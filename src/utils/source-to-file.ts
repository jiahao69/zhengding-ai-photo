export async function sourceToFile(
  source: string,
  fileName = "image.png",
) {
  const response = await fetch(source, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`读取图片失败: ${response.status}`);
  }

  const blob = await response.blob();
  if (blob.size <= 0) {
    throw new Error("图片内容为空");
  }

  return new File([blob], fileName, {
    type: blob.type || "image/png",
  });
}
