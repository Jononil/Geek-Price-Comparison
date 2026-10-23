#!/usr/bin/env node
/** 图片 URL 存活复检：慢速 + 429 退避重试，区分「真失效」与「被限流」 */
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const ROOT = 'E:/第三学期/Geek Price Comparison'
const CACHE = `${ROOT}/verification/open-image-inventory-20261010/_ro`
const rows = JSON.parse(readFileSync(`${CACHE}/url-liveness.json`, 'utf8'))
const targets = rows.filter((r) => r.code !== '200')
console.log(`待复检 ${targets.length} 条（首次非 200）`)
console.log('先等待 120 秒让 Wikimedia 限流恢复...\n')
await new Promise((r) => setTimeout(r, 120000))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const final = []
for (const t of targets) {
  let code = 'ERR', size = 0, tries = 0
  for (let a = 0; a < 5; a++) {
    tries++
    try {
      const out = execFileSync('curl.exe', ['-s', '-o', 'NUL', '-w', '%{http_code}|%{size_download}',
        '-A', 'GeekPriceAudit/1.0 (graduation project; contact: student)',
        '-H', 'Accept: image/*', '-L', '--max-time', '30', t.url], { encoding: 'utf8' })
      const [c, s] = out.split('|'); code = c; size = Number(s)
      if (code === '200') break
      if (code === '429') { await sleep(20000); continue }
      break
    } catch { await sleep(5000) }
  }
  const ok = code === '200'
  final.push({ ...t, code, size, tries })
  console.log(`  ${ok ? '✅' : '❌'} #${String(t.pid).padEnd(4)} [${code}] ${ok ? (size / 1024).toFixed(0) + ' KB' : '重试 ' + tries + ' 次'}  ${t.url.split('/').pop().slice(0, 52)}`)
  await sleep(2500)
}

const stillBad = final.filter((f) => f.code !== '200')
console.log(`\n复检结论：原先非 200 的 ${targets.length} 条中，恢复正常 ${targets.length - stillBad.length} 条，仍失败 ${stillBad.length} 条`)
if (stillBad.length) stillBad.forEach((b) => console.log(`  ❌ #${b.pid} [${b.code}] ${b.url}`))

// 合并全量结果
const merged = rows.map((r) => {
  const f = final.find((x) => x.pid === r.pid && x.url === r.url)
  return f ? { ...r, code: f.code, size: f.size || r.size, rechecked: true } : r
})
writeFileSync(`${CACHE}/url-liveness-final.json`, JSON.stringify(merged, null, 2))
const okAll = merged.filter((r) => r.code === '200').length
console.log(`\n全量 47 条真实图最终可访问 = ${okAll} / ${merged.length}`)
