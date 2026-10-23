#!/usr/bin/env node
/**
 * 第四阶段导入：把上一阶段已审核完成的 10 条 Wikimedia 候选写入 product_images
 * ============================================================================
 * 允许导入（10）：
 *   EXACT  : 122
 *   SERIES : 5, 8, 23, 45, 48, 83, 129, 130, 131
 * 明确不导入（规格冲突，5）：
 *   44（27B2H≠4K）、96（缺 Super）、114（4TB≠2TB）、123（4GB≠32GB）、125（1GB SDRAM≠32GB）
 *
 * 约束：只写 product_images；不改结构；不覆盖/删除已有；不重复 URL；每产品最多 1 张。
 * 事务：START TRANSACTION → 10 条 INSERT → 事务内校验 → COMMIT；任一校验失败即中止回滚。
 *
 * 用法：node verification/import-phase4-approved.mjs [execute]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const CACHE = join(HERE, '.cache-p4')
mkdirSync(CACHE, { recursive: true })
const MODE = process.argv.includes('execute') ? 'execute' : 'dry-run'

const OK_EXACT = [122]
const OK_SERIES = [5, 8, 23, 45, 48, 83, 129, 130, 131]
const ALLOWED = [...OK_EXACT, ...OK_SERIES]
const FORBIDDEN = [44, 96, 114, 123, 125]

const DB = { host: '127.0.0.1', port: '3306', user: 'root', password: process.env.GEEKPRICE_DB_PASSWORD ?? '123456', name: 'geek_price' }
const MYSQL = ['C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe', 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe'].find((p) => existsSync(p)) ?? 'mysql'

function runSql(sql, tag) {
  const inF = join(CACHE, `${tag}.sql`), bat = join(CACHE, `${tag}.bat`), outF = join(CACHE, `${tag}.out`), errF = join(CACHE, `${tag}.err`)
  writeFileSync(inF, sql, 'utf8')
  writeFileSync(bat, `@echo off\r\n"${MYSQL}" -h ${DB.host} -P ${DB.port} -u ${DB.user} -p${DB.password} --default-character-set=utf8mb4 -N -B "${DB.name}" < "${inF}" > "${outF}" 2> "${errF}"\r\nexit /b %ERRORLEVEL%\r\n`, 'utf8')
  let ok = true
  try { execFileSync('cmd.exe', ['/c', bat], { stdio: 'inherit' }) } catch { ok = false }
  return { ok, out: existsSync(outF) ? readFileSync(outF, 'utf8') : '', err: existsSync(errF) ? readFileSync(errF, 'utf8') : '' }
}
const one = (sql, tag) => Number(runSql(sql, tag).out.trim().split(/\r?\n/)[0])
const rows = (sql, tag, cols) => runSql(sql, tag).out.split(/\r?\n/).filter((l) => l.trim() !== '').map((l) => l.split('\t')).filter((f) => f.length === cols)

// ---------- 1) 组装 ----------
console.log('========== 第四阶段导入：写库前检查 ==========')
const review = JSON.parse(readFileSync(join(HERE, 'series-candidates-review.json'), 'utf8'))
const pool = [...review.exactMatch, ...review.seriesMatch]
const items = ALLOWED.map((id) => {
  const r = pool.find((x) => x.productId === id)
  if (!r) throw new Error(`找不到 #${id}`)
  return {
    productId: id,
    productName: r.productName,
    url: r.best.thumbnailUrl,
    title: r.best.title,
    license: r.best.license,
    matchType: OK_EXACT.includes(id) ? 'EXACT_MATCH' : 'SERIES_MATCH'
  }
}).sort((a, b) => a.productId - b.productId)

const checks = []
const add = (n, pass, d) => { checks.push({ n, pass, d }); console.log(`  ${pass ? '✅' : '❌'} ${n}${d ? ' — ' + d : ''}`) }

add('① 恰好 10 条且 product_id 为 5/8/23/45/48/83/122/129/130/131',
  items.length === 10 && ALLOWED.every((id) => items.some((x) => x.productId === id)),
  `实际 ${items.length}：${items.map((x) => x.productId).join(',')}`)

const nonThumb = items.filter((x) => !(/^https:\/\/thumb\.wikimedia\.org\//.test(x.url) && /\/500px-/.test(x.url)))
add('② 全部为 500px 缩略图 URL', nonThumb.length === 0, nonThumb.length ? JSON.stringify(nonThumb.map((x) => x.productId)) : '10/10')

const leaked = items.filter((x) => FORBIDDEN.includes(x.productId))
add('③ 不含规格冲突的 5 条（44/96/114/123/125）', leaked.length === 0, `已排除 ${FORBIDDEN.join('/')}`)

const dupSet = items.length !== new Set(items.map((x) => x.url)).size || items.length !== new Set(items.map((x) => x.productId)).size
add('④ 集合内 product_id / URL 无重复', !dupSet, dupSet ? '存在重复' : '每产品各 1 张')

// ---------- 2) 数据库现状 ----------
const beforeProducts = one('SELECT COUNT(*) FROM products;', 'c1')
const beforeImages = one('SELECT COUNT(*) FROM product_images;', 'c2')
const beforeReal = one("SELECT COUNT(*) FROM product_images WHERE url NOT LIKE '%placehold.co%';", 'c3')
const beforeTables = one(`SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB.name}';`, 'c4')
console.log(`\n  数据库现状：products=${beforeProducts}，product_images=${beforeImages}，真实图=${beforeReal}，表=${beforeTables}`)

const cols = rows(`SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema='${DB.name}' AND table_name='product_images' ORDER BY ordinal_position;`, 'c5', 1).map(([c]) => c)
add('⑤ product_images 结构未改（id,product_id,url,sort）', JSON.stringify(cols) === JSON.stringify(['id', 'product_id', 'url', 'sort']), cols.join(','))
add('⑥ 导入前基线符合预期（132/172/40）', beforeProducts === 132 && beforeImages === 172 && beforeReal === 40, `${beforeProducts}/${beforeImages}/${beforeReal}`)

const prods = rows(`SELECT id, name, deleted FROM products WHERE id IN (${ALLOWED.join(',')});`, 'c6', 3)
add('⑦ 10 个 product_id 均存在且 deleted=0', prods.length === 10 && prods.every(([, , d]) => Number(d) === 0), prods.length === 10 ? '10/10 未删除' : `仅 ${prods.length}`)

const existingUrls = new Set(rows('SELECT url FROM product_images;', 'c7', 1).map(([u]) => u))
const stemOf = (u) => { try { return decodeURIComponent(String(u).split('?')[0].split('/').pop() ?? '') } catch { return String(u).split('?')[0].split('/').pop() ?? '' } }
const existingStems = new Set([...existingUrls].map(stemOf))
const dup = items.filter((x) => existingUrls.has(x.url) || existingStems.has(stemOf(x.url)))
add('⑧ 10 条 URL 均不在库中（含文件名主干比对）', dup.length === 0, dup.length ? JSON.stringify(dup.map((x) => x.productId)) : '无重复')

// 每产品最多 1 张：确认这些产品当前没有真实图
const hasReal = new Set(rows(`SELECT DISTINCT product_id FROM product_images WHERE url NOT LIKE '%placehold.co%' AND product_id IN (${ALLOWED.join(',')});`, 'c8', 1).map(([p]) => Number(p)))
add('⑨ 10 个产品当前均无真实图（每产品最多新增 1 张）', hasReal.size === 0, hasReal.size ? JSON.stringify([...hasReal]) : '均为占位图')

const maxSort = new Map(rows(`SELECT product_id, MAX(sort) FROM product_images WHERE product_id IN (${ALLOWED.join(',')}) GROUP BY product_id;`, 'c9', 2).map(([p, s]) => [Number(p), Number(s)]))
for (const x of items) x.sort = (maxSort.get(x.productId) ?? -1) + 1
add('⑩ 每条 sort 接在现有最大值之后', items.every((x) => Number.isInteger(x.sort) && x.sort >= 0), items.map((x) => `#${x.productId}:${x.sort}`).join(' '))

// ---------- 3) SQL ----------
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
const inserts = items.map((x) =>
  `INSERT INTO product_images(product_id, url, sort) SELECT ${x.productId}, '${esc(x.url)}', ${x.sort} FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id=${x.productId} AND url='${esc(x.url)}');`)

// 事务内守卫：条件为真→0；为假→运行时 ERROR 1242 中止批次（不能用"引用不存在表"，那会在解析期就失败）
const G = (cond) => `SELECT CASE WHEN (${cond}) THEN 0 ELSE (SELECT 1 UNION ALL SELECT 2) END;`
const guards = [
  G(`(SELECT COUNT(*) FROM product_images)=${beforeImages + items.length}`),
  G(`(SELECT COUNT(*) FROM products)=${beforeProducts}`),
  G(`(SELECT COUNT(*) FROM product_images WHERE url NOT LIKE '%placehold.co%')=${beforeReal + items.length}`),
  G(`(SELECT COUNT(*) FROM (SELECT url FROM product_images GROUP BY url HAVING COUNT(*)>1) t)=0`),
  G(`(SELECT COUNT(*) FROM product_images WHERE product_id IN (${ALLOWED.join(',')}) AND url LIKE '%thumb.wikimedia.org%')=${items.length}`),
  G(`(SELECT COUNT(*) FROM product_images WHERE product_id IN (${FORBIDDEN.join(',')}) AND url LIKE '%thumb.wikimedia.org%')=0`),
  G(`(SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB.name}')=${beforeTables}`)
]

console.log('\n  ---------- 计划执行的 SQL ----------')
console.log('  START TRANSACTION;')
for (const i of inserts) console.log('  ' + i.slice(0, 118) + ' …')
console.log(`  [事务内守卫 ${guards.length} 项]`)
console.log('  COMMIT;')

const allPass = checks.every((c) => c.pass)
console.log(`\n  检查结论：${allPass ? '全部通过' : '存在失败项 → 不写入'}`)
if (!allPass) { console.log('  [ROLLBACK] 未执行任何写入。'); process.exit(1) }
if (MODE !== 'execute') { console.log('\n  [DRY-RUN] 未写入。加 execute 才执行。'); process.exit(0) }

// ---------- 4) 执行 ----------
console.log('\n  [EXECUTE] 执行事务（10 条 INSERT → 校验 → COMMIT）...')
const res = runSql(['START TRANSACTION;', ...inserts, '-- 事务内校验', ...guards, 'COMMIT;', "SELECT 'IMPORT_COMMITTED';"].join('\n'), 'exec')
const committed = /IMPORT_COMMITTED/.test(res.out)
console.log(`  事务批次：${res.ok ? 'OK' : 'FAILED（已中止）'}  已提交：${committed}`)
if (res.err.trim()) console.log('  stderr: ' + res.err.trim().split('\n').filter((l) => !/Warning/i.test(l)).slice(0, 3).join(' | '))

// ---------- 5) 独立验证 ----------
const afterProducts = one('SELECT COUNT(*) FROM products;', 'v1')
const afterImages = one('SELECT COUNT(*) FROM product_images;', 'v2')
const afterReal = one("SELECT COUNT(*) FROM product_images WHERE url NOT LIKE '%placehold.co%';", 'v3')
const afterTables = one(`SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB.name}';`, 'v4')
const insertedCount = afterImages - beforeImages

const thumbRows = rows(`SELECT product_id, id, url, sort FROM product_images WHERE product_id IN (${ALLOWED.join(',')}) AND url LIKE '%thumb.wikimedia.org%' ORDER BY product_id;`, 'v5', 4)
const forbiddenAdded = rows(`SELECT product_id, id, url FROM product_images WHERE product_id IN (${FORBIDDEN.join(',')}) AND url LIKE '%thumb.wikimedia.org%';`, 'v6', 3)
const dupRows = rows('SELECT url, COUNT(*) c FROM product_images GROUP BY url HAVING c>1;', 'v7', 2)
const afterRows = rows('SELECT id, product_id, url, sort FROM product_images ORDER BY id;', 'v8', 4)
const beforeSnap = readFileSync(join(CACHE, 'before.tsv'), 'utf8').split(/\r?\n/).filter((l) => l.trim() !== '').map((l) => l.split('\t')).filter((f) => f.length === 4)

const line = ([id, p, u, s]) => `${Number(id)}\t${Number(p)}\t${u}\t${Number(s)}`
const afterById = new Map(afterRows.map((r) => [Number(r[0]), line(r)]))
const beforeById = new Map(beforeSnap.map((r) => [Number(r[0]), line(r)]))
const modified = [...beforeById.entries()].filter(([id, l]) => afterById.get(id) !== l)
const deleted = [...beforeById.keys()].filter((id) => !afterById.has(id))
const added = [...afterById.keys()].filter((id) => !beforeById.has(id))
const thumbByPid = new Map(thumbRows.map(([p, id, u, s]) => [Number(p), { id: Number(id), url: u, sort: Number(s) }]))

const verify = [
  ['products 数量仍为 132', afterProducts === 132, `${afterProducts}`],
  ['product_images = 182（172+10）', afterImages === 182, `${afterImages}`],
  ['真实图片 = 50（40+10）', afterReal === 50, `${afterReal}`],
  ['本轮新增 = 10', insertedCount === 10, `${insertedCount}`],
  ['10 个 product_id 全部存在缩略图', ALLOWED.every((id) => thumbByPid.has(id)), `${thumbRows.length}/10`],
  ['重复 URL = 0', dupRows.length === 0, `${dupRows.length}`],
  ['冲突项 44/96/114/123/125 未新增', forbiddenAdded.length === 0, forbiddenAdded.length ? JSON.stringify(forbiddenAdded.map((r) => r[0])) : '无'],
  ['原有 172 条未被删除', deleted.length === 0, deleted.length ? JSON.stringify(deleted) : '无'],
  ['原有 172 条未被修改', modified.length === 0, modified.length ? JSON.stringify(modified.map(([id]) => id)) : '无'],
  ['新增行数 = 10', added.length === 10, `${added.length}`],
  ['schema 表数量仍为 25', afterTables === 25, `${afterTables}`]
]
console.log('\n========== 导入后独立验证 ==========')
for (const [n, pass, d] of verify) console.log(`  ${pass ? '✅' : '❌'} ${n} — ${d}`)

const ok = committed && verify.every(([, p]) => p) && insertedCount === 10 && afterImages === 182
console.log(`\n  IMPORT_STATUS = ${ok ? 'SUCCESS' : 'FAILED'}`)
writeFileSync(join(CACHE, 'result.json'), JSON.stringify({ ok, beforeImages, afterImages, insertedCount, afterReal, items, thumbByPid: Object.fromEntries(thumbByPid), verify }, null, 2))
process.exit(ok ? 0 : 1)
