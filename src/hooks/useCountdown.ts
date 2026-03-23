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
  const timeoutIdRef = useRef<number | null>(null);
  const onEndRef = useRef<IUseCountdownOptions["onEnd"]>(onEnd);
  const hasTriggeredEndRef = useRef(false);
  const [startedAt, setStartedAt] = useState(0);
  const [currentMs, setCurrentMs] = useState(0);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    if (timeoutIdRef.current !== null) {
      window.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    if (!startWhen) {
      hasTriggeredEndRef.current = false;
      timeoutIdRef.current = window.setTimeout(() => {
        setStartedAt((prev) => (prev === 0 ? prev : 0));
        setCurrentMs((prev) => (prev === 0 ? prev : 0));
      }, 0);

      return;
    }

    hasTriggeredEndRef.current = false;

    timeoutIdRef.current = window.setTimeout(() => {
      const nextStartedAt = Date.now();
      setStartedAt(nextStartedAt);
      setCurrentMs(nextStartedAt);

      const tick = () => {
        const now = Date.now();

        if (
          !hasTriggeredEndRef.current &&
          now - nextStartedAt >= normalizedDuration * 1000
        ) {
          hasTriggeredEndRef.current = true;
          onEndRef.current?.();
          return;
        }

        setCurrentMs(now);

        const elapsedMs = Math.max(now - nextStartedAt, 0);
        const nextDelay = 1000 - (elapsedMs % 1000);
        timeoutIdRef.current = window.setTimeout(
          tick,
          Math.max(nextDelay, 16),
        );
      };

      timeoutIdRef.current = window.setTimeout(tick, 1000);
    }, 0);

    return () => {
      if (timeoutIdRef.current !== null) {
        window.clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [normalizedDuration, startWhen]);

  if (!startWhen || startedAt <= 0) {
    return normalizedDuration;
  }

  return getRemainingSeconds(currentMs, startedAt, normalizedDuration);
};

export default useCountdown;
