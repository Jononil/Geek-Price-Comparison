#!/usr/bin/env node
/**
 * 阶段 B-1 第三步：逐张授权审计 + 生成 CSV/JSON（只读审计，不写库）
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const OUT = 'E:/第三学期/Geek Price Comparison/verification/image-license-audit-20261011'
const worklist = JSON.parse(readFileSync(join(OUT, '_raw/images-worklist.json'), 'utf8'))
const meta = JSON.parse(readFileSync(join(OUT, '_raw/commons-meta.json'), 'utf8'))

// ---------- 隐患预检 ----------
console.log('=== 隐患预检（categories 中的标记）===')
let gfdl = 0, reviewNeeded = 0, flickr = 0
for (const m of Object.values(meta)) {
  if (/gfdl/i.test(m.categories ?? '')) { gfdl++; console.log('  ⚠️ GFDL:', m.title) }
  if (/license review needed/i.test(m.categories ?? '')) { reviewNeeded++; console.log('  ⚠️ License review needed:', m.title) }
  if (/flickr/i.test(m.categories ?? '')) { flickr++; console.log('  ℹ️ Flickr 来源:', m.title) }
}
console.log(`  GFDL=${gfdl} LicenseReviewNeeded=${reviewNeeded} Flickr=${flickr}`)

// ---------- 许可分类 ----------
function classifyLicense(shortName, licenseUrl, categories) {
  const s = String(shortName ?? '').trim()
  if (!s) return { cls: 'LICENSE_UNVERIFIED', version: null }
  if (/^cc0/i.test(s)) return { cls: 'CC0', version: s.match(/^cc0\s+([\d.]+)/i)?.[1] ?? null }
  if (/public domain|^pd\b|pd-self/i.test(s)) return { cls: 'PUBLIC_DOMAIN', version: null }
  if (/^cc by-sa/i.test(s)) return { cls: 'CC_BY_SA', version: s.match(/[\d.]+/)?.[0] ?? null }
  if (/^cc by(?!-)/i.test(s)) return { cls: 'CC_BY', version: s.match(/[\d.]+/)?.[0] ?? null }
  if (/by-nc|by-nd|nc-nd|fair|非商业/i.test(s)) return { cls: 'LICENSE_NOT_COMPATIBLE', version: null }
  return { cls: 'OTHER_OPEN_LICENSE', version: null, raw: s }
}

// 系列图商品（phase4 批次）：非精确型号
const SERIES_PRODUCTS = new Set([23, 48, 83, 129, 130, 131])
// 对比截图（试点批次早期导入，主体为对比图）：不符合现行商品图标准
const COMPARISON_PRODUCTS = new Set([95, 97])
// 键盘特写（型号正确但为局部特写）：保留但记录风险
const CLOSEUP_PRODUCTS = new Set([24])

// Commons API 返回的 title 用空格，URL 派生的用下划线 → 统一归一化后再查
const normKey = (t) => String(t ?? '').replace(/ /g, '_')
const metaByNorm = new Map(Object.entries(meta).map(([k, v]) => [normKey(k), v]))

const records = []
for (const w of worklist) {
  const m = metaByNorm.get(normKey(w.commonsFileTitle))
  if (!m || m.missing) {
    records.push({
      imageId: w.imageId, productId: w.productId, productName: w.productName, imageUrl: w.url,
      source: 'wikimedia_commons', sourcePageUrl: null, license: null, licenseUrl: null,
      author: null, attributionText: null, modifications: null,
      licenseVerified: false, sourceVerified: false, imageMatchVerified: 'UNKNOWN',
      frontendEligibility: 'PENDING_EVIDENCE', auditStatus: 'LICENSE_UNVERIFIED',
      riskNotes: 'Commons 元数据缺失，无法核验授权', provenance: w.provenance
    })
    continue
  }
  const { cls, version } = classifyLicense(m.licenseShortName, m.licenseUrl, m.categories)
  const sourcePageUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(w.commonsFileTitle).replace(/%3A/, ':')}`
  const licenseFull = cls === 'CC0' ? (version ? `CC0 ${version}` : 'CC0')
    : cls === 'CC_BY' ? `CC BY ${version ?? '?'}`
    : cls === 'CC_BY_SA' ? `CC BY-SA ${version ?? '?'}`
    : cls === 'PUBLIC_DOMAIN' ? 'Public Domain'
    : (m.licenseShortName || '(未知)')

  // 作者：剥离 HTML 后的 Artist 字段（可能含括号/链接残留，仅做轻度清理，不猜测）
  let author = (m.artist || '').replace(/\s*\(.*?\)\s*$/, '').trim()
  if (!author) author = ''

  // 改动说明
  const modifications = w.isThumb
    ? '经 Wikimedia 官方缩略图服务缩放为 500px 展示尺寸（内容未编辑）'
    : '无（原图直接引用，未编辑）'

  // 署名文本（仅按真实信息生成；缺失处标注待补）
  const attributionText = cls === 'CC0'
    ? `图片来自 Wikimedia Commons（${sourcePageUrl}），许可 CC0${version ? ' ' + version : ''}${author ? '，作者 ' + author : ''}。`
    : `图片来自 Wikimedia Commons，作者 ${author || '（作者字段缺失，待补）'}，许可 ${licenseFull}${m.licenseUrl ? `（${m.licenseUrl}）` : ''}，原始页面 ${sourcePageUrl}${w.isThumb ? '；展示图为官方缩放版本' : ''}。`

  // 历史匹配结论
  let matchVerified, matchNote = ''
  if (COMPARISON_PRODUCTS.has(w.productId)) {
    matchVerified = 'PARTIAL'
    matchNote = '对比视频截图，画面含多个型号，不符合现行商品图主体标准（试点批次导入于严格主体规则建立之前）'
  } else if (SERIES_PRODUCTS.has(w.productId)) {
    matchVerified = 'SERIES_LEVEL'
    matchNote = '系列级参考图（非精确型号），前端已显示「系列参考图」标识'
  } else if (w.provenance.startsWith('批次2') || w.provenance.startsWith('批次3')) {
    matchVerified = 'EXACT_MATCH'
  } else if (w.provenance.startsWith('批次4')) {
    matchVerified = 'EXACT_MATCH' // 批次4 中 #122 为 EXACT
  } else {
    matchVerified = 'EXACT_MATCH' // 批次1 试点 5 张经 round-2/3 人工审核
  }

  // 风险备注
  const risks = []
  if (/gfdl/i.test(m.categories ?? '')) risks.push('双许可含 GFDL（可在 CC 条款下选用，但需知悉）')
  if (/license review needed/i.test(m.categories ?? '')) risks.push('Commons 标记 License review needed（授权未复核）')
  if (/flickr/i.test(m.categories ?? '')) risks.push('源自 Flickr（Credit 字段保留原链接信息）')
  if (COMPARISON_PRODUCTS.has(w.productId)) risks.push(matchNote)
  if (SERIES_PRODUCTS.has(w.productId)) risks.push(matchNote)
  if (CLOSEUP_PRODUCTS.has(w.productId)) risks.push('键盘局部特写（型号正确，建议后续补整机图）')
  if ((m.size ?? 0) > 2 * 1024 * 1024) risks.push(`原图 ${(m.size / 1024 / 1024).toFixed(1)}MB，超 2MB，建议用缩略图`)
  if (w.isThumb && w.url.includes('utm_')) risks.push('URL 带 utm 跟踪参数，建议清理为纯路径')

  // 审核状态（许可维度）
  let auditStatus
  if (cls === 'LICENSE_NOT_COMPATIBLE' || /license review needed/i.test(m.categories ?? '')) auditStatus = 'PENDING_EVIDENCE'
  else if (cls === 'CC0' || cls === 'PUBLIC_DOMAIN') auditStatus = 'APPROVED'
  else if (cls === 'CC_BY' || cls === 'CC_BY_SA') auditStatus = 'APPROVED_WITH_ATTRIBUTION'
  else auditStatus = 'PENDING_EVIDENCE'

  // 前台展示资格（许可 + 主体 + 系统署名能力三重门）
  let frontendEligibility, eligReason
  if (COMPARISON_PRODUCTS.has(w.productId)) {
    frontendEligibility = 'REJECTED'; eligReason = '主体为对比截图（含多型号），建议阶段 B-2 换图'
  } else if (auditStatus === 'APPROVED') {
    frontendEligibility = 'APPROVED'; eligReason = 'CC0/公有领域，无署名义务，可立即展示'
  } else if (auditStatus === 'APPROVED_WITH_ATTRIBUTION') {
    frontendEligibility = 'PENDING_EVIDENCE'; eligReason = '许可允许使用但要求署名；当前系统无署名存储/展示能力，待署名功能上线后方可开放'
  } else {
    frontendEligibility = 'PENDING_EVIDENCE'; eligReason = '许可证据不完整或不适用'
  }

  records.push({
    imageId: w.imageId, productId: w.productId, productName: w.productName, brand: w.brand, category: w.category,
    imageUrl: w.url, isThumb: w.isThumb,
    source: 'wikimedia_commons', sourcePageUrl,
    license: licenseFull, licenseClass: cls, licenseUrl: m.licenseUrl || null,
    author, artistRaw: m.artist || '', creditRaw: m.credit || '',
    attributionText, modifications,
    licenseVerified: true, sourceVerified: true, imageMatchVerified: matchVerified,
    attributionRequiredByLicense: cls === 'CC_BY' || cls === 'CC_BY_SA',
    frontendEligibility, eligibilityReason: eligReason, auditStatus,
    riskNotes: risks.join('；') || '无明显风险',
    provenance: w.provenance, provenanceUrlMatch: w.provenanceUrlMatch,
    historicallyRecordedLicense: w.licenseRecordedHistorically ?? null,
    naturalSize: m.size ?? null, naturalWidth: m.width ?? null, naturalHeight: m.height ?? null
  })
}

// ---------- 统计（对账） ----------
const tally = (key) => records.reduce((a, r) => { a[r[key]] = (a[r[key]] ?? 0) + 1; return a }, {})
const licTally = tally('licenseClass')
const eligTally = tally('frontendEligibility')
const auditTally = tally('auditStatus')
const total = records.length
console.log(`\n总计 ${total} 条`)
console.log('许可分类：', JSON.stringify(licTally))
console.log('审核状态：', JSON.stringify(auditTally))
console.log('前台资格：', JSON.stringify(eligTally))
if (total !== 47) throw new Error('对账失败：不是 47 条')

// ---------- 输出 CSV ----------
const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
const cols = ['imageId', 'productId', 'productName', 'brand', 'category', 'imageUrl', 'source', 'sourcePageUrl', 'license', 'licenseUrl', 'author', 'attributionText', 'modifications', 'licenseVerified', 'sourceVerified', 'imageMatchVerified', 'frontendEligibility', 'auditStatus', 'eligibilityReason', 'riskNotes', 'provenance', 'isThumb', 'naturalSize']
const csv = [cols.join(',')]
for (const r of records) csv.push(cols.map((c) => esc(r[c])).join(','))
writeFileSync(join(OUT, 'existing-images-license-audit.csv'), '\uFEFF' + csv.join('\n') + '\n')

// ---------- 输出 JSON ----------
writeFileSync(join(OUT, 'existing-images-license-audit.json'), JSON.stringify({
  meta: {
    generatedAt: new Date().toISOString(),
    purpose: '阶段 B-1：47 张已存真实图片逐张授权审计（只读，未写库）',
    evidenceBasis: 'Wikimedia MediaWiki API extmetadata（LicenseShortName/LicenseUrl/Artist/Credit/Categories），授权一手证据',
    stats: { total, licenseClass: licTally, auditStatus: auditTally, frontendEligibility: eligTally }
  },
  records
}, null, 2))

console.log('\n已输出 existing-images-license-audit.csv / .json')
console.log('\n需暂缓展示（PENDING_EVIDENCE）的商品：')
records.filter((r) => r.frontendEligibility === 'PENDING_EVIDENCE').slice(0, 50).forEach((r) => console.log(`  #${r.productId} ${r.productName} — ${r.eligibilityReason.slice(0, 46)}`))
console.log('\nREJECTED：')
records.filter((r) => r.frontendEligibility === 'REJECTED').forEach((r) => console.log(`  #${r.productId} ${r.productName} — ${r.eligibilityReason}`))
console.log('\n可立即展示（APPROVED）：')
records.filter((r) => r.frontendEligibility === 'APPROVED').forEach((r) => console.log(`  #${r.productId} ${r.productName}（${r.license}）`))
