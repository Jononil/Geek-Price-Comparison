/**
 * 测评详情页
 * ---------------------------------------------------------------
 * 接口：
 * - GET /api/articles/{id}        详情（副作用 views+1；content 为富文本 HTML）
 * - POST /api/articles/{id}/like  点赞（likes+1）
 * 实测：content 含 <p> 标签（当前库无 <img>/<h2>），用 <rich-text> 渲染；
 *      productId 全部为 null → 关联商品入口按数据动态隐藏；
 *      点赞接口无登录校验/去重/回显（接口缺口，前端做乐观 +1，与 PC 端一致）。
 */
import { articleApi } from '../../api/index'
import type { ReviewArticle } from '../../types'

Page({
  data: {
    state: 'loading' as 'loading' | 'ready' | 'notfound' | 'error',
    article: null as ReviewArticle | null,
    /** rich-text nodes（小程序 rich-text 接受 HTML 字符串） */
    contentNodes: '',
    scoreText: '',
    subScores: [] as { label: string; value: string }[],
    hasProduct: false,
    likedLocal: false,
    likesText: '0',
  },

  onLoad(query: Record<string, string | undefined>) {
    const id = Number(query.id)
    if (!id) {
      this.setData({ state: 'notfound' })
      return
    }
    this.load(id)
  },

  async load(id: number) {
    this.setData({ state: 'loading' })
    try {
      const a = await articleApi.detail(id)
      const subScores: { label: string; value: string }[] = []
      if (a.performanceScore != null) subScores.push({ label: '性能', value: String(a.performanceScore) })
      if (a.appearanceScore != null) subScores.push({ label: '外观', value: String(a.appearanceScore) })
      if (a.screenScore != null) subScores.push({ label: '屏幕', value: String(a.screenScore) })
      if (a.batteryScore != null) subScores.push({ label: '续航', value: String(a.batteryScore) })

      this.setData({
        article: a,
        // 正文为空时回退到摘要（不伪造内容）
        contentNodes: a.content || a.summary || '',
        scoreText: a.score != null ? String(a.score) : '—',
        subScores,
        hasProduct: !!a.productId,
        likesText: String(a.likes ?? 0),
        state: 'ready',
      })
      wx.setNavigationBarTitle({ title: a.title.length > 16 ? a.title.slice(0, 16) + '…' : a.title })
    } catch (err) {
      const code = (err as { code?: number })?.code
      this.setData({ state: code === 404 ? 'notfound' : 'error' })
    }
  },

  onRetry() {
    const id = this.data.article?.id
    if (id) this.load(id)
  },

  onLike() {
    if (this.data.likedLocal) return // 本地防连点（后端无去重，见报告缺口1）
    const a = this.data.article
    if (!a) return
    this.setData({ likedLocal: true })
    articleApi
      .like(a.id)
      .then(() => {
        const next = Number(this.data.likesText) + 1
        this.setData({ likesText: String(next) })
      })
      .catch(() => {
        this.setData({ likedLocal: false })
      })
  },

  onGoProduct() {
    const a = this.data.article
    if (a?.productId) {
      wx.navigateTo({ url: `/pages/product-detail/index?id=${a.productId}` })
    }
  },
})
