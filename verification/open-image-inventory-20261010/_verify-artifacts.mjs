#!/usr/bin/env node
/** 核验：现有审核产物 ↔ 当前数据库一致性 + 图片 URL 存活抽查 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const ROOT = 'E:/第三学期/Geek Price Comparison'
const CACHE = `${ROOT}/verification/open-image-inventory-20261010/_ro`
mkdirSync(CACHE, { recursive: true })
const MYSQL = 'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe'

function q(sql, tag) {
  if (!/^\s*(select|show|describe|desc)\b/i.test(sql)) throw new Error('[只读保护] 非只读语句被拒绝')
  const s = `${CACHE}/${tag}.sql`, b = `${CACHE}/${tag}.bat`, o = `${CACHE}/${tag}.out`, e = `${CACHE}/${tag}.err`
  writeFileSync(s, sql, 'utf8')
  writeFileSync(b, `@echo off\r\n"${MYSQL}" -h 127.0.0.1 -u root -p123456 --default-character-set=utf8mb4 -N -B geek_price < "${s}" > "${o}" 2> "${e}"\r\n`, 'utf8')
  try { execFileSync('cmd.exe', ['/c', b], { stdio: 'inherit' }) } catch { }
  return existsSync(o) ? readFileSync(o, 'utf8') : ''
}
const rs = (sql, t) => q(sql, t).split(/\r?\n/).filter((l) => l.trim() !== '').map((l) => l.split('\t'))

console.log('=========== A. 历史产物存在性核验 ===========')
const FILES = [
  'verification/final-approved-product-images.json',
  'verification/final-approved-product-images.csv',
  'verification/final-image-import-result.md',
  'verification/db-product-image-verification.json',
  'verification/db-product-image-verification.csv',
  'verification/summary.md',
  'verification/db-product-image-summary.md',
  'verification/verify-db-product-images.mjs',
  'verification/lib/wikimedia.mjs',
  'verification/lib/matching.mjs',
  'verification/lib/scoring-selftest.mjs',
  'verification/verify-product-images.mjs',
  'verification/import-approved-images.mjs'
]
for (const f of FILES) console.log(`  ${existsSync(`${ROOT}/${f}`) ? '✅ 存在' : '❌ 缺失'}  ${f}`)
console.log('  ⚠️ 任务描述中的 verification/summary.md 不存在；实际对应文件是 db-product-image-summary.md')

console.log('\n=========== B. lib 工具清单 ===========')
const libDir = `${ROOT}/verification/lib`
if (existsSync(libDir)) {
  for (const f of readdirSync(libDir)) console.log(`  lib/${f}`)
}

console.log('\n=========== C. 现有审核产物 ↔ 数据库一致性 ===========')
const dbReal = new Set(rs(`SELECT DISTINCT product_id FROM product_images WHERE url NOT LIKE '%placehold.co%';`, 'c1').map(([p]) => Number(p)))
const dbAll = rs(`SELECT product_id, url FROM product_images WHERE url NOT LIKE '%placehold.co%';`, 'c2').map(([p, u]) => ({ pid: Number(p), url: u }))
console.log(`  数据库：有真实图商品 ${dbReal.size} 个，真实图记录 ${dbAll.length} 条`)

// final-image-import-result.md 中记录的 28 条（阶段二正式导入）
const imp = readFileSync(`${ROOT}/verification/final-image-import-result.md`, 'utf8')
const impIds = [...imp.matchAll(/^\|\s*\d+\s*\|\s*(\d+)\s*\|/gm)].map((m) => Number(m[1]))
console.log(`  final-image-import-result.md 记录的商品数 = ${impIds.length}`)
const impPresent = impIds.filter((id) => dbReal.has(id))
console.log(`  其中当前仍有真实图的 = ${impPresent.length} / ${impIds.length}`)
const impMissing = impIds.filter((id) => !dbReal.has(id))
if (impMissing.length) console.log(`  已不在库（可能被回滚）: ${impMissing.join(', ')}`)

// 阶段三/四产物
for (const f of ['image-candidates-phase2-approved.json', 'series-candidates-review.json']) {
  const p = `${ROOT}/verification/${f}`
  if (!existsSync(p)) continue
  const j = JSON.parse(readFileSync(p, 'utf8'))
  const n = (j.finalApproved ?? [...(j.exactMatch ?? []), ...(j.seriesMatch ?? [])]).length
  console.log(`  ${f}: 含候选记录 ${n} 条`)
}

console.log('\n=========== D. 图片 URL 存活抽查（全部 47 条真实图）===========')
const results = []
for (const { pid, url } of dbAll) {
  let code = 'ERR', size = 0
  try {
    const out = execFileSync('curl.exe', ['-s', '-o', 'NUL', '-w', '%{http_code}|%{size_download}', '-A', 'Mozilla/5.0 (GeekPriceAudit)', '-L', '--max-time', '25', url], { encoding: 'utf8' })
    const [c, s] = out.split('|'); code = c; size = Number(s)
  } catch { }
  results.push({ pid, url, code, size })
  await new Promise((r) => setTimeout(r, 350))
}
const okN = results.filter((r) => r.code === '200').length
console.log(`  可访问(200) = ${okN} / ${results.length}`)
const bad = results.filter((r) => r.code !== '200')
if (bad.length) { console.log('  ❌ 失效 URL：'); bad.forEach((b) => console.log(`     #${b.pid} [${b.code}] ${b.url.slice(0, 95)}`)) }
else console.log('  ✅ 全部可访问')

// 超大图（>2MB）预警
const big = results.filter((r) => r.size > 2 * 1024 * 1024).sort((a, b) => b.size - a.size)
console.log(`\n  体积 >2MB 的图（影响首屏） = ${big.length} 条`)
big.slice(0, 8).forEach((b) => console.log(`     #${b.pid} ${(b.size / 1024 / 1024).toFixed(1)} MB  ${b.url.slice(-60)}`))

writeFileSync(`${CACHE}/url-liveness.json`, JSON.stringify(results, null, 2))
console.log(`\n  明细已存: _ro/url-liveness.json`)
