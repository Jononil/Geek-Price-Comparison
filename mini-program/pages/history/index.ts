/**
 * 浏览历史
 * ---------------------------------------------------------------
 * 接口：
 * - GET    /api/history?limit=20  列表（需登录；limit 上限 50；无分页）
 * - DELETE /api/history           清空全部（需登录）
 * 图片：后端返回 qualifiedFirstImageUrl（null → 空态）。
 */
import { historyApi } from '../../api/index'
import type { BrowseHistoryItem } from '../../types'
import { formatPrice, isScoreMissing } from '../../utils/format'

interface HisItem {
  id: number
  productId: number
  name: string
  image: string
  priceText: string
  valueText: string
  valueMissing: boolean
  timeText: string
}

function toItem(h: BrowseHistoryItem): HisItem {
  return {
    id: h.id,
    productId: h.productId,
    name: h.productName || '（已下架商品）',
    image: h.image || '',
    priceText: `¥${formatPrice(h.price)}`,
    valueText: isScoreMissing(h.valueScore) ? '数据不足' : String(h.valueScore),
    valueMissing: isScoreMissing(h.valueScore),
    timeText: (h.viewedAt || '').slice(0, 16).replace('T', ' '),
  }
}

Page({
  data: {
    items: [] as HisItem[],
    state: 'loading' as 'loading' | 'ready' | 'error',
  },

  onShow() {
    this.load()
  },

  async load() {
    this.setData({ state: 'loading' })
    try {
      const list = await historyApi.list(20)
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

  onClear() {
    wx.showModal({
      title: '清除历史',
      content: '确定清除全部浏览历史？',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await historyApi.clear()
          wx.showToast({ title: '已清除', icon: 'success' })
          this.setData({ items: [] })
        } catch {
          // toast 已由请求层提示
        }
      },
    })
  },
})
