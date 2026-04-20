import { memo, useEffect, useMemo, useState } from "react";
import type { FC, ReactNode } from "react";

import { getThemeImage } from "@/utils/theme-assets";

interface IProps {
  children?: ReactNode;
}

const INTRO_SWITCH_INTERVAL = 5000;
const INTRO_ITEMS = [
  {
    imageName: "20260420-140957.png",
    text: "斗笠盔是戚家军步兵制式头盔，因形似斗笠得名。",
  },
  {
    imageName: "20260420-140955.png",
    text: "藤牌由坚韧老藤编织而成，轻便坚韧、防水防潮，是戚家军近战核心盾牌。",
  },
  {
    imageName: "20260420-140951.png",
    text: "长牌是戚家军鸳鸯阵前排核心防御装备，又称挨牌，为高大长方形盾体。",
  },
  {
    imageName: "20260420-140953.png",
    text: "龙虾臂是戚家军标配的前臂防护甲，因铁甲片层层叠合、屈伸如虾壳而得名。",
  },
  {
    imageName: "20260420-140949.png",
    text: "狼筅是戚继光专为克制倭刀打造的神器，以长竹加固制成，保留层层枝杈，让倭寇再锋利的刀也难以发挥。",
  },
  {
    imageName: "20260420-140947.png",
    text: "明初四川有韩氏女子，世称韩氏女。堪称明代版花木兰，成为长城之外、西南边塞一段巾帼传奇。",
  },
] as const;

const ChangChengLoading: FC<IProps> = () => {
  const bg = getThemeImage("bg.png");
  const textBorder = getThemeImage("border.png");
  const loading = getThemeImage("loading.png");
  const [activeIndex, setActiveIndex] = useState(0);
  const introItems = useMemo(
    () =>
      INTRO_ITEMS.map((item) => ({
        ...item,
        image: getThemeImage(item.imageName),
      })),
    [],
  );

  useEffect(() => {
    if (introItems.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % introItems.length);
    }, INTRO_SWITCH_INTERVAL);

    return () => {
      window.clearInterval(timer);
    };
  }, [introItems.length]);

  const activeIntroItem = introItems[activeIndex] ?? introItems[0];

  return (
    <div
      className="flex flex-col items-center h-full bg-cover"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="pt-200 font-[yanzhengqing] fs-72">变装中请稍后...</div>

      <img className="w-642 mt-40" src={activeIntroItem?.image} />

      <div
        className="flex justify-center items-center w-920 h-315 pl-140 pr-140 bg-cover mt-140 "
        style={{ backgroundImage: `url(${textBorder})` }}
      >
        <span className="fs-32">{activeIntroItem?.text}</span>
      </div>

      <img className="w-175 mt-auto mb-180 animate-spin" src={loading} alt="" />
    </div>
  );
};

export default memo(ChangChengLoading);
