import { memo } from "react";
import type { FC, ReactNode } from "react";

import bg2 from "@/assets/images/bg2.png";
import zjgVideo from "@/assets/videos/zjg.mp4";

import Button from "@/components/Button";
import VideoWrapper from "@/components/VideoWrapper";

interface IProps {
  children?: ReactNode;
  onNext?: () => void;
}

const Zjg: FC<IProps> = ({ onNext }) => {
  return (
    <div
      className="size-full bg-cover"
      style={{ backgroundImage: `url(${bg2})` }}
    >
      <div className="text-center pt-80 font-[yanzhengqing] fs-72">
        注意，现在开始正己冠
      </div>

      <VideoWrapper videoSrc={zjgVideo} />

      <div className="absolute left-0 right-0 bottom-270 flex justify-center">
        <Button text="下一步" onClick={onNext}></Button>
      </div>
    </div>
  );
};

export default memo(Zjg);
