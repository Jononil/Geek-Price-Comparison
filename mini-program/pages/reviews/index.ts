/**
 * 商品评价页（分页 + 发表评价）
 * ---------------------------------------------------------------
 * 接口：
 * - GET  /api/reviews/product/{productId}  分页评价列表（实测 4 条，含 nickname）
 * - POST /api/reviews                      发表评价（需登录；star 1-5；未登录=HTTP403→跳登录）
 * 说明：接口无"我是否已赞"字段 → 不做点赞 UI（缺口，见报告）。
 */
import { reviewApi } from '../../api/index'
import { userStore } from '../../store/user'
import type { Review } from '../../types'

const PAGE_SIZE = 10

interface ReviewItem {
  id: number
  nickname: string
  star: number
  content: string
  createdAt: string
}

function toItem(r: Review): ReviewItem {
  return {
    id: r.id,
    nickname: r.nickname || '匿名用户',
    star: r.star,
    content: r.content || '',
    createdAt: (r.createdAt || '').slice(0, 16).replace('T', ' '),
  }
}

Page({
  data: {
    productId: 0,
    productName: '',

    items: [] as ReviewItem[],
    page: 1,
    total: 0,
    hasMore: true,
    state: 'loading' as 'loading' | 'ready' | 'error',
    loadingMore: false,

    // 发表评价
    isLoggedIn: false,
    star: 5,
    content: '',
    submitting: false,
  },

  onLoad(query: Record<string, string | undefined>) {
    const productId = Number(query.productId)
    if (!productId) {
      this.setData({ state: 'error' })
      return
    }
    this.setData({
      productId,
      productName: query.productName ? decodeURIComponent(query.productName) : '',
      isLoggedIn: userStore.isLoggedIn(),
    })
    if (this.data.productName) {
      wx.setNavigationBarTitle({ title: `${this.data.productName} 评价` })
    }
    this.reload()
  },

  onShow() {
    this.setData({ isLoggedIn: userStore.isLoggedIn() })
  },

  async reload() {
    this.setData({ state: 'loading', page: 1, items: [], hasMore: true })
    try {
      const res = await reviewApi.listByProduct(this.data.productId, 1, PAGE_SIZE)
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
      const res = await reviewApi.listByProduct(this.data.productId, nextPage, PAGE_SIZE)
      const existing = new Set(this.data.items.map((r) => r.id))
      const merged = [...this.data.items]
      for (const r of res.records) {
        if (!existing.has(r.id)) merged.push(toItem(r))
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

  // ---------- 发表评价 ----------
  onStarTap(e: WechatMiniprogram.CustomEvent) {
    const v = Number(e.currentTarget.dataset.value)
    if (v >= 1 && v <= 5) this.setData({ star: v })
  },

  onContentInput(e: WechatMiniprogram.Input) {
    this.setData({ content: e.detail.value })
  },

  onGoLogin() {
    wx.navigateTo({
      url: `/pages/login/login?redirect=${encodeURIComponent(`/pages/reviews/index?productId=${this.data.productId}`)}`,
    })
  },

  async onSubmit() {
    const { productId, star, content, submitting } = this.data
    if (submitting) return
    if (!content.trim()) {
      wx.showToast({ title: '评价内容不能为空', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    try {
      await reviewApi.create({ productId, star, content: content.trim() })
      wx.showToast({ title: '评价成功', icon: 'success' })
      this.setData({ content: '', star: 5 })
      this.reload()
    } catch {
      // 401/403 由请求层统一处理（跳登录）；其他错误已 toast
    } finally {
      this.setData({ submitting: false })
    }
  },
})
