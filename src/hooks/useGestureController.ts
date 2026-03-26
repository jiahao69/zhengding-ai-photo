import { useCallback, useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { getPublicAssetPath } from "@/utils/public-asset-path";

type Point = {
  x: number;
  y: number;
};

type GestureControllerState = {
  cursor: Point | null;
  progress: number;
  hovering: boolean;
};

const GESTURE_WASM_BASE_URL = getPublicAssetPath("mediapipe/wasm");
const GESTURE_MODEL_ASSET_PATH = getPublicAssetPath(
  "mediapipe/hand_landmarker.task",
);
const GESTURE_SMOOTHING = 0.56;
const GESTURE_DWELL_MS = 2000;
const GESTURE_PROGRESS_DELAY_MS = 300;
const CURSOR_CHANGE_THRESHOLD_SQ = 0.25;
const PROGRESS_CHANGE_THRESHOLD = 0.01;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getHandCenter = (landmarks?: Point[]) => {
  if (!landmarks || landmarks.length === 0) {
    return null;
  }

  let sumX = 0;
  let sumY = 0;
  let count = 0;

  for (const landmark of landmarks) {
    if (!Number.isFinite(landmark.x) || !Number.isFinite(landmark.y)) {
      continue;
    }

    sumX += landmark.x;
    sumY += landmark.y;
    count += 1;
  }

  if (count === 0) {
    return null;
  }

  return {
    x: sumX / count,
    y: sumY / count,
  };
};

const getClickableTarget = (x: number, y: number): HTMLElement | null => {
  if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) {
    return null;
  }

  const element = document.elementFromPoint(x, y) as HTMLElement | null;
  if (!element) {
    return null;
  }

  return element.closest<HTMLElement>("[data-gesture-clickable]");
};

const useGestureController = (): GestureControllerState => {
  const [cursor, setCursor] = useState<Point | null>(null);
  const [progress, setProgress] = useState(0);
  const [hovering, setHovering] = useState(false);

  const rafIdRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const smoothedRef = useRef<Point | null>(null);
  const activeTargetRef = useRef<HTMLElement | null>(null);
  const dwellStartRef = useRef<number | null>(null);
  const hoverTargetRef = useRef<HTMLElement | null>(null);
  const disposedRef = useRef(false);

  // 清理当前被手势悬停的元素标记，避免页面残留激活态
  const clearHoverTarget = useCallback(() => {
    const hoverTarget = hoverTargetRef.current;
    if (!hoverTarget) {
      return;
    }

    hoverTarget.removeAttribute("data-gesture-hovered");
    hoverTargetRef.current = null;
  }, []);

  const resetDwellState = useCallback(() => {
    activeTargetRef.current = null;
    dwellStartRef.current = null;
    setHovering(false);
    setProgress(0);
  }, []);

  // 统一释放资源：RAF、模型、摄像头流、隐藏 video 节点
  const teardown = useCallback(() => {
    const rafId = rafIdRef.current;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafIdRef.current = null;
    }

    const landmarker = landmarkerRef.current;
    if (landmarker) {
      landmarker.close();
      landmarkerRef.current = null;
    }

    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const video = videoRef.current;
    if (video?.parentNode) {
      video.parentNode.removeChild(video);
    }
    videoRef.current = null;

    smoothedRef.current = null;
    resetDwellState();
    clearHoverTarget();
    setCursor(null);
  }, [clearHoverTarget, resetDwellState]);

  const startTracking = useCallback(async () => {
    const video = document.createElement("video");
    video.muted = true;
    video.style.position = "fixed";
    video.style.opacity = "0";
    video.style.pointerEvents = "none";
    video.style.left = "-10000px";
    video.style.top = "-10000px";
    document.body.appendChild(video);
    videoRef.current = video;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
    });

    if (disposedRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    streamRef.current = stream;
    video.srcObject = stream;
    await video.play();

    if (disposedRef.current) {
      return;
    }

    const vision = await FilesetResolver.forVisionTasks(GESTURE_WASM_BASE_URL);
    if (disposedRef.current) {
      return;
    }

    const landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: GESTURE_MODEL_ASSET_PATH,
      },
      runningMode: "VIDEO",
      numHands: 1,
    });

    if (disposedRef.current) {
      landmarker.close();
      return;
    }

    landmarkerRef.current = landmarker;

    const loop = () => {
      if (disposedRef.current) {
        return;
      }

      // 视觉检测跟随浏览器刷新节奏，避免定时器造成额外抖动
      rafIdRef.current = requestAnimationFrame(loop);

      const landmarker = landmarkerRef.current;
      const videoEl = videoRef.current;
      if (!landmarker || !videoEl || videoEl.readyState < 2) {
        return;
      }

      const now = performance.now();
      const results = landmarker.detectForVideo(videoEl, now);
      const handCenter = getHandCenter(results.landmarks?.[0]);

      if (!handCenter) {
        // 丢手后立即重置 UI 与 dwell 状态，防止误触发
        smoothedRef.current = null;
        setCursor(null);
        resetDwellState();
        clearHoverTarget();
        return;
      }

      const normX = 1 - clamp(handCenter.x, 0, 1);
      const normY = clamp(handCenter.y, 0, 1);
      const rawX = normX * window.innerWidth;
      const rawY = normY * window.innerHeight;
      const previous = smoothedRef.current ?? { x: rawX, y: rawY };
      const nextPoint = {
        x: previous.x + (rawX - previous.x) * GESTURE_SMOOTHING,
        y: previous.y + (rawY - previous.y) * GESTURE_SMOOTHING,
      };

      smoothedRef.current = nextPoint;
      setCursor((prev) => {
        if (!prev) {
          return nextPoint;
        }

        const dx = nextPoint.x - prev.x;
        const dy = nextPoint.y - prev.y;
        // 位移不足阈值时返回 prev
        if (dx * dx + dy * dy < CURSOR_CHANGE_THRESHOLD_SQ) {
          return prev;
        }

        return nextPoint;
      });

      const target = getClickableTarget(nextPoint.x, nextPoint.y);
      if (!target) {
        resetDwellState();
        clearHoverTarget();
        return;
      }

      if (activeTargetRef.current !== target) {
        activeTargetRef.current = target;
        dwellStartRef.current = now;
        setProgress(0);
      }

      if (hoverTargetRef.current !== target) {
        clearHoverTarget();
        hoverTargetRef.current = target;
        hoverTargetRef.current.setAttribute("data-gesture-hovered", "true");
      }

      const dwellStart = dwellStartRef.current ?? now;
      const elapsed = now - dwellStart;
      if (elapsed < GESTURE_PROGRESS_DELAY_MS) {
        setHovering(false);
        setProgress(0);
        return;
      }

      setHovering(true);
      const nextProgress = clamp(
        (elapsed - GESTURE_PROGRESS_DELAY_MS) / Math.max(GESTURE_DWELL_MS, 1),
        0,
        1,
      );
      setProgress((prev) => {
        if (prev === nextProgress) {
          return prev;
        }

        const isBoundary = nextProgress === 0 || nextProgress === 1;
        // 进度变化太小时跳过更新，减少高频 UI 抖动
        if (
          !isBoundary &&
          Math.abs(prev - nextProgress) < PROGRESS_CHANGE_THRESHOLD
        ) {
          return prev;
        }

        return nextProgress;
      });

      if (nextProgress >= 1) {
        // 停留进度完成后触发一次点击，并重置当前 dwell 会话
        resetDwellState();
        target.click();
      }
    };

    loop();
  }, [clearHoverTarget, resetDwellState]);

  useEffect(() => {
    disposedRef.current = false;

    startTracking().catch((error) => {
      if (!disposedRef.current) {
        console.warn("Gesture tracking failed to start:", error);
      }
      teardown();
    });

    return () => {
      disposedRef.current = true;
      teardown();
    };
  }, [startTracking, teardown]);

  return {
    cursor,
    progress,
    hovering,
  };
};

export default useGestureController;
