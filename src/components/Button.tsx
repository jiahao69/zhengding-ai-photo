import { memo } from "react";
import type { CSSProperties, FC, ReactNode } from "react";

import { px2vw } from "@/utils/px2vw";
import { getThemeImage } from "@/utils/theme-assets";

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
  width = 349,
  height = 123,
  normalBg,
  activeBg,
  text,
  onClick,
}) => {
  const resolvedNormalBg = normalBg ?? getThemeImage("button.png");
  const resolvedActiveBg = activeBg ?? getThemeImage("button-active.png");
  const style = {
    "--gesture-button-bg": `url(${resolvedNormalBg})`,
    "--gesture-button-active-bg": `url(${resolvedActiveBg})`,
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
        <span className="font-[yanzhengqing] fs-70 text-white">{text}</span>
      )}
    </div>
  );
};

export default memo(Button);
