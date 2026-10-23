/**
 * 个人中心（我的）
 * ---------------------------------------------------------------
 * 接口：
 * - GET  /api/user/info          个人资料（需登录；实测：phone/avatar 可为 null）
 * - PUT  /api/user/password      修改密码（需登录；oldPassword + newPassword 6-20）
 * - POST/DELETE /api/favorites   收藏（需登录，见 favorites 页）
 * - GET/DELETE /api/history      浏览历史（需登录，见 history 页）
 * 登出：后端无登出接口（接口缺口）→ 清本地 token，与 PC 端一致。
 */
import { userApi } from '../../api/index'
import { userStore } from '../../store/user'
import { compareStore } from '../../store/compare'
import type { User } from '../../types'

Page({
  data: {
    isLoggedIn: false,
    user: null as User | null,
    rolesText: '',

    // 修改密码
    showPwdForm: false,
    oldPassword: '',
    newPassword: '',
    newPassword2: '',
    pwdSubmitting: false,
  },

  onShow() {
    const isLoggedIn = userStore.isLoggedIn()
    this.setData({ isLoggedIn })
    if (isLoggedIn) {
      this.loadUser()
    } else {
      this.setData({ user: null, rolesText: '' })
    }
  },

  async loadUser() {
    try {
      const user = await userApi.info() as unknown as User
      userStore.setUser(user)
      this.setData({
        user,
        rolesText: (user.roles || []).join(', '),
      })
    } catch {
      // 401/403 已由请求层清 token 并跳登录
    }
  },

  onGoLogin() {
    wx.navigateTo({ url: '/pages/login/login?redirect=/pages/mine/index' })
  },

  onGoFavorites() {
    wx.navigateTo({ url: '/pages/favorites/index' })
  },

  onGoHistory() {
    wx.navigateTo({ url: '/pages/history/index' })
  },

  onTogglePwdForm() {
    this.setData({
      showPwdForm: !this.data.showPwdForm,
      oldPassword: '',
      newPassword: '',
      newPassword2: '',
    })
  },

  onPwdInput(e: WechatMiniprogram.CustomEvent) {
    const field = e.currentTarget.dataset.field as string
    this.setData({ [field]: e.detail.value } as Record<string, string>)
  },

  async onChangePassword() {
    const { oldPassword, newPassword, newPassword2, pwdSubmitting } = this.data
    if (pwdSubmitting) return
    if (!oldPassword || !newPassword) {
      wx.showToast({ title: '请填写完整', icon: 'none' })
      return
    }
    if (newPassword.length < 6 || newPassword.length > 20) {
      wx.showToast({ title: '新密码长度需在 6-20 位', icon: 'none' })
      return
    }
    if (newPassword !== newPassword2) {
      wx.showToast({ title: '两次输入的新密码不一致', icon: 'none' })
      return
    }
    this.setData({ pwdSubmitting: true })
    try {
      await userApi.updatePassword({ oldPassword, newPassword })
      wx.showToast({ title: '密码修改成功', icon: 'success' })
      this.setData({
        showPwdForm: false,
        oldPassword: '',
        newPassword: '',
        newPassword2: '',
      })
    } catch {
      // 旧密码错误等业务错误已由请求层 toast（实测：错误旧密码 → code=400"旧密码错误"，不改数据）
    } finally {
      this.setData({ pwdSubmitting: false })
    }
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定退出当前账号？',
      success: (res) => {
        if (res.confirm) {
          userStore.clear()
          compareStore.load() // 对比列表是本地数据，保持不动；仅刷新内存态
          this.setData({ isLoggedIn: false, user: null, rolesText: '' })
          wx.showToast({ title: '已退出登录', icon: 'none' })
        }
      },
    })
  },
})
