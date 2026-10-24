/**
 * 我的收藏
 * ---------------------------------------------------------------
 * 接口：
 * - GET    /api/favorites?page&pageSize          分页列表（实测 1 条，字段全确认）
 * - DELETE /api/favorites/{targetType}/{targetId} 取消收藏（需登录）
 * targetType：1=产品（跳商品详情）2=测评（后端返回 title/cover，跳测评详情）
 * 图片：后端对 targetType=1 已返回 qualifiedFirstImageUrl（null → 空态，不放占位图）。
 */
import { toAbsoluteUrl } from '../../utils/image'
import { favoriteApi } from '../../api/index'
import type { FavoriteItem } from '../../types'
import { formatPrice, isScoreMissing } from '../../utils/format'

const PAGE_SIZE = 10

interface FavItem {
  id: number
  targetType: number
  targetId: number
  name: string
  image: string
  priceText: string
  valueText: string
  valueMissing: boolean
  createdAtText: string
}

function toItem(f: FavoriteItem): FavItem {
  const isProduct = f.targetType === 1
  return {
    id: f.id,
    targetType: f.targetType,
    targetId: f.targetId,
    name: f.name || '（已删除的内容）',
    image: toAbsoluteUrl(f.image),
    priceText: isProduct ? `¥${formatPrice(f.price)}` : '',
    valueText: isScoreMissing(f.valueScore) ? '数据不足' : String(f.valueScore),
    valueMissing: isScoreMissing(f.valueScore),
    createdAtText: (f.createdAt || '').slice(0, 10),
  }
}

Page({
  data: {
    items: [] as FavItem[],
    page: 1,
    total: 0,
    hasMore: true,
    state: 'loading' as 'loading' | 'ready' | 'error',
    loadingMore: false,
  },

  onShow() {
    this.reload()
  },

  async reload() {
    this.setData({ state: 'loading', page: 1, items: [], hasMore: true })
    try {
      const res = await favoriteApi.list(1, PAGE_SIZE)
      this.setData({
        items: res.records.map(toItem),
        total: res.total,
        page: 1,
        hasMore: res.records.length >= PAGE_SIZE && res.records.length < res.total,
        state: 'ready',
      })
    } catch {
      this.setData({ state: 'error' })
    }
  },

  async loadMore() {
    const { loadingMore, hasMore, state, page } = this.data
    if (loadingMore || !hasMore || state !== 'ready') return
    this.setData({ loadingMore: true })
    try {
      const nextPage = page + 1
      const res = await favoriteApi.list(nextPage, PAGE_SIZE)
      const existing = new Set(this.data.items.map((f) => f.id))
      const merged = [...this.data.items]
      for (const f of res.records) {
        if (!existing.has(f.id)) merged.push(toItem(f))
      }
      this.setData({
        items: merged,
        page: nextPage,
        total: res.total,
        hasMore: res.records.length >= PAGE_SIZE && merged.length < res.total,
      })
    } catch {
      // toast 已由请求层提示
    } finally {
      this.setData({ loadingMore: false })
    }
  },

  onReachBottom() {
    this.loadMore()
  },

  async onPullDownRefresh() {
    await this.reload().catch(() => {})
    wx.stopPullDownRefresh()
  },

  onRetry() {
    this.reload()
  },

  onTapItem(e: WechatMiniprogram.CustomEvent) {
    const id = Number(e.currentTarget.dataset.id)
    const type = Number(e.currentTarget.dataset.type)
    const url =
      type === 1
        ? `/pages/product-detail/index?id=${id}`
        : `/pages/article-detail/index?id=${id}`
    wx.navigateTo({ url })
  },

  onRemove(e: WechatMiniprogram.CustomEvent) {
    const id = Number(e.currentTarget.dataset.id)
    const type = Number(e.currentTarget.dataset.type)
    const item = this.data.items.find((f) => f.id === id)
    wx.showModal({
      title: '取消收藏',
      content: `确定取消收藏「${item?.name || ''}」？`,
      success: async (res) => {
        if (!res.confirm) return
        try {
          await favoriteApi.remove(type, Number(e.currentTarget.dataset.target))
          wx.showToast({ title: '已取消收藏', icon: 'success' })
          this.reload()
        } catch {
          // toast 已由请求层提示
        }
      },
    })
  },
})
