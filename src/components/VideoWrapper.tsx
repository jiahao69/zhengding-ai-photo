import { memo } from "react";
import type { FC, ReactNode } from "react";

import videoBorder from "@/assets/images/video-border.png";

interface IProps {
  children?: ReactNode;
  videoSrc?: string;
}

const VideoWrapper: FC<IProps> = ({ videoSrc }) => {
  return (
    <div className="relative -top-50 w-1006 h-1421 ml-auto mr-auto">
      <div className="size-full pl-179 pr-169 pt-231 pb-164">
        <video
          className="size-full object-cover"
          src={videoSrc}
          muted
          autoPlay
          loop
        />
      </div>
      <div
        className="absolute inset-0 bg-cover"
        style={{ backgroundImage: `url(${videoBorder})` }}
      />
    </div>
  );
};

export default memo(VideoWrapper);
