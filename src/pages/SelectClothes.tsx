import { memo, useCallback, useMemo } from "react";
import type { FC, ReactNode } from "react";

import bg3 from "@/assets/images/bg3.png";
import male1 from "@/assets/images/male-preview1.png";
import maleActive1 from "@/assets/images/male-preview-active1.png";
import male2 from "@/assets/images/male-preview2.png";
import maleActive2 from "@/assets/images/male-preview-active2.png";
import male3 from "@/assets/images/male-preview3.png";
import maleActive3 from "@/assets/images/male-preview-active3.png";
import male4 from "@/assets/images/male-preview4.png";
import maleActive4 from "@/assets/images/male-preview-active4.png";
import female1 from "@/assets/images/female-preview1.png";
import femaleActive1 from "@/assets/images/female-preview-active1.png";
import female2 from "@/assets/images/female-preview2.png";
import femaleActive2 from "@/assets/images/female-preview-active2.png";
import female3 from "@/assets/images/female-preview3.png";
import femaleActive3 from "@/assets/images/female-preview-active3.png";
import female4 from "@/assets/images/female-preview4.png";
import femaleActive4 from "@/assets/images/female-preview-active4.png";
import maleSwap1 from "@/assets/images/male-swap1.png";
import maleSwap2 from "@/assets/images/male-swap2.png";
import maleSwap3 from "@/assets/images/male-swap3.png";
import maleSwap4 from "@/assets/images/male-swap4.png";
import femaleSwap1 from "@/assets/images/female-swap1.png";
import femaleSwap2 from "@/assets/images/female-swap2.png";
import femaleSwap3 from "@/assets/images/female-swap3.png";
import femaleSwap4 from "@/assets/images/female-swap4.png";

import Button from "@/components/Button";

interface IProps {
  children?: ReactNode;
  selectedGender?: "male" | "female" | "";
  onBack?: () => void;
  onConfirm?: (swapImage: string) => void;
}

interface IClothesOption {
  previewImage: string;
  activePreviewImage: string;
  swapImage: string;
}

const SelectClothes: FC<IProps> = ({
  selectedGender = "",
  onBack,
  onConfirm,
}) => {
  const clothesList = useMemo<IClothesOption[]>(() => {
    if (selectedGender === "female") {
      return [
        {
          previewImage: female1,
          activePreviewImage: femaleActive1,
          swapImage: femaleSwap1,
        },
        {
          previewImage: female2,
          activePreviewImage: femaleActive2,
          swapImage: femaleSwap2,
        },
        {
          previewImage: female3,
          activePreviewImage: femaleActive3,
          swapImage: femaleSwap3,
        },
        {
          previewImage: female4,
          activePreviewImage: femaleActive4,
          swapImage: femaleSwap4,
        },
      ];
    }
    return [
      {
        previewImage: male1,
        activePreviewImage: maleActive1,
        swapImage: maleSwap1,
      },
      {
        previewImage: male2,
        activePreviewImage: maleActive2,
        swapImage: maleSwap2,
      },
      {
        previewImage: male3,
        activePreviewImage: maleActive3,
        swapImage: maleSwap3,
      },
      {
        previewImage: male4,
        activePreviewImage: maleActive4,
        swapImage: maleSwap4,
      },
    ];
  }, [selectedGender]);

  const handleSelect = useCallback(
    (swapImage: string) => {
      onConfirm?.(swapImage);
    },
    [onConfirm],
  );

  return (
    <div
      className="size-full bg-cover"
      style={{ backgroundImage: `url(${bg3})` }}
    >
      <div className="pt-198 text-center font-[yanzhengqing] fs-72">
        选择服装
      </div>

      <div className="flex flex-wrap justify-center gap-x-44 gap-y-44 mt-40">
        {clothesList.map((clothes) => {
          return (
            <Button
              key={clothes.previewImage}
              width={349}
              height={513}
              normalBg={clothes.previewImage}
              activeBg={clothes.activePreviewImage}
              onClick={() => {
                handleSelect(clothes.swapImage);
              }}
            />
          );
        })}
      </div>

      <div className="flex justify-center gap-100 mt-10">
        <Button text="返回" onClick={onBack} />
      </div>
    </div>
  );
};

export default memo(SelectClothes);
