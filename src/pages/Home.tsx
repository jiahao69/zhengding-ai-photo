import { memo } from "react";
import type { FC, ReactNode } from "react";

import bg1 from "@/assets/images/bg1.png";
import ygyx from "@/assets/images/ygyx.png";
import open from "@/assets/images/open.png";
import openActive from "@/assets/images/open-active.png";

import Button from "@/components/Button";

interface IProps {
  children?: ReactNode;
  onOpen?: () => void;
}

const Home: FC<IProps> = ({ onOpen }) => {
  return (
    <div className="h-full bg-cover" style={{ backgroundImage: `url(${bg1})` }}>
      <div className="pl-245 pt-264">
        <img className="w-525" src={ygyx} alt="" />
      </div>
      <div className="flex justify-center mt-76">
        <Button
          width={603}
          height={219}
          normalBg={open}
          activeBg={openActive}
          onClick={onOpen}
        />
      </div>
    </div>
  );
};

export default memo(Home);
