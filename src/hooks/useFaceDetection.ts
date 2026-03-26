import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

import useCameraStream from "./useCameraStream";
import { getPublicAssetPath } from "@/utils/public-asset-path";

interface IUseFaceDetectionOptions {
  hasCaptured?: boolean;
}

interface IFaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MEDIAPIPE_FACE_LANDMARKER_MODEL_ASSET_PATH = getPublicAssetPath(
  "mediapipe/face_landmarker.task",
);
const MEDIAPIPE_WASM_BASE_URL = getPublicAssetPath("mediapipe/wasm");
const FACE_MIN_AREA_RATIO = 0.03;
const FACE_MAX_AREA_RATIO = 0.7;
const FACE_CENTER_MIN_RATIO = 0.22;
const FACE_CENTER_MAX_RATIO = 0.78;
const FACE_LANDMARK_MIN_CONFIDENCE = 0.82;
const FACE_LANDMARK_MIN_PRESENCE_CONFIDENCE = 0.85;
const FACE_LANDMARK_MIN_TRACKING_CONFIDENCE = 0.82;
const FACE_LANDMARK_MIN_COUNT = 400;
const FACE_LANDMARK_MIN_ASPECT_RATIO = 0.72;
const FACE_LANDMARK_MAX_ASPECT_RATIO = 1.15;
const FACE_STABLE_FRAMES = 12;
const CAMERA_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
};

const getLandmarkBoundingBox = (
  landmarks: NormalizedLandmark[],
  video: HTMLVideoElement,
): IFaceBoundingBox | null => {
  if (landmarks.length < FACE_LANDMARK_MIN_COUNT) {
    return null;
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  landmarks.forEach(({ x, y }) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });

  if (
    !Number.isFinite(minX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(maxX) ||
    !Number.isFinite(maxY)
  ) {
    return null;
  }

  return {
    x: minX * video.videoWidth,
    y: minY * video.videoHeight,
    width: (maxX - minX) * video.videoWidth,
    height: (maxY - minY) * video.videoHeight,
  };
};

const isValidLandmarkFace = (
  landmarks: NormalizedLandmark[],
  video: HTMLVideoElement,
) => {
  const landmarkBoundingBox = getLandmarkBoundingBox(landmarks, video);
  if (!landmarkBoundingBox) {
    return false;
  }

  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  if (videoWidth <= 0 || videoHeight <= 0) {
    return false;
  }

  if (landmarkBoundingBox.width <= 0 || landmarkBoundingBox.height <= 0) {
    return false;
  }

  const areaRatio =
    (landmarkBoundingBox.width * landmarkBoundingBox.height) /
    (videoWidth * videoHeight);
  if (areaRatio < FACE_MIN_AREA_RATIO || areaRatio > FACE_MAX_AREA_RATIO) {
    return false;
  }

  const aspectRatio = landmarkBoundingBox.width / landmarkBoundingBox.height;
  if (
    aspectRatio < FACE_LANDMARK_MIN_ASPECT_RATIO ||
    aspectRatio > FACE_LANDMARK_MAX_ASPECT_RATIO
  ) {
    return false;
  }

  const centerXRatio =
    (landmarkBoundingBox.x + landmarkBoundingBox.width / 2) / videoWidth;
  const centerYRatio =
    (landmarkBoundingBox.y + landmarkBoundingBox.height / 2) / videoHeight;
  if (
    centerXRatio < FACE_CENTER_MIN_RATIO ||
    centerXRatio > FACE_CENTER_MAX_RATIO ||
    centerYRatio < FACE_CENTER_MIN_RATIO ||
    centerYRatio > FACE_CENTER_MAX_RATIO
  ) {
    return false;
  }

  return true;
};

const useFaceDetection = ({
  hasCaptured = false,
}: IUseFaceDetectionOptions) => {
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const detectionFrameRef = useRef<number | null>(null);
  const detectionSessionIdRef = useRef(0);
  const stableFaceFramesRef = useRef(0);
  const hasFaceDetectedRef = useRef(false);
  const isFaceStableRef = useRef(false);

  const [hasFaceDetected, setHasFaceDetected] = useState(false);
  const [isFaceStable, setIsFaceStable] = useState(false);

  const { videoRef, startCamera, stopCamera } = useCameraStream();

  const stopDetection = useCallback(() => {
    detectionSessionIdRef.current += 1;

    if (detectionFrameRef.current !== null) {
      window.cancelAnimationFrame(detectionFrameRef.current);
      detectionFrameRef.current = null;
    }

    landmarkerRef.current?.close();
    landmarkerRef.current = null;

    stableFaceFramesRef.current = 0;
    if (hasFaceDetectedRef.current) {
      hasFaceDetectedRef.current = false;
      setHasFaceDetected(false);
    }
    if (isFaceStableRef.current) {
      isFaceStableRef.current = false;
      setIsFaceStable(false);
    }

    stopCamera();
  }, [stopCamera]);

  const startDetectionLoop = useCallback(
    (sessionId: number) => {
      const detectFrame = () => {
        if (detectionSessionIdRef.current !== sessionId) {
          return;
        }

        const video = videoRef.current;
        const landmarker = landmarkerRef.current;
        if (!landmarker || !video) {
          detectionFrameRef.current = window.requestAnimationFrame(detectFrame);
          return;
        }

        if (
          video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
          video.videoWidth <= 0 ||
          video.videoHeight <= 0
        ) {
          detectionFrameRef.current = window.requestAnimationFrame(detectFrame);
          return;
        }

        const timestamp = performance.now();
        let hasValidFace = false;
        try {
          const landmarkerResult = landmarker.detectForVideo(video, timestamp);
          hasValidFace = landmarkerResult.faceLandmarks.some((landmarks) =>
            isValidLandmarkFace(landmarks, video),
          );
        } catch {
          hasValidFace = false;
        }

        if (hasValidFace) {
          stableFaceFramesRef.current += 1;
        } else {
          stableFaceFramesRef.current = 0;
        }

        const nextIsFaceStable =
          hasValidFace && stableFaceFramesRef.current >= FACE_STABLE_FRAMES;

        if (hasFaceDetectedRef.current !== hasValidFace) {
          hasFaceDetectedRef.current = hasValidFace;
          setHasFaceDetected(hasValidFace);
        }
        if (isFaceStableRef.current !== nextIsFaceStable) {
          isFaceStableRef.current = nextIsFaceStable;
          setIsFaceStable(nextIsFaceStable);
        }

        detectionFrameRef.current = window.requestAnimationFrame(detectFrame);
      };

      detectFrame();
    },
    [videoRef],
  );

  const startDetection = useCallback(async () => {
    const sessionId = detectionSessionIdRef.current + 1;
    detectionSessionIdRef.current = sessionId;

    let landmarker: FaceLandmarker | null = null;

    try {
      const started = await startCamera(CAMERA_VIDEO_CONSTRAINTS);
      if (!started || detectionSessionIdRef.current !== sessionId) {
        return;
      }

      const vision = await FilesetResolver.forVisionTasks(
        MEDIAPIPE_WASM_BASE_URL,
      );
      if (detectionSessionIdRef.current !== sessionId) {
        return;
      }

      landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MEDIAPIPE_FACE_LANDMARKER_MODEL_ASSET_PATH,
        },
        runningMode: "VIDEO",
        numFaces: 1,
        minFaceDetectionConfidence: FACE_LANDMARK_MIN_CONFIDENCE,
        minFacePresenceConfidence: FACE_LANDMARK_MIN_PRESENCE_CONFIDENCE,
        minTrackingConfidence: FACE_LANDMARK_MIN_TRACKING_CONFIDENCE,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });
      if (detectionSessionIdRef.current !== sessionId) {
        landmarker.close();
        return;
      }

      landmarkerRef.current = landmarker;
      startDetectionLoop(sessionId);
    } catch (error) {
      landmarker?.close();

      if (detectionSessionIdRef.current === sessionId) {
        stopDetection();
        throw error;
      }
    }
  }, [startCamera, startDetectionLoop, stopDetection]);

  useEffect(() => {
    if (hasCaptured) {
      return;
    }

    const startId = window.setTimeout(() => {
      startDetection().catch((error) => {
        console.warn("启动人脸检测失败:", error);
      });
    }, 0);

    return () => {
      window.clearTimeout(startId);
      stopDetection();
    };
  }, [hasCaptured, startDetection, stopDetection]);

  return {
    videoRef,
    hasFaceDetected,
    isFaceStable,
  };
};

export default useFaceDetection;
