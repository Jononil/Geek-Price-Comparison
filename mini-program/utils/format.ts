/**
 * 格式化与展示辅助工具
 */

/** 价格展示：保留两位小数（后端 BigDecimal 序列化为 number/string 均兼容） */
export function formatPrice(price?: number | string | null): string {
  if (price === null || price === undefined || price === '') return '—'
  const n = Number(price)
  if (Number.isNaN(n)) return '—'
  return n.toFixed(2)
}

/** 评分展示：null → "数据不足"（业务红线：不得用默认值伪造评分） */
export function formatScore(score?: number | string | null): string {
  if (score === null || score === undefined || score === '') return '数据不足'
  const n = Number(score)
  return Number.isNaN(n) ? '数据不足' : String(n)
}

/** 评分是否缺失（UI 判断用） */
export function isScoreMissing(score?: number | string | null): boolean {
  return score === null || score === undefined || score === '' || Number.isNaN(Number(score))
}

/** ISO 时间 → MM-DD HH:mm（报价 updatedAt 用；后端 Jackson 'yyyy-MM-dd HH:mm:ss' 两种形态都兼容） */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return ''
  const s = iso.replace('T', ' ')
  const m = s.match(/^\d{4}-(\d{2}-\d{2})[ ](\d{2}:\d{2})/)
  if (m) return `${m[1]} ${m[2]}`
  return s.length > 16 ? s.slice(0, 16) : s
}

/** 日期（记录日）→ MM-DD */
export function formatDateMMDD(date?: string | null): string {
  if (!date) return ''
  const m = date.match(/^\d{4}-(\d{2}-\d{2})$/)
  return m ? m[1] : date
}
