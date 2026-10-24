/**
 * 排行榜页
 * ---------------------------------------------------------------
 * 接口：GET /api/products?sort=<tab>&page=1&pageSize=10
 * 与 PC 端 RankingView 对齐：性价比榜/热门榜/评分榜/最新榜/价格最低 5 个 tab，
 * sort 均为后端真实合法值。
 */
import { productApi } from '../../api/index'
import type { Product } from '../../types'
import { pickProductImage, isPlaceholderImage, toAbsoluteUrl } from '../../utils/image'
import { formatPrice, isScoreMissing } from '../../utils/format'

const TABS = [
  { key: 'valueScore', label: '性价比榜' },
  { key: 'heat', label: '热门榜' },
  { key: 'rating', label: '评分榜' },
  { key: 'newest', label: '最新榜' },
  { key: 'priceAsc', label: '价格最低' },
]

interface RankItem {
  id: number
  rank: number
  name: string
  brandCategory: string
  image: string
  valueText: string
  valueMissing: boolean
  priceText: string
}

Page({
  data: {
    tabs: TABS,
    activeTab: 'valueScore',
    items: [] as RankItem[],
    state: 'loading' as 'loading' | 'ready' | 'error',
  },

  onLoad() {
    this.load()
  },

  async load() {
    this.setData({ state: 'loading' })
    try {
      const res = await productApi.list({
        sort: this.data.activeTab,
        page: 1,
        pageSize: 10,
      })
      const items: RankItem[] = res.records.map((p: Product, i: number) => {
        const url = pickProductImage(p.images)
        return {
          id: p.id,
          rank: i + 1,
          name: p.name,
          brandCategory: `${p.brandName || '—'} · ${p.categoryName || '—'}`,
          image: !isPlaceholderImage(url) ? toAbsoluteUrl(url) : '',
          valueText: isScoreMissing(p.valueScore) ? '数据不足' : String(p.valueScore),
          valueMissing: isScoreMissing(p.valueScore),
          priceText: formatPrice(p.currentPrice),
        }
      })
      this.setData({ items, state: 'ready' })
    } catch {
      this.setData({ state: 'error' })
    }
  },

  onTabTap(e: WechatMiniprogram.CustomEvent) {
    const key = e.currentTarget.dataset.key as string
    if (key === this.data.activeTab) return
    this.setData({ activeTab: key })
    this.load()
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
