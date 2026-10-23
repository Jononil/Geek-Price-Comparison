/**
 * 首页
 * ---------------------------------------------------------------
 * 数据源（全部真实接口，已冒烟）：
 * - GET /api/categories        热门分类入口
 * - GET /api/products          高性价比严选（sort=valueScore, pageSize=8）
 * - GET /recommendations       为你推荐（匿名=冷启动 value+hot，登录=个性化 hybrid）
 * 规则：
 * - 性价比 null → "数据不足"（不伪造评分）；
 * - 推荐图片 image 为 null 时空态（不放占位图）；
 * - 搜索/分类跳转商品列表页。
 */
import { categoryApi, productApi, recommendApi } from '../../api/index'
import { compareStore } from '../../store/compare'
import type { Category, Product, Recommendation } from '../../types'
import { pickProductImage } from '../../utils/image'
import { formatPrice, isScoreMissing } from '../../utils/format'

type ViewState = 'loading' | 'ready' | 'error'

/** 推荐卡展示模型 */
interface RecItem {
  productId: number
  name: string
  image: string
  valueMissing: boolean
  valueScore: number | string
  priceText: string
  reason: string
  typeLabel: string
}

const TYPE_LABELS: Record<string, string> = {
  hybrid: '为你推荐',
  value: '高性价比',
  hot: '近期热门',
  new: '新品',
  discount: '降价',
}

Page({
  data: {
    keyword: '',
    categories: [] as Category[],
    valueProducts: [] as Product[],
    recommendations: [] as RecItem[],
    valueState: 'loading' as ViewState,
    recState: 'loading' as ViewState,
    compareCount: 0,
  },

  onLoad() {
    this.loadCategories()
    this.loadValueProducts()
    this.loadRecommendations()
  },

  /** 下拉刷新：三个模块并行重载，全部结束后停止下拉动画 */
  async onPullDownRefresh() {
    await Promise.all([
      this.loadCategories(),
      this.loadValueProducts(),
      this.loadRecommendations(),
    ]).catch(() => {})
    wx.stopPullDownRefresh()
  },

  onShow() {
    // 对比数可能在其他页变化；卡片"已在对比"状态按需刷新
    this.setData({ compareCount: compareStore.count() })
  },

  async loadCategories() {
    try {
      const categories = await categoryApi.list()
      this.setData({ categories })
    } catch {
      // 分类失败不阻断首页（其余模块已各自处理状态）
    }
  },

  async loadValueProducts() {
    this.setData({ valueState: 'loading' })
    try {
      const res = await productApi.list({ sort: 'valueScore', page: 1, pageSize: 8 })
      this.setData({ valueProducts: res.records, valueState: 'ready' })
    } catch {
      this.setData({ valueState: 'error' })
    }
  },

  async loadRecommendations() {
    this.setData({ recState: 'loading' })
    try {
      const list = await recommendApi.list()
      const recommendations: RecItem[] = list.map((r) => ({
        productId: r.productId,
        name: r.name,
        image: pickProductImage(typeof r.image === 'string' ? [r.image] : []),
        valueMissing: isScoreMissing(r.valueScore),
        valueScore: isScoreMissing(r.valueScore) ? '数据不足' : String(r.valueScore),
        priceText: formatPrice(r.price),
        reason: r.reason,
        typeLabel: TYPE_LABELS[r.type] || '推荐',
      }))
      this.setData({ recommendations, recState: 'ready' })
    } catch {
      this.setData({ recState: 'error' })
    }
  },

  onRetryValue() {
    this.loadValueProducts()
  },

  onRetryRec() {
    this.loadRecommendations()
  },

  onKeywordInput(e: WechatMiniprogram.Input) {
    this.setData({ keyword: e.detail.value })
  },

  onSearch() {
    const kw = this.data.keyword.trim()
    wx.navigateTo({
      url: `/pages/product-list/index?keyword=${encodeURIComponent(kw)}`,
    })
  },

  onGoCategory(e: WechatMiniprogram.CustomEvent) {
    const id = e.currentTarget.dataset.id as number
    const name = e.currentTarget.dataset.name as string
    wx.navigateTo({
      url: `/pages/product-list/index?categoryId=${id}&title=${encodeURIComponent(name)}`,
    })
  },

  onGoAllValue() {
    wx.navigateTo({ url: '/pages/product-list/index?sort=valueScore&title=' + encodeURIComponent('高性价比严选') })
  },

  onGoDetail(e: WechatMiniprogram.CustomEvent) {
    const id = e.currentTarget.dataset.id as number
    wx.navigateTo({ url: `/pages/product-detail/index?id=${id}` })
  },

  onGoCompare() {
    // 对比页是 tab 页，必须 switchTab
    wx.switchTab({ url: '/pages/compare/index' })
  },
})
