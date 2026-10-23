/**
 * 「系列参考图」前端元数据映射
 * ------------------------------------------------------------------
 * 背景：product_images 表只有 id / product_id / url / sort，没有字段能区分
 *       「精确型号图」与「系列参考图」。为不扩表，这里用前端常量做轻量标识。
 *
 * 规则：
 *   - 仅对本阶段实际导入、且经审核确认为「同系列但非同一型号」的图片打标
 *   - 使用 productId + 完整图片 URL 双重精确匹配，避免误标其它图片
 *   - #122 Kingston FURY Impact 32GB 是 EXACT（精确型号）图，**不在**此列
 *
 * 匹配方式：URL 的 utm 查询参数会变化，因此比对时只取路径部分，
 *           但仍要求 productId 与 URL 路径**同时**命中，保证精确性。
 */

/** 待标识的系列参考图（productId + 已导入图片 URL 的路径部分） */
interface SeriesRefEntry {
  productId: number
  /** 图片 URL 的路径段（不含 ?查询参数），与数据库实际导入值一致 */
  pathSuffix: string
  /** 说明：为何只是系列参考图 */
  reason: string
}

const SERIES_REFS: SeriesRefEntry[] = [
  {
    productId: 23,
    pathSuffix: '/c/c9/Macbook_Air.jpg/500px-Macbook_Air.jpg',
    reason: 'MacBook Air 系列图，未确认是 M3 款'
  },
  {
    productId: 48,
    pathSuffix: '/6/67/Bose_QuietComfort_Ultra_Earbuds_-_3.jpg/500px-Bose_QuietComfort_Ultra_Earbuds_-_3.jpg',
    reason: 'QuietComfort 系列图'
  },
  {
    productId: 83,
    pathSuffix: '/7/79/Xiaomi_Mi_Watch_Black.jpg/500px-Xiaomi_Mi_Watch_Black.jpg',
    reason: '小米手表系列图，非 Watch S3'
  },
  {
    productId: 129,
    pathSuffix: '/e/ea/Router_TP-LINK.jpg/500px-Router_TP-LINK.jpg',
    reason: 'TP-Link 通用路由器图，非 XDR6080'
  },
  {
    productId: 130,
    pathSuffix: '/7/79/HUAWEI_Router_X3_Pro_%E2%80%93_Sunrise_Gold.jpg/500px-HUAWEI_Router_X3_Pro_%E2%80%93_Sunrise_Gold.jpg',
    reason: '华为路由器系列图（X3 Pro），非 AX3 Pro'
  },
  {
    productId: 131,
    pathSuffix: '/4/45/ZTE_WiFi_router4G.jpg/500px-ZTE_WiFi_router4G.jpg',
    reason: '中兴通用路由器图，非 AX5400 Pro'
  }
]

/** 取出 URL 的路径部分（去协议、域名与查询串），用于稳定比对 */
function urlPath(url: string): string {
  let s = String(url ?? '').trim()
  if (!s) return ''
  try {
    // 去掉查询参数（utm_* 会变）
    const noQuery = s.split('?')[0]
    // 兼容 http(s):// 与站内相对路径
    if (/^https?:\/\//i.test(noQuery)) {
      const u = new URL(noQuery)
      return u.pathname
    }
    return noQuery
  } catch {
    return s.split('?')[0]
  }
}

/** 判断某产品的某张图片是否为「系列参考图」 */
export function isSeriesReferenceImage(productId?: number | null, url?: string | null): boolean {
  if (productId == null || !url) return false
  const path = urlPath(url)
  if (!path) return false
  return SERIES_REFS.some(
    (e) => e.productId === Number(productId) && path.endsWith(e.pathSuffix)
  )
}

/** 取该系列参考图的说明（用于 tooltip），未命中返回 null */
export function getSeriesReferenceReason(productId?: number | null, url?: string | null): string | null {
  if (productId == null || !url) return null
  const path = urlPath(url)
  const hit = SERIES_REFS.find(
    (e) => e.productId === Number(productId) && path.endsWith(e.pathSuffix)
  )
  return hit ? hit.reason : null
}

/** 已标识的系列参考图数量（供自测） */
export const SERIES_REFERENCE_COUNT = SERIES_REFS.length
