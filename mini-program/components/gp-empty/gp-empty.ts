/**
 * 通用空状态
 * 规范约束：无数据时如实展示，不使用可能被误认为商品实拍/官方内容的占位图。
 */
Component({
  properties: {
    /** 空态文案 */
    text: { type: String, value: '暂无数据' },
    /** 补充说明 */
    subText: { type: String, value: '' },
  },
})
