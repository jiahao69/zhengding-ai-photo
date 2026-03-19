import { useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

import cursorImg from "@/assets/images/cursor.png";

type Point = {
  x: number;
  y: number;
};

const GESTURE_WASM_BASE_URL = "/mediapipe/wasm";
const GESTURE_MODEL_ASSET_PATH = "/mediapipe/hand_landmarker.task";
const GESTURE_SMOOTHING = 0.5;
const GESTURE_DWELL_MS = 2000;
const GESTURE_PROGRESS_DELAY_MS = 300;
const GESTURE_RING_VIEWBOX_SIZE = 100;
const GESTURE_RING_STROKE = 12;
const ringRadius = (GESTURE_RING_VIEWBOX_SIZE - GESTURE_RING_STROKE) / 2;
const ringCircumference = 2 * Math.PI * ringRadius;

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

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

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

const GestureController = () => {
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

  const setCursorSafe = (next: Point | null) => {
    setCursor((prev) => {
      if (!prev && !next) return prev;
      if (!prev || !next) return next;
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      if (dx * dx + dy * dy < 0.25) return prev;
      return next;
    });
  };

  useEffect(() => {
    const clearHoverTarget = () => {
      if (!hoverTargetRef.current) {
        return;
      }

      hoverTargetRef.current.removeAttribute("data-gesture-hovered");
      hoverTargetRef.current = null;
    };

    const resetDwellState = () => {
      activeTargetRef.current = null;
      dwellStartRef.current = null;
      setHovering(false);
      setProgress(0);
    };

    const teardown = () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current?.parentNode) {
        videoRef.current.parentNode.removeChild(videoRef.current);
        videoRef.current = null;
      }

      clearHoverTarget();
    };

    const start = async () => {
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
      streamRef.current = stream;

      video.srcObject = stream;
      await video.play();

      const vision = await FilesetResolver.forVisionTasks(
        GESTURE_WASM_BASE_URL,
      );

      landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: GESTURE_MODEL_ASSET_PATH,
        },
        runningMode: "VIDEO",
        numHands: 1,
      });

      const loop = () => {
        rafIdRef.current = requestAnimationFrame(loop);

        const landmarker = landmarkerRef.current;
        const videoEl = videoRef.current;
        if (!landmarker || !videoEl) {
          return;
        }

        const now = performance.now();
        const results = landmarker.detectForVideo(videoEl, now);
        const handCenter = getHandCenter(results.landmarks?.[0]);

        if (!handCenter) {
          smoothedRef.current = null;
          setCursorSafe(null);
          resetDwellState();
          clearHoverTarget();
          return;
        }

        let normX = clamp(handCenter.x, 0, 1);
        normX = 1 - normX;

        const normY = clamp(handCenter.y, 0, 1);
        const rawX = normX * window.innerWidth;
        const rawY = normY * window.innerHeight;
        const previous = smoothedRef.current ?? { x: rawX, y: rawY };
        const nextPoint = {
          x: previous.x + (rawX - previous.x) * GESTURE_SMOOTHING,
          y: previous.y + (rawY - previous.y) * GESTURE_SMOOTHING,
        };

        smoothedRef.current = nextPoint;
        setCursorSafe(nextPoint);

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
        setProgress(nextProgress);

        if (nextProgress >= 1) {
          resetDwellState();
          target.click();
        }
      };

      loop();
    };

    start().catch((error) => {
      console.warn("Gesture tracking failed to start:", error);

      teardown();
    });

    return () => {
      teardown();
    };
  }, []);

  if (!cursor) {
    return null;
  }

  const ringProgress = clamp(progress, 0, 1);
  const dashOffset = ringCircumference * (1 - ringProgress);

  return (
    <div className="fixed inset-0 pointer-events-none">
      <div
        className="absolute translate-x-[-50%] translate-y-[-50%] flex justify-center items-center w-140 h-140"
        style={{
          left: cursor.x,
          top: cursor.y,
        }}
      >
        {hovering && (
          <svg
            className="absolute size-full"
            viewBox={`0 0 ${GESTURE_RING_VIEWBOX_SIZE} ${GESTURE_RING_VIEWBOX_SIZE}`}
          >
            <circle
              cx="50"
              cy="50"
              r={ringRadius}
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={GESTURE_RING_STROKE}
            />
            <circle
              cx="50"
              cy="50"
              r={ringRadius}
              fill="none"
              stroke="rgba(255,255,255,0.95)"
              strokeWidth={GESTURE_RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={ringCircumference}
              strokeDashoffset={dashOffset}
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "50% 50%",
              }}
            />
          </svg>
        )}

        <img className="w-90" src={cursorImg} alt="" />
      </div>
    </div>
  );
};

export default GestureController;
