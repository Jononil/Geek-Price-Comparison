/**
 * 商品列表 / 分类 / 搜索页
 * ---------------------------------------------------------------
 * 接收参数：keyword / categoryId / brandId / sort / title / minPrice / maxPrice
 * 接口：GET /api/products（ProductQueryDTO 全参数已在阶段二实测）
 * 交互：
 * - 触底加载（onReachBottom），page 递增，按 id 去重防重复渲染；
 * - 筛选面板：分类 / 品牌 / 价格区间（品牌、分类均来自真实接口）；
 * - 排序条：使用后端真实 sort 合法值；
 * - 加载中 / 错误 / 空态 / 没有更多 全覆盖；
 * - pageSize=20（服务端上限 50）。
 */
import { brandApi, categoryApi, productApi } from '../../api/index'
import type { Brand, Category, Product, ProductQuery } from '../../types'
import { SORT_OPTIONS } from '../../types'

const PAGE_SIZE = 20

interface FilterPanel {
  show: boolean
  categories: Category[]
  brands: Brand[]
  /** 面板中的草稿值（确定时才生效） */
  draftCategoryId: number | null
  draftBrandId: number | null
  draftMinPrice: string
  draftMaxPrice: string
}

Page({
  data: {
    title: '全部商品',
    keyword: '',
    sort: '',
    sortOptions: SORT_OPTIONS,

    products: [] as Product[],
    page: 1,
    total: 0,
    hasMore: true,

    state: 'loading' as 'loading' | 'ready' | 'error',
    loadingMore: false,

    /** 生效的筛选 */
    categoryId: null as number | null,
    brandId: null as number | null,
    minPrice: null as number | null,
    maxPrice: null as number | null,

    /** 当前筛选摘要（显示在筛选按钮上） */
    filterSummary: '',

    panel: {
      show: false,
      categories: [] as Category[],
      brands: [] as Brand[],
      draftCategoryId: null as number | null,
      draftBrandId: null as number | null,
      draftMinPrice: '',
      draftMaxPrice: '',
    } as FilterPanel,
  },

  onLoad(query: Record<string, string | undefined>) {
    const keyword = query.keyword || ''
    const categoryId = query.categoryId ? Number(query.categoryId) : null
    const brandId = query.brandId ? Number(query.brandId) : null
    const sort = query.sort || ''
    const title =
      query.title || (keyword ? `搜索：${keyword}` : categoryId ? '分类商品' : '全部商品')

    this.setData({
      title,
      keyword,
      categoryId,
      brandId,
      sort,
      minPrice: query.minPrice ? Number(query.minPrice) : null,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : null,
    })
    wx.setNavigationBarTitle({ title })

    this.loadFilterOptions()
    this.reload()
  },

  /** 分类/品牌选项（筛选面板用，失败不阻断列表） */
  async loadFilterOptions() {
    try {
      const [categories, brands] = await Promise.all([categoryApi.list(), brandApi.list()])
      this.setData({
        'panel.categories': categories,
        'panel.brands': brands,
      })
    } catch {
      // 筛选面板选项加载失败：面板仍可打开，仅选项为空（列表已有独立错误态）
    }
  },

  buildQuery(page: number): ProductQuery {
    const { keyword, categoryId, brandId, sort, minPrice, maxPrice } = this.data
    const q: ProductQuery = { page, pageSize: PAGE_SIZE }
    if (keyword) q.keyword = keyword
    if (categoryId) q.categoryId = categoryId
    if (brandId) q.brandId = brandId
    if (minPrice !== null) q.minPrice = minPrice
    if (maxPrice !== null) q.maxPrice = maxPrice
    if (sort) q.sort = sort
    return q
  },

  /** 重置并加载第一页 */
  async reload() {
    this.setData({ state: 'loading', page: 1, products: [], hasMore: true })
    try {
      const res = await productApi.list(this.buildQuery(1))
      this.setData({
        products: res.records,
        total: res.total,
        page: 1,
        hasMore: res.records.length >= PAGE_SIZE && res.records.length < res.total,
        state: 'ready',
      })
    } catch {
      this.setData({ state: 'error' })
    }
  },

  /** 触底加载下一页（带 loading 锁防重复请求） */
  async loadMore() {
    const { loadingMore, hasMore, state, page } = this.data
    if (loadingMore || !hasMore || state !== 'ready') return
    this.setData({ loadingMore: true })
    try {
      const nextPage = page + 1
      const res = await productApi.list(this.buildQuery(nextPage))
      // 按 id 去重（数据变化时避免重复渲染）
      const existing = new Set(this.data.products.map((p) => p.id))
      const merged = [...this.data.products]
      for (const p of res.records) {
        if (!existing.has(p.id)) merged.push(p)
      }
      this.setData({
        products: merged,
        page: nextPage,
        total: res.total,
        hasMore: res.records.length >= PAGE_SIZE && merged.length < res.total,
      })
    } catch {
      // 加载更多失败：保持现有数据，toast 已由请求层提示
    } finally {
      this.setData({ loadingMore: false })
    }
  },

  onReachBottom() {
    this.loadMore()
  },

  /** 下拉刷新：重置到第一页 */
  async onPullDownRefresh() {
    await this.reload().catch(() => {})
    wx.stopPullDownRefresh()
  },

  onRetry() {
    this.reload()
  },

  // ---------- 排序 ----------
  onSortTap(e: WechatMiniprogram.CustomEvent) {
    const value = e.currentTarget.dataset.value as string
    if (value === this.data.sort) return
    this.setData({ sort: value })
    this.reload()
  },

  // ---------- 筛选面板 ----------
  onOpenPanel() {
    // 打开时把生效筛选同步为草稿
    this.setData({
      'panel.show': true,
      'panel.draftCategoryId': this.data.categoryId,
      'panel.draftBrandId': this.data.brandId,
      'panel.draftMinPrice': this.data.minPrice !== null ? String(this.data.minPrice) : '',
      'panel.draftMaxPrice': this.data.maxPrice !== null ? String(this.data.maxPrice) : '',
    })
  },

  onClosePanel() {
    this.setData({ 'panel.show': false })
  },

  onBlockTouchMove() {
    // 阻止面板下的页面滚动（no-op 仅为占位事件，防 wxml 缺失）
  },

  onPickCategory(e: WechatMiniprogram.CustomEvent) {
    const id = Number(e.currentTarget.dataset.id)
    this.setData({
      'panel.draftCategoryId': this.data.panel.draftCategoryId === id ? null : id,
    })
  },

  onPickBrand(e: WechatMiniprogram.CustomEvent) {
    const id = Number(e.currentTarget.dataset.id)
    this.setData({
      'panel.draftBrandId': this.data.panel.draftBrandId === id ? null : id,
    })
  },

  onDraftMinPrice(e: WechatMiniprogram.Input) {
    this.setData({ 'panel.draftMinPrice': e.detail.value })
  },

  onDraftMaxPrice(e: WechatMiniprogram.Input) {
    this.setData({ 'panel.draftMaxPrice': e.detail.value })
  },

  onResetPanel() {
    this.setData({
      'panel.draftCategoryId': null,
      'panel.draftBrandId': null,
      'panel.draftMinPrice': '',
      'panel.draftMaxPrice': '',
    })
  },

  onApplyPanel() {
    const { draftCategoryId, draftBrandId, draftMinPrice, draftMaxPrice } = this.data.panel
    const min = draftMinPrice.trim() === '' ? null : Number(draftMinPrice)
    const max = draftMaxPrice.trim() === '' ? null : Number(draftMaxPrice)
    if (min !== null && Number.isNaN(min)) {
      wx.showToast({ title: '最低价格式不正确', icon: 'none' })
      return
    }
    if (max !== null && Number.isNaN(max)) {
      wx.showToast({ title: '最高价格式不正确', icon: 'none' })
      return
    }
    if (min !== null && max !== null && min > max) {
      wx.showToast({ title: '最低价不能大于最高价', icon: 'none' })
      return
    }

    // 摘要文案
    const parts: string[] = []
    const cat = this.data.panel.categories.find((c) => c.id === draftCategoryId)
    const brand = this.data.panel.brands.find((b) => b.id === draftBrandId)
    if (cat) parts.push(cat.name)
    if (brand) parts.push(brand.name)
    if (min !== null || max !== null) {
      parts.push(`¥${min !== null ? min : 0}-${max !== null ? max : '∞'}`)
    }

    this.setData({
      categoryId: draftCategoryId,
      brandId: draftBrandId,
      minPrice: min,
      maxPrice: max,
      filterSummary: parts.join(' · '),
      'panel.show': false,
    })
    this.reload()
  },
})
