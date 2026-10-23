#!/usr/bin/env node
/**
 * 产品图片数据源可行性验证脚本（独立验证工具，不属于生产代码）
 * ------------------------------------------------------------------
 * 目的：验证现有 50 个 Mock 产品能否通过 Wikimedia Commons / Openverse
 *       找到「与产品型号真实对应」的开放授权图片。
 *
 * 严格约束（本脚本自身保证）：
 *   - 只读取 backend/src/main/resources/mock-data/products.json（只读）
 *   - 只写 verification/ 目录下的结果文件与本地缓存
 *   - 不连接数据库、不写 product_images、不引用任何生产 Java 代码
 *   - 不新增 ProductDataProvider、不改动同步链路与前端
 *
 * 用法：
 *   node verification/verify-product-images.mjs            # 正常执行（带缓存）
 *   node verification/verify-product-images.mjs --no-cache # 忽略缓存重新抓取
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
// 评分逻辑统一放在 lib/matching.mjs，由 lib/scoring-selftest.mjs 用构造用例验证。
// 主脚本不再自行重复实现，避免「报告用的规则」与「被验证的规则」分叉。
import {
  norm, stripHtml, tokenize, uniq,
  buildSignals, buildQueries, scoreCandidate, isGoodLicense,
  MODEL_ALIASES
} from './lib/matching.mjs'
// Wikimedia 检索实现统一放在 lib/wikimedia.mjs，与「真实数据库产品验证」共用同一份代码
import { createWikimediaClient } from './lib/wikimedia.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const CACHE_DIR = join(HERE, '.cache')
const NO_CACHE = process.argv.includes('--no-cache')

const PRODUCTS_JSON = join(ROOT, 'backend', 'src', 'main', 'resources', 'mock-data', 'products.json')

const UA = 'GeekPriceImageVerification/1.0 (undergraduate graduation project; image source feasibility study)'
const WM_API = 'https://commons.wikimedia.org/w/api.php'
const OV_API = 'https://api.openverse.org/v1/images/'

// Openverse 匿名配额：20/min、200/day。保守使用，并全程落缓存。
const OV_MIN_INTERVAL_MS = 3400
const OV_DAILY_BUDGET = 180

// Wikimedia 是开放 API，仅做温和串行限速（非硬配额）。
const WM_MIN_INTERVAL_MS = 350

const WM_LIMIT = 10        // 每查询最多候选数
const WM_MAX_QUERIES = 6   // 每产品最多查询数（brand+model / 别名写法… / model / brand+model+category）
const OV_LIMIT = 10
const OV_MAX_QUERIES = 2
const MAX_CANDIDATES_PER_PRODUCT = 18

mkdirSync(CACHE_DIR, { recursive: true })

// ============================================================
// 一、通用工具（sleep 为本脚本的限速工具；其余工具函数见 lib/matching.mjs）
// ============================================================

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ============================================================
// 四、Wikimedia Commons 抓取（复用 lib/wikimedia.mjs）
// ============================================================

const wmClient = createWikimediaClient({
  cacheDir: CACHE_DIR,
  userAgent: UA,
  minIntervalMs: WM_MIN_INTERVAL_MS,
  limit: WM_LIMIT,
  noCache: NO_CACHE
})
const searchWikimedia = (query) => wmClient.search(query)

function cachePath(kind, key) {
  const safe = Buffer.from(key).toString('base64url').slice(0, 120)
  return join(CACHE_DIR, `${kind}-${safe}.json`)
}

function readCache(kind, key) {
  if (NO_CACHE) return null
  const p = cachePath(kind, key)
  if (!existsSync(p)) return null
  try {
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch {
    return null
  }
}

function writeCache(kind, key, value) {
  writeFileSync(cachePath(kind, key), JSON.stringify(value))
}


// ============================================================
// 五、Openverse 抓取
// ============================================================

let lastOvCall = 0
let ovDailyUsed = 0
let ovBudgetExhausted = false

async function ovThrottle() {
  const wait = OV_MIN_INTERVAL_MS - (Date.now() - lastOvCall)
  if (wait > 0) await sleep(wait)
  lastOvCall = Date.now()
}

async function searchOpenverse(query) {
  const cached = readCache('ov', query)
  if (cached) return cached

  if (ovBudgetExhausted || ovDailyUsed >= OV_DAILY_BUDGET) {
    ovBudgetExhausted = true
    return { query, error: 'BUDGET_EXHAUSTED', results: [] }
  }

  await ovThrottle()
  ovDailyUsed++

  const url = `${OV_API}?${new URLSearchParams({ q: query, page_size: String(OV_LIMIT) })}`
  let body = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } })
      if (res.status === 429) {
        const retry = Number(res.headers.get('retry-after') ?? 0) * 1000
        await sleep(Math.max(retry, 8000))
        continue
      }
      if (res.status >= 500) {
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
      await sleep(1500 * attempt)
    }
  }

  const results = (body?.results ?? []).map((r) => ({
    title: r.title ?? null,
    imageUrl: r.url ?? null,
    thumbnailUrl: r.thumbnail ?? null,
    description: r.attribution ?? null,
    tags: Array.isArray(r.tags) ? r.tags.map((t) => t?.name ?? t).filter(Boolean).join('|') : null,
    creator: r.creator ?? null,
    license: r.license ? String(r.license).toUpperCase() + (r.license_version ? ' ' + r.license_version : '') : null,
    licenseUrl: r.license_url ?? null,
    sourceUrl: r.foreign_landing_url ?? r.detail_url ?? null,
    provider: r.provider ?? null,
    width: r.width, height: r.height
  }))

  const out = { query, error: body?.__error ?? null, results }
  writeCache('ov', query, out)
  return out
}

// ============================================================
// 七、主流程
// ============================================================

const products = JSON.parse(readFileSync(PRODUCTS_JSON, 'utf8'))
console.log(`[INFO] 载入 Mock 产品 ${products.length} 个：${PRODUCTS_JSON}`)

/**
 * 跑一轮完整验证。
 * @param useAliases false = 别名前基线；true = 启用别名表
 */
async function runVerification(useAliases) {
  const label = useAliases ? '别名后' : '别名前'
  console.log(`\n########## 开始采集（${label}）##########`)
  const reports = []

  for (let i = 0; i < products.length; i++) {
    const p = products[i]
    const sig = buildSignals(p, { useAliases })
    const queries = buildQueries(sig, WM_MAX_QUERIES)
    const candidates = []
    let wmRaw = 0
    let ovRaw = 0
    const errors = []

    // ---- Wikimedia ----
    for (const q of queries) {
      const r = await searchWikimedia(q)
      if (r.error) errors.push(`wikimedia:${q}:${r.error}`)
      wmRaw += r.results.length
      for (const c of r.results) {
        candidates.push({ ...c, source: 'wikimedia', searchQuery: q })
      }
      if (candidates.filter((c) => c.source === 'wikimedia').length >= WM_LIMIT) break
    }

    // ---- 评分（先看 Wikimedia 质量） ----
    let scored = candidates.map((c) => ({ ...c, ...scoreCandidate(sig, { ...c, source: c.source }) }))
    const wmBest = Math.max(0, ...scored.filter((c) => c.source === 'wikimedia').map((c) => c.matchScore))

    // ---- Openverse 补充：Wikimedia 无结果或最佳分 < 60 时 ----
    let ovUsed = false
    if (wmBest < 60) {
      ovUsed = true
      for (const q of queries.slice(0, OV_MAX_QUERIES)) {
        const r = await searchOpenverse(q)
        if (r.error) errors.push(`openverse:${q}:${r.error}`)
        ovRaw += r.results.length
        for (const c of r.results) {
          const withSource = { ...c, source: 'openverse' }
          candidates.push(withSource)
          scored.push({ ...withSource, ...scoreCandidate(sig, withSource) })
        }
      }
    }

    // 去重（按 imageUrl）并保留最高分
    const byUrl = new Map()
    for (const c of scored) {
      const key = c.imageUrl ?? c.title
      const prev = byUrl.get(key)
      if (!prev || c.matchScore > prev.matchScore) byUrl.set(key, c)
    }
    const finalCandidates = [...byUrl.values()]
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, MAX_CANDIDATES_PER_PRODUCT)

    const best = finalCandidates[0] ?? null
    reports.push({
      productId: i + 1,
      brand: p.brand,
      brandSearch: sig.brandSearch,
      model: p.model,
      modelCore: sig.coreModel,
      aliasKey: sig.aliasKey,
      aliasesUsed: (sig.aliasForms ?? []).map((f) => f.text),
      title: p.title,
      category: p.category,
      specs: p.specs ?? {},
      queriesTried: queries,
      openverseQueried: ovUsed,
      wikimediaRawResults: wmRaw,
      openverseRawResults: ovRaw,
      errors,
      candidateCount: finalCandidates.length,
      bestMatchScore: best?.matchScore ?? 0,
      bestMatchStatus: best?.matchStatus ?? 'REJECT',
      bestAutoAdopt: best?.autoAdopt === true,
      autoAdoptCount: finalCandidates.filter((c) => c.autoAdopt === true).length,
      bestCandidate: best
        ? {
            source: best.source,
            title: best.title,
            matchScore: best.matchScore,
            matchStatus: best.matchStatus,
            autoAdopt: best.autoAdopt === true,
            license: best.license ?? null,
            matchedVia: best.matchedVia ?? null,
            viaAlias: best.viaAlias === true
          }
        : null,
      candidates: finalCandidates
    })

    const tag = `[${i + 1}/${products.length}]`
    console.log(`${tag} ${p.brand} ${p.model} -> wm=${wmRaw} ov=${ovRaw} best=${best?.matchScore ?? 0} (${best?.matchStatus ?? 'REJECT'}) adopt=${best?.autoAdopt === true}`)
  }
  return reports
}

// 先跑「别名前」基线，再跑「别名后」，用于量化别名带来的增益
const baselineReports = await runVerification(false)
const productReports = await runVerification(true)

// ---- 基线 vs 别名后 逐产品对比 ----
const aliasComparison = productReports.map((after) => {
  const before = baselineReports.find((b) => b.productId === after.productId)
  const usable = (s) => s === 'HIGH' || s === 'MEDIUM'
  return {
    productId: after.productId,
    brand: after.brand,
    model: after.model,
    aliases: after.aliasesUsed,
    baselineScore: before?.bestMatchScore ?? 0,
    baselineStatus: before?.bestMatchStatus ?? 'REJECT',
    aliasScore: after.bestMatchScore,
    aliasStatus: after.bestMatchStatus,
    becameUsable: !usable(before?.bestMatchStatus ?? 'REJECT') && usable(after.bestMatchStatus),
    becameHigh: (before?.bestMatchStatus ?? 'REJECT') !== 'HIGH' && after.bestMatchStatus === 'HIGH',
    fixedByAlias: (after.candidates ?? []).some((c) => c.viaAlias === true
      && (c.matchStatus === 'HIGH' || c.matchStatus === 'MEDIUM'))
  }
})

const aliasGains = aliasComparison.filter((c) => c.becameUsable)
console.log(`\n[别名增益] 新增可用产品 ${aliasGains.length} 个：${aliasGains.map((g) => `#${g.productId} ${g.model}(${g.baselineStatus}->${g.aliasStatus})`).join('、') || '无'}`)

// ============================================================
// 七之二、真实数据上的「反例探针」
// ============================================================
// 目的：用真实 API 返回结果证明负例规则确实生效，而不是只靠构造用例。
// 做法：故意用「容易混淆」的查询词去搜 Wikimedia，再把结果回灌到评分函数，
//       检查它们是否被正确压到 HIGH 以下。
const ADVERSARIAL_PROBES = [
  { label: 'RTX 5070 Ti 是否会被当成 RTX 5070', query: 'RTX 5070 Ti', product: { brand: 'NVIDIA', model: 'RTX 5070', category: '显卡' } },
  { label: 'RTX 4080 是否会被当成 RTX 4070 Ti Super', query: 'RTX 4080', product: { brand: 'NVIDIA', model: 'RTX 4070 Ti Super', category: '显卡' } },
  { label: 'iPhone 17 case 是否会被当成 iPhone 17 本体', query: 'iPhone 17 case', product: { brand: 'Apple', model: 'iPhone 17 256GB', category: '手机' } },
  { label: 'MacBook Pro case 是否会被当成 MacBook Pro', query: 'MacBook Pro case', product: { brand: 'Apple', model: 'MacBook Pro 14 M4', category: '笔记本电脑' } },
  { label: 'MacBook Air 是否会被当成 MacBook Pro', query: 'MacBook Air', product: { brand: 'Apple', model: 'MacBook Pro 14 M4', category: '笔记本电脑' } },
  { label: 'Watch GT 5 Pro 是否会被当成 Watch GT 5', query: 'Watch GT 5 Pro', product: { brand: '华为', model: 'Watch GT 5', category: '智能手表' } }
]

const adversarialResults = []
for (const probe of ADVERSARIAL_PROBES) {
  const sig = buildSignals(probe.product)
  const r = await searchWikimedia(probe.query)
  const scored = r.results.map((c) => {
    const withSource = { ...c, source: 'wikimedia', searchQuery: probe.query }
    return { ...withSource, ...scoreCandidate(sig, withSource) }
  }).sort((a, b) => b.matchScore - a.matchScore)

  const best = scored[0] ?? null
  const highCount = scored.filter((c) => c.matchStatus === 'HIGH').length
  adversarialResults.push({
    label: probe.label,
    query: probe.query,
    product: `${probe.product.brand} ${probe.product.model}`,
    resultCount: scored.length,
    highCount,
    bestScore: best?.matchScore ?? null,
    bestStatus: best?.matchStatus ?? null,
    bestTitle: best?.title ?? null,
    bestReasons: best?.matchReasons ?? [],
    top: scored.slice(0, 5).map((c) => ({ title: c.title, matchScore: c.matchScore, matchStatus: c.matchStatus, matchReasons: c.matchReasons }))
  })
  console.log(`[探针] ${probe.label} -> 结果 ${scored.length} 条，HIGH ${highCount} 条，最高 ${best?.matchScore ?? 0} (${best?.matchStatus ?? 'N/A'})`)
}

// ============================================================
// 八、输出 JSON / CSV
// ============================================================

const generatedAt = new Date().toISOString()
const jsonOut = {
  meta: {
    purpose: '产品图片数据源可行性验证（专项，非生产接入）',
    generatedAt,
    sourceProducts: 'backend/src/main/resources/mock-data/products.json',
    productCount: products.length,
    sources: ['wikimedia', 'openverse'],
    scoringRubric: {
      add: {
        '标题包含完整 model': 50,
        '标题包含 brand': 30,
        '描述/标签包含完整 model': 20,
        '分类与产品 category 一致': 10,
        '来源是 Wikimedia Commons': 10,
        '许可为 CC0/CC BY/CC BY-SA/Public Domain': 10
      },
      subtract: {
        '含 case/cover/sleeve/protector': -50,
        '含 concept': -40,
        '含 wallpaper/logo/vector/mockup 等非实物图': -40,
        '含 accessory/charger/cable 等': -30,
        '明显是其他型号（同系列数字不一致）': -30,
        '变体冲突（标题多出 Pro/Max/Ti/Super 等）': -30,
        '明显是其他型号（标题多出 Ti/Super/Pro/Max/Ultra/XT/OLED 等升档 SKU）': -30,
        '型号描述不完整（缺少变体词）': -15,
        '只有品牌、没有型号': -20
      },
      statusThresholds: { HIGH: '>=80', MEDIUM: '60-79', LOW: '40-59', REJECT: '<40' }
    },
    autoAdoptRule: {
      rule: 'matchStatus === "HIGH" 且许可证属于 CC0 / Public Domain / CC BY / CC BY-SA',
      reject: 'MEDIUM/LOW/REJECT 一律 false；许可含 NC 或 ND、缺失或无法识别一律 false'
    },
    modelAliases: MODEL_ALIASES,
    aliasBaseline: {
      description: '关闭别名表（既不用别名检索也不用别名匹配）跑出的「别名前」基线',
      usableCount: baselineReports.filter((r) => r.bestMatchStatus === 'HIGH' || r.bestMatchStatus === 'MEDIUM').length,
      highCount: baselineReports.filter((r) => r.bestMatchStatus === 'HIGH').length,
      mediumCount: baselineReports.filter((r) => r.bestMatchStatus === 'MEDIUM').length,
      lowCount: baselineReports.filter((r) => r.bestMatchStatus === 'LOW').length,
      rejectCount: baselineReports.filter((r) => r.bestMatchStatus === 'REJECT').length,
      perProduct: baselineReports.map((r) => ({
        productId: r.productId, model: r.model,
        bestMatchScore: r.bestMatchScore, bestMatchStatus: r.bestMatchStatus
      }))
    },
    aliasComparison,
    notes: [
      'productId 为 products.json 中的目录序号（1 起始），Mock 数据本身不含数据库主键。',
      'Openverse 匿名配额为 20 次/分钟、200 次/天，本脚本对每次查询做本地缓存并保守限速。',
      '本脚本不写数据库、不写 product_images、不改动任何生产代码。',
      '型号 token 一律整词命中，不做子串匹配；变体冲突只比较多字母变体词。',
      '评分规则由 lib/matching.mjs 提供，并由 lib/scoring-selftest.mjs 用构造用例验证（100 项断言）。',
      'scoreCandidate 中的扣分是「逐条累加」的：同一个候选可能同时命中多条扣分规则。',
      'adversarialProbes 记录了用真实 API 结果做的反例探针，用于证明负例规则在真实数据上同样生效。',
      'autoAdopt 只是「是否满足自动采用准入条件」的标记，本次验证并未真正写入任何数据库。',
      '别名表只含经真实 API 核实的显式映射，匹配时按连续短语整段命中。'
    ]
  },
  products: productReports,
  adversarialProbes: adversarialResults
}

writeFileSync(join(HERE, 'product-image-verification.json'), JSON.stringify(jsonOut, null, 2))

// CSV
const csvEscape = (v) => {
  const s = v == null ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const csvHeader = [
  'productId', 'brand', 'model', 'category', 'source', 'searchQuery', 'title',
  'imageUrl', 'license', 'licenseUrl', 'creator', 'sourceUrl', 'matchScore', 'matchStatus',
  'autoAdopt', 'matchedVia', 'viaAlias'
]
const csvRows = [csvHeader.join(',')]
for (const r of productReports) {
  for (const c of r.candidates) {
    csvRows.push([
      r.productId, r.brand, r.model, r.category, c.source, c.searchQuery, c.title,
      c.imageUrl, c.license, c.licenseUrl, c.creator, c.sourceUrl, c.matchScore, c.matchStatus,
      c.autoAdopt === true, c.matchedVia ?? '', c.viaAlias === true
    ].map(csvEscape).join(','))
  }
}
writeFileSync(join(HERE, 'product-image-verification.csv'), '\uFEFF' + csvRows.join('\n') + '\n')

// 别名前基线也单独落一份 CSV，便于比对
const baselineCsvRows = [csvHeader.join(',')]
for (const r of baselineReports) {
  for (const c of r.candidates) {
    baselineCsvRows.push([
      r.productId, r.brand, r.model, r.category, c.source, c.searchQuery, c.title,
      c.imageUrl, c.license, c.licenseUrl, c.creator, c.sourceUrl, c.matchScore, c.matchStatus,
      c.autoAdopt === true, c.matchedVia ?? '', c.viaAlias === true
    ].map(csvEscape).join(','))
  }
}
writeFileSync(join(HERE, 'product-image-verification-baseline.csv'), '\uFEFF' + baselineCsvRows.join('\n') + '\n')

console.log(`[DONE] 候选总数 ${csvRows.length - 1}（别名前基线 ${baselineCsvRows.length - 1}），已写出 JSON / CSV`)
console.log(`[STATS] Openverse 实际请求次数（本次运行）：${ovDailyUsed}，预算耗尽：${ovBudgetExhausted}`)

// 供 summary 生成脚本使用
writeFileSync(join(HERE, '.cache', '_reports.json'), JSON.stringify({ generatedAt, ovDailyUsed, ovBudgetExhausted, productReports, baselineReports }))
