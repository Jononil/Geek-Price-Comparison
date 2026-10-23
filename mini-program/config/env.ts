/**
 * 环境与 API Base URL 单点管理
 * ---------------------------------------------------------------
 * 开发环境：本地后端（微信开发者工具需勾选"不校验合法域名"）
 * 正式环境：必须为已在小程序后台配置的 HTTPS 域名（微信强制要求），
 *           本文件不硬编码未确定的域名，正式值由使用方在发布前替换。
 */

type EnvKey = 'dev' | 'prod'

const ENV: EnvKey = 'dev'

const BASE_URLS: Record<EnvKey, string> = {
  // 本地联调（已实测后端监听 8080）
  dev: 'http://localhost:8080',
  // TODO 发布前替换为真实备案 HTTPS 域名，并在小程序后台配置 request 合法域名
  prod: 'https://YOUR-PROD-DOMAIN.example.com',
}

/** API 统一前缀（后端所有 Controller 均在 /api 下） */
export const API_PREFIX = '/api'

/** 请求超时（ms），与 PC 端 axios timeout=15000 对齐 */
export const TIMEOUT = 15000

export function getBaseURL(): string {
  return BASE_URLS[ENV]
}

export function isDev(): boolean {
  return ENV === 'dev'
}
