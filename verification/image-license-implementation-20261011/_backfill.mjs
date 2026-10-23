#!/usr/bin/env node
/**
 * 阶段 B-2 回填：把审计确认的 47 条授权信息写入 product_image_license
 * - 幂等：image_id 已有记录则跳过，不覆盖（冲突不静默覆盖）
 * - 只回填审计 JSON 中有真实证据的字段
 * - 用法：node verification/image-license-implementation-20261011/_backfill.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const ROOT = 'E:/第三学期/Geek Price Comparison'
const OUT = `${ROOT}/verification/image-license-implementation-20261011`
mkdirSync(OUT, { recursive: true })
const AUDIT = `${ROOT}/verification/image-license-audit-20261011`
const MYSQL = 'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe'

function runSql(sql, tag) {
  const s = `${OUT}/_${tag}.sql`, b = `${OUT}/_${tag}.bat`, o = `${OUT}/_${tag}.out`, e = `${OUT}/_${tag}.err`
  writeFileSync(s, sql, 'utf8')
  writeFileSync(b, `@echo off\r\n"${MYSQL}" -h 127.0.0.1 -u root -p123456 --default-character-set=utf8mb4 -N -B geek_price < "${s}" > "${o}" 2> "${e}"\r\nexit /b %ERRORLEVEL%\r\n`, 'utf8')
  let ok = true
  try { execFileSync('cmd.exe', ['/c', b], { stdio: 'inherit' }) } catch { ok = false }
  return { ok, out: existsSync(o) ? readFileSync(o, 'utf8') : '', err: existsSync(e) ? readFileSync(e, 'utf8') : '' }
}

const audit = JSON.parse(readFileSync(`${AUDIT}/existing-images-license-audit.json`, 'utf8'))
const commonsMeta = JSON.parse(readFileSync(`${AUDIT}/_raw/commons-meta.json`, 'utf8'))
const normKey = (t) => String(t ?? '').replace(/ /g, '_')
const metaByNorm = new Map(Object.entries(commonsMeta).map(([k, v]) => [normKey(k), v]))
function fileTitleFromUrl(url) {
  let u = String(url).split('?')[0]
  const m = u.match(/\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/(.+)$/)
  if (!m) return null
  const segs = m[1].split('/')
  let fn = segs.length > 1 ? segs[0] : segs[0]
  try { fn = decodeURIComponent(fn) } catch { }
  return 'File:' + fn
}

// 最终落库状态（核账结论）：REJECTED 覆盖一切；PENDING 保持待审；其余按许可维度
function finalStatus(r) {
  if (r.frontendEligibility === 'REJECTED') return 'REJECTED'
  if (r.auditStatus === 'PENDING_EVIDENCE') return 'PENDING_EVIDENCE'
  if (r.auditStatus === 'APPROVED') return 'APPROVED'
  return 'APPROVED_WITH_ATTRIBUTION'
}
const reviewedAt = String(audit.meta.generatedAt).replace('T', ' ').slice(0, 19)
const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")

const stmts = []
for (const r of audit.records) {
  const m = metaByNorm.get(normKey(fileTitleFromUrl(r.imageUrl)))
  const originalUrl = m?.originalUrl ?? null
  stmts.push(
    `INSERT INTO product_image_license` +
    `(image_id, source, source_page_url, original_url, license, license_url, author, attribution_text, modifications, match_type, audit_status, reviewer, reviewed_at)\n` +
    `SELECT ${r.imageId}, '${esc(r.source ?? 'wikimedia_commons')}', ${r.sourcePageUrl ? `'${esc(r.sourcePageUrl)}'` : 'NULL'}, ` +
    `${originalUrl ? `'${esc(originalUrl)}'` : 'NULL'}, ${r.license ? `'${esc(r.license)}'` : 'NULL'}, ` +
    `${r.licenseUrl ? `'${esc(r.licenseUrl)}'` : 'NULL'}, ${r.author ? `'${esc(r.author)}'` : 'NULL'}, ` +
    `${r.attributionText ? `'${esc(r.attributionText)}'` : 'NULL'}, ${r.modifications ? `'${esc(r.modifications)}'` : 'NULL'}, ` +
    `'${esc(r.imageMatchVerified)}', '${finalStatus(r)}', 'image-license-audit-20261011', '${reviewedAt}'\n` +
    `FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_image_license WHERE image_id = ${r.imageId});`
  )
}
console.log(`待回填 ${stmts.length} 条（幂等：已有记录跳过）`)
const res = runSql(['START TRANSACTION;', ...stmts, 'COMMIT;', "SELECT 'BACKFILL_COMMITTED';"].join('\n'), 'backfill')
const committed = /BACKFILL_COMMITTED/.test(res.out)
console.log(`事务：${res.ok ? 'OK' : 'FAILED'}  已提交：${committed}`)
if (res.err.trim()) console.log('stderr:', res.err.trim().split('\n').filter((l) => !/Warning/i.test(l)).slice(0, 3).join(' | '))

const tally = runSql('SELECT audit_status, COUNT(*) FROM product_image_license GROUP BY audit_status ORDER BY audit_status;', 'tally')
console.log('\n落库状态分布：')
tally.out.split(/\r?\n/).filter(Boolean).forEach((l) => console.log('  ' + l))
const total = runSql('SELECT COUNT(*) FROM product_image_license;', 'total').out.trim()
console.log('总记录数 =', total, total === '47' ? '✅' : '❌')
