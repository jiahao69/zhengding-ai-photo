import { memo, useCallback } from "react";
import type { FC, ReactNode } from "react";

import Button from "@/components/Button";
import { getThemeImage } from "@/utils/theme-assets";

interface IProps {
  children?: ReactNode;
  onSelect?: (gender: "male" | "female") => void;
  onBack?: () => void;
}

const SelectGender: FC<IProps> = ({ onSelect, onBack }) => {
  const bg = getThemeImage("bg.png");
  const male = getThemeImage("male.png");
  const maleActive = getThemeImage("male-active.png");
  const female = getThemeImage("female.png");
  const femaleActive = getThemeImage("female-active.png");

  const handleSelect = useCallback(
    (gender: "male" | "female") => {
      onSelect?.(gender);
    },
    [onSelect],
  );

  return (
    <div
      className="size-full bg-cover"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="pt-159 text-center font-[yanzhengqing] fs-72">
        请选择性别
      </div>

      <div className="flex flex-col items-center gap-56 mt-162">
        <Button
          width={370}
          height={372}
          normalBg={male}
          activeBg={maleActive}
          onClick={() => {
            handleSelect("male");
          }}
        />
        <Button
          width={370}
          height={372}
          normalBg={female}
          activeBg={femaleActive}
          onClick={() => {
            handleSelect("female");
          }}
        />
      </div>

      <div className="flex justify-center mt-56">
        <Button text="返回" onClick={onBack} />
      </div>
    </div>
  );
};

export default memo(SelectGender);
