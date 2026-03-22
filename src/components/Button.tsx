import { memo } from "react";
import type { CSSProperties, FC, ReactNode } from "react";

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
  const style = {
    "--gesture-button-bg": `url(${normalBg})`,
    "--gesture-button-active-bg": `url(${activeBg})`,
    width: px2vw(width),
    height: px2vw(height),
  } as CSSProperties;

  return (
    <div
      className="gesture-button flex justify-center items-center bg-cover"
      style={style}
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
