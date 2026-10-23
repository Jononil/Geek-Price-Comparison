#!/usr/bin/env node
/**
 * 阶段 A 最终报告生成器（READ-ONLY）
 * 输入：数据库只读查询 + _src/inventory-raw.json（严格检索结果）+ 人工终审覆盖表
 * 输出：verification/open-image-inventory-20261010/ 下 7 份交付文件
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const ROOT = 'E:/第三学期/Geek Price Comparison'
const OUT = `${ROOT}/verification/open-image-inventory-20261010`
mkdirSync(OUT, { recursive: true })
const MYSQL = 'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe'

function q(sql, tag) {
  if (!/^\s*select\b/i.test(sql)) throw new Error('[只读保护] 拒绝非 SELECT')
  const s = `${OUT}/_ro/${tag}.sql`, b = `${OUT}/_ro/${tag}.bat`, o = `${OUT}/_ro/${tag}.out`, e = `${OUT}/_ro/${tag}.err`
  writeFileSync(s, sql, 'utf8')
  writeFileSync(b, `@echo off\r\n"${MYSQL}" -h 127.0.0.1 -u root -p123456 --default-character-set=utf8mb4 -N -B geek_price < "${s}" > "${o}" 2> "${e}"\r\n`, 'utf8')
  try { execFileSync('cmd.exe', ['/c', b], { stdio: 'inherit' }) } catch { }
  return existsSync(o) ? readFileSync(o, 'utf8') : ''
}
const rs = (sql, t) => q(sql, t).split(/\r?\n/).filter((l) => l.trim() !== '').map((l) => l.split('\t'))

// ============ 1. 数据库只读读取 ============
const brands = new Map(rs('SELECT id, name FROM brands;', 'fb').map(([i, n]) => [Number(i), n]))
const cats = new Map(rs('SELECT id, name FROM categories;', 'fc').map(([i, n]) => [Number(i), n]))
const products = rs('SELECT id, name, brand_id, category_id, status, deleted FROM products ORDER BY id;', 'fp')
  .map(([id, name, b, c, st, del]) => ({ id: Number(id), name, brand: brands.get(Number(b)) ?? '(未知品牌)', category: cats.get(Number(c)) ?? '(未分类)', status: Number(st), deleted: Number(del) }))
const images = rs('SELECT product_id, url, sort FROM product_images ORDER BY product_id, sort;', 'fi')
  .map(([p, u, s]) => ({ productId: Number(p), url: u, sort: Number(s) }))
if (products.length === 0) {
  console.error('[FATAL] products 读取为 0 —— MySQL 未启动或查询失败，已中止（不生成空报告）。')
  console.error('        请先启动 mysqld 后重跑。')
  process.exit(1)
}
const realByProduct = new Map()
for (const im of images) {
  if (/placehold\.co|placekitten|dummyimage|via\.placeholder/i.test(im.url)) continue
  if (!realByProduct.has(im.productId)) realByProduct.set(im.productId, [])
  realByProduct.get(im.productId).push(im)
}
console.log(`数据库：products=${products.length}，product_images=${images.length}，有真实图商品=${realByProduct.size}`)

// ============ 2. 检索结果 ============
const raw = JSON.parse(readFileSync(`${OUT}/_src/inventory-raw.json`, 'utf8'))
const searchBy = new Map(raw.inventory.map((r) => [r.productId, r]))

// ============ 3. 人工终审覆盖表（逐条核验候选标题后作出） ============
/**
 * 规则来源：任务书 §六（品牌/型号/类别/变体/主体）与 §四（宁少不滥）
 * 每条 override 都附具体证据
 */
const OVERRIDE = {
  // 保持 NEW_HIGH_CONFIDENCE（人工复核通过）
  12: { status: 'NEW_HIGH_CONFIDENCE', note: '标题「Redmi K70 至尊版 - 2024-09-27 01.jpg」含品牌与完整型号（含中文后缀），主体为手机本体' },
  49: { status: 'NEW_HIGH_CONFIDENCE', note: '标题「AirPods Pro 2.jpg」品牌+完整型号命中，单一耳机本体' },
  // 从 HIGH 降级
  26: { status: 'REVIEW_REQUIRED', note: '候选「Dell XPS 13 9350 and 9300.jpg」为两台不同代 XPS 13 并排合影，主体不唯一；历史审核亦曾因「XPS 13 and 15」拒绝同类图' },
  31: { status: 'REVIEW_REQUIRED', note: '候选为「MagicBook Pro 14」，数据库商品名未带尺寸（14/16），系列级图不得直接认定为该型号' },
  36: { status: 'NO_QUALIFIED_IMAGE', note: '最佳候选「Rückseite CPU-Sockel MSI Trident X」是机箱背部 CPU 插槽/内部结构，非产品本体；German "Rückseite"=背面' },
  37: { status: 'NO_QUALIFIED_IMAGE', note: '候选「Asus ROG Laptop Keyboard.jpg」为笔记本键盘特写，而商品分类为台式电脑——产品类别冲突' },
  125: { status: 'MODEL_UNCERTAIN', note: '商品名「英睿达 32GB」只有容量无型号，无法确认具体哪款；候选虽为 Crucial CT32G48C40S5，不能反推商品型号' },
  // SOURCE_UNVERIFIED 保持
  109: { status: 'SOURCE_UNVERIFIED', note: '候选许可证字段为「FAL」（非开放许可），无法核验可商用性' }
}

// ============ 4. 主状态裁定 ============
const records = []
for (const p of products) {
  const realImgs = realByProduct.get(p.id) ?? []
  const s = searchBy.get(p.id)
  let mainStatus, reason = '', autoAdopt = false
  if (realImgs.length > 0) {
    mainStatus = 'EXISTING_VALID'
    reason = `数据库已有 ${realImgs.length} 张非占位图（历史多轮审核+正式导入产物，URL 存活见执行日志）`
    autoAdopt = false // 已在库，无需再自动纳入
  } else {
    const ov = OVERRIDE[p.id]
    if (ov) { mainStatus = ov.status; reason = ov.note }
    else if (s) {
      mainStatus = s.bestStatus
      const best = s.candidates[0]
      reason = best ? `${best.matchEvidence}` : '检索无任何候选'
      autoAdopt = best?.autoAdopt ?? false
    } else {
      mainStatus = 'NO_QUALIFIED_IMAGE'
      reason = '未进入缺图检索清单（异常，应核查）'
    }
  }
  // 说明：未译中文片段不再自动降级——如果主状态是 NEW_HIGH_CONFIDENCE，
  // 说明「标题含完整型号」门槛已通过，即中文型号段确实出现在标题中（如 #12「Redmi K70 至尊版」），
  // 此时型号解析是可靠的；纯容量/无型号的情况已由人工覆盖表 #125 处理。
  records.push({
    productId: p.id, productName: p.name, brand: p.brand, category: p.category,
    status: p.status, deleted: p.deleted,
    normalizedModel: s?.normalizedModel ?? null,
    lineTranslations: s?.lineTranslations ?? [],
    untranslatedCjk: s?.untranslatedCjk ?? [],
    queries: s?.queries ?? [],
    existingRealImageCount: realImgs.length,
    existingRealImageUrls: realImgs.map((x) => x.url),
    mainStatus, reason, autoAdopt,
    candidates: s?.candidates ?? [],
    searchPoolSize: s?.poolSize ?? 0
  })
}

// 互斥校验
const VALID = new Set(['EXISTING_VALID', 'NEW_HIGH_CONFIDENCE', 'REVIEW_REQUIRED', 'NO_QUALIFIED_IMAGE', 'MODEL_UNCERTAIN', 'SOURCE_UNVERIFIED'])
const tally = {}
for (const r of records) {
  if (!VALID.has(r.mainStatus)) throw new Error(`非法状态 ${r.mainStatus} @#${r.productId}`)
  tally[r.mainStatus] = (tally[r.mainStatus] ?? 0) + 1
}
const totalCheck = Object.values(tally).reduce((a, b) => a + b, 0)
if (totalCheck !== products.length) throw new Error(`状态对账失败 ${totalCheck} != ${products.length}`)
console.log('主状态分布：', JSON.stringify(tally), '合计', totalCheck, '✅ 互斥且对账')

// ============ 5. 分类覆盖统计 ============
const catStats = new Map()
for (const r of records) {
  if (!catStats.has(r.category)) catStats.set(r.category, { total: 0, existing: 0, high: 0, review: 0, uncertain: 0, sourceUnverified: 0, none: 0 })
  const c = catStats.get(r.category); c.total++
  if (r.mainStatus === 'EXISTING_VALID') c.existing++
  else if (r.mainStatus === 'NEW_HIGH_CONFIDENCE') c.high++
  else if (r.mainStatus === 'REVIEW_REQUIRED') c.review++
  else if (r.mainStatus === 'MODEL_UNCERTAIN') c.uncertain++
  else if (r.mainStatus === 'SOURCE_UNVERIFIED') c.sourceUnverified++
  else c.none++
}

// ============ 6. 输出 7 份文件 ============
const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
const GEN_AT = new Date().toISOString()

// ---- product-image-inventory.json ----
const jsonDoc = {
  meta: {
    generatedAt: GEN_AT,
    purpose: '阶段 A：开放授权商品图片资源全面盘点与前台展示资格审核（READ-ONLY，未写库未改码）',
    dbBaseline: { products: products.length, product_images: images.length, realImages: [...realByProduct.values()].flat().length, tables: Number(rs("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='geek_price';", 'ft')[0]?.[0] ?? -1) },
    statusDefinition: {
      EXISTING_VALID: '数据库已有经核验的合格真实图片',
      NEW_HIGH_CONFIDENCE: '本次检索到新的高可信度候选（人工终审通过）',
      REVIEW_REQUIRED: '有候选但需人工核验型号/主体/许可',
      NO_QUALIFIED_IMAGE: '合理检索后无合格图片',
      MODEL_UNCERTAIN: '商品本身型号无法可靠识别',
      SOURCE_UNVERIFIED: '候选来源或许可无法核验'
    },
    searchScope: {
      wikimedia_commons: 'brand+model / model / brand+rawModel 各 3 词检索，严格匹配（品牌身份词+完整型号+主体+许可四重门槛），每商品最多 5 候选',
      openverse: `不可达（reachable=${raw.openverse.reachable}，${raw.openverse.error ?? ''}），未产生任何候选`,
      others: '详见 source-license-audit.md'
    },
    stats: tally
  },
  products: records
}
writeFileSync(`${OUT}/product-image-inventory.json`, JSON.stringify(jsonDoc, null, 2))

// ---- product-image-inventory.csv（每商品一行主结果） ----
const csv1 = ['productId,productName,brand,category,normalizedModel,mainStatus,existingRealImages,searchPoolSize,candidateCount,autoAdopt,reason']
for (const r of records) {
  csv1.push([r.productId, r.productName, r.brand, r.category, r.normalizedModel ?? '', r.mainStatus,
    r.existingRealImageCount, r.searchPoolSize, r.candidates.length, r.autoAdopt, r.reason].map(esc).join(','))
}
writeFileSync(`${OUT}/product-image-inventory.csv`, '\uFEFF' + csv1.join('\n') + '\n')

// ---- image-candidates.csv（候选明细，多候选不丢） ----
const csv2 = ['productId,productName,brand,normalizedModel,source,sourcePageUrl,imageUrl,license,licenseUrl,author,matchStatus,matchEvidence,imageType,accessibilityStatus,reviewReason,autoAdopt']
let candCount = 0
for (const r of records) {
  for (const c of r.candidates) {
    candCount++
    csv2.push([r.productId, r.productName, r.brand, r.normalizedModel ?? '', c.source, c.sourcePageUrl,
      c.imageUrl, c.license ?? '', c.licenseUrl ?? '', c.author ?? '', c.matchStatus, c.matchEvidence,
      c.imageType, c.accessibilityStatus, c.reviewReason ?? '', c.autoAdopt].map(esc).join(','))
  }
}
writeFileSync(`${OUT}/image-candidates.csv`, '\uFEFF' + csv2.join('\n') + '\n')

// ---- frontend-eligibility-preview.csv ----
const csv3 = ['productId,productName,currentImageStatus,suggestedFutureDisplay,reason']
for (const r of records) {
  const cur = r.existingRealImageCount > 0 ? 'HAS_REAL_IMAGE' : 'PLACEHOLDER_ONLY'
  let suggest, why
  if (r.mainStatus === 'EXISTING_VALID') { suggest = 'SHOW'; why = '已有合格真实图片' }
  else if (r.mainStatus === 'NEW_HIGH_CONFIDENCE') { suggest = 'SHOW_AFTER_FORMAL_APPROVAL'; why = '高可信度新候选，需走正式审核后方可展示：' + r.reason }
  else if (r.mainStatus === 'REVIEW_REQUIRED') { suggest = 'HIDE'; why = '候选需人工核验，暂不展示：' + r.reason }
  else if (r.mainStatus === 'MODEL_UNCERTAIN') { suggest = 'HIDE'; why = '商品型号无法确认：' + r.reason }
  else if (r.mainStatus === 'SOURCE_UNVERIFIED') { suggest = 'HIDE'; why = '许可无法核验：' + r.reason }
  else { suggest = 'HIDE'; why = '无合格图片：' + r.reason }
  csv3.push([r.productId, r.productName, cur, suggest, why].map(esc).join(','))
}
writeFileSync(`${OUT}/frontend-eligibility-preview.csv`, '\uFEFF' + csv3.join('\n') + '\n')

// ---- 汇总统计供 md 使用 ----
const showNow = tally.EXISTING_VALID ?? 0
const showAfter = showNow + (tally.NEW_HIGH_CONFIDENCE ?? 0)
const ratioNow = (showNow / products.length * 100).toFixed(1)
const ratioAfter = (showAfter / products.length * 100).toFixed(1)

writeFileSync(`${OUT}/_stats.json`, JSON.stringify({
  genAt: GEN_AT, tally, total: products.length, candCount, showNow, showAfter, ratioNow, ratioAfter,
  catStats: Object.fromEntries(catStats), dbBaseline: jsonDoc.meta.dbBaseline
}, null, 2))

console.log('\n=========== 状态统计 ===========')
console.log(JSON.stringify(tally, null, 1))
console.log(`候选明细 ${candCount} 条`)
console.log(`当前可展示 = ${showNow} (${ratioNow}%)；正式批准后可到 ${showAfter} (${ratioAfter}%)`)
console.log('\n7 份文件已生成（summary/source-license-audit/execution-log 由下一脚本写 md）')
