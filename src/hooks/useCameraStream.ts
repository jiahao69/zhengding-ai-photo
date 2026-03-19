import { useCallback, useRef } from "react";

const useCameraStream = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(
    async (videoConstraints: MediaTrackConstraints) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        console.warn("当前环境不支持摄像头");
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return false;
      }

      streamRef.current = stream;
      video.srcObject = stream;

      await video.play();

      return true;
    },
    [],
  );

  const stopCamera = useCallback(() => {
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
