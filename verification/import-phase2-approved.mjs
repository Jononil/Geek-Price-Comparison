#!/usr/bin/env node
/**
 * 第二阶段正式导入：image-candidates-phase2-approved.json 中的 7 条 FINAL_APPROVED
 * ============================================================================
 * - 只导入 product_id 13、76、80、81、85、91、107
 * - 只使用 500px 缩略图 importUrl，禁止原图
 * - 只写 product_images；不改结构、不改其它业务数据
 * - 每条 INSERT 带 NOT EXISTS 幂等守卫
 * - 单个事务：START TRANSACTION → 7 条 INSERT → 事务内校验 → COMMIT
 * - 任一关键校验失败：批次中止（不执行 COMMIT），连接关闭自动 ROLLBACK
 *
 * 用法：node verification/import-phase2-approved.mjs [execute]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const CACHE = join(HERE, '.cache-p2')
mkdirSync(CACHE, { recursive: true })
const MODE = process.argv.includes('execute') ? 'execute' : 'dry-run'

const APPROVED = JSON.parse(readFileSync(join(HERE, 'image-candidates-phase2-approved.json'), 'utf8'))
const ALLOWED_IDS = [13, 76, 80, 81, 85, 91, 107]
const FORBIDDEN_IDS = [8, 50, 64, 82, 101, 122]

const DB = {
  host: process.env.GEEKPRICE_DB_HOST ?? '127.0.0.1',
  port: process.env.GEEKPRICE_DB_PORT ?? '3306',
  user: process.env.GEEKPRICE_DB_USER ?? 'root',
  password: process.env.GEEKPRICE_DB_PASSWORD ?? '123456',
  name: process.env.GEEKPRICE_DB_NAME ?? 'geek_price'
}
const MYSQL = ['C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe',
  'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe'].find((p) => existsSync(p)) ?? 'mysql'

function runSql(sql, tag) {
  const inF = join(CACHE, `${tag}.sql`), bat = join(CACHE, `${tag}.bat`)
  const outF = join(CACHE, `${tag}.out`), errF = join(CACHE, `${tag}.err`)
  writeFileSync(inF, sql, 'utf8')
  writeFileSync(bat, `@echo off\r\n"${MYSQL}" -h ${DB.host} -P ${DB.port} -u ${DB.user} -p${DB.password} --default-character-set=utf8mb4 -N -B "${DB.name}" < "${inF}" > "${outF}" 2> "${errF}"\r\nexit /b %ERRORLEVEL%\r\n`, 'utf8')
  let ok = true
  try { execFileSync('cmd.exe', ['/c', bat], { stdio: 'inherit' }) } catch { ok = false }
  const out = existsSync(outF) ? readFileSync(outF, 'utf8') : ''
  const err = existsSync(errF) ? readFileSync(errF, 'utf8') : ''
  return { ok, out, err }
}
function select(sql, tag) {
  if (!/^\s*select\b/i.test(sql)) throw new Error('[只读保护] 非 SELECT 被拒绝')
  return runSql(sql, tag).out
}
const parseTsv = (raw, cols) => raw.split(/\r?\n/).filter((l) => l.trim() !== '')
  .map((l) => l.split('\t')).filter((f) => f.length === cols)
const one = (sql, tag) => Number(parseTsv(select(sql, tag), 1)[0][0])

// ============================================================
// 1) 组装导入集合（只取 FINAL_APPROVED 中的 7 条）
// ============================================================
console.log('========== 第二阶段导入：写库前检查 ==========')
const approved = APPROVED.finalApproved.filter((x) => ALLOWED_IDS.includes(x.productId))
const rows = approved.map((x) => ({
  productId: x.productId,
  productName: x.productName,
  url: x.importUrl,
  originalUrl: x.originalUrl,
  license: x.license,
  commonsPage: x.commonsPage
}))
rows.sort((a, b) => a.productId - b.productId)

const checks = []
const add = (name, pass, detail) => { checks.push({ name, pass, detail }); console.log(`  ${pass ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`) }

// ---- 静态检查 ----
const missingIds = ALLOWED_IDS.filter((id) => !rows.some((r) => r.productId === id))
add('① 恰好 7 条且 product_id 为 13/76/80/81/85/91/107', rows.length === 7 && missingIds.length === 0, `实际 ${rows.length} 条${missingIds.length ? '，缺 ' + missingIds : ''}`)

const nonThumb = rows.filter((r) => !(/^https:\/\/thumb\.wikimedia\.org\//.test(r.url) && /\/500px-/.test(r.url)))
add('② 全部使用 500px 缩略图 importUrl（非原图）', nonThumb.length === 0, nonThumb.length ? JSON.stringify(nonThumb.map((r) => r.productId)) : '7/7 为 thumb.wikimedia.org/.../500px-')

const sameAsOrig = rows.filter((r) => r.url === r.originalUrl)
add('③ 导入 URL 均不等于原始超大图 URL', sameAsOrig.length === 0, sameAsOrig.length ? JSON.stringify(sameAsOrig.map((r) => r.productId)) : '全部为缩略图版本')

const leaked = rows.filter((r) => FORBIDDEN_IDS.includes(r.productId))
add('④ 不含 FINAL_REJECTED / HOLD_LOW 的 product_id', leaked.length === 0, leaked.length ? JSON.stringify(leaked.map((r) => r.productId)) : `已排除 ${FORBIDDEN_IDS.join('/')}`)

const dupInSet = rows.length !== new Set(rows.map((r) => r.url)).size || rows.length !== new Set(rows.map((r) => r.productId)).size
add('⑤ 集合内 product_id / URL 无重复', !dupInSet, dupInSet ? '存在重复' : '每条产品各 1 张')

const badUrl = rows.filter((r) => !r.url || !/^https?:\/\//.test(r.url))
add('⑥ URL 非空且为 http(s)', badUrl.length === 0, badUrl.length ? JSON.stringify(badUrl.map((r) => r.productId)) : '全部合法')

// ---- 数据库检查（只读）----
const beforeProducts = one(`SELECT COUNT(*) FROM products;`, 'c_prod')
const beforeImages = one(`SELECT COUNT(*) FROM product_images;`, 'c_img')
const beforeReal = one(`SELECT COUNT(*) FROM product_images WHERE url NOT LIKE '%placehold.co%';`, 'c_real')
const beforeTables = one(`SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB.name}';`, 'c_tab')
console.log(`\n  数据库现状：products=${beforeProducts}，product_images=${beforeImages}，真实图=${beforeReal}，表=${beforeTables}`)

const cols = parseTsv(select(`SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema='${DB.name}' AND table_name='product_images' ORDER BY ordinal_position;`, 'c_cols'), 1).map(([c]) => c)
add('⑦ product_images 结构未改（id,product_id,url,sort）', JSON.stringify(cols) === JSON.stringify(['id', 'product_id', 'url', 'sort']), cols.join(','))
add('⑧ 导入前基线符合预期（132/165/33）', beforeProducts === 132 && beforeImages === 165 && beforeReal === 33, `${beforeProducts}/${beforeImages}/${beforeReal}`)

const prodRows = parseTsv(select(`SELECT id, name, deleted FROM products WHERE id IN (${ALLOWED_IDS.join(',')});`, 'c_p'), 3)
const prodMap = new Map(prodRows.map(([id, n, d]) => [Number(id), { name: n, deleted: Number(d) }]))
add('⑨ 7 个 product_id 均存在且 deleted=0', prodRows.length === 7 && prodRows.every(([, , d]) => Number(d) === 0), prodRows.length === 7 ? '7/7 未删除' : `仅找到 ${prodRows.length}`)

const existingUrls = new Set(parseTsv(select(`SELECT url FROM product_images;`, 'c_urls'), 1).map(([u]) => u))
const alreadyThere = rows.filter((r) => existingUrls.has(r.url))
add('⑩ 7 条 URL 当前均不在库中', alreadyThere.length === 0, alreadyThere.length ? JSON.stringify(alreadyThere.map((r) => r.productId)) : '无重复 URL')

// 排序：接在现有最大 sort 之后
const sortRows = parseTsv(select(`SELECT product_id, MAX(sort) FROM product_images WHERE product_id IN (${ALLOWED_IDS.join(',')}) GROUP BY product_id;`, 'c_sort'), 2)
const maxSort = new Map(sortRows.map(([p, s]) => [Number(p), Number(s)]))
for (const r of rows) r.sort = (maxSort.get(r.productId) ?? -1) + 1
add('⑪ 每条 sort 接在现有最大值之后', rows.every((r) => Number.isInteger(r.sort) && r.sort >= 0), rows.map((r) => `#${r.productId}:sort=${r.sort}`).join(' '))

// ---- SQL 生成 ----
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
const inserts = rows.map((r) =>
  `INSERT INTO product_images(product_id, url, sort) SELECT ${r.productId}, '${esc(r.url)}', ${r.sort} FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id=${r.productId} AND url='${esc(r.url)}');`)

// 事务内校验：任一失败则引用不存在的表使批次报错中止 → 不会执行 COMMIT → 自动回滚
const guard = (cond, sentinel) => `SELECT CASE WHEN (${cond}) THEN 0 ELSE (SELECT 1 FROM \`${sentinel}\`) END;`
const EXPECT_IMAGES = beforeImages + rows.length
const EXPECT_REAL = beforeReal + rows.length
// 事务内守卫：条件为真 → 返回 0；条件为假 → 运行时抛 ERROR 1242（子查询返回多行）中止批次。
// 不能用「引用不存在的表」的方式：MySQL 在解析期就校验表名，即使条件为真也会失败。
const G = (cond) => `SELECT CASE WHEN (${cond}) THEN 0 ELSE (SELECT 1 UNION ALL SELECT 2) END;`
const guards = []
guards.push(G(`(SELECT COUNT(*) FROM product_images)=${EXPECT_IMAGES}`))
guards.push(G(`(SELECT COUNT(*) FROM products)=${beforeProducts}`))
guards.push(G(`(SELECT COUNT(*) FROM product_images WHERE url NOT LIKE '%placehold.co%')=${EXPECT_REAL}`))
guards.push(G(`(SELECT COUNT(*) FROM (SELECT url FROM product_images GROUP BY url HAVING COUNT(*)>1) t)=0`))
guards.push(G(`(SELECT COUNT(*) FROM product_images WHERE product_id IN (${ALLOWED_IDS.join(',')}) AND url LIKE '%thumb.wikimedia.org%')=${rows.length}`))
guards.push(G(`(SELECT COUNT(*) FROM product_images WHERE product_id IN (${FORBIDDEN_IDS.join(',')}) AND url LIKE '%thumb.wikimedia.org%')=0`))
guards.push(G(`(SELECT COUNT(*) FROM product_images WHERE url NOT LIKE '%thumb.wikimedia.org%')=${beforeImages}`))
guards.push(G(`(SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB.name}')=${beforeTables}`))

const sqlAll = [
  'START TRANSACTION;',
  ...inserts,
  '-- 事务内校验（任一失败将中止批次，COMMIT 不执行 → 自动回滚）',
  ...guards,
  'COMMIT;',
  "SELECT 'IMPORT_COMMITTED' AS result;"
].join('\n')

console.log('\n  ---------- 计划执行的 SQL ----------')
console.log('  START TRANSACTION;')
for (const i of inserts) console.log('  ' + i.slice(0, 150) + (i.length > 150 ? ' …' : ''))
console.log(`  [事务内校验 ${guards.length} 项]`)
console.log('  COMMIT;')

const allPass = checks.every((c) => c.pass)
console.log(`\n  检查结论：${allPass ? '全部通过' : '存在失败项 → 不执行写入'}`)

if (!allPass) {
  console.log('  [ROLLBACK] 未执行任何写入。')
  process.exit(1)
}
if (MODE !== 'execute') {
  console.log('\n  [DRY-RUN] 未写入。加 execute 才执行。')
  process.exit(0)
}

// ============================================================
// 2) 执行（单事务 + 事务内校验）
// ============================================================
console.log('\n  [EXECUTE] 执行事务（7 条 INSERT → 校验 → COMMIT）...')
const res = runSql(sqlAll, 'exec')
const committed = /IMPORT_COMMITTED/.test(res.out)
console.log(`  事务批次：${res.ok ? 'OK' : 'FAILED（已中止）'}  已提交：${committed}`)
if (res.err.trim()) console.log('  stderr: ' + res.err.trim().split('\n').slice(0, 3).join(' | '))

// ============================================================
// 3) 独立验证（新连接，只读）
// ============================================================
const afterProducts = one(`SELECT COUNT(*) FROM products;`, 'v_prod')
const afterImages = one(`SELECT COUNT(*) FROM product_images;`, 'v_img')
const afterReal = one(`SELECT COUNT(*) FROM product_images WHERE url NOT LIKE '%placehold.co%';`, 'v_real')
const afterTables = one(`SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB.name}';`, 'v_tab')
const insertedCount = afterImages - beforeImages

const thumbRows = parseTsv(select(`SELECT product_id, id, url, sort FROM product_images WHERE product_id IN (${ALLOWED_IDS.join(',')}) AND url LIKE '%thumb.wikimedia.org%' ORDER BY product_id;`, 'v_thumb'), 4)
const forbiddenAdded = parseTsv(select(`SELECT product_id, id, url FROM product_images WHERE product_id IN (${FORBIDDEN_IDS.join(',')}) AND url LIKE '%thumb.wikimedia.org%';`, 'v_forb'), 3)
const dupRows = parseTsv(select(`SELECT url, COUNT(*) c FROM product_images GROUP BY url HAVING c>1;`, 'v_dup'), 2)
const afterRows = parseTsv(select(`SELECT id, product_id, url, sort FROM product_images ORDER BY id;`, 'v_all'), 4)
const beforeSnapshot = parseTsv(readFileSync(join(CACHE, 'before.tsv'), 'utf8'), 4)

const afterById = new Map(afterRows.map(([id, p, u, s]) => [Number(id), `${Number(id)}\t${Number(p)}\t${u}\t${Number(s)}`]))
const beforeById = new Map(beforeSnapshot.map(([id, p, u, s]) => [Number(id), `${Number(id)}\t${Number(p)}\t${u}\t${Number(s)}`]))
const modified = [...beforeById.entries()].filter(([id, line]) => afterById.get(id) !== line)
const deleted = [...beforeById.keys()].filter((id) => !afterById.has(id))
const added = [...afterById.entries()].filter(([id]) => !beforeById.has(id))

const thumbByProduct = new Map(thumbRows.map(([p, id, u, s]) => [Number(p), { id: Number(id), url: u, sort: Number(s) }]))

const verify = [
  ['products 数量仍为 132', afterProducts === 132, `${afterProducts}`],
  ['product_images 总数为 172', afterImages === 172, `${afterImages}`],
  ['非 placehold.co 真实图片为 40', afterReal === 40, `${afterReal}`],
  ['本次新增为 7', insertedCount === 7, `${insertedCount}`],
  ['7 个 product_id 全部存在 Wikimedia 缩略图', ALLOWED_IDS.every((id) => thumbByProduct.has(id)), `${thumbRows.length}/7`],
  ['重复 URL = 0', dupRows.length === 0, `${dupRows.length}`],
  ['被拒/暂缓 product_id 未新增本轮图片', forbiddenAdded.length === 0, forbiddenAdded.length ? JSON.stringify(forbiddenAdded.map((r) => r[0])) : '无'],
  ['原有 165 条未被删除', deleted.length === 0, deleted.length ? JSON.stringify(deleted) : '无删除'],
  ['原有 165 条未被修改', modified.length === 0, modified.length ? JSON.stringify(modified.map(([id]) => id)) : '无修改'],
  ['新增行数 = 7', added.length === 7, `${added.length}`],
  ['schema 表数量仍为 25', afterTables === 25, `${afterTables}`]
]

console.log('\n========== 导入后独立验证 ==========')
for (const [name, pass, detail] of verify) console.log(`  ${pass ? '✅' : '❌'} ${name} — ${detail}`)

const ok = committed && verify.every(([, p]) => p) && insertedCount === 7 && afterImages === 172
console.log(`\n  IMPORT_STATUS = ${ok ? 'SUCCESS' : 'FAILED'}`)
console.log(`  BEFORE = ${beforeImages}`)
console.log(`  INSERTED = ${insertedCount}`)
console.log(`  AFTER = ${afterImages}`)
console.log(`  REAL_IMAGES = ${afterReal}`)
console.log(`  DUPLICATES = ${dupRows.length}`)

// ============================================================
// 4) 报告
// ============================================================
const md = []
md.push('# 第二阶段图片正式导入结果')
md.push('')
md.push(`> 执行时间：${new Date().toISOString()}`)
md.push(`> 来源：\`image-candidates-phase2-approved.json\` 中的 7 条 FINAL_APPROVED`)
md.push(`> 导入 URL：全部使用 Wikimedia **500px 缩略图**（未使用任何原始超大图）`)
md.push('')
md.push('## BEFORE')
md.push('')
md.push('| 指标 | 数值 |')
md.push('|---|---|')
md.push(`| products | ${beforeProducts} |`)
md.push(`| product_images | ${beforeImages} |`)
md.push(`| 非 placehold.co 真实图片 | ${beforeReal} |`)
md.push(`| schema 表数量 | ${beforeTables} |`)
md.push(`| 导入 URL 已在库中（应跳过） | 0 |`)
md.push('')
md.push('## INSERTED')
md.push('')
md.push(`**${insertedCount}** 条（预期 7）`)
md.push('')
md.push('## AFTER')
md.push('')
md.push('| 指标 | 预期 | 实际 | 结果 |')
md.push('|---|---|---|---|')
md.push(`| products | 132 | ${afterProducts} | ${afterProducts === 132 ? '✅' : '❌'} |`)
md.push(`| product_images | 172 | ${afterImages} | ${afterImages === 172 ? '✅' : '❌'} |`)
md.push(`| schema 表数量 | 25 | ${afterTables} | ${afterTables === 25 ? '✅' : '❌'} |`)
md.push(`| 原有 165 条被删除 | 0 | ${deleted.length} | ${deleted.length === 0 ? '✅' : '❌'} |`)
md.push(`| 原有 165 条被修改 | 0 | ${modified.length} | ${modified.length === 0 ? '✅' : '❌'} |`)
md.push('')
md.push('## REAL_IMAGES')
md.push('')
md.push(`**${afterReal}**（33 + 7 = 40，预期 40 ${afterReal === 40 ? '✅' : '❌'}）`)
md.push('')
md.push('## DUPLICATES')
md.push('')
md.push(dupRows.length === 0 ? '**0** —— `product_images` 中不存在重复 URL ✅' : `❌ 发现重复：${JSON.stringify(dupRows)}`)
md.push('')
md.push('## 7 个 product_id 导入结果')
md.push('')
md.push('| product_id | 产品 | 许可证 | imageId | sort | 导入 URL（500px 缩略图） | 结果 |')
md.push('|---|---|---|---|---|---|---|')
for (const r of rows) {
  const t = thumbByProduct.get(r.productId)
  md.push(`| ${r.productId} | ${r.productName} | ${r.license} | ${t?.id ?? '-'} | ${t?.sort ?? '-'} | ${r.url} | ${t ? '✅ 已导入' : '❌ 未找到'} |`)
}
md.push('')
md.push(`被拒/暂缓项确认未导入（8、50、64、82、101、122）：${forbiddenAdded.length === 0 ? '✅ 均未新增' : '❌ ' + JSON.stringify(forbiddenAdded)}`)
md.push('')
md.push('### 独立性检查明细')
md.push('')
md.push('| 检查项 | 结果 | 说明 |')
md.push('|---|---|---|')
for (const [name, pass, detail] of verify) md.push(`| ${name} | ${pass ? '✅' : '❌'} | ${detail} |`)
md.push('')
md.push('## 最终 IMPORT_STATUS')
md.push('')
md.push('```')
md.push(`IMPORT_STATUS = ${ok ? 'SUCCESS' : 'FAILED'}`)
md.push(`BEFORE = ${beforeImages}`)
md.push(`INSERTED = ${insertedCount}`)
md.push(`AFTER = ${afterImages}`)
md.push(`REAL_IMAGES = ${afterReal}`)
md.push(`DUPLICATES = ${dupRows.length}`)
md.push('```')
md.push('')
md.push('### 本轮未改动的内容')
md.push('')
md.push('- 未修改 `products` / `brands` / `categories` / `product_source` / 价格 / 评论 / 推荐算法')
md.push('- 未修改数据库结构（`product_images` 仍为 id/product_id/url/sort 四列）')
md.push('- 未修改 backend / frontend / admin；未重新搜索图片；未改动审核标准')
md.push('- 未导入 FINAL_REJECTED（101、122）与 HOLD_LOW（8、50、64、82）')
md.push('')
writeFileSync(join(HERE, 'image-import-phase2-result.md'), md.join('\n'))
console.log('\n  报告已生成：verification/image-import-phase2-result.md')
process.exit(ok ? 0 : 1)
