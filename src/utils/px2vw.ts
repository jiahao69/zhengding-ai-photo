/**
 * px转换vw
 * @param {number} targetNum - 需要转换的数值
 * @param {number} designWidth - 设计稿宽度
 */
export function px2vw(targetNum: number = 0, designWidth: number = 1080) {
  return (targetNum / designWidth) * 100 + "vw";
}
