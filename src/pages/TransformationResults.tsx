import { memo, useMemo } from "react";
import type { FC, ReactNode } from "react";
import QRCode from "react-qr-code";

import {
  getThemeImage,
  getThemeImages,
} from "@/utils/theme-assets";

interface IProps {
  children?: ReactNode;
  resultImageUrl?: string;
  uploadedResultUrl?: string;
  onBack?: () => void;
}

const getPoemIndexFromResult = (poemCount: number) =>
  Math.floor(Math.random() * poemCount);

const TransformationResults: FC<IProps> = ({
  resultImageUrl,
  uploadedResultUrl,
  onBack,
}) => {
  const poemImages = getThemeImages([
    "poem1.png",
    "poem2.png",
    "poem3.png",
    "poem4.png",
  ]);
  const qrBg = getThemeImage("qrcode-bg.png");
  const backHome = getThemeImage("back-home.png");
  const poemIndex = useMemo(
    () => getPoemIndexFromResult(poemImages.length),
    [poemImages.length],
  );
  const poemImage = poemImages[poemIndex] ?? poemImages[0] ?? "";
  const qrcodeValue =
    "https://threebody-test.vitoreality.com/yuangu-ar/api" + uploadedResultUrl;

  return (
    <div
      className="h-full bg-cover"
      style={{
        backgroundImage: resultImageUrl ? `url(${resultImageUrl})` : undefined,
      }}
    >
      <div
        className="absolute right-72 top-70 w-204 h-314 bg-cover"
        style={{ backgroundImage: `url(${qrBg})` }}
      >
        {qrcodeValue && (
          <QRCode
            className="absolute left-34 top-34 size-138"
            value={qrcodeValue}
            fgColor="#111111"
            bgColor="#ffffff"
          />
        )}
      </div>

      <img
        className="absolute left-76 top-70 z-10 w-142"
        src={poemImage}
        alt=""
      />

      {onBack && (
        <div
          className="absolute right-0 bottom-0"
          data-gesture-clickable
          onClick={onBack}
        >
          <img className="w-266" src={backHome} alt="" />
        </div>
      )}
    </div>
  );
};

export default memo(TransformationResults);
