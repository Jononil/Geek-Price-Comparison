#!/usr/bin/env node
/**
 * 阶段 B-1 第一步（只读）：从数据库 + 阶段 A 产物提取 47 张真实图片清单
 * 并从 URL 解析出 Commons 文件名，为批量核验授权做准备。
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const ROOT = 'E:/第三学期/Geek Price Comparison'
const OUT = `${ROOT}/verification/image-license-audit-20261011`
mkdirSync(OUT, { recursive: true })
mkdirSync(`${OUT}/_raw`, { recursive: true })
const MYSQL = 'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe'

function q(sql, tag) {
  if (!/^\s*select\b/i.test(sql)) throw new Error('[只读保护] 非 SELECT 被拒绝')
  const s = `${OUT}/_raw/${tag}.sql`, b = `${OUT}/_raw/${tag}.bat`, o = `${OUT}/_raw/${tag}.out`, e = `${OUT}/_raw/${tag}.err`
  writeFileSync(s, sql, 'utf8')
  writeFileSync(b, `@echo off\r\n"${MYSQL}" -h 127.0.0.1 -u root -p123456 --default-character-set=utf8mb4 -N -B geek_price < "${s}" > "${o}" 2> "${e}"\r\n`, 'utf8')
  try { execFileSync('cmd.exe', ['/c', b], { stdio: 'inherit' }) } catch { }
  return existsSync(o) ? readFileSync(o, 'utf8') : ''
}
const rs = (sql, t) => q(sql, t).split(/\r?\n/).filter((l) => l.trim() !== '').map((l) => l.split('\t'))

// ---------- 1. 数据库：47 张真实图 ----------
const brands = new Map(rs('SELECT id, name FROM brands;', 'b').map(([i, n]) => [Number(i), n]))
const cats = new Map(rs('SELECT id, name FROM categories;', 'c').map(([i, n]) => [Number(i), n]))
const products = new Map(rs('SELECT id, name, brand_id, category_id FROM products WHERE deleted=0;', 'p')
  .map(([id, name, b, c]) => [Number(id), { name, brand: brands.get(Number(b)) ?? '', category: cats.get(Number(c)) ?? '' }]))
const images = rs('SELECT id, product_id, url, sort FROM product_images WHERE url NOT LIKE \'%placehold.co%\' ORDER BY product_id, sort;', 'i')
  .map(([id, pid, url, sort]) => ({ imageId: Number(id), productId: Number(pid), url, sort: Number(sort) }))
console.log(`数据库真实图记录 = ${images.length} 条，涉及商品 = ${new Set(images.map((x) => x.productId)).size} 个`)

// ---------- 2. 从 URL 解析 Commons 文件名 ----------
function commonsFileTitle(url) {
  let u = String(url).split('?')[0]
  const m = u.match(/\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/(.+)$/)
  if (!m) return null
  let fn = m[1]
  // thumb URL 形如 FileName/500px-FileName → 取第一段
  const segs = fn.split('/')
  fn = segs.length > 1 ? segs[0] : fn
  try { fn = decodeURIComponent(fn) } catch { }
  return 'File:' + fn
}
for (const im of images) {
  const p = products.get(im.productId) ?? {}
  im.productName = p.name ?? '(未知)'
  im.brand = p.brand ?? ''
  im.category = p.category ?? ''
  im.commonsFileTitle = commonsFileTitle(im.url)
  im.isThumb = /\/commons\/thumb\//.test(im.url)
}

// ---------- 3. 历史审核溯源（URL 级对应） ----------
// 47 张图来自 4 个导入批次：
//   批次1（试点）: 产品 65,67,89,95,97（round-2/3）
//   批次2（正式导入 28）: final-image-import-result.md
//   批次3（phase2 7 张 EXACT）: image-candidates-phase2-approved.json
//   批次4（phase4 6 SERIES + 1 EXACT）: series-candidates-review.json
const provenance = new Map()
// 批次 2：从导入结果 md 提取 product_id + 缩略图 URL
try {
  const imp = readFileSync(`${ROOT}/verification/final-image-import-result.md`, 'utf8')
  // 表格式：| # | product_id | 产品名 | 品牌 | 分类 | URL | source | 许可 | Commons页面 | imageId | 结果 |
  for (const m of imp.matchAll(/^\|\s*\d+\s*\|\s*(\d+)\s*\|[^|]*\|[^|]*\|[^|]*\|\s*(https:\/\/[^\s|]+)\s*\|[^|]*\|([^|]*)\|/gm)) {
    provenance.set(Number(m[1]), { batch: '批次2-正式导入(28)', url: m[2].trim(), licenseRecorded: (m[3] ?? '').trim() || undefined, matchType: 'HIGH(经8项复核)' })
  }
} catch (e) { console.log('⚠️ final-image-import-result.md 读取失败:', e.message) }
// 批次 3：phase2 JSON
try {
  const p2 = JSON.parse(readFileSync(`${ROOT}/verification/image-candidates-phase2-approved.json`, 'utf8'))
  for (const r of p2.finalApproved ?? []) provenance.set(r.productId, { batch: '批次3-phase2(7 EXACT)', url: r.importUrl ?? r.thumbnailUrl, matchType: 'EXACT_MATCH', licenseRecorded: r.license })
} catch (e) { console.log('⚠️ phase2 JSON 读取失败:', e.message) }
// 批次 4：series-candidates-review JSON
try {
  const s4 = JSON.parse(readFileSync(`${ROOT}/verification/series-candidates-review.json`, 'utf8'))
  for (const r of [...(s4.exactMatch ?? []), ...(s4.seriesMatch ?? [])]) {
    provenance.set(r.productId, { batch: '批次4-phase4(6 SERIES+1 EXACT)', url: r.best?.thumbnailUrl, matchType: r.best?.matchType, licenseRecorded: r.best?.license })
  }
} catch (e) { console.log('⚠️ series JSON 读取失败:', e.message) }
// 批次 1：试点（65,67,89,95,97）——来自早期 approved-product-images.json
try {
  const pilot = JSON.parse(readFileSync(`${ROOT}/verification/approved-product-images.json`, 'utf8'))
  for (const r of (pilot.approved ?? pilot).filter?.((x) => x) ?? []) {
    if (r.importedImageId) provenance.set(r.productId, { batch: '批次1-试点导入(5)', imageId: r.importedImageId, licenseRecorded: r.license })
  }
} catch (e) { console.log('⚠️ approved-product-images.json 结构异常（跳过，稍后按 URL 兜底）:', e.message) }

for (const im of images) {
  const pv = provenance.get(im.productId)
  // URL 级核验：只有历史记录中的 URL 与当前库中 URL 一致时才确认对应关系
  if (pv?.url) {
    const same = decodeURIComponent(pv.url).split('?')[0] === decodeURIComponent(im.url).split('?')[0]
    im.provenance = pv.batch
    im.provenanceUrlMatch = same ? 'URL一致' : 'URL不一致(需人工核对)'
    im.licenseRecordedHistorically = pv.licenseRecorded ?? null
    im.matchTypeHistorically = pv.matchType ?? null
  } else if (pv) {
    im.provenance = pv.batch
    im.provenanceUrlMatch = pv.imageId ? `历史记录imageId=${pv.imageId}${pv.imageId === im.imageId ? '(一致)' : '(不一致)'}` : '无URL记录'
    im.licenseRecordedHistorically = pv.licenseRecorded ?? null
    im.matchTypeHistorically = pv.matchType ?? null
  } else {
    im.provenance = '未知批次(需人工核对)'
    im.provenanceUrlMatch = '未找到历史记录'
  }
}

const provTally = {}
for (const im of images) provTally[im.provenance] = (provTally[im.provenance] ?? 0) + 1
console.log('溯源分布：', JSON.stringify(provTally, null, 1))
const urlMismatch = images.filter((x) => x.provenanceUrlMatch?.includes('不一致'))
console.log(urlMismatch.length ? `⚠️ URL 不一致 ${urlMismatch.length} 条: ${urlMismatch.map((x) => '#' + x.productId).join(', ')}` : '✅ 溯源 URL 全部一致')

// ---------- 4. 阶段 A 产物读取 ----------
const stageA = JSON.parse(readFileSync(`${ROOT}/verification/open-image-inventory-20261010/product-image-inventory.json`, 'utf8'))
const stageAMap = new Map(stageA.products.map((p) => [p.productId, p]))

// ---------- 5. 输出工作清单 ----------
for (const im of images) {
  const s = stageAMap.get(im.productId)
  im.stageAMainStatus = s?.mainStatus ?? '(不在阶段A)'
  im.stageANormalizedModel = s?.normalizedModel ?? null
}
writeFileSync(`${OUT}/_raw/images-worklist.json`, JSON.stringify(images, null, 2))
writeFileSync(`${OUT}/_raw/file-titles.json`, JSON.stringify(images.map((x) => ({ imageId: x.imageId, productId: x.productId, title: x.commonsFileTitle })), null, 2))
console.log(`\n工作清单已存 _raw/images-worklist.json（${images.length} 条）`)
console.log('Commons 文件名解析成功 =', images.filter((x) => x.commonsFileTitle).length, '/', images.length)
