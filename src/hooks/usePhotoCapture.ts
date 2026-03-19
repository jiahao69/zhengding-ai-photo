import { useCallback, useState } from "react";

const usePhotoCapture = () => {
  const [capturedPhotoDataUrl, setCapturedPhotoDataUrl] = useState("");

  const capturePhoto = useCallback((video: HTMLVideoElement | null) => {
    if (!video || video.readyState < 2) {
      console.log("倒计时结束，但摄像头未就绪，拍照失败");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.log("倒计时结束，但无法获取画布上下文，拍照失败");
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoDataUrl = canvas.toDataURL("image/png");
    setCapturedPhotoDataUrl(photoDataUrl);

    console.log("倒计时结束，已拍照");
  }, []);

  const resetCapture = useCallback(() => {
    setCapturedPhotoDataUrl("");
  }, []);

  return {
    capturedPhotoDataUrl,
    capturePhoto,
    resetCapture,
  };
};

export default usePhotoCapture;
