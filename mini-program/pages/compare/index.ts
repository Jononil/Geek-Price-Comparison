/**
 * 商品对比页
 * ---------------------------------------------------------------
 * 接口（阶段一决策 Q1：走服务端接口，获得品类校验兜底——已实测跨品类返回 code=400）：
 * - GET /api/products/compare?ids=1,2  → Product[]（同品类，含 specs/images/attribution）
 * - 本地 compareStore（最多 4 个、同品类、去重；Storage 持久化）
 * 业务红线：
 * - 禁止跨品类对比（本地 + 服务端双重校验）；
 * - 模板(template)参数独立分组并标注"非官方规格"，缺失值显示"暂无可靠数据"；
 * - valueScore/performanceScore 为 null → "数据不足"，不伪造排名。
 * 数据流：进入页面 → 读 compareStore 的轻量列表 → 拉 /products/compare 全量详情。
 */
import { productApi } from '../../api/index'
import { compareStore } from '../../store/compare'
import { SPEC_GROUPS, type GroupDef } from '../../utils/specGroups'
import { pickProductImage, isPlaceholderImage, toAbsoluteUrl } from '../../utils/image'
import { formatPrice, isScoreMissing } from '../../utils/format'
import type { Product, ProductSpec } from '../../types'

type ViewState = 'empty' | 'loading' | 'ready' | 'error'

/** 对比概览模型 */
interface OverviewItem {
  id: number
  name: string
  shortName: string
  brandName: string
  categoryName: string
  image: string
  priceText: string
  valueText: string
  valueMissing: boolean
  ratingText: string
  trustCount: string // "可信/全部" 项数
}

/** 表格行 */
interface TableRow {
  key: string
  label: string
  /** 每个商品在该行的值（'' 表示缺失） */
  values: Record<number, string>
  /** 该行整体信任态（取各商品最高：verified > reference > template） */
  trust: 'verified' | 'reference' | 'template'
}

interface TableGroup {
  name: string
  rows: TableRow[]
  trust: 'verified' | 'reference' | 'template'
}

/** 信任态归一化：缺失按 template（不可信） */
function normTrust(s?: ProductSpec | null): 'verified' | 'reference' | 'template' {
  if (!s) return 'template'
  if (s.verifyStatus === 'verified') return 'verified'
  if (s.verifyStatus === 'reference') return 'reference'
  return 'template'
}

Page({
  data: {
    state: 'empty' as ViewState,
    /** 本地对比列表（轻量，用于展示占位与移除） */
    localItems: [] as { id: number; name: string }[],

    overviews: [] as OverviewItem[],
    columns: [] as number[], // 参与对比的商品 id（列）

    trustedGroups: [] as TableGroup[],
    templateGroup: { name: '未核验参数（模板数据，非官方规格）', rows: [] as TableRow[], trust: 'template' } as TableGroup,

    /** 展示版本（受"只看差异"控制） */
    showTrustedGroups: [] as TableGroup[],
    showTemplateGroup: { name: '未核验参数（模板数据，非官方规格）', rows: [] as TableRow[], trust: 'template' } as TableGroup,

    priceRows: [] as TableRow[],
    trustSummary: '',
    diffOnly: false,
  },

  onShow() {
    compareStore.load()
    const localItems = compareStore.products.map((p) => ({ id: p.id, name: p.name }))
    if (localItems.length === 0) {
      this.setData({ state: 'empty', localItems: [] })
      return
    }
    this.setData({ localItems })
    this.loadCompare()
  },

  async loadCompare() {
    const ids = compareStore.products.map((p) => p.id)
    this.setData({ state: 'loading' })
    try {
      const products = await productApi.compare(ids) as unknown as Product[]
      // 服务端已做品类校验（跨品类会 reject code=400，进入 catch）
      const columns = products.map((p) => p.id)
      const overviews = products.map((p) => this.buildOverview(p))
      const { trustedGroups, templateGroup } = this.buildGroups(products)
      const priceRows = this.buildPriceRows(products)
      this.setData({
        state: 'ready',
        columns,
        overviews,
        trustedGroups,
        templateGroup,
        priceRows,
        trustSummary: this.buildTrustSummary(products),
      })
      this.refreshDisplay()
    } catch (err) {
      const code = (err as { code?: number })?.code
      if (code === 400) {
        // 服务端品类校验拒绝（本地校验与服务端数据不一致时的兜底）
        wx.showToast({ title: '商品分类不一致，无法对比', icon: 'none' })
        this.setData({ state: 'empty' })
        return
      }
      this.setData({ state: 'error' })
    }
  },

  buildOverview(p: Product): OverviewItem {
    const url = pickProductImage(p.images)
    const specs = p.specs || []
    const trusted = specs.filter(
      (s) => s.verifyStatus === 'verified' || s.verifyStatus === 'reference'
    ).length
    return {
      id: p.id,
      name: p.name,
      shortName: p.name.length > 10 ? p.name.slice(0, 10) + '…' : p.name,
      brandName: p.brandName || '—',
      categoryName: p.categoryName || '—',
      image: !isPlaceholderImage(url) ? toAbsoluteUrl(url) : '',
      priceText: formatPrice(p.currentPrice),
      valueText: isScoreMissing(p.valueScore) ? '数据不足' : String(p.valueScore),
      valueMissing: isScoreMissing(p.valueScore),
      ratingText: isScoreMissing(p.userRating) ? '—' : String(p.userRating),
      trustCount: `${trusted} / ${specs.length} 项`,
    }
  },

  /** 规格分组：可信参数（verified/reference）进品类组；模板参数统一归入"未核验参数"组 */
  buildGroups(products: Product[]): { trustedGroups: TableGroup[]; templateGroup: TableGroup } {
    const categoryId = products[0]?.categoryId
    const defs: GroupDef[] = (categoryId && SPEC_GROUPS[categoryId]) || []
    const trustedGroups: TableGroup[] = []
    const templateRows: TableRow[] = []

    // 已分组的键集合（防止重复出现在"其他参数"）
    const groupedKeys = new Set<string>()
    defs.forEach((g) => g.keys.forEach((k) => groupedKeys.add(k)))

    const buildRow = (key: string, label: string): TableRow | null => {
      const values: Record<number, string> = {}
      let any = false
      let trust: TableRow['trust'] = 'template'
      for (const p of products) {
        const spec = (p.specs || []).find((s) => s.specKey === key)
        const v = spec ? String(spec.specValue ?? '') : ''
        values[p.id] = v
        if (v) any = true
        const t = normTrust(spec)
        if (t === 'verified') trust = 'verified'
        else if (t === 'reference' && trust !== 'verified') trust = 'reference'
      }
      if (!any) return null // 全员缺失的键不展示
      return { key, label, values, trust }
    }

    // 品类分组
    for (const g of defs) {
      const rows: TableRow[] = []
      let groupTrust: TableGroup['trust'] = 'reference'
      for (const key of g.keys) {
        const sample = products
          .map((p) => (p.specs || []).find((s) => s.specKey === key))
          .find(Boolean)
        const label = sample?.specLabel || key
        const row = buildRow(key, label)
        if (!row) continue
        if (row.trust === 'template') {
          templateRows.push(row)
          continue
        }
        if (row.trust === 'verified') groupTrust = 'verified'
        rows.push(row)
      }
      if (rows.length) trustedGroups.push({ name: g.name, rows, trust: groupTrust })
    }

    // "其他参数"：未被品类分组覆盖、且非 template 的键
    const otherRows: TableRow[] = []
    let otherTrust: TableGroup['trust'] = 'reference'
    const seenKeys = new Set<string>(groupedKeys)
    for (const p of products) {
      for (const s of p.specs || []) {
        if (seenKeys.has(s.specKey)) continue
        seenKeys.add(s.specKey)
        const row = buildRow(s.specKey, s.specLabel)
        if (!row) continue
        if (row.trust === 'template') {
          templateRows.push(row)
          continue
        }
        if (row.trust === 'verified') otherTrust = 'verified'
        otherRows.push(row)
      }
    }
    if (otherRows.length) trustedGroups.push({ name: '其他参数', rows: otherRows, trust: otherTrust })

    return {
      trustedGroups,
      templateGroup: { name: '未核验参数（模板数据，非官方规格）', rows: templateRows, trust: 'template' },
    }
  },

  /** 价格与评分对比行（价格为系统模拟报价） */
  buildPriceRows(products: Product[]): TableRow[] {
    const values: Record<number, string> = {}
    const valueValues: Record<number, string> = {}
    const perfValues: Record<number, string> = {}
    const ratingValues: Record<number, string> = {}
    for (const p of products) {
      values[p.id] = `¥${formatPrice(p.currentPrice)}`
      valueValues[p.id] = isScoreMissing(p.valueScore) ? '' : String(p.valueScore)
      perfValues[p.id] = isScoreMissing(p.performanceScore) ? '' : String(p.performanceScore)
      ratingValues[p.id] = isScoreMissing(p.userRating) ? '' : String(p.userRating)
    }
    return [
      { key: 'price', label: '当前价格（模拟）', values, trust: 'reference' },
      { key: 'valueScore', label: '性价比评分', values: valueValues, trust: 'reference' },
      { key: 'performanceScore', label: '性能分数', values: perfValues, trust: 'reference' },
      { key: 'userRating', label: '用户评分', values: ratingValues, trust: 'reference' },
    ]
  },

  buildTrustSummary(products: Product[]): string {
    let v = 0
    let r = 0
    let t = 0
    for (const p of products) {
      for (const s of p.specs || []) {
        if (s.verifyStatus === 'verified') v++
        else if (s.verifyStatus === 'reference') r++
        else t++
      }
    }
    const parts: string[] = []
    if (v) parts.push(`已核验 ${v} 项`)
    if (r) parts.push(`参考资料 ${r} 项（未联网复核）`)
    if (t) parts.push(`模板数据 ${t} 项（非官方规格）`)
    return parts.length ? `数据可信度：${parts.join(' · ')}` : '暂无参数数据'
  },

  // ---------- 交互 ----------
  onRetry() {
    this.loadCompare()
  },

  onGoList() {
    wx.navigateTo({ url: '/pages/product-list/index' })
  },

  onRemove(e: WechatMiniprogram.CustomEvent) {
    const id = Number(e.currentTarget.dataset.id)
    compareStore.remove(id)
    this.onShow()
  },

  onClear() {
    wx.showModal({
      title: '清空对比',
      content: '确定清空全部对比商品？',
      success: (res) => {
        if (res.confirm) {
          compareStore.clear()
          this.onShow()
        }
      },
    })
  },

  onToggleDiff() {
    this.setData({ diffOnly: !this.data.diffOnly })
    this.refreshDisplay()
  },

  /** 只看差异：过滤掉所有商品值相同的行，刷新展示版本 */
  refreshDisplay() {
    const filterRows = (rows: TableRow[]): TableRow[] => {
      if (!this.data.diffOnly) return rows
      return rows.filter((r) => {
        const vals = Object.values(r.values)
        return !vals.every((v) => v === vals[0])
      })
    }
    const showTrustedGroups = this.data.trustedGroups
      .map((g) => ({ ...g, rows: filterRows(g.rows) }))
      .filter((g) => g.rows.length > 0)
    const templateRows = filterRows(this.data.templateGroup.rows)
    this.setData({
      showTrustedGroups,
      showTemplateGroup: { ...this.data.templateGroup, rows: templateRows },
    })
  },

  onGoDetail(e: WechatMiniprogram.CustomEvent) {
    const id = Number(e.currentTarget.dataset.id)
    wx.navigateTo({ url: `/pages/product-detail/index?id=${id}` })
  },
})
