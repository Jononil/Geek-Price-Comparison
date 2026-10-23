/**
 * 登录态守卫（页面级通用工具）
 * 需要登录才能执行的操作：未登录时引导登录并携带回跳地址。
 */
import { userStore } from '../store/user'

/**
 * 若未登录则跳转登录页；返回是否已登录。
 * @param currentRoute 当前页面路由（用于回跳），如 'pages/product-detail/index'
 */
export function ensureLogin(currentRoute?: string): boolean {
  if (userStore.isLoggedIn()) return true
  const pages = getCurrentPages()
  const route = currentRoute ?? pages[pages.length - 1]?.route ?? '/pages/index/index'
  const redirect = route.startsWith('/') ? route : `/${route}`
  wx.navigateTo({ url: `/pages/login/login?redirect=${encodeURIComponent(redirect)}` })
  return false
}
