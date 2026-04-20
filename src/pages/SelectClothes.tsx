import { memo, useCallback, useMemo } from "react";
import type { FC, ReactNode } from "react";

import Button from "@/components/Button";
import { getThemeImage, getThemeImages } from "@/utils/theme-assets";

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
  const bg = getThemeImage("bg.png");

  const clothesList = useMemo<IClothesOption[]>(() => {
    if (selectedGender === "female") {
      const [
        female1,
        femaleActive1,
        female2,
        femaleActive2,
        female3,
        femaleActive3,
        female4,
        femaleActive4,
        femaleSwap1,
        femaleSwap2,
        femaleSwap3,
        femaleSwap4,
      ] = getThemeImages([
        "female-preview1.png",
        "female-preview-active1.png",
        "female-preview2.png",
        "female-preview-active2.png",
        "female-preview3.png",
        "female-preview-active3.png",
        "female-preview4.png",
        "female-preview-active4.png",
        "female-swap1.png",
        "female-swap2.png",
        "female-swap3.png",
        "female-swap4.png",
      ]);

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

    const [
      male1,
      maleActive1,
      male2,
      maleActive2,
      male3,
      maleActive3,
      male4,
      maleActive4,
      maleSwap1,
      maleSwap2,
      maleSwap3,
      maleSwap4,
    ] = getThemeImages([
      "male-preview1.png",
      "male-preview-active1.png",
      "male-preview2.png",
      "male-preview-active2.png",
      "male-preview3.png",
      "male-preview-active3.png",
      "male-preview4.png",
      "male-preview-active4.png",
      "male-swap1.png",
      "male-swap2.png",
      "male-swap3.png",
      "male-swap4.png",
    ]);

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
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="pt-160 text-center font-[yanzhengqing] fs-72">
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

      <div className="flex justify-center gap-100 mt-100">
        <Button text="返回" onClick={onBack} />
      </div>
    </div>
  );
};

export default memo(SelectClothes);
