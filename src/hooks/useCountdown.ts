import { useEffect, useRef, useState } from "react";

interface IUseCountdownOptions {
  startWhen: boolean;
  duration: number;
  onEnd?: () => void;
}

const normalizeDuration = (duration: number) => {
  const roundedDuration = Math.floor(duration);
  if (!Number.isFinite(roundedDuration) || roundedDuration < 1) {
    return 1;
  }

  return roundedDuration;
};

const getRemainingSeconds = (
  nowMs: number,
  startedAt: number,
  durationSeconds: number,
) => {
  const effectiveNowMs = Math.max(nowMs, startedAt);
  const elapsedSeconds = Math.floor((effectiveNowMs - startedAt) / 1000);
  return Math.max(durationSeconds - elapsedSeconds, 1);
};

const useCountdown = ({
  startWhen,
  duration,
  onEnd,
}: IUseCountdownOptions) => {
  const normalizedDuration = normalizeDuration(duration);
  const startedAtRef = useRef(0);
  const [startedAt, setStartedAt] = useState(0);
  const [currentMs, setCurrentMs] = useState(0);
  const onEndRef = useRef<IUseCountdownOptions["onEnd"]>(onEnd);
  const hasTriggeredEndRef = useRef(false);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    if (!startWhen) {
      startedAtRef.current = 0;
      hasTriggeredEndRef.current = false;
      if (startedAt !== 0) {
        const resetId = window.requestAnimationFrame(() => {
          setStartedAt(0);
        });

        return () => {
          window.cancelAnimationFrame(resetId);
        };
      }

      return;
    }

    let rafId = 0;
    const tick = () => {
      const now = Date.now();

      if (startedAtRef.current <= 0) {
        startedAtRef.current = now;
        hasTriggeredEndRef.current = false;
        setStartedAt(now);
      }

      setCurrentMs(now);

      if (
        !hasTriggeredEndRef.current &&
        now - startedAtRef.current >= normalizedDuration * 1000
      ) {
        hasTriggeredEndRef.current = true;
        onEndRef.current?.();
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [normalizedDuration, startWhen, startedAt]);

  if (!startWhen || startedAt <= 0) {
    return normalizedDuration;
  }

  return getRemainingSeconds(currentMs, startedAt, normalizedDuration);
};

export default useCountdown;
