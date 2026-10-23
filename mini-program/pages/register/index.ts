/**
 * 注册页
 * ---------------------------------------------------------------
 * 接口：POST /api/auth/register
 * 实测字段约束（RegisterDTO）：username 4-20、password 6-20、nickname 必填、email 可选（格式校验）
 * 注册成功直接返回 { token, user }（自动登录，与 PC 端一致）。
 */
import { authApi } from '../../api/index'
import { userStore } from '../../store/user'

Page({
  data: {
    username: '',
    nickname: '',
    email: '',
    password: '',
    loading: false,
  },

  onFieldInput(e: WechatMiniprogram.CustomEvent) {
    const field = e.currentTarget.dataset.field as string
    this.setData({ [field]: e.detail.value } as Record<string, string>)
  },

  async onRegister() {
    const { username, nickname, email, password, loading } = this.data
    if (loading) return
    if (!username || !nickname || !password) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }
    if (username.length < 4 || username.length > 20) {
      wx.showToast({ title: '用户名长度需在 4-20 位', icon: 'none' })
      return
    }
    if (password.length < 6 || password.length > 20) {
      wx.showToast({ title: '密码长度需在 6-20 位', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    try {
      const res = await authApi.register({ username, password, nickname, email })
      userStore.setToken(res.token)
      userStore.setUser(res.user)
      wx.showToast({ title: '注册成功', icon: 'success' })
      setTimeout(() => {
        // index 是 tab 页，必须 switchTab
        wx.switchTab({ url: '/pages/index/index' })
      }, 500)
    } catch {
      // 用户名已占用/邮箱已注册等业务错误已由请求层 toast
    } finally {
      this.setData({ loading: false })
    }
  },

  onGoLogin() {
    wx.navigateBack()
  },
})
