import { memo, useCallback } from "react";
import type { FC, ReactNode } from "react";

import bg2 from "@/assets/images/bg2.png";
import countDown1 from "@/assets/images/count-down1.png";
import countDown2 from "@/assets/images/count-down2.png";
import countDown3 from "@/assets/images/count-down3.png";
import countDown4 from "@/assets/images/count-down4.png";
import countDown5 from "@/assets/images/count-down5.png";
import photographBorder from "@/assets/images/photograph-border.png";
import notDetected from "@/assets/images/not-detected.png";
import { useCountdown, useFaceDetection, usePhotoCapture } from "@/hooks";

import Button from "@/components/Button";

interface IProps {
  children?: ReactNode;
  savedPhotoDataUrl?: string;
  onRetake?: () => void;
  onConfirm?: (photoDataUrl: string) => void;
}

const COUNTDOWN_DURATION_SECONDS = 5;
const countdownImageMap: Record<number, string> = {
  1: countDown1,
  2: countDown2,
  3: countDown3,
  4: countDown4,
  5: countDown5,
};

const Photograph: FC<IProps> = ({ savedPhotoDataUrl, onRetake, onConfirm }) => {
  const {
    capturedPhotoDataUrl,
    capturePhoto: doCapturePhoto,
    resetCapture,
  } = usePhotoCapture();

  const currentPhotoDataUrl = savedPhotoDataUrl || capturedPhotoDataUrl;
  const hasCaptured = Boolean(currentPhotoDataUrl);

  const { videoRef, hasFaceDetected, isFaceStable } = useFaceDetection({
    hasCaptured,
  });

  const capturePhoto = useCallback(() => {
    doCapturePhoto(videoRef.current);
  }, [doCapturePhoto, videoRef]);

  const isCountingDown = isFaceStable && !hasCaptured;

  const remainingSeconds = useCountdown({
    startWhen: isCountingDown,
    duration: COUNTDOWN_DURATION_SECONDS,
    onEnd: capturePhoto,
  });

  const countdownImage = countdownImageMap[remainingSeconds] ?? countDown1;

  const handleRetake = useCallback(() => {
    resetCapture();
    onRetake?.();
  }, [onRetake, resetCapture]);

  const handleConfirm = useCallback(() => {
    if (!currentPhotoDataUrl) {
      return;
    }

    onConfirm?.(currentPhotoDataUrl);
  }, [currentPhotoDataUrl, onConfirm]);

  return (
    <div
      className="size-full bg-cover"
      style={{ backgroundImage: `url(${bg2})` }}
    >
      {isCountingDown && (
        <div className={`flex flex-col items-center pt-76`}>
          <div className="font-[yanzhengqing] fs-64">倒计时</div>
          <img className="w-344 -mt-80" src={countdownImage} alt="" />
        </div>
      )}

      <div className="absolute top-296 w-full">
        <div
          className="flex justify-center items-center h-664 w-664 mx-auto bg-cover"
          style={{
            backgroundImage: `url(${photographBorder})`,
          }}
        >
          <div className="size-460 rounded-[50%] overflow-hidden bg-black">
            {currentPhotoDataUrl ? (
              <img
                className="size-full object-cover"
                src={currentPhotoDataUrl}
                alt=""
              />
            ) : (
              <video
                ref={videoRef}
                className="size-full object-cover"
                autoPlay
                muted
              />
            )}
          </div>
        </div>

        <div className="text-center font-[yanzhengqing] fs-64">
          请确保您的脸对准拍摄框
        </div>

        {!hasFaceDetected && !currentPhotoDataUrl && (
          <img src={notDetected} className="w-889 m-auto" alt="" />
        )}

        {currentPhotoDataUrl && (
          <div className="flex justify-center gap-67 mt-107">
            <Button text="重拍" onClick={handleRetake} />
            <Button text="确认" onClick={handleConfirm} />
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(Photograph);
