#!/usr/bin/env node
/**
 * 回滚本阶段新增的 3 张易误导图片（仅这 3 条）
 * 事务 + 逐条核验：只有 id、product_id、url、sort 全部匹配预期才删除。
 * 任何一条不匹配 → 中止，不删除任何记录。
 * 用法：node verification/rollback-3-images.mjs [execute]
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const CACHE = join(HERE, '.cache-rb')
mkdirSync(CACHE, { recursive: true })
const MODE = process.argv.includes('execute') ? 'execute' : 'dry-run'
const MYSQL = 'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe'

function run(sql, tag) {
  const s = join(CACHE, `${tag}.sql`), b = join(CACHE, `${tag}.bat`), o = join(CACHE, `${tag}.out`), e = join(CACHE, `${tag}.err`)
  writeFileSync(s, sql, 'utf8')
  writeFileSync(b, `@echo off\r\n"${MYSQL}" -h 127.0.0.1 -u root -p123456 --default-character-set=utf8mb4 -N -B geek_price < "${s}" > "${o}" 2> "${e}"\r\nexit /b %ERRORLEVEL%\r\n`, 'utf8')
  let ok = true
  try { execFileSync('cmd.exe', ['/c', b], { stdio: 'inherit' }) } catch { ok = false }
  return { ok, out: existsSync(o) ? readFileSync(o, 'utf8') : '', err: existsSync(e) ? readFileSync(e, 'utf8') : '' }
}
const one = (t) => Number(run('SELECT 1;', t) && 0) || 0
const num = (sql, t) => Number(run(sql, t).out.trim().split(/\r?\n/)[0])
const rs = (sql, t, c) => run(sql, t).out.split(/\r?\n/).filter((l) => l.trim()).map((l) => l.split('\t')).filter((f) => f.length === c)

// 预期记录（来自 import-phase4-approved.mjs 的本阶段导入：imageId 43065/43066/43068）
const EXPECT = [
  { id: 43065, pid: 5, sort: 1, mustUrlPart: 'Xiaomi_14_%28July_10%2C_2026%29.jpg' },
  { id: 43066, pid: 8, sort: 1, mustUrlPart: 'Vivo_X100_pic2.jpg' },
  { id: 43068, pid: 45, sort: 1, mustUrlPart: 'BENQ_MONITOR' }
]

console.log('========== 回滚 3 张图片：写库前核验 ==========')
const before = {
  products: num('SELECT COUNT(*) FROM products;', 'b1'),
  images: num('SELECT COUNT(*) FROM product_images;', 'b2'),
  real: num("SELECT COUNT(*) FROM product_images WHERE url NOT LIKE '%placehold.co%';", 'b3'),
  tables: num("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='geek_price';", 'b4')
}
console.log(`  现状：products=${before.products}，product_images=${before.images}，真实图=${before.real}，表=${before.tables}`)

const actual = rs(`SELECT id, product_id, sort, url FROM product_images WHERE id IN (43065,43066,43068) ORDER BY id;`, 'b5', 4)
let allMatch = actual.length === 3
console.log('\n  逐条核验：')
for (const e of EXPECT) {
  const a = actual.find((r) => Number(r[0]) === e.id)
  if (!a) { console.log(`  ❌ id=${e.id} 不存在`); allMatch = false; continue }
  const okPid = Number(a[1]) === e.pid
  const okSort = Number(a[2]) === e.sort
  const okUrl = String(a[3]).includes(e.mustUrlPart)
  const ok = okPid && okSort && okUrl
  if (!ok) allMatch = false
  console.log(`  ${ok ? '✅' : '❌'} id=${e.id} product_id=${a[1]}(期望${e.pid}) sort=${a[2]}(期望${e.sort}) url含「${e.mustUrlPart}」=${okUrl}`)
}

// 额外安全检查：确认这 3 条的 sort 都是 1，即确为本阶段追加，而非原有占位图
const anySortNot1 = actual.some((r) => Number(r[2]) !== 1)
if (anySortNot1) { console.log('  ❌ 存在 sort≠1 的记录，可能不是本阶段新增'); allMatch = false }

// 确认这 3 条所在产品同时还有占位图(sort=0)，说明删掉后仍保留占位图
const remaining = rs(`SELECT product_id, COUNT(*) FROM product_images WHERE product_id IN (5,8,45) AND id NOT IN (43065,43066,43068) GROUP BY product_id;`, 'b6', 2)
console.log(`\n  删除后这些产品剩余图片：${remaining.map(([p, c]) => `#${p}:${c}条`).join(' ')}（应各至少 1 条占位图）`)
if (remaining.length !== 3 || !remaining.every(([, c]) => Number(c) >= 1)) { console.log('  ❌ 产品将失去所有图片'); allMatch = false }

console.log(`\n  核验结论：${allMatch ? '全部匹配，可安全删除 3 条' : '存在不匹配 → 中止，不删除任何记录'}`)
if (!allMatch) process.exit(1)
if (MODE !== 'execute') { console.log('\n  [DRY-RUN] 未删除。加 execute 才执行。'); process.exit(0) }

// 事务执行：再次核验 + 删除（只删这 3 个 id）
console.log('\n  [EXECUTE] 事务执行删除...')
const G = (c) => `SELECT CASE WHEN (${c}) THEN 0 ELSE (SELECT 1 UNION ALL SELECT 2) END;`
const sql = [
  'START TRANSACTION;',
  `DELETE FROM product_images WHERE id=43065 AND product_id=5 AND sort=1;`,
  `DELETE FROM product_images WHERE id=43066 AND product_id=8 AND sort=1;`,
  `DELETE FROM product_images WHERE id=43068 AND product_id=45 AND sort=1;`,
  // 事务内守卫：必须恰好删掉 3 条，且其它一切不变
  G(`(SELECT COUNT(*) FROM product_images)=${before.images - 3}`),
  G(`(SELECT COUNT(*) FROM product_images WHERE id IN (43065,43066,43068))=0`),
  G(`(SELECT COUNT(*) FROM products)=${before.products}`),
  G(`(SELECT COUNT(*) FROM product_images WHERE url NOT LIKE '%placehold.co%')=${before.real - 3}`),
  G(`(SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='geek_price')=${before.tables}`),
  G(`(SELECT COUNT(*) FROM product_images WHERE product_id IN (5,8,45) AND url LIKE '%placehold.co%')=3`),
  'COMMIT;',
  "SELECT 'ROLLBACK_COMMITTED';"
].join('\n')
const res = run(sql, 'exec')
const committed = /ROLLBACK_COMMITTED/.test(res.out)
console.log(`  事务：${res.ok ? 'OK' : 'FAILED（已中止）'}  已提交：${committed}`)

// 独立验证
const after = {
  products: num('SELECT COUNT(*) FROM products;', 'v1'),
  images: num('SELECT COUNT(*) FROM product_images;', 'v2'),
  real: num("SELECT COUNT(*) FROM product_images WHERE url NOT LIKE '%placehold.co%';", 'v3'),
  tables: num("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='geek_price';", 'v4')
}
const gone = num('SELECT COUNT(*) FROM product_images WHERE id IN (43065,43066,43068);', 'v5')
console.log('\n========== 回滚后独立验证 ==========')
const V = [
  ['products = 132', after.products === 132, after.products],
  ['product_images = 179', after.images === 179, after.images],
  ['真实图片 = 47', after.real === 47, after.real],
  ['表数量 = 25', after.tables === 25, after.tables],
  ['3 条记录已删除', gone === 0, gone],
  ['保留的 6 张 SERIES + 1 张 EXACT 仍在', num("SELECT COUNT(*) FROM product_images WHERE url LIKE '%thumb.wikimedia%';", 'v6') === 14, num("SELECT COUNT(*) FROM product_images WHERE url LIKE '%thumb.wikimedia%';", 'v7')]
]
for (const [n, pass, a] of V) console.log(`  ${pass ? '✅' : '❌'} ${n} — 实际 ${a}`)
const ok = committed && V.every(([, p]) => p)
console.log(`\n  ROLLBACK_STATUS = ${ok ? 'SUCCESS' : 'FAILED'}`)
process.exit(ok ? 0 : 1)
