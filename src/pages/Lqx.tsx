import { memo } from "react";
import type { FC, ReactNode } from "react";

import lqxVideo from "@/assets/videos/lqx.mp4";

import Button from "@/components/Button";
import VideoWrapper from "@/components/VideoWrapper";
import { getThemeImage } from "@/utils/theme-assets";

interface IProps {
  children?: ReactNode;
  isGenerating?: boolean;
  onNext?: () => void;
}

const Lqx: FC<IProps> = ({ isGenerating = false, onNext }) => {
  const bg = getThemeImage("bg.png");
  const swappingTip = getThemeImage("swapping-tip.png");
  const loading = getThemeImage("loading.png");

  return (
    <div
      className="size-full bg-cover"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="text-center pt-80 font-[yanzhengqing] fs-72">
        注意，现在开始捋清袖
      </div>

      <VideoWrapper videoSrc={lqxVideo} />

      <div className="absolute left-0 right-0 bottom-270 flex justify-center">
        <Button text="下一步" onClick={onNext}></Button>
      </div>

      {isGenerating && (
        <div className="absolute inset-0 z-20 backdrop-blur-[20px]">
          <div className="size-full flex flex-col items-center">
            <img className="w-769 mt-280" src={swappingTip} alt="" />
            <img
              className="w-175 mt-auto mb-180 animate-spin"
              src={loading}
              alt=""
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(Lqx);
