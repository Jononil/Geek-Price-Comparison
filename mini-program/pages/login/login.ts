/**
 * 登录页（账号密码）
 * ---------------------------------------------------------------
 * 依据后端实测行为：
 * - POST /api/auth/login { username, password } → { token, user }
 * - 用户名或密码错误 → HTTP 200 + code=401 + message="用户名或密码错误"
 * 说明：后端无微信登录实现，本阶段仅支持账号密码（与 PC 端一致）。
 */
import { authApi } from '../../api/index'
import { userStore } from '../../store/user'

Page({
  data: {
    username: '',
    password: '',
    loading: false,
    redirect: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    this.setData({ redirect: query.redirect || '' })
  },

  onUsernameInput(e: WechatMiniprogram.Input) {
    this.setData({ username: e.detail.value })
  },

  onPasswordInput(e: WechatMiniprogram.Input) {
    this.setData({ password: e.detail.value })
  },

  async onLogin() {
    const { username, password, redirect } = this.data
    if (!username || !password) {
      wx.showToast({ title: '请输入用户名和密码', icon: 'none' })
      return
    }
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const res = await authApi.login({ username, password })
      userStore.setToken(res.token)
      userStore.setUser(res.user)
      wx.showToast({ title: '登录成功', icon: 'success' })
      // 仅允许站内相对路径回跳（防开放重定向）
      const target =
        redirect && redirect.startsWith('/') && !redirect.startsWith('//')
          ? redirect
          : '/pages/index/index'
      setTimeout(() => {
        // tab 页不支持 redirectTo，需 switchTab（且 switchTab 会丢弃 query，回跳参数在非 tab 页生效）
        const tabPages = [
          '/pages/index/index',
          '/pages/category/index',
          '/pages/compare/index',
          '/pages/article-list/index',
          '/pages/mine/index',
        ]
        if (tabPages.indexOf(target) >= 0) {
          wx.switchTab({ url: target })
        } else {
          wx.redirectTo({ url: target })
        }
      }, 500)
    } catch {
      // 错误提示已在请求层统一 toast（含 code=401"用户名或密码错误"）
    } finally {
      this.setData({ loading: false })
    }
  },

  onGoRegister() {
    // 注册页在阶段三接入（后端接口已就绪：POST /api/auth/register）
    wx.showToast({ title: '注册功能开发中', icon: 'none' })
  },
})
