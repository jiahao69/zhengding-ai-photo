import { dataURLToBlob } from "@/utils/dataurl-to-blob";
import { sourceToFile } from "@/utils/source-to-file";

import { request } from "./request";

const VITE_SWAP_BASE_URL = import.meta.env.VITE_SWAP_BASE_URL;
const VITE_UPLOAD_BASE_URL = import.meta.env.VITE_UPLOAD_BASE_URL;

const blobToDataURL = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string" && reader.result) {
        resolve(reader.result);
        return;
      }
      reject(new Error("读取图片失败"));
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("读取图片失败"));
    };

    reader.readAsDataURL(blob);
  });

export async function requestFaceSwap(
  sourceImageUrl: string,
  targetImageUrl: string,
) {
  const [sourceFile, targetFile] = await Promise.all([
    sourceToFile(sourceImageUrl, "source.png"),
    sourceToFile(targetImageUrl, "target.png"),
  ]);

  const formData = new FormData();
  formData.append("source", sourceFile);
  formData.append("target", targetFile);

  const response = await fetch(VITE_SWAP_BASE_URL + "/face-swap", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("合成失败");
  }

  const blob = await response.blob();

  if (blob.size > 0) {
    return await blobToDataURL(blob);
  }

  throw new Error("未获取到换装结果图片");
}

export function uploadImage(name: string, dataURL: string) {
  const blob = dataURLToBlob(dataURL);

  const extension = blob.type.split("/")[1] || "png";
  const fileName = `${name}.${extension}`;

  const formData = new FormData();
  formData.append("file", blob, fileName);
  formData.append("file_category", "2");
  formData.append("namespace", "camera");

  return request<{ value: string }>(
    VITE_UPLOAD_BASE_URL + "/system/v1/upload",
    {
      method: "post",
      body: formData,
    },
  );
}
