/**
 * Wikimedia Commons 检索客户端（验证专项共用）
 * ------------------------------------------------------------------
 * 从 verify-product-images.mjs 抽出，供「Mock 目录验证」与「真实数据库产品验证」
 * 共用同一套检索实现，避免出现两份行为不一致的抓取代码。
 *
 * 特性：
 *   - 只读公开 API（action=query&generator=search&prop=imageinfo&iiprop=...extmetadata）
 *   - 只取元数据与缩略图信息，不下载原图
 *   - 温和串行限速 + 本地文件缓存（同一查询不重复请求）
 *   - 失败重试；错误以 error 字段返回，不抛异常
 *
 * 本模块不访问数据库、不写任何业务数据。
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { stripHtml } from './matching.mjs'

const WM_API = 'https://commons.wikimedia.org/w/api.php'
const DEFAULT_UA = 'GeekPriceImageVerification/1.0 (undergraduate graduation project; image source feasibility study)'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * 创建一个 Wikimedia 检索客户端。
 * @param {object} opts
 * @param {string} opts.cacheDir      缓存目录（不存在会自动创建）
 * @param {string} [opts.userAgent]   User-Agent
 * @param {number} [opts.minIntervalMs] 两次请求之间的最小间隔
 * @param {number} [opts.limit]       单次查询最多候选数
 * @param {boolean} [opts.noCache]    为 true 时忽略缓存
 */
export function createWikimediaClient(opts) {
  const {
    cacheDir,
    userAgent = DEFAULT_UA,
    minIntervalMs = 350,
    limit = 10,
    noCache = false
  } = opts

  mkdirSync(cacheDir, { recursive: true })
  let lastCall = 0

  const cachePath = (query) =>
    join(cacheDir, `wm-${Buffer.from(query).toString('base64url').slice(0, 120)}.json`)

  function readCache(query) {
    if (noCache) return null
    const p = cachePath(query)
    if (!existsSync(p)) return null
    try {
      return JSON.parse(readFileSync(p, 'utf8'))
    } catch {
      return null
    }
  }

  function writeCache(query, value) {
    writeFileSync(cachePath(query), JSON.stringify(value))
  }

  async function throttle() {
    const wait = minIntervalMs - (Date.now() - lastCall)
    if (wait > 0) await sleep(wait)
    lastCall = Date.now()
  }

  /** 关键词检索 Commons 图片文件，返回统一结构的候选列表 */
  async function search(query) {
    const cached = readCache(query)
    if (cached) return cached

    await throttle()
    const url = `${WM_API}?${new URLSearchParams({
      action: 'query', format: 'json', formatversion: '2',
      generator: 'search', gsrsearch: query, gsrnamespace: '6', gsrlimit: String(limit),
      prop: 'imageinfo', iiprop: 'url|size|extmetadata|mime', iiurlwidth: '480'
    })}`

    let body = null
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(url, { headers: { 'User-Agent': userAgent } })
        if (res.status === 429 || res.status >= 500) {
          await sleep(1500 * attempt)
          continue
        }
        body = await res.json()
        break
      } catch (e) {
        if (attempt === 3) {
          body = { __error: String(e?.message ?? e) }
          break
        }
        await sleep(1200 * attempt)
      }
    }

    const pages = body?.query?.pages ?? []
    const results = pages
      .filter((p) => p.imageinfo?.[0])
      .filter((p) => String(p.imageinfo[0].mime ?? '').startsWith('image/'))
      .map((p) => {
        const ii = p.imageinfo[0]
        const em = ii.extmetadata ?? {}
        const val = (k) => (em[k]?.value != null ? stripHtml(em[k].value) : null)
        return {
          title: p.title,
          imageUrl: String(ii.url ?? '').split('?')[0],
          thumbnailUrl: ii.thumburl ? String(ii.thumburl).split('?')[0] : null,
          description: val('ImageDescription'),
          categories: val('Categories'),
          objectName: val('ObjectName'),
          creator: val('Artist') ?? val('Credit'),
          license: val('LicenseShortName') ?? val('License'),
          licenseUrl: val('LicenseUrl'),
          usageTerms: val('UsageTerms'),
          mime: ii.mime,
          width: ii.width,
          height: ii.height,
          sourceUrl: ii.descriptionurl ?? null
        }
      })

    const out = { query, error: body?.__error ?? null, results }
    writeCache(query, out)
    return out
  }

  return { search }
}
