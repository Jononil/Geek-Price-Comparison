/**
 * 分类导航页（tab 页）
 * ---------------------------------------------------------------
 * 接口：GET /api/categories（16 个真实分类）
 * 说明：tabBar 页面无法通过 switchTab 传递参数（微信限制），
 *       本页作为分类入口导航，点击后 navigateTo 商品列表页（非 tab 页）携带 categoryId。
 */
import { categoryApi } from '../../api/index'
import type { Category } from '../../types'

Page({
  data: {
    categories: [] as Category[],
    state: 'loading' as 'loading' | 'ready' | 'error',
  },

  onLoad() {
    this.load()
  },

  async load() {
    this.setData({ state: 'loading' })
    try {
      const categories = await categoryApi.list()
      this.setData({ categories, state: 'ready' })
    } catch {
      this.setData({ state: 'error' })
    }
  },

  onRetry() {
    this.load()
  },

  onGoCategory(e: WechatMiniprogram.CustomEvent) {
    const id = Number(e.currentTarget.dataset.id)
    const name = e.currentTarget.dataset.name as string
    wx.navigateTo({
      url: `/pages/product-list/index?categoryId=${id}&title=${encodeURIComponent(name)}`,
    })
  },

  onGoAll() {
    wx.navigateTo({ url: '/pages/product-list/index' })
  },
})
