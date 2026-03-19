import { memo, useMemo } from "react";
import type { FC, ReactNode } from "react";
import QRCode from "react-qr-code";

import poem1 from "@/assets/images/poem1.png";
import poem2 from "@/assets/images/poem2.png";
import poem3 from "@/assets/images/poem3.png";
import poem4 from "@/assets/images/poem4.png";
import qrBg from "@/assets/images/qrcode-bg.png";
import backHome from "@/assets/images/back-home.png";

interface IProps {
  children?: ReactNode;
  resultImageUrl?: string;
  uploadedResultUrl?: string;
  onBack?: () => void;
}

const poemImages = [poem1, poem2, poem3, poem4];
const getPoemIndexFromResult = () =>
  Math.floor(Math.random() * poemImages.length);

const TransformationResults: FC<IProps> = ({
  resultImageUrl,
  uploadedResultUrl,
  onBack,
}) => {
  const poemIndex = useMemo(() => getPoemIndexFromResult(), []);
  const poemImage = poemImages[poemIndex] ?? poem1;
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
