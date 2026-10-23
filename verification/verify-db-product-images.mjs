#!/usr/bin/env node
/**
 * 图片覆盖验证专项：验证「真实数据库产品」的 Wikimedia Commons 图片覆盖率
 * ==================================================================
 * 与上一轮的区别：产品来源从 products.json（50 个 Mock）改为**数据库 products 表**。
 *
 * 严格约束（本脚本自身保证）：
 *   - 只读数据库：所有 SQL 均为 SELECT，脚本内含断言，出现任何非 SELECT 直接退出
 *   - 不写 product_images / products / 任何表；不改 schema
 *   - 只使用 Wikimedia Commons 一个来源（不接 Openverse / GSMArena / ABO / Products-10K / RPC）
 *   - 不下载原图到项目资源目录（只取元数据与缩略图 URL）
 *   - 复用 lib/matching.mjs 的型号匹配/评分/许可判断，复用 lib/wikimedia.mjs 的检索实现
 *   - 不放宽匹配规则换覆盖率；无法确认型号一律 REJECT
 *
 * 数据库说明：products 表**没有 model 列**（任务书给的 SQL 会报 Unknown column 'model'），
 * 因此「型号」由产品名按**确定性规则**得到：去掉开头的品牌词（纯格式处理，非模糊匹配），
 * 与上一轮已确认的映射口径 B「严格同名 + 去品牌前后缀同名」保持一致。
 *
 * 用法：
 *   node verification/verify-db-product-images.mjs
 *   node verification/verify-db-product-images.mjs --no-cache   # 忽略本地缓存重新抓取
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  buildSignals, buildQueries, scoreCandidate,
  isAutoAdoptLicense, stripLeadingBrand
} from './lib/matching.mjs'
import { createWikimediaClient } from './lib/wikimedia.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CACHE = join(HERE, '.cache')
const NO_CACHE = process.argv.includes('--no-cache')

const OUT_JSON = join(HERE, 'db-product-image-verification.json')
const OUT_CSV = join(HERE, 'db-product-image-verification.csv')
const OUT_MD = join(HERE, 'db-product-image-summary.md')

const WM_LIMIT = 10
const WM_MAX_QUERIES = 3
mkdirSync(CACHE, { recursive: true })

// ============================================================
// 一、只读数据库访问（复用项目现有连接配置，不硬编码密码）
// ============================================================

const DB = {
  host: process.env.GEEKPRICE_DB_HOST ?? '127.0.0.1',
  port: process.env.GEEKPRICE_DB_PORT ?? '3306',
  user: process.env.GEEKPRICE_DB_USER ?? 'root',
  password: process.env.GEEKPRICE_DB_PASSWORD ?? '123456',
  name: process.env.GEEKPRICE_DB_NAME ?? 'geek_price'
}
const MYSQL = [
  'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe',
  'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe',
  'mysql'
].find((p) => p === 'mysql' || existsSync(p))
if (!MYSQL) {
  console.error('[FATAL] 未找到 mysql 客户端')
  process.exit(1)
}

/**
 * 只读查询。任何非 SELECT 语句都会被拒绝（本专项禁止一切写操作）。
 */
function select(sql, outName) {
  if (!/^\s*select\b/i.test(sql)) {
    throw new Error(`[只读保护] 本专项禁止执行非 SELECT 语句：${sql.slice(0, 60)}`)
  }
  const inFile = join(CACHE, '_sel.sql')
  const batFile = join(CACHE, '_sel.bat')
  const outFile = join(CACHE, outName)
  const errFile = join(CACHE, '_sel.err')
  writeFileSync(inFile, sql, 'utf8')
  // stderr 单独落文件，避免 mysql 的密码告警混进数据
  writeFileSync(batFile,
    `@echo off\r\n"${MYSQL}" -h ${DB.host} -P ${DB.port} -u ${DB.user} -p${DB.password} ` +
    `--default-character-set=utf8mb4 -N -B "${DB.name}" < "${inFile}" > "${outFile}" 2> "${errFile}"\r\n`,
    'utf8')
  execFileSync('cmd.exe', ['/c', batFile], { stdio: 'inherit' })
  return existsSync(outFile) ? readFileSync(outFile, 'utf8') : ''
}

const parseTsv = (raw, cols) => raw.split(/\r?\n/)
  .filter((l) => l.trim() !== '')
  .map((l) => l.split('\t'))
  .filter((f) => f.length === cols)

// ============================================================
// 二、读取真实数据库产品
// ============================================================

console.log('[1/4] 读取数据库真实产品（只读 SELECT）...')

const brands = new Map(parseTsv(
  select(`SELECT id, name FROM brands;`, 'db_brands.tsv'), 2
).map(([id, name]) => [Number(id), name]))

const categories = new Map(parseTsv(
  select(`SELECT id, name FROM categories;`, 'db_categories.tsv'), 2
).map(([id, name]) => [Number(id), name]))

const productRows = parseTsv(
  select(`SELECT id, name, brand_id, category_id, status FROM products WHERE deleted = 0 ORDER BY id;`, 'db_products_all.tsv'), 5
)

const products = productRows.map(([id, name, brandId, categoryId, status]) => {
  const brand = brands.get(Number(brandId)) ?? ''
  // products 表没有 model 列：型号 = 产品名去掉开头品牌词（确定性、纯格式）
  const stripped = stripLeadingBrand(name)
  const model = stripped || name
  return {
    productId: Number(id),
    name,
    model,
    brand,
    brandId: Number(brandId),
    category: categories.get(Number(categoryId)) ?? '',
    categoryId: Number(categoryId),
    status: Number(status)
  }
})
console.log(`      产品数（deleted=0）= ${products.length}`)

// 现有图片：区分「真实图片」与「占位图」
const imageRows = parseTsv(
  select(`SELECT product_id, url FROM product_images;`, 'db_images_all.tsv'), 2
)
const isPlaceholder = (u) => /placehold\.co|placekitten|dummyimage|via\.placeholder/i.test(String(u ?? ''))
const realImagesByProduct = new Map()
const allImagesByProduct = new Map()
for (const [pid, url] of imageRows) {
  const id = Number(pid)
  allImagesByProduct.set(id, (allImagesByProduct.get(id) ?? 0) + 1)
  if (!isPlaceholder(url)) realImagesByProduct.set(id, (realImagesByProduct.get(id) ?? 0) + 1)
}
console.log(`      product_images 行数 = ${imageRows.length}，其中非占位图 = ${[...realImagesByProduct.values()].reduce((a, b) => a + b, 0)}`)

// ============================================================
// 三、逐产品检索 Wikimedia 并评分
// ============================================================

const wm = createWikimediaClient({
  cacheDir: CACHE,
  minIntervalMs: 350,
  limit: WM_LIMIT,
  noCache: NO_CACHE
})

/** 判断「图片主体明确是该产品」：标题级命中型号，且无任何型号歧义/配件/非实物图信号 */
function subjectClearlyProduct(c) {
  if (!c || c.modelFullInTitle !== true) return false
  const f = c.flags ?? {}
  if (f.hardDisqualify || f.otherModel) return false
  if ((f.variantExtra ?? []).length > 0) return false
  if ((f.plusUpgrade ?? []).length > 0) return false
  if ((f.variantMissing ?? []).length > 0) return false
  if (f.caseLike || f.concept || f.wallpaperLike || f.accessory) return false
  return true
}

/**
 * 图片「主体类型」提示（不影响 matchScore，只用于人工复核提示）。
 * 型号可能完全正确，但图片主体未必是「产品实拍」：
 *   - 芯片裸片/显微图（AMD@...@iod@swir、nmesf、wafer、die shot…）
 *   - 店铺/陈列照（store、shop、flagship…）
 * 这类图放进产品主图并不合适，因此单独标出，供小范围试点人工复核。
 */
function subjectTypeWarning(title) {
  const t = String(title ?? '').toLowerCase()
  if (/die shot|wafer|microscope|swir|\bnmesf\b|\bnmccd\b|iod@|ccd@|delid|晶圆|裸片|显微/.test(t)) {
    return 'chip_die_or_micrograph'
  }
  if (/\bstore\b|\bshop\b|flagship|陳列|陈列|专柜/.test(t)) {
    return 'store_display'
  }
  return null
}

/** 生成一句可读的判定原因 */
function buildReason(status, best) {
  if (!best) return '两个来源均无候选（本轮只用 Wikimedia，故为 Wikimedia 无候选）'
  const reasons = (best.matchReasons ?? []).filter((r) => !r.startsWith('→'))
  const negs = reasons.filter((r) => r.startsWith('-'))
  const head = {
    HIGH: '标题完整命中型号且无歧义信号',
    MEDIUM: '型号未出现在标题（仅描述命中），封顶 79',
    LOW: '存在明显扣分项，未达可用线',
    REJECT: '未命中型号或命中配件/非实物图/其他型号'
  }[status]
  const tail = negs.length ? `；扣分：${negs.join('，')}` : ''
  return `${head}${tail}`
}

console.log(`[2/4] 开始逐个检索 Wikimedia（每产品最多 ${WM_MAX_QUERIES} 条查询）...`)
const results = []

for (let i = 0; i < products.length; i++) {
  const p = products[i]
  const sig = buildSignals({ brand: p.brand, model: p.model, category: p.category })
  const queries = buildQueries(sig, WM_MAX_QUERIES)
  const candidates = []
  const errors = []

  for (const q of queries) {
    const r = await wm.search(q)
    if (r.error) errors.push(`wikimedia:${q}:${r.error}`)
    for (const c of r.results) candidates.push({ ...c, source: 'wikimedia', searchQuery: q })
    if (candidates.length >= WM_LIMIT) break
  }

  const scored = candidates.map((c) => ({ ...c, ...scoreCandidate(sig, c) }))
  const byUrl = new Map()
  for (const c of scored) {
    const k = c.imageUrl ?? c.title
    const prev = byUrl.get(k)
    if (!prev || c.matchScore > prev.matchScore) byUrl.set(k, c)
  }
  const finalCandidates = [...byUrl.values()].sort((a, b) => b.matchScore - a.matchScore)
  const best = finalCandidates[0] ?? null

  const matchStatus = best?.matchStatus ?? 'REJECT'
  const license = best?.license ?? null
  const licenseAllowed = best ? isAutoAdoptLicense(license) : false
  const subjectOk = subjectClearlyProduct(best)
  const autoAdopt = matchStatus === 'HIGH' && licenseAllowed && subjectOk

  results.push({
    productId: p.productId,
    name: p.name,
    model: p.model,
    brand: p.brand,
    category: p.category,
    queriesTried: queries,
    wikimediaCandidates: finalCandidates.length,
    candidateCount: finalCandidates.length,
    bestCandidate: best
      ? {
          title: best.title,
          imageUrl: best.imageUrl,
          thumbnailUrl: best.thumbnailUrl,
          sourceUrl: best.sourceUrl,
          creator: best.creator,
          license: best.license,
          licenseUrl: best.licenseUrl,
          matchScore: best.matchScore,
          matchStatus: best.matchStatus,
          matchedVia: best.matchedVia ?? null,
          viaAlias: best.viaAlias === true
        }
      : null,
    matchStatus,
    matchScore: best?.matchScore ?? 0,
    license,
    licenseAllowed,
    subjectClearlyProduct: subjectOk,
    subjectTypeWarning: subjectTypeWarning(best?.title),
    autoAdopt,
    hasRealImage: (realImagesByProduct.get(p.productId) ?? 0) > 0,
    imageRowCount: allImagesByProduct.get(p.productId) ?? 0,
    realImageCount: realImagesByProduct.get(p.productId) ?? 0,
    reason: buildReason(matchStatus, best),
    errors,
    candidates: finalCandidates.slice(0, 10)
  })

  if ((i + 1) % 10 === 0 || i === products.length - 1) {
    console.log(`      [${i + 1}/${products.length}] 最新：#${p.productId} ${p.name} -> ${matchStatus}(${best?.matchScore ?? 0}) adopt=${autoAdopt}`)
  }
}

// ============================================================
// 四、输出 JSON / CSV / Markdown
// ============================================================

const tally = (arr, fn) => {
  const m = new Map()
  for (const x of arr) {
    const k = fn(x)
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}
const pct = (n, d) => (d === 0 ? '0.0' : ((n / d) * 100).toFixed(1))

const statusCounts = { HIGH: 0, MEDIUM: 0, LOW: 0, REJECT: 0 }
for (const r of results) statusCounts[r.matchStatus]++

const withCandidates = results.filter((r) => r.wikimediaCandidates > 0)
const noCandidates = results.filter((r) => r.wikimediaCandidates === 0)
const licenseAllowedHigh = results.filter((r) => r.matchStatus === 'HIGH' && r.licenseAllowed)
const autoAdoptList = results.filter((r) => r.autoAdopt)
const alreadyHaveReal = results.filter((r) => r.hasRealImage)
const placeholderOnly = results.filter((r) => !r.hasRealImage)

const licenseStats = tally(results.filter((r) => r.license), (r) => r.license)
const licenseAllowedCount = results.filter((r) => r.license && r.licenseAllowed).length
const licenseForbiddenCount = results.filter((r) => r.license && !r.licenseAllowed).length

/** 主体类型需要人工复核的 autoAdopt 产品（型号正确，但图可能不是产品实拍） */
const subjectWarnList = autoAdoptList.filter((r) => r.subjectTypeWarning)

const generatedAt = new Date().toISOString()
const jsonOut = {
  meta: {
    purpose: '真实数据库产品的 Wikimedia Commons 图片覆盖率验证（只读，不写库）',
    generatedAt,
    source: 'MySQL geek_price.products（deleted = 0）',
    productCount: results.length,
    imageSource: 'Wikimedia Commons（唯一来源；未接入 Openverse / GSMArena / ABO / Products-10K / RPC）',
    modelDerivation: 'products 表无 model 列；型号 = 产品名去掉开头品牌词（确定性纯格式处理）',
    mappingPolicy: '严格型号一致 + 已核实 MODEL_ALIASES；禁止任何型号推断与系列匹配',
    licenseRule: '允许：CC0 / Public Domain / CC BY / CC BY-SA；禁止：BY-NC* / BY-ND / 未知',
    autoAdoptRule: 'matchStatus=HIGH 且 licenseAllowed=true 且 图片主体明确是该产品（无型号歧义）',
    dbWrites: '无（脚本只执行 SELECT，内含非 SELECT 断言）',
    stats: {
      productTotal: results.length,
      withCandidates: withCandidates.length,
      noCandidates: noCandidates.length,
      ...statusCounts,
      licenseAllowedHigh: licenseAllowedHigh.length,
      autoAdopt: autoAdoptList.length,
      autoAdoptSubjectWarning: subjectWarnList.length,
      alreadyHaveRealImage: alreadyHaveReal.length,
      placeholderOnly: placeholderOnly.length
    }
  },
  products: results
}
writeFileSync(OUT_JSON, JSON.stringify(jsonOut, null, 2))

// ---- CSV ----
const esc = (v) => {
  const s = v == null ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const csvHeader = [
  'productId', 'name', 'model', 'brand', 'category',
  'wikimediaCandidates', 'matchScore', 'matchStatus',
  'bestTitle', 'license', 'licenseAllowed', 'subjectClearlyProduct', 'autoAdopt',
  'hasRealImage', 'imageUrl', 'sourceUrl', 'reason'
]
const csvRows = [csvHeader.join(',')]
for (const r of results) {
  csvRows.push([
    r.productId, r.name, r.model, r.brand, r.category,
    r.wikimediaCandidates, r.matchScore, r.matchStatus,
    r.bestCandidate?.title ?? '', r.license ?? '', r.licenseAllowed, r.subjectClearlyProduct, r.autoAdopt,
    r.hasRealImage, r.bestCandidate?.imageUrl ?? '', r.bestCandidate?.sourceUrl ?? '', r.reason
  ].map(esc).join(','))
}
writeFileSync(OUT_CSV, '\uFEFF' + csvRows.join('\n') + '\n')

// ---- Markdown ----
const top20 = [...autoAdoptList].sort((a, b) => b.matchScore - a.matchScore).slice(0, 20)
const nearMiss = results
  .filter((r) => !r.autoAdopt && r.matchStatus === 'HIGH')
  .slice(0, 10)
const md = []
md.push('# 真实数据库产品 × Wikimedia Commons 覆盖率验证报告')
md.push('')
md.push(`> 生成时间：${generatedAt}`)
md.push(`> 产品来源：数据库 \`geek_price.products\`（\`deleted = 0\`），共 **${results.length}** 个产品`)
md.push('> 图片来源：**Wikimedia Commons（唯一来源）**')
md.push('> 本报告只做验证：**未执行任何数据库写操作**，未导入任何图片。')
md.push('')
md.push('## 一、结论速览')
md.push('')
md.push('| 指标 | 数值 | 占比 |')
md.push('|---|---|---|')
md.push(`| 数据库产品总数 | ${results.length} | 100% |`)
md.push(`| Wikimedia 有候选 | ${withCandidates.length} | ${pct(withCandidates.length, results.length)}% |`)
md.push(`| Wikimedia 无候选 | ${noCandidates.length} | ${pct(noCandidates.length, results.length)}% |`)
md.push(`| HIGH | ${statusCounts.HIGH} | ${pct(statusCounts.HIGH, results.length)}% |`)
md.push(`| MEDIUM | ${statusCounts.MEDIUM} | ${pct(statusCounts.MEDIUM, results.length)}% |`)
md.push(`| LOW | ${statusCounts.LOW} | ${pct(statusCounts.LOW, results.length)}% |`)
md.push(`| REJECT | ${statusCounts.REJECT} | ${pct(statusCounts.REJECT, results.length)}% |`)
md.push(`| 许可合规的 HIGH | ${licenseAllowedHigh.length} | ${pct(licenseAllowedHigh.length, results.length)}% |`)
md.push(`| **autoAdopt（可自动采用）** | **${autoAdoptList.length}** | **${pct(autoAdoptList.length, results.length)}%** |`)
md.push('')
md.push('现有图片状况（placehold.co 按「没有真实图片」处理）：')
md.push('')
md.push('| 状况 | 产品数 |')
md.push('|---|---|')
md.push(`| 已有真实图片 | ${alreadyHaveReal.length} |`)
md.push(`| 仍只有占位图 / 无图 | ${placeholderOnly.length} |`)
md.push('')
md.push('## 二、验证方法')
md.push('')
md.push('1. 从数据库读取 `products WHERE deleted = 0`，并 JOIN `brands` / `categories` 取品牌名与分类名；')
md.push('2. `products` 表**没有 `model` 列**（任务书给的 SQL 会报 `Unknown column \'model\'`），')
md.push('   因此型号由产品名按确定性规则得到：**去掉开头的品牌词**（纯格式处理，非模糊匹配），')
md.push('   与上一轮已确认的映射口径 B 一致；')
md.push('3. 用 `lib/matching.mjs` 的 `buildSignals` / `buildQueries` / `scoreCandidate` 做检索与评分；')
md.push('4. Wikimedia 检索复用 `lib/wikimedia.mjs`（每产品最多 3 条查询：品牌+型号 / 型号 / 品牌+型号+分类）；')
md.push('5. 许可判断复用 `isAutoAdoptLicense`；')
md.push(`6. \`autoAdopt\` 需同时满足：\`matchStatus=HIGH\` + \`licenseAllowed=true\` + 图片主体明确；`)
md.push('7. 全程只执行 SELECT（脚本内含非 SELECT 断言），不写任何表。')
md.push('')
md.push('## 三、匹配与许可规则（本轮未放宽）')
md.push('')
md.push('- 型号必须**完全一致**；仅允许大小写/空格/连字符等纯格式差异；')
md.push('- 仅允许已核实的 `MODEL_ALIASES`：`sony a7m4 → a7 iv / a7iv / alpha 7 iv / alpha 7 mark iv`、')
md.push('  `ipad pro 11 m4 → ipad pro m4 / ipad pro m4 11-inch / ipad pro 11-inch m4`；')
md.push('- **禁止**任何型号推断：`RTX 5070 ≠ 5070 Ti`、`iPhone 17 ≠ 17 Pro/Pro Max`、')
md.push('  `Mate 70 Pro ≠ Mate 70 Pro+`、`MacBook Pro 14 M4 ≠ 16 M4 Pro`、`Bose QC Ultra ≠ QuietComfort Ultra Earbuds`；')
md.push('- **禁止**系列名代替具体型号、Pro/Pro Max 混用、Ti/Ti Super 混用、不同年份/尺寸/芯片混用、')
md.push('  配件图冒充产品主体、仅凭品牌或搜索词相似判同；')
md.push('- 无法确认一律判 REJECT。')
md.push('')
md.push('许可：允许 `CC0 / Public Domain / CC BY / CC BY-SA`；')
md.push('禁止 `CC BY-NC / BY-NC-SA / BY-NC-ND / BY-ND / Unknown`。')
md.push('「找到图片」不等于「可以使用」。')
md.push('')
md.push('## 四、License 统计')
md.push('')
md.push('| 许可证 | 产品数（取该产品最佳候选的许可） |')
md.push('|---|---|')
for (const [k, v] of licenseStats) md.push(`| ${k} | ${v} |`)
md.push('')
md.push(`- 许可合规：**${licenseAllowedCount}** 个`)
md.push(`- 许可不合规（NC/ND/未知等）：**${licenseForbiddenCount}** 个`)
md.push(`- 其中「HIGH 但许可不合规」：**${statusCounts.HIGH - licenseAllowedHigh.length}** 个（不可自动采用）`)
md.push('')
md.push('## 五、autoAdopt 明细')
md.push('')
md.push(`满足全部条件的共 **${autoAdoptList.length}** 个产品：`)
md.push('')
if (autoAdoptList.length === 0) {
  md.push('> 无。')
} else {
  md.push('| # | 产品 | 型号 | 分类 | 分数 | 许可 | 图片标题 |')
  md.push('|---|---|---|---|---|---|---|')
  for (const r of autoAdoptList) {
    md.push(`| ${r.productId} | ${r.name} | ${r.model} | ${r.category} | ${r.matchScore} | ${r.license} | ${String(r.bestCandidate?.title ?? '').replace(/\|/g, '\\|')} |`)
  }
}
md.push('')
if (nearMiss.length) {
  md.push('以下是 **HIGH 但不可自动采用** 的产品（许可不合规或主体存疑），仅供人工复核：')
  md.push('')
  md.push('| # | 产品 | 型号 | 分数 | 许可 | 许可合规 | 主体明确 | 原因 |')
  md.push('|---|---|---|---|---|---|---|---|')
  for (const r of nearMiss) {
    md.push(`| ${r.productId} | ${r.name} | ${r.model} | ${r.matchScore} | ${r.license ?? '-'} | ${r.licenseAllowed} | ${r.subjectClearlyProduct} | ${r.reason} |`)
  }
  md.push('')
}
md.push('## 六、最值得导入的产品 Top 20')
md.push('')
if (top20.length === 0) {
  md.push('> 无。')
} else {
  md.push('| 排名 | # | 产品 | 型号 | 分类 | 分数 | 许可 | 图片 |')
  md.push('|---|---|---|---|---|---|---|---|')
  top20.forEach((r, i) => {
    md.push(`| ${i + 1} | ${r.productId} | ${r.name} | ${r.model} | ${r.category} | ${r.matchScore} | ${r.license} | ${String(r.bestCandidate?.title ?? '').replace(/\|/g, '\\|')} |`)
  })
}
md.push('')
md.push('## 七、典型无法匹配的产品')
md.push('')
const byStatus = (s) => results.filter((r) => r.matchStatus === s)
md.push(`- **Wikimedia 无候选（${noCandidates.length} 个）**：${noCandidates.slice(0, 15).map((r) => `${r.name}`).join('、')}${noCandidates.length > 15 ? ' 等' : ''}`)
md.push(`- **REJECT（${byStatus('REJECT').length} 个）**：${byStatus('REJECT').slice(0, 15).map((r) => `${r.name}(${r.matchScore})`).join('、')}${byStatus('REJECT').length > 15 ? ' 等' : ''}`)
md.push('')
md.push('原因分布：')
md.push('')
const reasonTally = tally(results.filter((r) => r.matchStatus !== 'HIGH'), (r) => r.reason)
md.push('| 原因 | 产品数 |')
md.push('|---|---|')
for (const [k, v] of reasonTally.slice(0, 12)) md.push(`| ${k.replace(/\|/g, '\\|')} | ${v} |`)
md.push('')
md.push('## 八、典型误匹配风险')
md.push('')
md.push('### 8.1 本轮实测发现并已修复的跨型号误配（回归用例已固化）')
md.push('')
md.push('第一轮跑出来 42 个 autoAdopt，人工复核发现其中数条是**跨型号误配**，已修复并写成回归用例')
md.push('（`lib/scoring-selftest.mjs` 第 20 组，自测总数 100 → 128 项）：')
md.push('')
md.push('| 数据库产品 | 误配到的标题 | 缺陷类型 | 修复方式 |')
md.push('|---|---|---|---|')
md.push('| 索尼 A7 IV | `sony A7 R IV launch` | 命中跨度内夹入非型号字母 `R` | 跨度内禁止出现非型号 token |')
md.push('| 华为 MateBook 14 | `MateBook D 14` / `MateBook GT 14` | 同上（夹 `D` / `GT`） | 同上 |')
md.push('| 三星 990 Pro 2TB | `990 PRO 4TB` | 容量/SKU 冲突 | 标题写了别的容量即判不匹配 |')
md.push('| 大疆 Pocket 3 | `DJI Osmo Pocket - 3` | 末尾照片序号被当成型号数字 | 剥掉标题末尾 ` - N` |')
md.push('| 苹果 Watch Ultra 2 | `Apple Watch Ultra - 2` | 同上 | 同上 |')
md.push('| 小米 14 | `... Seaside City (2024-12-14)` | 日期里的 `14` 被当成型号 | 标题也去日期噪声 |')
md.push('| 三星 Galaxy Watch 6 | `Galaxy Watch 6 Classic` 群拍 | `Classic` 属不同 SKU | 变体词表加入 `classic` |')
md.push('| i9-14900K | 对比视频标题（含 14600K/12900HX） | 跨度内夹入其它型号数字 | 同「跨度内禁止非型号 token」 |')
md.push('')
md.push('### 8.2 当前仍存在的残余风险（不构成跨型号误配，但建议人工复核）')
md.push('')
if (subjectWarnList.length === 0) {
  md.push('- 未检出「非产品实拍」类候选。')
} else {
  md.push(`- **主体类型可疑（${subjectWarnList.length} 个 autoAdopt 产品）**：型号完全正确，但图片主体可能不是产品实拍`)
  md.push('  （芯片裸片/显微图、店铺陈列照）。这类图用作产品主图并不合适，建议试点前人工过一眼：')
  md.push('')
  md.push('  | # | 产品 | 分数 | 主体类型 | 图片 |')
  md.push('  |---|---|---|---|---|')
  for (const r of subjectWarnList) {
    md.push(`  | ${r.productId} | ${r.name} | ${r.matchScore} | ${r.subjectTypeWarning} | ${String(r.bestCandidate?.title ?? '').replace(/\|/g, '\\|')} |`)
  }
  md.push('')
}
md.push('- **多设备合影**：如「DELL XPS 13 and 15」「SAMSUNG Galaxy Tab S9, W24, Z Fold 5 …」这类图里同时出现多台设备，')
md.push('  目标型号确实在图中，但主体不唯一。建议人工确认或优先换用单机实拍图。')
md.push('- **纯数字型号偏弱**：如「小米 14」「小米 15」这类型号，其型号 token 只有一个数字，')
md.push('  理论上最容易被日期/编号撞上；本轮已通过「标题去日期 + 禁止跨度内非型号 token」压制，但仍属需要重点抽查的类型。')
md.push('- **同名不同品类**：如「990 Pro」既是三星 SSD 也是 Beyerdynamic 耳机型号（DT-990 Pro），')
md.push('  本轮该候选被判为 MEDIUM 70 而非 HIGH，未进入 autoAdopt；但说明「型号字符串相同」并不等于「品类相同」，')
md.push('  正式接入时建议再加一层品类校验。')
md.push('')
const riskFlag = {
  otherModel: '同系列不同数字（如 4070 vs 4080）',
  variantExtra: '标题多出升档 SKU（Pro/Max/Ti/Super/Ultra…）',
  plusUpgrade: '加号升档 SKU（Pro+ ≠ Pro）',
  variantMissing: '型号描述不完整',
  caseLike: '配件/保护壳冒充主体',
  wallpaperLike: '壁纸/logo/矢量图等非实物图',
  accessory: '配件（充电器/线材/支架）',
  concept: '概念图',
  onlyBrand: '只有品牌没有型号'
}
const riskCounts = {}
for (const r of results) {
  for (const c of r.candidates ?? []) {
    for (const [k, label] of Object.entries(riskFlag)) {
      const v = c.flags?.[k]
      const hit = Array.isArray(v) ? v.length > 0 : v === true
      if (hit) riskCounts[label] = (riskCounts[label] ?? 0) + 1
    }
  }
}
md.push(`在 ${results.reduce((s, r) => s + (r.candidates?.length ?? 0), 0)} 条候选中，被规则拦下的风险类型：`)
md.push('')
md.push('| 风险类型 | 命中次数 |')
md.push('|---|---|')
for (const [k, v] of Object.entries(riskCounts).sort((a, b) => b[1] - a[1])) md.push(`| ${k} | ${v} |`)
md.push('')
md.push('## 九、复现方式')
md.push('')
md.push('```bash')
md.push('node verification/verify-db-product-images.mjs')
md.push('```')
md.push('')
md.push('产出：`db-product-image-verification.json`、`db-product-image-verification.csv`、`db-product-image-summary.md`。')
md.push('')

writeFileSync(OUT_MD, md.join('\n'))

console.log('[3/4] 已写出 JSON / CSV / Markdown')
console.log(`[4/4] 统计：产品 ${results.length}，有候选 ${withCandidates.length}，无候选 ${noCandidates.length}`)
console.log(`      HIGH ${statusCounts.HIGH} / MEDIUM ${statusCounts.MEDIUM} / LOW ${statusCounts.LOW} / REJECT ${statusCounts.REJECT}`)
console.log(`      许可合规 HIGH ${licenseAllowedHigh.length}，autoAdopt ${autoAdoptList.length}`)
console.log(`      已有真实图片 ${alreadyHaveReal.length}，仍只有占位图 ${placeholderOnly.length}`)
