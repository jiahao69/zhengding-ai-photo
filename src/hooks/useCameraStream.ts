import { useCallback, useRef } from "react";

const useCameraStream = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startSessionIdRef = useRef(0);

  const startCamera = useCallback(
    async (videoConstraints: MediaTrackConstraints) => {
      const sessionId = startSessionIdRef.current + 1;
      startSessionIdRef.current = sessionId;

      if (!navigator.mediaDevices?.getUserMedia) {
        console.warn("当前环境不支持摄像头");
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });
      if (startSessionIdRef.current !== sessionId) {
        stream.getTracks().forEach((track) => track.stop());
        return false;
      }

      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return false;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      streamRef.current = stream;
      video.srcObject = stream;

      try {
        await video.play();
      } catch {
        stream.getTracks().forEach((track) => track.stop());
        if (streamRef.current === stream) {
          streamRef.current = null;
        }
        if (video.srcObject === stream) {
          video.srcObject = null;
        }
        return false;
      }

      if (startSessionIdRef.current !== sessionId) {
        stream.getTracks().forEach((track) => track.stop());
        if (streamRef.current === stream) {
          streamRef.current = null;
        }
        if (video.srcObject === stream) {
          video.srcObject = null;
        }
        return false;
      }

      return true;
    },
    [],
  );

  const stopCamera = useCallback(() => {
    startSessionIdRef.current += 1;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
  }, []);

  return {
    videoRef,
    startCamera,
    stopCamera,
  };
};

export default useCameraStream;
