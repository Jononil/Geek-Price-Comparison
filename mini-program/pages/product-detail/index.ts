/**
 * 商品详情页
 * ---------------------------------------------------------------
 * 接口（全部真实，已冒烟）：
 * - GET /api/products/{id}           详情（specs/images/attribution/reviews/articles）
 * - GET /api/prices/compare/{id}     多平台报价（系统模拟报价）
 * - GET /api/prices/history/{id}     历史价格（系统模拟数据）
 * 业务红线：
 * - 参数可信度三态 verified/reference/template（缺失按 template 处理）；
 * - valueScore / performanceScore 为 null → "数据不足"，不伪造；
 * - 图片仅展示后端下发的审核通过图，无合格图/加载失败 → 空态；
 * - 模拟报价必须标注；
 * - 历史价格为空数组 → 图表空状态，不生成曲线。
 * 图表：Canvas 2D 手绘折线图（不依赖浏览器版 ECharts）。
 */
import { productApi, priceApi, favoriteApi, historyApi } from '../../api/index'
import type {
  ImageAttribution,
  PriceCompare,
  PriceHistory,
  Product,
  ProductSpec,
} from '../../types'
import { pickProductImage, isPlaceholderImage } from '../../utils/image'
import { isSeriesReferenceImage, getSeriesReferenceReason } from '../../utils/seriesReference'
import { formatPrice, isScoreMissing, formatDateTime, formatDateMMDD } from '../../utils/format'
import { compareStore } from '../../store/compare'
import { userStore } from '../../store/user'

type ViewState = 'loading' | 'ready' | 'notfound' | 'error'

/** 参数行（含展示所需的信任态归一化） */
interface SpecRow {
  label: string
  value: string
  /** 归一化后的三态（缺失按 template 处理——业务红线） */
  trust: 'verified' | 'reference' | 'template'
  trustLabel: string
  sourceUrl: string
}

/** 平台报价行 */
interface PriceRow {
  platformName: string
  priceText: string
  shopName: string
  isLowest: boolean
  updatedAtText: string
}

/** Canvas 2D 绘图上下文（小程序环境无 DOM 类型，声明最小可用子集） */
type ChartCtx = {
  clearRect(x: number, y: number, w: number, h: number): void
  beginPath(): void
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  closePath(): void
  stroke(): void
  fill(): void
  arc(x: number, y: number, r: number, start: number, end: number): void
  scale(x: number, y: number): void
  strokeStyle: string
  fillStyle: string
  lineWidth: number
  font: string
  textAlign: string
  textBaseline: string
  fillText(text: string, x: number, y: number): void
  measureText(text: string): { width: number }
  rect(x: number, y: number, w: number, h: number): void
}

Page({
  data: {
    id: 0,
    state: 'loading' as ViewState,

    product: null as Product | null,
    displayUrl: '',
    imgFailed: false,
    seriesRef: false,
    seriesReason: '',

    // 评分（null → 数据不足）
    valueMissing: false,
    perfMissing: false,
    ratingMissing: false,

    // 参数
    specRows: [] as SpecRow[],
    specSummary: '',
    hasSpecs: false,

    // 价格
    priceRows: [] as PriceRow[],
    hasPrices: false,
    lowestPriceText: '',
    lowestPlatformName: '',
    saveAmountText: '',
    priceHint: '系统模拟报价，非实时电商价格',

    // 历史
    historyState: 'loading' as 'loading' | 'ready' | 'empty' | 'error',
    historyStats: [] as { label: string; value: string; highlight?: boolean }[],

    // 评价（来自详情接口的最新 10 条）
    reviews: [] as { id: number; nickname: string; star: number; content: string; createdAt: string }[],

    favorited: false,
    favSubmitting: false,
    inCompare: false,
  },

  // 图表状态（非响应式实例字段：触摸重绘用）
  chartCtx: null as ChartCtx | null,
  chartWidth: 0,
  chartHeight: 0,
  chartPoints: [] as { date: string; price: number }[],
  chartSelected: -1,
  chartRectLeft: 0,

  onLoad(query: Record<string, string | undefined>) {
    const id = Number(query.id)
    if (!id) {
      this.setData({ state: 'notfound' })
      return
    }
    this.setData({ id })
    this.loadAll(id)
  },

  /** 页面卸载：释放 canvas 引用（内存卫生） */
  onUnload() {
    this.chartCtx = null
    this.chartPoints = []
  },

  async loadAll(id: number) {
    this.setData({ state: 'loading' })
    // 详情必选；报价/历史失败可降级（各自独立状态）
    try {
      const [product, compare, history] = await Promise.all([
        productApi.detail(id),
        priceApi.compare(id).catch(() => null),
        priceApi.history(id).catch(() => null),
      ])
      this.applyProduct(product)
      this.applyCompare(compare)
      this.applyHistory(history)
      this.setData({ state: 'ready' })
      // 登录态下静默上报浏览历史（POST /history/{id}，需登录；接口内部同商品先删后插）
      if (userStore.isLoggedIn()) {
        historyApi.record(id).catch(() => {})
      }
    } catch (err) {
      const code = (err as { code?: number })?.code
      // 后端业务码 404 = 产品不存在或已下架（HTTP 200 + code=404，已实测）
      this.setData({ state: code === 404 ? 'notfound' : 'error' })
    }
  },

  applyProduct(p: Product) {
    const url = pickProductImage(p.images)
    const displayUrl = !isPlaceholderImage(url) ? url : ''
    const series = isSeriesReferenceImage(p.id, displayUrl)

    // 参数行：三态归一化（缺失视为 template=不可信）
    const specRows: SpecRow[] = (p.specs || []).map((s: ProductSpec) => {
      const trust: SpecRow['trust'] =
        s.verifyStatus === 'verified' || s.verifyStatus === 'reference'
          ? s.verifyStatus
          : 'template'
      const trustLabel =
        trust === 'verified' ? '已核验' : trust === 'reference' ? '参考' : '模板'
      return {
        label: s.specLabel,
        value: s.specValue,
        trust,
        trustLabel,
        sourceUrl: s.sourceUrl || '',
      }
    })

    // 可信度统计摘要（与 PC 端 specTrustHint 同口径）
    const v = specRows.filter((r) => r.trust === 'verified').length
    const r2 = specRows.filter((r) => r.trust === 'reference').length
    const t = specRows.filter((r) => r.trust === 'template').length
    const parts: string[] = []
    if (v) parts.push(`已核验 ${v} 项`)
    if (r2) parts.push(`参考资料 ${r2} 项（未联网复核）`)
    if (t) parts.push(`模板数据 ${t} 项（非官方规格，仅供参考）`)
    const specSummary = parts.length ? `参数可信度：${parts.join(' · ')}` : '暂无参数数据'

    // 评价（详情内嵌最新 10 条，补用户昵称字段）
    const reviews = (p.reviews || []).map((rv) => ({
      id: rv.id,
      nickname: rv.nickname || '匿名用户',
      star: rv.star,
      content: rv.content,
      createdAt: rv.createdAt,
    }))

    this.setData({
      product: p,
      displayUrl,
      imgFailed: false,
      seriesRef: series,
      seriesReason: series ? getSeriesReferenceReason(p.id, displayUrl) || '' : '',
      valueMissing: isScoreMissing(p.valueScore),
      perfMissing: isScoreMissing(p.performanceScore),
      ratingMissing: isScoreMissing(p.userRating),
      specRows,
      specSummary,
      hasSpecs: specRows.length > 0,
      reviews,
      inCompare: compareStore.has(p.id),
      favorited: false, // 后端无"是否已收藏"查询接口（接口缺口，见报告）
    })
  },

  applyCompare(c: PriceCompare | null) {
    if (!c || !c.prices || c.prices.length === 0) {
      this.setData({ priceRows: [], hasPrices: false })
      return
    }
    const rows: PriceRow[] = c.prices.map((p) => ({
      platformName: p.platformName || '未知平台',
      priceText: formatPrice(p.price),
      shopName: p.shopName || '—',
      isLowest: Number(p.price) === Number(c.lowestPrice),
      updatedAtText: formatDateTime(p.updatedAt),
    }))
    this.setData({
      priceRows: rows,
      hasPrices: true,
      lowestPriceText: formatPrice(c.lowestPrice),
      lowestPlatformName: c.lowestPlatformName || '',
      saveAmountText: formatPrice(c.saveAmount),
    })
  },

  applyHistory(h: PriceHistory | null) {
    if (!h || !h.history || h.history.length === 0) {
      this.setData({ historyState: 'empty', historyStats: [] })
      return
    }
    const stats: { label: string; value: string; highlight?: boolean }[] = [
      { label: '当前最低', value: `¥${formatPrice(h.currentLowest)}` },
      { label: '历史最低', value: `¥${formatPrice(h.historyLowest)}` },
      { label: '历史最高', value: `¥${formatPrice(h.historyHighest)}` },
    ]
    if (Number(h.recentDrop) > 0) {
      stats.push({
        label: '近期降价',
        value: `¥${formatPrice(h.recentDrop)}`,
        highlight: true,
      })
    }
    this.setData({ historyState: 'ready', historyStats: stats })
    // 图表需等 WXML 渲染出 canvas 节点后绘制
    this.drawChart(h)
  },

  // ---------- Canvas 2D 价格走势图 ----------
  async drawChart(h: PriceHistory) {
    try {
      // 等待视图渲染
      await new Promise<void>((resolve) => setTimeout(resolve, 100))
      const query = this.createSelectorQuery()
      query.select('#price-chart').fields({ node: true, size: true })
      query.exec((res) => {
        const field = res && res[0]
        if (!field || !field.node || !field.width) {
          // 节点未就绪：按空状态处理（不伪造曲线）
          this.setData({ historyState: 'empty' })
          return
        }
        const canvas = field.node as WechatMiniprogram.Canvas
        const ctx = canvas.getContext('2d') as unknown as ChartCtx
        const dpr = wx.getWindowInfo().pixelRatio || 2
        const width = field.width as number
        const height = field.height as number
        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)
        const points = h.history.map((p) => ({
          date: formatDateMMDD(p.recordDate),
          price: Number(p.price),
        }))
        // 保存图表状态（触摸交互重绘用；非响应式数据，放实例字段）
        this.chartCtx = ctx
        this.chartWidth = width
        this.chartHeight = height
        this.chartPoints = points
        this.chartSelected = -1
        this.renderLineChart(ctx, width, height, points, -1)
      })
    } catch {
      this.setData({ historyState: 'empty' })
    }
  },

  /** 触摸图表：高亮最近的数据点（touchmove 跟随；clientX 需换算为 canvas 内坐标） */
  onChartTouch(e: WechatMiniprogram.TouchEvent) {
    if (!this.chartCtx || this.chartPoints.length === 0) return
    const touch = e.touches && e.touches[0]
    if (!touch) return
    // 首次触摸时取 canvas 在页面中的偏移（clientX 是视口坐标）
    if (!this.chartRectLeft) {
      const query = this.createSelectorQuery()
      query.select('#price-chart').boundingClientRect()
      query.exec((res) => {
        const rect = res && res[0]
        if (rect && typeof rect.left === 'number') {
          this.chartRectLeft = rect.left
          this.onChartTouch(e)
        }
      })
      return
    }
    const padLeft = 52
    const padRight = 16
    const chartW = this.chartWidth - padLeft - padRight
    const n = this.chartPoints.length
    // x → 最近点索引
    const ratio = (touch.clientX - this.chartRectLeft - padLeft) / chartW
    let idx = Math.round(ratio * (n - 1))
    if (idx < 0) idx = 0
    if (idx > n - 1) idx = n - 1
    if (idx === this.chartSelected) return
    this.chartSelected = idx
    this.renderLineChart(this.chartCtx, this.chartWidth, this.chartHeight, this.chartPoints, idx)
  },

  /** 手绘折线图（y 轴自适应，与 PC 端 ECharts scale:true 语义一致）；selectedIdx>=0 时高亮该点 */
  renderLineChart(
    ctx: ChartCtx,
    width: number,
    height: number,
    points: { date: string; price: number }[],
    selectedIdx = -1
  ) {
    const padLeft = 52
    const padRight = 16
    const padTop = 16
    const padBottom = 34
    const chartW = width - padLeft - padRight
    const chartH = height - padTop - padBottom

    const prices = points.map((p) => p.price)
    let min = Math.min(...prices)
    let max = Math.max(...prices)
    if (min === max) {
      // 全部同价：留出视觉余量
      min = min * 0.98
      max = max * 1.02 || 1
    }
    const span = max - min

    const xAt = (i: number) =>
      padLeft + (points.length === 1 ? chartW / 2 : (i / (points.length - 1)) * chartW)
    const yAt = (v: number) => padTop + chartH - ((v - min) / span) * chartH

    ctx.clearRect(0, 0, width, height)

    // 网格 + y 轴标签（4 档）
    ctx.strokeStyle = '#f1f5f9'
    ctx.fillStyle = '#9ca3af'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let i = 0; i <= 4; i++) {
      const v = min + (span * i) / 4
      const y = yAt(v)
      ctx.beginPath()
      ctx.moveTo(padLeft, y)
      ctx.lineTo(width - padRight, y)
      ctx.stroke()
      ctx.fillText(Math.round(v).toString(), padLeft - 6, y)
    }

    // x 轴标签（最多 6 个，防重叠）
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const step = Math.max(1, Math.ceil(points.length / 6))
    for (let i = 0; i < points.length; i += step) {
      ctx.fillText(points[i].date, xAt(i), height - padBottom + 8)
    }

    // 面积填充
    ctx.beginPath()
    ctx.moveTo(xAt(0), yAt(points[0].price))
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(xAt(i), yAt(points[i].price))
    }
    ctx.lineTo(xAt(points.length - 1), padTop + chartH)
    ctx.lineTo(xAt(0), padTop + chartH)
    ctx.closePath()
    ctx.fillStyle = 'rgba(37, 99, 235, 0.08)'
    ctx.fill()

    // 折线
    ctx.beginPath()
    ctx.moveTo(xAt(0), yAt(points[0].price))
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(xAt(i), yAt(points[i].price))
    }
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // 历史最低点标记
    const minIdx = prices.indexOf(Math.min(...prices))
    ctx.beginPath()
    ctx.arc(xAt(minIdx), yAt(prices[minIdx]), 3, 0, Math.PI * 2)
    ctx.fillStyle = '#10b981'
    ctx.fill()

    // 触摸高亮：竖线 + 数据点 + 日期/价格标签
    if (selectedIdx >= 0 && selectedIdx < points.length) {
      const px = xAt(selectedIdx)
      const py = yAt(points[selectedIdx].price)
      ctx.beginPath()
      ctx.moveTo(px, padTop)
      ctx.lineTo(px, padTop + chartH)
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.35)'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(px, py, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#2563eb'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // 标签（防越界：靠近边缘时贴边显示）
      const label = `${points[selectedIdx].date}  ¥${points[selectedIdx].price.toFixed(2)}`
      ctx.font = 'bold 10px sans-serif'
      const textW = ctx.measureText(label).width
      let labelX = px - textW / 2 - 4
      if (labelX < 2) labelX = 2
      if (labelX + textW + 8 > width - 2) labelX = width - textW - 10
      const labelY = py - 22 < 2 ? py + 12 : py - 22
      ctx.fillStyle = 'rgba(31, 41, 55, 0.88)'
      ctx.beginPath()
      // 小圆角矩形（手绘：rect + 四个角圆弧简化为 rect）
      ctx.rect(labelX, labelY, textW + 8, 18)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, labelX + 4, labelY + 9)
    }
  },

  // ---------- 交互 ----------
  onRetry() {
    this.loadAll(this.data.id)
  },

  onImgError() {
    this.setData({ imgFailed: true, displayUrl: '' })
  },

  onTapImageAttribution() {
    const p = this.data.product
    if (!p || !this.data.displayUrl) return
    const att = (p.imagesAttribution || []).find(
      (a: ImageAttribution) => a.url === this.data.displayUrl
    )
    const lines: string[] = []
    if (att) {
      lines.push(`作者：${att.author || '未标注'}`)
      lines.push(`许可：${att.license || '未知许可'}`)
      if (att.modifications) lines.push(`说明：${att.modifications}`)
      if (att.matchType === 'SERIES_LEVEL') lines.push('⚠ 该图为系列参考图，非精确型号实拍')
      if (att.attributionText) lines.push('', att.attributionText)
    } else {
      lines.push('该图片暂无授权署名信息')
    }
    wx.showModal({ title: '图片来源与许可', content: lines.join('\n'), showCancel: false })
  },

  onAddCompare() {
    const p = this.data.product
    if (!p) return
    const result = compareStore.add(p)
    wx.showToast({ title: result.message, icon: result.ok ? 'success' : 'none' })
    if (result.ok) this.setData({ inCompare: true })
  },

  onToggleFavorite() {
    if (!userStore.isLoggedIn()) {
      wx.navigateTo({
        url: `/pages/login/login?redirect=${encodeURIComponent(`/pages/product-detail/index?id=${this.data.id}`)}`,
      })
      return
    }
    if (this.data.favSubmitting) return
    const p = this.data.product
    if (!p) return
    this.setData({ favSubmitting: true })
    const next = !this.data.favorited
    // 接口缺口：无"是否已收藏"查询 → 无法回显初始态（与 PC 端一致）；
    // 这里按乐观切换调用真实接口，重复收藏后端幂等。
    const action = next
      ? favoriteApi.add(1, p.id)
      : favoriteApi.remove(1, p.id)
    action
      .then(() => {
        this.setData({ favorited: next })
        wx.showToast({ title: next ? '收藏成功' : '已取消收藏', icon: 'success' })
      })
      .catch(() => {
        // 401/403 已由请求层处理；其他错误已 toast
      })
      .finally(() => {
        this.setData({ favSubmitting: false })
      })
  },

  onGoReviews() {
    const p = this.data.product
    if (!p) return
    wx.navigateTo({
      url: `/pages/reviews/index?productId=${p.id}&productName=${encodeURIComponent(p.name)}`,
    })
  },
})
