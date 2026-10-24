/**
 * 个性化推荐页
 * ---------------------------------------------------------------
 * 接口：GET /api/recommendations（唯一来源——推荐算法在后端，前端不得自算）
 * 匿名 = 冷启动（value 6 条 + hot 4 条）；登录且有行为 = hybrid TOP10。
 */
import { recommendApi } from '../../api/index'
import type { Recommendation } from '../../types'
import { pickProductImage, toAbsoluteUrl } from '../../utils/image'
import { formatPrice, isScoreMissing } from '../../utils/format'

interface RecItem {
  productId: number
  name: string
  image: string
  reason: string
  typeLabel: string
  scoreText: string
  priceText: string
  valueText: string
  valueMissing: boolean
}

const TYPE_LABELS: Record<string, string> = {
  hybrid: '为你推荐',
  value: '高性价比',
  hot: '近期热门',
  new: '新品',
  discount: '降价',
}

function toItem(r: Recommendation): RecItem {
  return {
    productId: r.productId,
    name: r.name,
    image: toAbsoluteUrl(pickProductImage(typeof r.image === 'string' ? [r.image] : [])),
    reason: r.reason || '',
    typeLabel: TYPE_LABELS[r.type] || '推荐',
    scoreText: r.score != null ? `${r.score}%` : '—',
    priceText: formatPrice(r.price),
    valueText: isScoreMissing(r.valueScore) ? '数据不足' : String(r.valueScore),
    valueMissing: isScoreMissing(r.valueScore),
  }
}

Page({
  data: {
    items: [] as RecItem[],
    state: 'loading' as 'loading' | 'ready' | 'error',
  },

  onLoad() {
    this.load()
  },

  onShow() {
    // 登录态变化会影响推荐结果（个性化），每次显示重新拉取
    if (this.data.state !== 'loading') this.load()
  },

  async load() {
    this.setData({ state: 'loading' })
    try {
      const list = await recommendApi.list()
      this.setData({ items: list.map(toItem), state: 'ready' })
    } catch {
      this.setData({ state: 'error' })
    }
  },

  onRetry() {
    this.load()
  },

  async onPullDownRefresh() {
    await this.load().catch(() => {})
    wx.stopPullDownRefresh()
  },

  onTapItem(e: WechatMiniprogram.CustomEvent) {
    const id = Number(e.currentTarget.dataset.id)
    wx.navigateTo({ url: `/pages/product-detail/index?id=${id}` })
  },
})
