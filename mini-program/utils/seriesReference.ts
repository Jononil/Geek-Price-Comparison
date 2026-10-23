/**
 * 「系列参考图」标识映射（与 PC 端 frontend/src/utils/seriesReference.ts 完全对齐）
 * ---------------------------------------------------------------
 * product_images 表无"精确型号图/系列参考图"字段，经审核确认为
 * 「同系列但非同一型号」的图片在前端做轻量标识。
 * 规则：productId + 图片 URL 路径段 双重精确匹配（查询参数会变化，只比对路径）。
 */

interface SeriesRefEntry {
  productId: number
  /** 图片 URL 的路径段（不含 ?查询参数），与数据库实际导入值一致 */
  pathSuffix: string
  reason: string
}

const SERIES_REFS: SeriesRefEntry[] = [
  { productId: 23, pathSuffix: '/c/c9/Macbook_Air.jpg/500px-Macbook_Air.jpg', reason: 'MacBook Air 系列图，未确认是 M3 款' },
  { productId: 48, pathSuffix: '/6/67/Bose_QuietComfort_Ultra_Earbuds_-_3.jpg/500px-Bose_QuietComfort_Ultra_Earbuds_-_3.jpg', reason: 'QuietComfort 系列图' },
  { productId: 83, pathSuffix: '/7/79/Xiaomi_Mi_Watch_Black.jpg/500px-Xiaomi_Mi_Watch_Black.jpg', reason: '小米手表系列图，非 Watch S3' },
  { productId: 129, pathSuffix: '/e/ea/Router_TP-LINK.jpg/500px-Router_TP-LINK.jpg', reason: 'TP-LINK 通用路由器图，非 XDR6080' },
  { productId: 130, pathSuffix: '/7/79/HUAWEI_Router_X3_Pro_%E2%80%93_Sunrise_Gold.jpg/500px-HUAWEI_Router_X3_Pro_%E2%80%93_Sunrise_Gold.jpg', reason: '华为路由器系列图（X3 Pro），非 AX3 Pro' },
  { productId: 131, pathSuffix: '/4/45/ZTE_WiFi_router4G.jpg/500px-ZTE_WiFi_router4G.jpg', reason: '中兴通用路由器图，非 AX5400 Pro' },
]

/** 取 URL 路径部分（去协议、域名与查询串） */
function urlPath(url: string): string {
  const s = String(url ?? '').trim()
  if (!s) return ''
  const noQuery = s.split('?')[0]
  if (/^https?:\/\//i.test(noQuery)) {
    const idx = noQuery.indexOf('//')
    const afterProto = noQuery.slice(idx + 2)
    const slash = afterProto.indexOf('/')
    return slash >= 0 ? afterProto.slice(slash) : '/'
  }
  return noQuery
}

/** 是否为系列参考图（productId + URL 路径同时命中） */
export function isSeriesReferenceImage(
  productId?: number | null,
  url?: string | null
): boolean {
  if (productId == null || !url) return false
  const path = urlPath(url)
  if (!path) return false
  return SERIES_REFS.some(
    (e) => e.productId === Number(productId) && path.endsWith(e.pathSuffix)
  )
}

/** 系列参考图说明（未命中返回 null） */
export function getSeriesReferenceReason(
  productId?: number | null,
  url?: string | null
): string | null {
  if (productId == null || !url) return null
  const path = urlPath(url)
  const hit = SERIES_REFS.find(
    (e) => e.productId === Number(productId) && path.endsWith(e.pathSuffix)
  )
  return hit ? hit.reason : null
}
