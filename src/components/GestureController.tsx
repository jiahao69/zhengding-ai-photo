import cursorImg from "@/assets/images/cursor.png";
import { useGestureController } from "@/hooks";

const GESTURE_RING_VIEWBOX_SIZE = 100;
const GESTURE_RING_STROKE = 12;
const ringCenter = GESTURE_RING_VIEWBOX_SIZE / 2;
const ringRadius = (GESTURE_RING_VIEWBOX_SIZE - GESTURE_RING_STROKE) / 2;
const ringCircumference = 2 * Math.PI * ringRadius;

const GestureController = () => {
  const { cursor, progress, hovering } = useGestureController();

  if (!cursor) {
    return null;
  }

  const dashOffset = ringCircumference * (1 - progress);

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
              cx={ringCenter}
              cy={ringCenter}
              r={ringRadius}
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={GESTURE_RING_STROKE}
            />
            <circle
              cx={ringCenter}
              cy={ringCenter}
              r={ringRadius}
              fill="none"
              stroke="rgba(255,255,255,0.95)"
              strokeWidth={GESTURE_RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={ringCircumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${ringCenter} ${ringCenter})`}
            />
          </svg>
        )}

        <img className="w-90" src={cursorImg} alt="" />
      </div>
    </div>
  );
};

export default GestureController;
