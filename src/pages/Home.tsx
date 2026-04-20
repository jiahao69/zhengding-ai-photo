import { memo } from "react";
import type { FC, ReactNode } from "react";

import Button from "@/components/Button";
import { getThemeImage } from "@/utils/theme-assets";

interface IProps {
  children?: ReactNode;
  onOpen?: () => void;
}

const Home: FC<IProps> = ({ onOpen }) => {
  const bg = getThemeImage("bg.png");
  const ygyx = getThemeImage("ygyx.png");

  return (
    <div className="h-full bg-cover" style={{ backgroundImage: `url(${bg})` }}>
      <div className="pl-245 pt-264">
        <img className="w-525" src={ygyx} alt="" />
      </div>
      <div className="flex justify-center mt-76">
        <Button text="开启" onClick={onOpen} />
      </div>
    </div>
  );
};

export default memo(Home);
