import { memo, useEffect, useRef, useState } from "react";
import type { FC, ReactNode } from "react";

import buttonBg from "@/assets/images/button.png";
import buttonActiveBg from "@/assets/images/button-active.png";
import { px2vw } from "@/utils/px2vw";

interface IProps {
  children?: ReactNode;
  width?: number;
  height?: number;
  normalBg?: string;
  activeBg?: string;
  text?: string;
  onClick?: () => void;
}

const Button: FC<IProps> = ({
  width = 360,
  height = 210,
  normalBg = buttonBg,
  activeBg = buttonActiveBg,
  text,
  onClick,
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const rootNode = rootRef.current;

    if (!rootNode) {
      return;
    }

    const syncHoverState = () => {
      const hovered = rootNode.getAttribute("data-gesture-hovered") === "true";
      setIsActive(hovered);
    };

    syncHoverState();

    const observer = new MutationObserver(syncHoverState);
    observer.observe(rootNode, {
      attributes: true,
      attributeFilter: ["data-gesture-hovered"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const backgroundImage = `url(${isActive ? activeBg : normalBg})`;

  return (
    <div
      ref={rootRef}
      className={`flex justify-center items-center bg-cover`}
      style={{
        backgroundImage,
        width: px2vw(width),
        height: px2vw(height),
      }}
      data-gesture-clickable
      onClick={onClick}
    >
      {text && (
        <span className="font-[yanzhengqing] fs-64 text-white">{text}</span>
      )}
    </div>
  );
};

export default memo(Button);
