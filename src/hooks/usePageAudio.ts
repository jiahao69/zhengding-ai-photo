import { useEffect } from "react";

interface IUsePageAudioOptions {
  src: string;
  volume?: number;
}

const usePageAudio = ({ src, volume = 1 }: IUsePageAudioOptions) => {
  useEffect(() => {
    if (!src) {
      return;
    }

    const audio = new Audio(src);
    audio.preload = "auto";
    audio.volume = volume;
    const unlockEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "touchstart",
      "mousedown",
      "keydown",
    ];

    const cleanupUnlockListeners = () => {
      unlockEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleUnlockPlay);
      });
    };

    const tryPlay = () => {
      void audio
        .play()
        .then(() => {
          cleanupUnlockListeners();
        })
        .catch(() => {
          unlockEvents.forEach((eventName) => {
            window.addEventListener(eventName, handleUnlockPlay, { once: true });
          });
        });
    };

    const handleUnlockPlay = () => {
      tryPlay();
    };

    tryPlay();

    return () => {
      cleanupUnlockListeners();
      audio.pause();
      audio.currentTime = 0;
    };
  }, [src, volume]);
};

export default usePageAudio;
