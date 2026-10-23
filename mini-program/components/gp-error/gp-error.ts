/**
 * 通用错误态（网络失败/接口异常时展示，支持重试回调）
 */
Component({
  properties: {
    text: { type: String, value: '加载失败' },
    subText: { type: String, value: '请检查网络后重试' },
    retryText: { type: String, value: '重新加载' },
  },
  methods: {
    onRetry() {
      this.triggerEvent('retry')
    },
  },
})
