/**
 * 产品图片取值工具（与 PC 端 frontend/src/utils/image.ts 逻辑对齐）
 * ---------------------------------------------------------------
 * 与后端 ProductImageLicenseService 门控配套的前端规则：
 * - 后端只下发「审核通过的真实图片」（未授权/待审核/拒绝/有风险的图不会出现在 images 中）；
 * - images 可能为空数组（无合格图）；前端不得用占位图/类别图伪装商品实拍，
 *   无合格图或加载失败时统一显示"暂无实拍图"空态（见组件实现）；
 * - 防御性排除 placehold.co 等占位服务地址（历史数据残留）。
 */

import { getBaseURL } from '../config/env'

const PLACEHOLDER_PATTERN = /placehold\.co|placekitten|dummyimage|via\.placeholder/i

/** 判断 URL 是否为占位图 */
export function isPlaceholderImage(url?: string | null): boolean {
  if (!url) return true
  return PLACEHOLDER_PATTERN.test(url)
}

/**
 * 从图片列表中挑选展示图：优先第一张「非占位图」。
 * 返回 '' 表示无合格图（调用方必须走空态，不得自行补图）。
 */
export function pickProductImage(images?: string[] | null): string {
  const list = (images ?? []).filter(
    (url): url is string => typeof url === 'string' && url.trim() !== ''
  )
  const real = list.find((url) => !isPlaceholderImage(url))
  return real ?? ''
}

/**
 * 后端下发的图片可能是站内相对路径（/products/p123.jpg）。
 * 小程序里 <image src> 不会相对后端解析，必须补成绝对地址。
 */
export function toAbsoluteUrl(url?: string | null): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.charAt(0) === '/') return getBaseURL() + url
  return url
}