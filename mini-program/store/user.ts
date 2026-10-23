/**
 * 登录态管理（token + 用户信息）
 * ---------------------------------------------------------------
 * 后端为无状态 JWT（24h 有效期，无刷新/登出接口），小程序侧以
 * Storage 持久化 token，请求层统一注入 Authorization: Bearer。
 * 退出登录 = 清本地（与 PC 端行为一致——后端无登出接口）。
 */
import type { User } from '../types'

const TOKEN_KEY = 'gp_token'
const USER_KEY = 'gp_user'

export const userStore = {
  getToken(): string {
    return (wx.getStorageSync(TOKEN_KEY) as string) || ''
  },

  setToken(token: string): void {
    wx.setStorageSync(TOKEN_KEY, token)
  },

  getUser(): User | null {
    try {
      return (wx.getStorageSync(USER_KEY) as User) || null
    } catch {
      return null
    }
  },

  setUser(user: User): void {
    wx.setStorageSync(USER_KEY, user)
  },

  isLoggedIn(): boolean {
    return !!userStore.getToken()
  },

  /** 清除本地登录态（退出登录 / 令牌失效时调用） */
  clear(): void {
    wx.removeStorageSync(TOKEN_KEY)
    wx.removeStorageSync(USER_KEY)
  },
}
