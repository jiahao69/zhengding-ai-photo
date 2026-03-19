import { memo } from "react";
import type { FC, ReactNode } from "react";

import bg2 from "@/assets/images/bg2.png";
import lqxVideo from "@/assets/videos/lqx.mp4";
import swappingTip from "@/assets/images/swapping-tip.png";
import loading from "@/assets/images/loading.png";

import Button from "@/components/Button";
import VideoWrapper from "@/components/VideoWrapper";

interface IProps {
  children?: ReactNode;
  isGenerating?: boolean;
  onNext?: () => void;
}

const Lqx: FC<IProps> = ({ isGenerating = false, onNext }) => {
  return (
    <div
      className="size-full bg-cover"
      style={{ backgroundImage: `url(${bg2})` }}
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
