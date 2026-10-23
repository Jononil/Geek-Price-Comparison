/**
 * 测评中心（专业测评列表）
 * ---------------------------------------------------------------
 * 接口：GET /api/articles?page&pageSize（仅已发布 status=1，实测 32 篇）
 * 实测数据形态：cover 全部为 null（列表用无封面空态，不放占位图）、
 *              productId 全部为 null（跳转商品入口按数据动态隐藏）。
 * 交互：触底分页（onReachBottom + 去重 + loading 锁）。
 */
import { articleApi } from '../../api/index'
import type { ReviewArticle } from '../../types'

const PAGE_SIZE = 10

interface ArticleItem {
  id: number
  title: string
  summary: string
  author: string
  scoreText: string
  viewsText: string
  likesText: string
  publishText: string
  hasCover: boolean
  cover: string
  hasProduct: boolean
  productName: string
}

function toItem(a: ReviewArticle): ArticleItem {
  return {
    id: a.id,
    title: a.title,
    summary: a.summary || '',
    author: a.author || '—',
    scoreText: a.score != null ? String(a.score) : '—',
    viewsText: String(a.views ?? 0),
    likesText: String(a.likes ?? 0),
    publishText: (a.publishTime || '').slice(0, 10),
    hasCover: !!a.cover,
    cover: a.cover || '',
    hasProduct: !!a.productId,
    productName: a.productName || '',
  }
}

Page({
  data: {
    items: [] as ArticleItem[],
    page: 1,
    hasMore: true,
    state: 'loading' as 'loading' | 'ready' | 'error',
    loadingMore: false,
  },

  onLoad() {
    this.reload()
  },

  onShow() {
    // 从详情点赞返回时 likes 已在详情页+1（后端已持久化），简单重载首页数据保持一致
  },

  async reload() {
    this.setData({ state: 'loading', page: 1, items: [], hasMore: true })
    try {
      const res = await articleApi.list(1, PAGE_SIZE)
      this.setData({
        items: res.records.map(toItem),
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
      const res = await articleApi.list(nextPage, PAGE_SIZE)
      const existing = new Set(this.data.items.map((a) => a.id))
      const merged = [...this.data.items]
      for (const a of res.records) {
        if (!existing.has(a.id)) merged.push(toItem(a))
      }
      this.setData({
        items: merged,
        page: nextPage,
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

  onTapArticle(e: WechatMiniprogram.CustomEvent) {
    const id = Number(e.currentTarget.dataset.id)
    wx.navigateTo({ url: `/pages/article-detail/index?id=${id}` })
  },
})
