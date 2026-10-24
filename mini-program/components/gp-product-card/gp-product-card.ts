/**
 * 商品卡片（首页/列表/搜索共用）
 * ---------------------------------------------------------------
 * 规则（与 PC 端 ProductCard 对齐）：
 * - 只展示后端下发的审核通过图片；无合格图或加载失败 → "暂无实拍图"空态
 *   （不使用灰图/类别图/占位图冒充实物图）；
 * - 性价比 null → "数据不足"（不得用默认值伪造评分）；
 * - 价格标注"模拟"（系统模拟报价，非实时电商价格）；
 * - 点击图片上的 ⓘ 查看图片授权署名。
 */
import type { Product } from '../../types'
import { pickProductImage, isPlaceholderImage, toAbsoluteUrl } from '../../utils/image'
import { formatPrice, isScoreMissing } from '../../utils/format'
import { compareStore } from '../../store/compare'

Component({
  properties: {
    product: { type: Object, value: {} },
  },

  data: {
    displayUrl: '',        // '' 表示无合格图 → 空态
    failed: false,         // 图片加载失败（永久切空态）
    inCompare: false,
    priceText: '',
    valueMissing: false,
    hasDiscountTag: false, // tags 含"降价"（WXML 不支持函数调用，预计算）
    highValue: false,      // valueScore >= 90
  },

  observers: {
    'product.id': function (id: number) {
      if (!id) return
      const p = this.data.product as unknown as Product
      const url = pickProductImage(p.images)
      const tags = p.tags || []
      this.setData({
        displayUrl: !isPlaceholderImage(url) ? toAbsoluteUrl(url) : '',
        failed: false,
        inCompare: compareStore.has(id),
        priceText: formatPrice(p.currentPrice),
        valueMissing: isScoreMissing(p.valueScore),
        hasDiscountTag: tags.indexOf('降价') >= 0,
        highValue: !isScoreMissing(p.valueScore) && Number(p.valueScore) >= 90,
      })
    },
  },

  methods: {
    onImgError() {
      // 加载失败 → 空态，且不再重复触发
      this.setData({ failed: true, displayUrl: '' })
    },

    onTapCard() {
      const p = this.data.product as unknown as Product
      wx.navigateTo({ url: `/pages/product-detail/index?id=${p.id}` })
    },

    onTapCompare() {
      const p = this.data.product as unknown as Product
      const result = compareStore.add(p)
      wx.showToast({ title: result.message, icon: result.ok ? 'success' : 'none' })
      if (result.ok) this.setData({ inCompare: true })
    },

    onTapInfo() {
      // 查看图片授权署名（当前展示图对应的记录）
      const p = this.data.product as unknown as Product
      const url = this.data.displayUrl
      const list = p.imagesAttribution || []
      const att = list.find((a) => a.url === url) || null
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
      wx.showModal({
        title: '图片来源与许可',
        content: lines.join('\n'),
        showCancel: false,
        confirmText: '知道了',
      })
    },
  },
})
