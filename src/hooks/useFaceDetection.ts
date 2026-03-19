import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaceDetector,
  FaceLandmarker,
  FilesetResolver,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

import useCameraStream from "./useCameraStream";

interface IUseFaceDetectionOptions {
  hasCaptured?: boolean;
}

interface IFaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface IFaceCandidate {
  confidence: number;
  boundingBox: IFaceBoundingBox;
}

const MEDIAPIPE_FACE_MODEL_ASSET_PATH =
  "/mediapipe/blaze_face_short_range.tflite";
const MEDIAPIPE_FACE_LANDMARKER_MODEL_ASSET_PATH =
  "/mediapipe/face_landmarker.task";
const MEDIAPIPE_WASM_BASE_URL = "/mediapipe/wasm";
const FACE_MIN_AREA_RATIO = 0.03;
const FACE_MAX_AREA_RATIO = 0.7;
const FACE_CENTER_MIN_RATIO = 0.22;
const FACE_CENTER_MAX_RATIO = 0.78;
const FACE_MIN_CONFIDENCE = 0.8;
const FACE_MIN_ASPECT_RATIO = 0.72;
const FACE_MAX_ASPECT_RATIO = 1.2;
const FACE_LANDMARK_MIN_CONFIDENCE = 0.82;
const FACE_LANDMARK_MIN_PRESENCE_CONFIDENCE = 0.85;
const FACE_LANDMARK_MIN_TRACKING_CONFIDENCE = 0.82;
const FACE_LANDMARK_MIN_COUNT = 400;
const FACE_LANDMARK_OVERLAP_MIN_RATIO = 0.6;
const FACE_LANDMARK_MIN_ASPECT_RATIO = 0.72;
const FACE_LANDMARK_MAX_ASPECT_RATIO = 1.15;
const FACE_BOX_CENTER_OFFSET_MAX_RATIO = 0.18;
const FACE_STABLE_FRAMES = 12;
const CAMERA_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
};

const getBoundingBoxArea = ({ width, height }: IFaceBoundingBox) => {
  return width * height;
};

const getIntersectionArea = (a: IFaceBoundingBox, b: IFaceBoundingBox) => {
  const overlapWidth =
    Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const overlapHeight =
    Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);

  if (overlapWidth <= 0 || overlapHeight <= 0) {
    return 0;
  }

  return overlapWidth * overlapHeight;
};

const getBoundingBoxCenter = ({ x, y, width, height }: IFaceBoundingBox) => {
  return {
    x: x + width / 2,
    y: y + height / 2,
  };
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

const isConfirmedHumanFace = (
  candidate: IFaceCandidate,
  landmarks: NormalizedLandmark[],
  video: HTMLVideoElement,
) => {
  const landmarkBoundingBox = getLandmarkBoundingBox(landmarks, video);
  if (!landmarkBoundingBox) {
    return false;
  }

  const intersectionArea = getIntersectionArea(
    candidate.boundingBox,
    landmarkBoundingBox,
  );

  if (intersectionArea <= 0) {
    return false;
  }

  const candidateArea = getBoundingBoxArea(candidate.boundingBox);
  const landmarkArea = getBoundingBoxArea(landmarkBoundingBox);
  if (candidateArea <= 0 || landmarkArea <= 0) {
    return false;
  }

  const landmarkAspectRatio =
    landmarkBoundingBox.width / landmarkBoundingBox.height;
  if (
    landmarkAspectRatio < FACE_LANDMARK_MIN_ASPECT_RATIO ||
    landmarkAspectRatio > FACE_LANDMARK_MAX_ASPECT_RATIO
  ) {
    return false;
  }

  const overlapRatio =
    intersectionArea / Math.min(candidateArea, landmarkArea);
  const candidateCenter = getBoundingBoxCenter(candidate.boundingBox);
  const landmarkCenter = getBoundingBoxCenter(landmarkBoundingBox);
  const centerOffsetXRatio =
    Math.abs(candidateCenter.x - landmarkCenter.x) /
    Math.min(candidate.boundingBox.width, landmarkBoundingBox.width);
  const centerOffsetYRatio =
    Math.abs(candidateCenter.y - landmarkCenter.y) /
    Math.min(candidate.boundingBox.height, landmarkBoundingBox.height);

  return (
    overlapRatio >= FACE_LANDMARK_OVERLAP_MIN_RATIO &&
    centerOffsetXRatio <= FACE_BOX_CENTER_OFFSET_MAX_RATIO &&
    centerOffsetYRatio <= FACE_BOX_CENTER_OFFSET_MAX_RATIO
  );
};

const isValidFaceCandidate = (
  candidate: IFaceCandidate,
  video: HTMLVideoElement,
) => {
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  const { boundingBox } = candidate;
  if (boundingBox.width <= 0 || boundingBox.height <= 0) {
    return false;
  }

  const areaRatio =
    (boundingBox.width * boundingBox.height) / (videoWidth * videoHeight);
  if (areaRatio < FACE_MIN_AREA_RATIO || areaRatio > FACE_MAX_AREA_RATIO) {
    return false;
  }

  const aspectRatio = boundingBox.width / boundingBox.height;
  if (
    aspectRatio < FACE_MIN_ASPECT_RATIO ||
    aspectRatio > FACE_MAX_ASPECT_RATIO
  ) {
    return false;
  }

  const centerXRatio = (boundingBox.x + boundingBox.width / 2) / videoWidth;
  const centerYRatio = (boundingBox.y + boundingBox.height / 2) / videoHeight;
  if (
    centerXRatio < FACE_CENTER_MIN_RATIO ||
    centerXRatio > FACE_CENTER_MAX_RATIO ||
    centerYRatio < FACE_CENTER_MIN_RATIO ||
    centerYRatio > FACE_CENTER_MAX_RATIO
  ) {
    return false;
  }

  if (candidate.confidence > 0 && candidate.confidence < FACE_MIN_CONFIDENCE) {
    return false;
  }

  return true;
};

const useFaceDetection = ({
  hasCaptured = false,
}: IUseFaceDetectionOptions) => {
  const detectorRef = useRef<FaceDetector | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const detectionFrameRef = useRef<number | null>(null);
  const stableFaceFramesRef = useRef(0);

  const [hasFaceDetected, setHasFaceDetected] = useState(false);
  const [isFaceStable, setIsFaceStable] = useState(false);

  const { videoRef, startCamera, stopCamera } = useCameraStream();

  const startDetectionLoop = useCallback(() => {
    const detectFrame = () => {
      const video = videoRef.current;
      const detector = detectorRef.current;
      const landmarker = landmarkerRef.current;
      if (!detector || !landmarker || !video) return;

      const timestamp = performance.now();
      const detectorResult = detector.detectForVideo(video, timestamp);
      const faceCandidates = detectorResult.detections.flatMap((detection) => {
        const boundingBox = detection.boundingBox;
        if (!boundingBox) return [];

        const candidate = {
          confidence: detection.categories[0]?.score ?? 0,
          boundingBox: {
            x: boundingBox.originX,
            y: boundingBox.originY,
            width: boundingBox.width,
            height: boundingBox.height,
          },
        };

        return isValidFaceCandidate(candidate, video) ? [candidate] : [];
      });
      const landmarkerResult =
        faceCandidates.length > 0
          ? landmarker.detectForVideo(video, timestamp)
          : null;
      const hasValidFace =
        landmarkerResult !== null &&
        faceCandidates.some((candidate) =>
          landmarkerResult.faceLandmarks.some((landmarks) =>
            isConfirmedHumanFace(candidate, landmarks, video),
          ),
        );

      if (hasValidFace) {
        setHasFaceDetected(true);
        stableFaceFramesRef.current += 1;
        if (stableFaceFramesRef.current >= FACE_STABLE_FRAMES) {
          setIsFaceStable(true);
        }
      } else {
        setHasFaceDetected(false);
        stableFaceFramesRef.current = 0;
        setIsFaceStable(false);
      }

      detectionFrameRef.current = window.requestAnimationFrame(detectFrame);
    };

    detectFrame();
  }, [videoRef]);

  const startDetection = useCallback(async () => {
    const started = await startCamera(CAMERA_VIDEO_CONSTRAINTS);
    if (!started) {
      return;
    }

    const vision = await FilesetResolver.forVisionTasks(
      MEDIAPIPE_WASM_BASE_URL,
    );

    detectorRef.current = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MEDIAPIPE_FACE_MODEL_ASSET_PATH,
      },
      runningMode: "VIDEO",
      minDetectionConfidence: FACE_MIN_CONFIDENCE,
    });
    landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
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

    startDetectionLoop();
  }, [startCamera, startDetectionLoop]);

  const stopDetection = useCallback(() => {
    if (detectionFrameRef.current !== null) {
      window.cancelAnimationFrame(detectionFrameRef.current);
      detectionFrameRef.current = null;
    }

    detectorRef.current?.close();
    detectorRef.current = null;
    landmarkerRef.current?.close();
    landmarkerRef.current = null;

    stableFaceFramesRef.current = 0;
    setHasFaceDetected(false);
    setIsFaceStable(false);

    stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    if (hasCaptured) {
      return;
    }

    startDetection().catch((error) => {
      stopDetection();
      console.warn("启动人脸检测失败:", error);
    });

    return () => {
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
