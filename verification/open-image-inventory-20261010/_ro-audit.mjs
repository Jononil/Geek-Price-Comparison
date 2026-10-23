#!/usr/bin/env node
/** 只读核查：数据库真实结构 + 当前商品/图片数据 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const ROOT = 'E:/第三学期/Geek Price Comparison'
const CACHE = `${ROOT}/verification/open-image-inventory-20261010/_ro`
mkdirSync(CACHE, { recursive: true })
const MYSQL = 'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe'

function q(sql, tag) {
  if (!/^\s*(select|show|describe|desc)\b/i.test(sql)) throw new Error('[只读保护] 非只读语句被拒绝: ' + sql.slice(0, 60))
  const s = `${CACHE}/${tag}.sql`, b = `${CACHE}/${tag}.bat`, o = `${CACHE}/${tag}.out`, e = `${CACHE}/${tag}.err`
  writeFileSync(s, sql, 'utf8')
  writeFileSync(b, `@echo off\r\n"${MYSQL}" -h 127.0.0.1 -u root -p123456 --default-character-set=utf8mb4 -N -B geek_price < "${s}" > "${o}" 2> "${e}"\r\n`, 'utf8')
  let ok = true
  try { execFileSync('cmd.exe', ['/c', b], { stdio: 'inherit' }) } catch { ok = false }
  return { ok, out: existsSync(o) ? readFileSync(o, 'utf8') : '', err: existsSync(e) ? readFileSync(e, 'utf8') : '' }
}
const rs = (sql, t) => q(sql, t).out.split(/\r?\n/).filter((l) => l.trim() !== '').map((l) => l.split('\t'))

console.log('=========== 1. 数据库表清单 ===========')
const tables = rs(`SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema='geek_price' ORDER BY table_name;`, 't1')
console.log(`表数量 = ${tables.length}`)
tables.forEach(([n, r]) => console.log(`  ${n}  (~${r} 行)`))

console.log('\n=========== 2. products 真实字段 ===========')
const pcols = rs(`SELECT column_name, column_type, is_nullable, column_key, column_default, extra FROM information_schema.columns WHERE table_schema='geek_price' AND table_name='products' ORDER BY ordinal_position;`, 't2')
pcols.forEach(([n, t, nu, k, d, e]) => console.log(`  ${n.padEnd(18)} ${t.padEnd(16)} null=${nu} key=${k} default=${d ?? ''} ${e}`))
console.log(`  → 是否存在 model 字段：${pcols.some(([n]) => n === 'model') ? '是' : '否（与任务描述一致）'}`)

console.log('\n=========== 3. product_images 真实字段 ===========')
const icols = rs(`SELECT column_name, column_type, is_nullable, column_key, column_default, extra FROM information_schema.columns WHERE table_schema='geek_price' AND table_name='product_images' ORDER BY ordinal_position;`, 't3')
icols.forEach(([n, t, nu, k, d, e]) => console.log(`  ${n.padEnd(18)} ${t.padEnd(16)} null=${nu} key=${k} default=${d ?? ''} ${e}`))
console.log(`  → 是否有 license/source/author/review 等字段：${icols.filter(([n]) => /licen|source|author|review|type|status/i.test(n)).map(([n]) => n).join(', ') || '无'}`)

console.log('\n=========== 4. 核心计数 ===========')
const c = rs(`SELECT (SELECT COUNT(*) FROM products WHERE deleted=0) AS prod_alive, (SELECT COUNT(*) FROM products) AS prod_all, (SELECT COUNT(*) FROM product_images) AS imgs, (SELECT COUNT(*) FROM product_images WHERE url NOT LIKE '%placehold.co%') AS real_imgs, (SELECT COUNT(DISTINCT product_id) FROM product_images WHERE url NOT LIKE '%placehold.co%') AS prod_with_real, (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='geek_price') AS tbls;`, 't4')[0]
console.log(`  products(deleted=0) = ${c[0]}   products(全部) = ${c[1]}`)
console.log(`  product_images = ${c[2]}   其中真实图 = ${c[3]}`)
console.log(`  有真实图的商品数 = ${c[4]}   表数量 = ${c[5]}`)

console.log('\n=========== 5. 图片 URL 分类 ===========')
const kinds = rs(`SELECT CASE
    WHEN url LIKE '%placehold.co%' THEN 'placeholder'
    WHEN url LIKE '%thumb.wikimedia%' THEN 'wikimedia_thumb'
    WHEN url LIKE '%upload.wikimedia%' THEN 'wikimedia_original'
    ELSE 'other' END AS kind, COUNT(*) FROM product_images GROUP BY kind ORDER BY 2 DESC;`, 't5')
kinds.forEach(([k, n]) => console.log(`  ${k.padEnd(22)} ${n}`))

console.log('\n=========== 6. 重复 URL 检查 ===========')
const dup = rs(`SELECT url, COUNT(*) c FROM product_images GROUP BY url HAVING c>1;`, 't6')
console.log(dup.length === 0 ? '  ✅ 无重复 URL' : dup.map(([u, n]) => `  ⚠️ ${n} 次: ${u.slice(0, 90)}`).join('\n'))

console.log('\n=========== 7. 分类分布 ===========')
const cats = rs(`SELECT COALESCE(c.name,'(无分类)') AS cat, COUNT(*) AS total,
  SUM(CASE WHEN EXISTS(SELECT 1 FROM product_images pi WHERE pi.product_id=p.id AND pi.url NOT LIKE '%placehold.co%') THEN 1 ELSE 0 END) AS with_real
  FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.deleted=0 GROUP BY c.name ORDER BY total DESC;`, 't7')
cats.forEach(([cat, total, real]) => console.log(`  ${String(cat).padEnd(10)} 总 ${String(total).padStart(3)}  有真实图 ${String(real).padStart(2)}  缺 ${String(Number(total) - Number(real)).padStart(3)}`))
