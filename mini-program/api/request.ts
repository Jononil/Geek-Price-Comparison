/**
 * 统一请求层
 * ---------------------------------------------------------------
 * 处理要点（依据阶段一审计 + 阶段二实测的真实后端行为）：
 *
 * 1. 统一响应：{ code, message, data }，业务成功 code===200，拦截层解包 data；
 * 2. 异常形态（两种，均已实测）：
 *    a) HTTP 200 + body.code!==200（如 400/404/500，GlobalExceptionHandler 无 @ResponseStatus）
 *       —— 实测 GET /api/products/999999 → HTTP 200 + code=404
 *    b) HTTP 403 + Spring Security 默认错误 JSON（非 Result 结构）
 *       —— 实测未登录 GET /api/user/info → HTTP 403 + {"timestamp","status","error","path"}
 *    因此 HTTP 状态码与 body.code 必须双重判断；
 * 3. 认证失效（HTTP 401/403 或 body.code===401）：清除本地 token，引导登录（避免循环跳转）；
 * 4. 超时/断网：统一提示，不重复弹窗；
 * 5. 不在客户端存放任何服务端机密（JWT 密钥、数据库密码等仅存在于后端）。
 */
import { getBaseURL, TIMEOUT } from '../config/env'
import { userStore } from '../store/user'
import type { Result } from '../types'

/** 业务请求错误（携带后端业务码与消息） */
export class BizError extends Error {
  code: number
  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, unknown>
  params?: Record<string, string | number | undefined>
  /** 该请求是否静默处理错误（默认 false：错误统一 toast） */
  silent?: boolean
}

/** 当前是否正处于"跳登录"流程（防止并发请求重复弹窗/跳转） */
let redirecting = false

/**
 * 登录失效统一处理：
 * 清 token → 提示 → 跳登录页（已在登录页则不跳，避免循环）
 */
function forceRelogin(message = '登录已过期，请重新登录'): void {
  userStore.clear()
  if (redirecting) return
  redirecting = true
  wx.showToast({ title: message, icon: 'none' })
  const pages = getCurrentPages()
  const current = pages[pages.length - 1]
  const route = current?.route || ''
  // 延迟到 toast 展示后再跳转
  setTimeout(() => {
    redirecting = false
    if (route.startsWith('pages/login/')) return
    const redirect = route ? `/${route}` : '/pages/index/index'
    wx.navigateTo({ url: `/pages/login/login?redirect=${encodeURIComponent(redirect)}` })
  }, 600)
}

function showError(message: string): void {
  wx.showToast({ title: message || '请求失败', icon: 'none', duration: 2000 })
}

/** 拼接 query 参数（跳过 undefined / 空字符串） */
function buildQuery(params?: Record<string, string | number | undefined>): string {
  if (!params) return ''
  const pairs: string[] = []
  for (const key of Object.keys(params)) {
    const v = params[key]
    if (v === undefined || v === null || v === '') continue
    pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`)
  }
  return pairs.length ? `?${pairs.join('&')}` : ''
}

/**
 * 核心请求方法：resolve 后端 data（业务失败 reject BizError）
 */
export function request<T>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, params, silent = false } = options

  return new Promise<T>((resolve, reject) => {
    const header: Record<string, string> = {}
    const token = userStore.getToken()
    if (token) {
      header.Authorization = `Bearer ${token}`
    }
    if (method === 'POST' || method === 'PUT') {
      header['Content-Type'] = 'application/json'
    }

    wx.request({
      url: `${getBaseURL()}${url}${buildQuery(params)}`,
      method,
      data,
      header,
      timeout: TIMEOUT,
      success(res) {
        // 形态 b：HTTP 401/403（Spring Security 过滤器层拦截，body 非 Result 结构）
        if (res.statusCode === 401 || res.statusCode === 403) {
          forceRelogin()
          reject(new BizError(401, '未登录或登录已过期'))
          return
        }
        // 非 2xx 且非 JSON：服务器/网关错误
        if (res.statusCode < 200 || res.statusCode >= 300) {
          if (!silent) showError('服务暂时不可用，请稍后重试')
          reject(new BizError(res.statusCode, '服务暂时不可用'))
          return
        }

        const body = res.data as Result<T> | undefined
        // HTTP 200 但 body 不是标准 Result（防御性处理）
        if (!body || typeof body.code !== 'number') {
          if (!silent) showError('响应格式异常')
          reject(new BizError(-1, '响应格式异常'))
          return
        }

        if (body.code === 200) {
          resolve(body.data as T)
          return
        }
        // 形态 a：业务错误码（含 body.code===401 的业务级未登录）
        if (body.code === 401) {
          forceRelogin()
          reject(new BizError(401, body.message || '未登录或登录已过期'))
          return
        }
        if (!silent) showError(body.message || '请求失败')
        reject(new BizError(body.code, body.message || '请求失败'))
      },
      fail(err) {
        const msg = err.errMsg || ''
        const text = msg.includes('timeout')
          ? '请求超时，请检查网络'
          : '网络异常，请稍后重试'
        if (!silent) showError(text)
        reject(new BizError(-2, text))
      },
    })
  })
}

export const http = {
  get: <T>(url: string, params?: Record<string, string | number | undefined>, silent?: boolean) =>
    request<T>({ url, method: 'GET', params, silent }),
  post: <T>(url: string, data?: Record<string, unknown>, silent?: boolean) =>
    request<T>({ url, method: 'POST', data, silent }),
  put: <T>(url: string, data?: Record<string, unknown>, silent?: boolean) =>
    request<T>({ url, method: 'PUT', data, silent }),
  delete: <T>(url: string, silent?: boolean) => request<T>({ url, method: 'DELETE', silent }),
}
