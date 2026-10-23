/**
 * 产品图片取值工具
 * ------------------------------------------------------------------
 * 数据库里同一个产品可能同时存在多张图片记录：
 *   - 早期由初始化脚本写入的 placehold.co 占位图（sort 更小，排在最前）
 *   - 后续补录的真实产品图（sort 更大）
 * 因此不能固定取 images[0]，否则永远显示占位图。
 *
 * 取值优先级：
 *   1. 第一张「非占位图」的真实图片
 *   2. 若全都是占位图，则取第一张
 *   3. 都没有时，回退到统一的默认占位图
 */

/** 常见占位图服务（与后端验证脚本的判定保持一致） */
const PLACEHOLDER_PATTERN = /placehold\.co|placekitten|dummyimage|via\.placeholder/i

/** 统一的默认占位图 */
export const DEFAULT_PRODUCT_IMAGE =
  'https://placehold.co/400x300/e5e7eb/9ca3af?text=GeekPrice'

/** 判断一个 URL 是否为占位图 */
export function isPlaceholderImage(url?: string | null): boolean {
  if (!url) return true
  return PLACEHOLDER_PATTERN.test(url)
}

/**
 * 从产品图片列表中挑选用于展示的图片：优先真实图片，其次占位图，最后默认图。
 */
export function pickProductImage(images?: string[] | null): string {
  const list = (images ?? []).filter(
    (url): url is string => typeof url === 'string' && url.trim() !== ''
  )
  const real = list.find((url) => !isPlaceholderImage(url))
  return real ?? list[0] ?? DEFAULT_PRODUCT_IMAGE
}
