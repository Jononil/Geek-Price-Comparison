#!/usr/bin/env node
/**
 * 「补充商品图片」第一阶段：为「没有真实图片」的产品收集 Wikimedia 候选图
 * ====================================================================
 * 只做统计与候选收集，**不写数据库、不改前后端代码**。
 *
 * 范围：
 *   - 读取数据库全部 products（deleted = 0）
 *   - 排除「已存在非 placehold.co 真实图片」的产品（即已审核通过的 33 个）
 *   - 对剩余产品用 Wikimedia Commons 搜索候选
 *
 * 匹配原则（严格，不放宽）：
 *   - 必须「品牌 + 完整型号」同时成立：型号的数字 token 与系列 token 都要命中，
 *     且命中跨度内不得夹入非型号 token（复用 lib/matching.mjs 的已验证逻辑）
 *   - 禁止仅凭品牌、仅凭数字、或泛关键词判定
 *
 * 检索词说明（只用于「搜什么」，不放宽「怎么算匹配」）：
 *   - 数据库里品牌/系列多为中文，Commons 上多为英文，因此建立
 *     「品牌中文→英文」与「已知产品线中文→英文」两张**显式**对照表用于构造检索词；
 *     未确认的对照一律不翻译（宁少不错），并在报告中标注。
 *
 * 用法：node verification/collect-image-candidates.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { buildSignals, buildQueries, scoreCandidate, tokenize, norm, stripLeadingBrand, isAutoAdoptLicense } from './lib/matching.mjs'
import { createWikimediaClient } from './lib/wikimedia.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CACHE = join(HERE, '.cache-phase1')
mkdirSync(CACHE, { recursive: true })

const OUT_JSON = join(HERE, 'image-candidates-phase1.json')
const OUT_CSV = join(HERE, 'image-candidates-phase1.csv')
const OUT_MD = join(HERE, 'image-candidates-phase1.md')

const WM_LIMIT = 10
const MAX_QUERIES = 5

// ---------- 只读数据库 ----------
const DB = {
  host: process.env.GEEKPRICE_DB_HOST ?? '127.0.0.1',
  port: process.env.GEEKPRICE_DB_PORT ?? '3306',
  user: process.env.GEEKPRICE_DB_USER ?? 'root',
  password: process.env.GEEKPRICE_DB_PASSWORD ?? '123456',
  name: process.env.GEEKPRICE_DB_NAME ?? 'geek_price'
}
const MYSQL = ['C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe',
  'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe', 'mysql']
  .find((p) => p === 'mysql' || existsSync(p))

function select(sql, outName) {
  if (!/^\s*select\b/i.test(sql)) throw new Error('[只读保护] 非 SELECT 语句被拒绝：' + sql.slice(0, 60))
  const inF = join(CACHE, '_q.sql'), bat = join(CACHE, '_q.bat')
  const outF = join(CACHE, outName), errF = join(CACHE, '_q.err')
  writeFileSync(inF, sql, 'utf8')
  writeFileSync(bat, `@echo off\r\n"${MYSQL}" -h ${DB.host} -P ${DB.port} -u ${DB.user} -p${DB.password} --default-character-set=utf8mb4 -N -B "${DB.name}" < "${inF}" > "${outF}" 2> "${errF}"\r\n`, 'utf8')
  execFileSync('cmd.exe', ['/c', bat], { stdio: 'inherit' })
  return existsSync(outF) ? readFileSync(outF, 'utf8') : ''
}
const parseTsv = (raw, cols) => raw.split(/\r?\n/).filter((l) => l.trim() !== '')
  .map((l) => l.split('\t')).filter((f) => f.length === cols)

// ============================================================
// 检索用对照表（显式枚举；只影响「搜什么」，不影响「算什么匹配」）
// ============================================================

/** 品牌中文名 -> 英文（用于构造 Commons 检索词） */
const BRAND_EN = {
  '小米': 'Xiaomi', '联想': 'Lenovo', '华硕': 'ASUS', '苹果': 'Apple', '华为': 'Huawei',
  '戴尔': 'Dell', '微星': 'MSI', '海盗船': 'Corsair', '英伟达': 'NVIDIA', '惠普': 'HP',
  '三星': 'Samsung', '索尼': 'Sony', '雷蛇': 'Razer', '达尔优': 'Dareu', '致态': 'ZhiTai',
  '金士顿': 'Kingston', '一加': 'OnePlus', '荣耀': 'Honor', '机械革命': 'Mechrevo',
  '明基': 'BenQ', '泰坦军团': 'Titan Army', '森海塞尔': 'Sennheiser', '漫步者': 'Edifier',
  '水月雨': 'Moondrop', '铁三角': 'Audio-Technica', '珂芝': 'Kzzi', '樱桃': 'Cherry',
  '狼蛛': 'AULA', '雷柏': 'Rapoo', '卓威': 'ZOWIE', '多彩': 'Delux', '尼康': 'Nikon',
  '富士': 'Fujifilm', '松下': 'Panasonic', '佳明': 'Garmin', '微软': 'Microsoft',
  '七彩虹': 'Colorful', '西数': 'Western Digital', '铠侠': 'Kioxia', '海康威视': 'Hikvision',
  '宏碁': 'Acer', '芝奇': 'G.Skill', '威刚': 'ADATA', '英睿达': 'Crucial', '光威': 'Gloway',
  '中兴': 'ZTE'
}

/** 已知产品线中文名 -> 官方英文名（用于构造检索词；未确认的不收录） */
const LINE_EN = {
  '拯救者': 'Legion', '小新': 'Xiaoxin', '天选': 'TUF Gaming', '暗影精灵': 'OMEN',
  '绝影': 'Stealth', '玄龙骑士': 'Odyssey', '掠夺者': 'Predator', '幻光戟': 'Trident Z',
  '骇客神条': 'Fury', '复仇者': 'Vengeance', '玩家国度': 'ROG', '海皇戟': 'Trident',
  '至尊版': 'Ultra'
}

const CATEGORY_EN = {
  '手机': 'smartphone', '平板电脑': 'tablet', '笔记本电脑': 'laptop', '台式电脑': 'desktop PC',
  '显示器': 'monitor', '耳机': 'headphones', '键盘': 'keyboard', '鼠标': 'mouse',
  '相机': 'camera', '智能手表': 'smartwatch', '游戏机': 'game console', '显卡': 'graphics card',
  'CPU': 'CPU', '固态硬盘': 'SSD', '内存': 'RAM', '路由器': 'router'
}

/** 把型号里的中文产品线替换为官方英文名；并返回用到/未用到的对照 */
function translateModel(model) {
  let out = String(model)
  const used = []
  const unknownCjk = []
  for (const [zh, en] of Object.entries(LINE_EN)) {
    if (out.includes(zh)) { out = out.split(zh).join(en); used.push(`${zh}→${en}`) }
  }
  // 剩余仍未翻译的中文片段（说明该产品线海外名未确认）
  const rest = out.match(/[\u4e00-\u9fff]+/g) ?? []
  for (const r of rest) unknownCjk.push(r)
  return { translated: out.replace(/\s+/g, ' ').trim(), used, unknownCjk }
}

/**
 * 从「品牌 + 型号」形式的产品名里取出型号。
 * 中文品牌常与产品线粘连成一个 CJK 词元（如「联想拯救者」），
 * 因此先按品牌中文名做**整串前缀剥离**，再走通用品牌词剥离。
 */
function extractModel(name, brand) {
  let s = String(name ?? '').trim()
  if (brand && s.startsWith(brand)) s = s.slice(brand.length).trim()
  const stripped = stripLeadingBrand(s)
  return stripped || s || String(name ?? '')
}

/**
 * 图片主体类型提示（型号可能对，但主体不是产品实拍）。
 * 本轮只做标注，供人工复核，不参与打分。
 */
function subjectTypeWarning(title) {
  const t = String(title ?? '').toLowerCase()
  if (/die shot|wafer|microscope|swir|nmesf|nmccd|iod@|ccd@|delid|晶圆|裸片|显微|\bccx\b|@/.test(t)) return 'chip_die_or_micrograph'
  if (/\bstore\b|\bshop\b|flagship|booth|expo\b|exhibition|陈列|专柜|门店/.test(t)) return 'store_or_booth'
  if (/unboxing|unboxed|\bbox\b|packaging|retail box|开箱|包装/.test(t)) return 'packaging_or_unboxing'
  if (/\band\s+[a-z0-9-]*\d/i.test(t) || /、/.test(t)) return 'multi_device'
  if (/vergleich|comparison|\bvs\b|对比/.test(t)) return 'comparison_shot'
  return null
}

/** 品牌是否在标题/描述中出现（匹配依据里的 +30） */
const BRAND_BONUS_KEY = '包含品牌'

/**
 * 前序审核已判定「对应关系未证实」的产品，强制进入人工复核。
 * 华硕天选 5 Pro：ASUS 官方把「天选5 Pro」对应到 TUF Gaming A16/F16 (2024)，
 * 并不存在官方名为「TUF Gaming 5 Pro」的机型，因此不能仅凭字符串对应就当作可信命中。
 */
const CONTESTED_PRODUCT_NAMES = new Set(['华硕天选 5 Pro'])

// ============================================================
// 主流程
// ============================================================
console.log('[1/4] 读取数据库产品与现有图片（只读 SELECT）...')
const brands = new Map(parseTsv(select(`SELECT id, name FROM brands;`, 'b.tsv'), 2).map(([i, n]) => [Number(i), n]))
const cats = new Map(parseTsv(select(`SELECT id, name FROM categories;`, 'c.tsv'), 2).map(([i, n]) => [Number(i), n]))
const products = parseTsv(select(
  `SELECT id, name, brand_id, category_id FROM products WHERE deleted = 0 ORDER BY id;`, 'p.tsv'), 4)
  .map(([id, name, b, c]) => ({
    id: Number(id), name,
    brand: brands.get(Number(b)) ?? '', category: cats.get(Number(c)) ?? ''
  }))
const realImageProducts = new Set(parseTsv(
  select(`SELECT DISTINCT product_id FROM product_images WHERE url NOT LIKE '%placehold.co%';`, 'r.tsv'), 1)
  .map(([pid]) => Number(pid)))

const targets = products.filter((p) => !realImageProducts.has(p.id))
console.log(`      products=${products.length}，已有真实图=${realImageProducts.size}，本轮目标=${targets.length}`)

const wm = createWikimediaClient({ cacheDir: CACHE, minIntervalMs: 320, limit: WM_LIMIT })

console.log('[2/4] 逐个检索 Wikimedia Commons ...')
const report = []
for (let i = 0; i < targets.length; i++) {
  const p = targets[i]
  const brandEn = BRAND_EN[p.brand] ?? p.brand
  const modelRaw = extractModel(p.name, p.brand)
  const { translated, used, unknownCjk } = translateModel(modelRaw)
  const catEn = CATEGORY_EN[p.category] ?? ''

  // 检索词：品牌+型号(原样) / 型号(原样) / 品牌+型号(英译) / 型号(英译) / 品牌+型号(英译)+类别
  const queries = [...new Set([
    `${brandEn} ${modelRaw}`,
    modelRaw,
    `${brandEn} ${translated}`,
    translated,
    `${brandEn} ${translated} ${catEn}`.trim()
  ].filter(Boolean))].slice(0, MAX_QUERIES)

  const cands = []
  const errors = []
  for (const q of queries) {
    const r = await wm.search(q)
    if (r.error) errors.push(`${q}: ${r.error}`)
    for (const c of r.results) cands.push({ ...c, source: 'wikimedia', searchQuery: q })
    if (cands.length >= WM_LIMIT * 2) break
  }

  // 严格匹配：品牌 + 完整型号。品牌用英文名（Commons 标题为英文），
  // 型号用英译后的完整型号；匹配依据里会写明实际使用的口径。
  const sig = buildSignals({ brand: brandEn, model: translated, category: p.category })
  const scored = cands.map((c) => ({ ...c, ...scoreCandidate(sig, c) }))

  // 硬性闸门：必须「品牌 + 完整型号」同时成立。
  // 只命中型号数字、没有品牌证据的候选一律不计入（这类多为型号数字撞车：
  // A98/VT9 是公路编号、K75 是 BMW 摩托、K70 是大众卡车、M800 是主板、Sabre 是战机）。
  const brandEvidenced = (c) => (c.matchReasons ?? []).some((r) => r.includes(BRAND_BONUS_KEY))

  const byUrl = new Map()
  for (const c of scored) {
    const k = c.imageUrl ?? c.title
    const prev = byUrl.get(k)
    if (!prev || c.matchScore > prev.matchScore) byUrl.set(k, c)
  }
  const allCandidates = [...byUrl.values()]
  const droppedNoBrand = allCandidates.filter((c) => c.matchStatus !== 'REJECT' && !brandEvidenced(c)).length
  const kept = allCandidates
    .filter((c) => c.matchStatus !== 'REJECT' && brandEvidenced(c))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6)

  const pureNumeric = tokenize(translated).length > 0 && tokenize(translated).every((x) => /^\d+$/.test(x))
  // 型号是否具备可区分性：含数字（4060/7800x3d），或本身就是由多个词构成的完整型号（Xbox Series X）。
  // 只有单个泛产品线词的（Trident / ROG / Sabre）不算，无法支撑「品牌+完整型号」。
  const modelTokens = tokenize(translated)
  const hasDistinctiveModel = modelTokens.some((t) => /\d/.test(t)) || modelTokens.length >= 3
  // 最佳候选若有「主体类型」疑点（店铺陈列/裸片/开箱/多设备/对比图），也必须人工复核
  const bestSubjectWarning = kept[0]?.subjectTypeWarning ?? subjectTypeWarning(kept[0]?.title)
  const contested = CONTESTED_PRODUCT_NAMES.has(p.name)
  const needsReview = pureNumeric || unknownCjk.length > 0 || !hasDistinctiveModel || contested || Boolean(bestSubjectWarning)

  report.push({
    productId: p.id,
    productName: p.name,
    brand: p.brand,
    brandEn,
    model: modelRaw,
    modelForMatch: translated,
    pureNumericModel: pureNumeric,
    hasDistinctiveModel,
    needsReview,
    reviewReason: [
      pureNumeric ? '纯数字型号（易与日期/编号撞车）' : null,
      unknownCjk.length ? `中文系列名未确认海外名：${unknownCjk.join('/')}` : null,
      !hasDistinctiveModel ? '型号不含可区分数字（仅产品线名）' : null,
      contested ? '产品线中文名与海外名的对应关系未经证实（官方海外名并非该字符串）' : null,
      bestSubjectWarning ? `最佳候选主体类型存疑：${bestSubjectWarning}` : null
    ].filter(Boolean).join('；') || null,
    lineTranslations: used,
    untranslatedCjk: unknownCjk,
    category: p.category,
    queries,
    candidateCount: kept.length,
    rawCandidateCount: allCandidates.length,
    droppedNoBrand,
    bestStatus: kept[0]?.matchStatus ?? 'REJECT',
    bestScore: kept[0]?.matchScore ?? 0,
    errors,
    candidates: kept.map((c) => ({
      imageUrl: c.imageUrl,
      thumbnailUrl: c.thumbnailUrl ?? null,
      commonsPage: c.sourceUrl,
      title: String(c.title ?? '').replace(/^File:/, ''),
      license: c.license ?? null,
      licenseUrl: c.licenseUrl ?? null,
      licenseAllowed: isAutoAdoptLicense(c.license),
      creator: c.creator ?? null,
      matchScore: c.matchScore,
      matchStatus: c.matchStatus,
      matchedVia: c.matchedVia ?? null,
      brandEvidenced: brandEvidenced(c),
      subjectTypeWarning: subjectTypeWarning(c.title),
      matchReasons: c.matchReasons ?? [],
      searchQuery: c.searchQuery
    }))
  })

  if ((i + 1) % 10 === 0 || i === targets.length - 1) {
    console.log(`      [${i + 1}/${targets.length}] #${p.id} ${p.name} -> 候选 ${kept.length}（最佳 ${kept[0]?.matchStatus ?? 'REJECT'} ${kept[0]?.matchScore ?? 0}）`)
  }
}

// ============================================================
// 输出
// ============================================================
const generatedAt = new Date().toISOString()
const withCand = report.filter((r) => r.candidateCount > 0)
const withoutCand = report.filter((r) => r.candidateCount === 0)
const trusted = withCand.filter((r) => !r.needsReview)
const needReview = withCand.filter((r) => r.needsReview)
const cnt = (list, s) => list.filter((r) => r.bestStatus === s).length
const totalCandidates = report.reduce((s, r) => s + r.candidateCount, 0)
const totalDroppedNoBrand = report.reduce((s, r) => s + r.droppedNoBrand, 0)

const jsonOut = {
  meta: {
    purpose: '补充商品图片 第一阶段：为无真实图片的产品收集 Wikimedia 候选图（不写库）',
    generatedAt,
    scope: `数据库 deleted=0 产品 ${products.length} 个，排除已有真实图 ${realImageProducts.size} 个，本轮目标 ${targets.length} 个`,
    rule: '必须品牌 + 完整型号同时命中；缺少品牌证据的候选一律剔除；禁止仅凭数字/泛关键词匹配',
    queryHelpers: { brandZhToEn: BRAND_EN, productLineZhToEn: LINE_EN },
    stats: {
      totalProducts: products.length,
      alreadyHasRealImage: realImageProducts.size,
      targets: targets.length,
      withCandidates: withCand.length,
      withoutCandidates: withoutCand.length,
      trustedCandidatesProducts: trusted.length,
      needsReviewProducts: needReview.length,
      trustedHIGH: cnt(trusted, 'HIGH'),
      trustedMEDIUM: cnt(trusted, 'MEDIUM'),
      trustedLOW: cnt(trusted, 'LOW'),
      reviewHIGH: cnt(needReview, 'HIGH'),
      totalCandidates,
      droppedForNoBrandEvidence: totalDroppedNoBrand
    }
  },
  products: report
}
writeFileSync(OUT_JSON, JSON.stringify(jsonOut, null, 2))

const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
const csvHead = ['product_id', '产品名称', '品牌', '型号', '候选图片URL', 'Wikimedia页面', '许可证', '许可合规', '主体提示', '匹配依据', 'matchStatus', 'score', 'creator', '需人工复核', 'searchQuery']
const csv = [csvHead.join(',')]
for (const r of report) {
  if (r.candidates.length === 0) {
    csv.push([r.productId, r.productName, r.brand, r.model, '', '', '', '', '', `无候选（检索词：${r.queries.join(' / ')}）`, 'NONE', '', '', r.needsReview ? '是' : '否', ''].map(esc).join(','))
    continue
  }
  for (const c of r.candidates) {
    csv.push([r.productId, r.productName, r.brand, r.model, c.imageUrl, c.commonsPage, c.license,
      c.licenseAllowed ? '是' : '否', c.subjectTypeWarning ?? '', c.matchReasons.filter((x) => x.startsWith('+') || x.startsWith('-')).join('；'),
      c.matchStatus, c.matchScore, c.creator, r.needsReview ? '是' : '否', c.searchQuery].map(esc).join(','))
  }
}
writeFileSync(OUT_CSV, '\uFEFF' + csv.join('\n') + '\n')

const md = []
md.push('# 补充商品图片 · 第一阶段候选清单')
md.push('')
md.push(`> 生成时间：${generatedAt}`)
md.push(`> 范围：数据库 deleted=0 产品 **${products.length}** 个；已有真实图片 **${realImageProducts.size}** 个（已排除）；本轮目标 **${targets.length}** 个`)
md.push('> 本轮**只收集候选，不写入数据库**；未修改数据库、未改前后端代码。')
md.push('> 匹配门槛：**品牌 + 完整型号同时命中**；只命中型号数字、拿不到品牌证据的候选已全部剔除。')
md.push('')
md.push('## 一、总体统计')
md.push('')
md.push('| 指标 | 数量 |')
md.push('|---|---|')
md.push(`| 数据库产品总数（deleted=0） | ${products.length} |`)
md.push(`| 已有真实图片（已排除） | ${realImageProducts.size} |`)
md.push(`| 本轮检索目标 | ${targets.length} |`)
md.push(`| **找到可信候选** | **${trusted.length}** |`)
md.push(`| 找到候选但需人工复核 | ${needReview.length} |`)
md.push(`| 完全无候选 | ${withoutCand.length} |`)
md.push(`| 可信：HIGH / MEDIUM / LOW | ${cnt(trusted, 'HIGH')} / ${cnt(trusted, 'MEDIUM')} / ${cnt(trusted, 'LOW')} |`)
md.push(`| 候选总条数 | ${totalCandidates} |`)
md.push(`| 因缺少品牌证据被剔除 | ${totalDroppedNoBrand} |`)
md.push('')
md.push('## 二、可信候选清单（品牌 + 完整型号均命中）')
md.push('')
for (const r of trusted) {
  md.push(`### #${r.productId} ${r.productName}（${r.brand} / ${r.category}）  → ${r.bestStatus}`)
  md.push('')
  md.push(`- 型号：\`${r.model}\`${r.modelForMatch !== r.model ? ` → 匹配用：\`${r.modelForMatch}\`` : ''}`)
  if (r.lineTranslations.length) md.push(`- 产品线对照：${r.lineTranslations.join('、')}`)
  md.push('')
  md.push('| matchStatus | 分数 | 候选图片 URL | Wikimedia 页面 | 许可证 | 合规 | 主体提示 | 匹配依据 |')
  md.push('|---|---|---|---|---|---|---|---|')
  for (const c of r.candidates) {
    const why = c.matchReasons.filter((x) => x.startsWith('+')).join('；').replace(/\|/g, '\\|')
    md.push(`| **${c.matchStatus}** | ${c.matchScore} | ${c.imageUrl} | ${c.commonsPage ?? ''} | ${c.license ?? ''} | ${c.licenseAllowed ? '✅' : '❌'} | ${c.subjectTypeWarning ?? '—'} | ${why} |`)
  }
  md.push('')
}
md.push('## 三、需人工复核的候选（型号证据偏弱或系列名未确认）')
md.push('')
if (needReview.length === 0) md.push('（无）')
for (const r of needReview) {
  md.push(`### #${r.productId} ${r.productName}（${r.brand}）  → ${r.bestStatus}`)
  md.push('')
  md.push(`- 复核原因：${r.reviewReason ?? '—'}`)
  md.push(`- 型号：\`${r.model}\` → \`${r.modelForMatch}\``)
  if (r.candidates.length) {
    const c0 = r.candidates[0]
    md.push(`- 最佳候选：${c0.imageUrl}`)
    md.push(`  - 标题：${c0.title}`)
    md.push(`  - 许可证：${c0.license ?? '—'}（${c0.licenseAllowed ? '合规' : '不合规'}）`)
  }
  md.push('')
}
md.push('## 四、完全无候选的产品')
md.push('')
for (const r of withoutCand) {
  md.push(`- #${r.productId} ${r.productName}（${r.brand}）｜检索词：${r.queries.map((q) => `\`${q}\``).join('、')}`)
}
md.push('')
md.push('## 五、说明')
md.push('')
md.push('- 状态阈值与验证阶段一致：HIGH ≥80、MEDIUM 60-79、LOW 40-59，REJECT 已剔除。')
md.push('- 只命中型号数字、没有品牌证据的候选（如 A98/VT9 实为公路编号、K75 为 BMW 摩托、K70 为大众卡车、M800 为主板、Sabre 为战机）**已全部剔除**，共 ' + totalDroppedNoBrand + ' 条。')
md.push('- 中文品牌/产品线已用显式对照表转成英文检索词；未确认海外名的中文片段会在报告中标注，这类产品召回会偏低。')
md.push('- `主体提示` 标出芯片裸片/店铺陈列/开箱/多设备/对比图等"型号对但主体未必合适"的情况。')
md.push('- 无候选的产品集中在：中国大陆专供机型、外设/存储小众品牌、以及型号本身过于宽泛的产品。')
md.push('')
writeFileSync(OUT_MD, md.join('\n'))

console.log('[3/4] 已写出 JSON / CSV / Markdown')
console.log(`[4/4] 统计：目标 ${targets.length}，可信候选 ${trusted.length}（HIGH ${cnt(trusted, 'HIGH')} / MEDIUM ${cnt(trusted, 'MEDIUM')} / LOW ${cnt(trusted, 'LOW')}），需复核 ${needReview.length}，无候选 ${withoutCand.length}`)
console.log(`      候选总条数 ${totalCandidates}，因缺少品牌证据剔除 ${totalDroppedNoBrand}`)
