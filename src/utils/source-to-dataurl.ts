import { sourceToFile } from "./source-to-file";

export async function sourceToDataURL(source: string) {
  if (source.startsWith("data:")) {
    return source;
  }

  const file = await sourceToFile(source);

  return await new Promise<string>((resolve, reject) => {
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
    reader.readAsDataURL(file);
  });
}
