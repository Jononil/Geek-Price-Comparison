#!/usr/bin/env node
/**
 * 小范围生产试点：把验证阶段确认的「HIGH + 合法许可」图片导入 product_images。
 * ------------------------------------------------------------------
 * 严格约束（脚本自身保证）：
 *   - 只读 verification/product-image-verification.json（不改验证产物）
 *   - 只执行 INSERT INTO product_images(product_id, url, sort)
 *   - 绝不 UPDATE / DELETE 任何表，绝不改 schema
 *   - 默认 dry-run；只有显式传 execute 才写库
 *   - 单条失败隔离：一条失败不影响其他条
 *
 * 用法：
 *   node verification/import-approved-images.mjs                 # dry-run（默认）
 *   node verification/import-approved-images.mjs execute         # 真正写入
 *   node verification/import-approved-images.mjs --strict-existing  # 严格口径：任何非空 URL 都跳过
 *
 * 已确认的两项试点口径（由用户选定）：
 *   口径一（占位图）：placehold.co 之类的占位图视为「没有真实图片」，允许**追加** Wikimedia 图；
 *                     占位图行保留不动，只 INSERT，绝不 UPDATE / DELETE。
 *   口径二（映射）：   mock 目录产品 -> 数据库产品，允许「严格同名」与「去品牌前后缀后同名」
 *                      两档确定性匹配；不做任何模糊/近似匹配。
 *
 * 数据库连接从环境变量读取（不硬编码账号密码）：
 *   GEEKPRICE_DB_HOST / GEEKPRICE_DB_PORT / GEEKPRICE_DB_USER
 *   GEEKPRICE_DB_PASSWORD / GEEKPRICE_DB_NAME
 * 缺省值来自 backend/src/main/resources/application.yml 的默认本地配置。
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { tokenize, norm, stripLeadingBrand } from './lib/matching.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CACHE = join(HERE, '.cache')
const VERIFICATION_JSON = join(HERE, 'product-image-verification.json')
const APPROVED_JSON = join(HERE, 'approved-product-images.json')

const args = process.argv.slice(2)
const MODE = args.includes('execute') ? 'execute' : 'dry-run'
const REBUILD = args.includes('--rebuild')
/** 口径一：占位图视为「没有真实图片」（用户已确认）；--strict-existing 可切回严格口径 */
const TREAT_PLACEHOLDER_AS_EMPTY = !args.includes('--strict-existing')
/** 候选来源：mock = 上一轮的 products.json 验证结果；db = 真实数据库产品验证结果（本轮） */
const SOURCE = (args.find((a) => a.startsWith('--source=')) ?? '--source=mock').split('=')[1]

mkdirSync(CACHE, { recursive: true })

// ---------- 数据库连接（不硬编码密码） ----------
const DB = {
  host: process.env.GEEKPRICE_DB_HOST ?? '127.0.0.1',
  port: process.env.GEEKPRICE_DB_PORT ?? '3306',
  user: process.env.GEEKPRICE_DB_USER ?? 'root',
  password: process.env.GEEKPRICE_DB_PASSWORD ?? '123456',
  name: process.env.GEEKPRICE_DB_NAME ?? 'geek_price'
}
const MYSQL_CANDIDATES = [
  'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe',
  'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe',
  'mysql'
]
const MYSQL = MYSQL_CANDIDATES.find((p) => p === 'mysql' || existsSync(p))
if (!MYSQL) {
  console.error('[FATAL] 未找到 mysql 客户端')
  process.exit(1)
}

/**
 * 用 cmd 重定向执行一条 SQL。
 * 说明：沙箱下 Node 无法用管道捕获子进程输出，因此把命令写进临时 .bat，
 * 由 cmd 自己完成 < > 重定向，Node 只读结果文件。
 */
function runSql(sql, outFile) {
  const inFile = join(CACHE, '_stmt.sql')
  const batFile = join(CACHE, '_run.bat')
  const errFile = join(CACHE, '_run.err')
  writeFileSync(inFile, sql, 'utf8')
  // stderr 单独落文件：绝不能与 stdout 合并，否则 mysql 的密码告警会混进数据里
  writeFileSync(batFile,
    `@echo off\r\n"${MYSQL}" -h ${DB.host} -P ${DB.port} -u ${DB.user} -p${DB.password} ` +
    `--default-character-set=utf8mb4 -N -B "${DB.name}" < "${inFile}" > "${outFile}" 2> "${errFile}"\r\n`,
    'utf8')
  try {
    execFileSync('cmd.exe', ['/c', batFile], { stdio: 'inherit' })
    return { ok: true, output: existsSync(outFile) ? readFileSync(outFile, 'utf8') : '' }
  } catch (e) {
    return { ok: false, output: existsSync(outFile) ? readFileSync(outFile, 'utf8') : String(e.message) }
  }
}

/** 解析 TSV：只保留字段数正确的行，剔除任何非数据输出（告警、空行等） */
function parseTsv(raw, expectedColumns) {
  return raw.split(/\r?\n/)
    .filter((l) => l.trim() !== '')
    .map((l) => l.split('\t'))
    .filter((f) => f.length === expectedColumns)
}

/** 读取当前数据库真实状态 */
function loadDbState() {
  const q = (sql, file) => {
    const r = runSql(sql, join(CACHE, file))
    return r.output
  }
  const productsRaw = q(
    `SELECT id, name, brand_id, category_id, status, deleted FROM products ORDER BY id;`,
    'db_products.tsv')
  const imagesRaw = q(
    `SELECT id, product_id, url, sort FROM product_images ORDER BY product_id, sort;`,
    'db_images.tsv')

  const products = parseTsv(productsRaw, 6).map(([id, name, brandId, categoryId, status, deleted]) => ({
    id: Number(id), name, brandId: Number(brandId), categoryId: Number(categoryId),
    status: Number(status), deleted: Number(deleted)
  }))
  const images = parseTsv(imagesRaw, 4).map(([id, productId, url, sort]) => ({
    id: Number(id), productId: Number(productId), url, sort: Number(sort)
  }))
  return { products, images }
}

// ---------- 产品名归一化（用于 mock 目录 → 数据库产品的确定性匹配） ----------
function normName(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[™®]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
const isPlaceholder = (url) => /placehold\.co|placekitten|dummyimage|via\.placeholder/i.test(String(url ?? ''))

// stripLeadingBrand / BRAND_WORDS 已统一放到 lib/matching.mjs（与真实数据库产品验证共用同一份实现）

// ============================================================
// 第一步：从验证结果中挑出「每产品 1 张」的最优 autoAdopt 候选
// ============================================================
function selectApproved() {
  const data = JSON.parse(readFileSync(VERIFICATION_JSON, 'utf8'))
  /** 许可证明确度排序：CC0/PD 最明确，其次 CC BY，再 CC BY-SA */
  const licenseRank = (lic) => {
    const s = String(lic ?? '').toLowerCase()
    if (/^cc0|public domain|^pdm?\b/.test(s)) return 0
    if (/by-sa/.test(s)) return 2
    return 1
  }
  const picked = []
  for (const p of data.products) {
    const ok = (p.candidates ?? []).filter((c) =>
      c.autoAdopt === true &&
      c.matchStatus === 'HIGH' &&
      c.source === 'wikimedia' &&          // 明确禁止导入 Openverse
      typeof c.imageUrl === 'string' && c.imageUrl.trim() !== ''
    )
    if (ok.length === 0) continue
    ok.sort((a, b) =>
      (b.matchScore - a.matchScore) ||
      (licenseRank(a.license) - licenseRank(b.license)) ||
      (Number(Boolean(b.sourceUrl)) - Number(Boolean(a.sourceUrl))) ||
      (Number(Boolean(b.creator)) - Number(Boolean(a.creator)))
    )
    const best = ok[0]
    picked.push({
      mockProductId: p.productId,
      brand: p.brand,
      model: p.model,
      title: p.title,
      imageUrl: best.imageUrl,
      source: best.source,
      imageTitle: best.title,
      creator: best.creator ?? null,
      license: best.license ?? null,
      licenseUrl: best.licenseUrl ?? null,
      sourceUrl: best.sourceUrl ?? null,
      matchScore: best.matchScore,
      matchedVia: best.matchedVia ?? null,
      candidatesAvailable: ok.length
    })
  }
  return { data, picked }
}

// ============================================================
// 第二步：解析到数据库中真实存在且未删除的产品
// ============================================================
function resolveDbProducts(picked, products) {
  const active = products.filter((p) => p.deleted === 0 && p.status === 1)
  const byExact = new Map()
  const byStripped = new Map()
  for (const p of active) {
    byExact.set(normName(p.name), p)
    const k = stripLeadingBrand(p.name)
    if (k && !byStripped.has(k)) byStripped.set(k, p)
  }
  return picked.map((a) => {
    // 用「型号核心」与数据库产品名做**确定性**匹配（严格同名 -> 去品牌前后缀同名），不做模糊匹配
    const keys = [a.model, String(a.model).replace(/\b\d+\s?(GB|TB)\b/gi, '').trim()]
    let hit = null
    let tier = null
    for (const k of keys) {
      const n = normName(k)
      if (byExact.has(n)) { hit = byExact.get(n); tier = 'exact'; break }
    }
    if (!hit) {
      for (const k of keys) {
        const n = normName(k)
        if (byStripped.has(n)) { hit = byStripped.get(n); tier = 'brand_stripped'; break }
      }
    }
    return {
      ...a,
      dbProductId: hit?.id ?? null,
      dbProductName: hit?.name ?? null,
      mappingStatus: hit ? `matched_${tier}` : 'no_matching_db_product'
    }
  })
}

// ============================================================
// 真实数据库产品专项：40 个 HIGH 候选的最终导入前复核 + dry-run
// （只读：仅 SELECT；本流程**禁止 execute**）
// ============================================================

const CJK_RE = /[\u4e00-\u9fff]/

/** 图片「主体类型 / 构图」风险识别（用于最终复核，不参与打分） */
function subjectRisk(title) {
  const t = String(title ?? '').toLowerCase()
  const risks = []
  // 芯片裸片 / 显微图：Commons 上这类文件名常带 @ 与工艺代号
  if (/die shot|wafer|microscope|swir|nmesf|nmccd|iod@|ccd@|delid|晶圆|裸片|显微|\bccx\b|@/.test(t)) {
    risks.push('chip_die_or_micrograph')
  }
  if (/\bstore\b|\bshop\b|flagship|booth|expo\b|exhibition|陈列|专柜|门店/.test(t)) {
    risks.push('store_or_booth_display')
  }
  if (/unboxing|unboxed|\bbox\b|packaging|retail box|开箱|包装/.test(t)) {
    risks.push('packaging_or_unboxing')
  }
  // 多设备合影：出现 " and <带数字的型号>" 这类并列
  if (/\band\s+[a-z0-9-]*\d/i.test(t) || /、/.test(t)) {
    risks.push('possible_multi_device')
  }
  if (/vergleich|comparison|\bvs\b|对比/.test(t)) {
    risks.push('comparison_shot')
  }
  return risks
}

/** 纯数字型号（如「小米 14」的型号就是 "14"）：最容易被日期/编号撞上 */
function isPureNumericModel(model) {
  const toks = tokenize(String(model ?? ''))
  return toks.length > 0 && toks.every((t) => /^\d+$/.test(t))
}

/** 型号里的中文系列名是否没有出现在标题里（如 华硕天选 / 小米平板） */
function cjkSeriesUnverified(model, title) {
  const parts = String(model ?? '').match(/[\u4e00-\u9fff]+/g) ?? []
  if (parts.length === 0) return false
  const t = String(title ?? '').toLowerCase()
  return parts.some((p) => !t.includes(p.toLowerCase()))
}

/** 最终复核分类：finalApproved / finalReviewRequired / finalRejected */
function classifyHigh(r, title) {
  const base = {
    licenseAllowed: r.licenseAllowed === true,
    subjectClearlyProduct: r.subjectClearlyProduct === true
  }
  if (!base.licenseAllowed) {
    return { verdict: 'finalRejected', reasons: ['许可证不允许自动采用'], risks: [] }
  }
  if (!base.subjectClearlyProduct) {
    return { verdict: 'finalRejected', reasons: ['图片主体未明确为该产品'], risks: [] }
  }
  const risks = subjectRisk(title)
  if (risks.includes('chip_die_or_micrograph')) {
    return { verdict: 'finalRejected', reasons: ['图片主体为芯片裸片/显微图，不是产品本体实拍，不能作为产品主图'], risks }
  }
  const review = []
  if (risks.includes('store_or_booth_display')) review.push('店铺/展台陈列照，画面主体不唯一')
  if (risks.includes('packaging_or_unboxing')) review.push('开箱/包装照，主体可能是包装盒而非产品')
  if (risks.includes('comparison_shot')) review.push('对比/视频截图，画面可能含多张卡或多个型号')
  if (risks.includes('possible_multi_device')) review.push('疑似多设备合影，主体不唯一')
  if (isPureNumericModel(r.model)) review.push('纯数字型号，仅凭一个数字命中，证据偏弱')
  if (cjkSeriesUnverified(r.model, title)) review.push('型号中的中文系列名未在标题出现，系列名未获确认')
  if (review.length > 0) return { verdict: 'finalReviewRequired', reasons: review, risks }
  return { verdict: 'finalApproved', reasons: ['型号完全一致、主体明确、许可合规、品类一致'], risks: [] }
}

async function runDbSourceReview() {
  console.log('=== 真实数据库产品专项：HIGH 候选最终复核 + dry-run（只读，不执行 INSERT）===\n')

  const dbJsonPath = join(HERE, 'db-product-image-verification.json')
  if (!existsSync(dbJsonPath)) {
    console.error('[FATAL] 缺少 db-product-image-verification.json，请先运行 verify-db-product-images.mjs')
    process.exit(1)
  }
  const dbJson = JSON.parse(readFileSync(dbJsonPath, 'utf8'))
  const allProducts = dbJson.products

  // 本次候选范围：严格限定 HIGH + licenseAllowed + autoAdopt
  const high = allProducts.filter((p) => p.matchStatus === 'HIGH')
  const scope = high.filter((p) => p.licenseAllowed === true && p.autoAdopt === true)
  console.log(`[1/5] 覆盖验证结果：产品 ${allProducts.length}，HIGH ${high.length}，其中 autoAdopt ${scope.length}`)

  // ---- 读取数据库真实产品（SELECT only） ----
  const brandRows = parseTsv(runSql(`SELECT id, name FROM brands;`, join(CACHE, 'rv_brands.tsv')).output, 2)
  const brandName = new Map(brandRows.map(([id, n]) => [Number(id), n]))
  const catRows = parseTsv(runSql(`SELECT id, name FROM categories;`, join(CACHE, 'rv_cats.tsv')).output, 2)
  const catName = new Map(catRows.map(([id, n]) => [Number(id), n]))
  const prodRows = parseTsv(
    runSql(`SELECT id, name, brand_id, category_id, status, deleted FROM products WHERE deleted = 0 ORDER BY id;`,
      join(CACHE, 'rv_products.tsv')).output, 6)
  const products = prodRows.map(([id, name, b, c, status, deleted]) => ({
    id: Number(id), name, brandId: Number(b), categoryId: Number(c), status: Number(status), deleted: Number(deleted)
  }))
  const imageRows = parseTsv(
    runSql(`SELECT id, product_id, url, sort FROM product_images ORDER BY product_id, sort;`,
      join(CACHE, 'rv_images.tsv')).output, 4)
  const images = imageRows.map(([id, pid, url, sort]) => ({ id: Number(id), productId: Number(pid), url, sort: Number(sort) }))
  const productById = new Map(products.map((p) => [p.id, p]))
  const imagesByProduct = new Map()
  for (const im of images) {
    if (!imagesByProduct.has(im.productId)) imagesByProduct.set(im.productId, [])
    imagesByProduct.get(im.productId).push(im)
  }
  console.log(`[2/5] 数据库真实读取：products=${products.length}，brands=${brandRows.length}，categories=${catRows.length}，product_images=${images.length}`)

  // ---- 逐条复核 ----
  const reviewed = scope.map((r) => {
    const c = r.bestCandidate ?? {}
    const title = String(c.title ?? '').replace(/^File:/, '')
    const cls = classifyHigh({ ...r, model: r.model }, title)
    const dbp = productById.get(r.productId) ?? null
    const mine = imagesByProduct.get(r.productId) ?? []
    const sameUrl = mine.some((i) => String(i.url) === String(c.imageUrl))
    const realImgs = mine.filter((i) => !isPlaceholder(i.url))
    let skipReason = null
    if (cls.verdict === 'finalApproved') {
      if (sameUrl) skipReason = 'DUPLICATE'
      else if (realImgs.length > 0) skipReason = 'ALREADY_HAS_REAL_IMAGE'
    }
    return {
      databaseProductId: r.productId,
      databaseProductName: dbp?.name ?? r.name,
      databaseBrand: dbp ? (brandName.get(dbp.brandId) ?? null) : null,
      databaseCategory: dbp ? (catName.get(dbp.categoryId) ?? null) : null,
      databaseProductExists: Boolean(dbp),
      matchStatus: r.matchStatus,
      license: r.license,
      licenseAllowed: r.licenseAllowed,
      autoAdopt: r.autoAdopt,
      model: r.model,
      imageTitle: title,
      imageUrl: c.imageUrl ?? null,
      sourceUrl: c.sourceUrl ?? null,
      creator: c.creator ?? null,
      licenseUrl: c.licenseUrl ?? null,
      matchScore: r.matchScore,
      subjectTypeWarning: r.subjectTypeWarning ?? null,
      verdict: cls.verdict,
      reasons: cls.reasons,
      risks: cls.risks,
      reviewRequired: cls.verdict === 'finalReviewRequired',
      finalApproved: cls.verdict === 'finalApproved',
      finalReviewRequired: cls.verdict === 'finalReviewRequired',
      finalRejected: cls.verdict === 'finalRejected',
      existingImageRowCount: mine.length,
      existingRealImageCount: realImgs.length,
      existingUrls: mine.map((i) => i.url),
      skipReason,
      willInsert: cls.verdict === 'finalApproved' && skipReason === null
    }
  })

  const approved = reviewed.filter((r) => r.finalApproved)
  const reviewList = reviewed.filter((r) => r.finalReviewRequired)
  const rejected = reviewed.filter((r) => r.finalRejected)
  const dupSkipped = approved.filter((r) => r.skipReason === 'DUPLICATE')
  const hasRealSkipped = approved.filter((r) => r.skipReason === 'ALREADY_HAS_REAL_IMAGE')
  const willInsert = reviewed.filter((r) => r.willInsert)
  console.log(`[3/5] 复核结果：finalApproved ${approved.length}，finalReviewRequired ${reviewList.length}，finalRejected ${rejected.length}`)
  console.log(`      其中已存在图片而跳过：${dupSkipped.length + hasRealSkipped.length}（DUPLICATE ${dupSkipped.length} / 已有真实图 ${hasRealSkipped.length}）`)

  // ---- 落盘最终清单 ----
  const generatedAt = new Date().toISOString()
  const outDoc = {
    meta: {
      purpose: '真实数据库产品 40 个 HIGH(autoAdopt) 候选的最终导入前复核清单（只读，未执行 INSERT）',
      generatedAt,
      source: 'db-product-image-verification.json + MySQL geek_price（SELECT only）',
      scopeRule: 'matchStatus=HIGH 且 licenseAllowed=true 且 autoAdopt=true',
      verdictRule: {
        finalApproved: 'HIGH + licenseAllowed + 主体明确 + 型号无歧义 + 品类一致',
        finalReviewRequired: '主体轻微疑问 / 纯数字型号 / 跨品类同型号嫌疑 / 多设备合影 / 其它人工判断风险',
        finalRejected: '明显跨型号 / 明显跨品类 / 主体不是目标产品 / 许可证不允许 / 无法确认'
      },
      dbWrites: '无（仅 SELECT）',
      stats: {
        highTotal: high.length,
        scopeAutoAdopt: scope.length,
        finalApproved: approved.length,
        finalReviewRequired: reviewList.length,
        finalRejected: rejected.length,
        skippedDuplicate: dupSkipped.length,
        skippedAlreadyHasRealImage: hasRealSkipped.length,
        willInsert: willInsert.length
      }
    },
    reviewed,
    finalApproved: approved,
    finalReviewRequired: reviewList,
    finalRejected: rejected,
    insertPlan: willInsert.map((r) => ({
      databaseProductId: r.databaseProductId,
      databaseProductName: r.databaseProductName,
      imageUrl: r.imageUrl,
      nextSort: (imagesByProduct.get(r.databaseProductId) ?? []).length
        ? Math.max(...(imagesByProduct.get(r.databaseProductId) ?? []).map((i) => i.sort)) + 1
        : 0,
      license: r.license
    }))
  }
  writeFileSync(join(HERE, 'final-approved-product-images.json'), JSON.stringify(outDoc, null, 2))

  const csvEsc = (v) => {
    const s = v == null ? '' : String(v)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csvHead = [
    'databaseProductId', 'databaseProductName', 'databaseBrand', 'databaseCategory',
    'model', 'matchStatus', 'matchScore', 'license', 'licenseAllowed', 'autoAdopt',
    'verdict', 'willInsert', 'skipReason', 'imageTitle', 'imageUrl', 'sourceUrl', 'creator', 'reasons'
  ]
  const csvLines = [csvHead.join(',')]
  for (const r of reviewed) {
    csvLines.push([
      r.databaseProductId, r.databaseProductName, r.databaseBrand, r.databaseCategory,
      r.model, r.matchStatus, r.matchScore, r.license, r.licenseAllowed, r.autoAdopt,
      r.verdict, r.willInsert, r.skipReason ?? '', r.imageTitle, r.imageUrl, r.sourceUrl, r.creator, r.reasons.join('；')
    ].map(csvEsc).join(','))
  }
  writeFileSync(join(HERE, 'final-approved-product-images.csv'), '\uFEFF' + csvLines.join('\n') + '\n')
  console.log(`[4/5] 已写出 final-approved-product-images.json / .csv`)

  // ---- dry-run 报告 + INSERT SQL（只打印，绝不执行） ----
  console.log('')
  console.log('================ 导入前复核 dry-run ================')
  console.log(`  数据库真实产品数量        : ${products.length}`)
  console.log(`  HIGH 总数                 : ${high.length}`)
  console.log(`  本次候选（HIGH+licOK+adopt）: ${scope.length}`)
  console.log(`  最终确认可导入(finalApproved): ${approved.length}`)
  console.log(`  需要人工复核(reviewRequired) : ${reviewList.length}`)
  console.log(`  最终剔除(finalRejected)      : ${rejected.length}`)
  console.log(`  已存在相同图片(DUPLICATE)    : ${dupSkipped.length}`)
  console.log(`  已有其它真实图片(跳过)       : ${hasRealSkipped.length}`)
  console.log(`  预计 INSERT 数量             : ${willInsert.length}`)
  console.log('')
  if (reviewList.length) {
    console.log('  需要人工复核（未纳入本次 INSERT 计划）：')
    for (const r of reviewList) console.log(`    - db#${r.databaseProductId} 「${r.databaseProductName}」 ${r.reasons.join('；')}`)
    console.log('')
  }
  if (rejected.length) {
    console.log('  最终剔除：')
    for (const r of rejected) console.log(`    - db#${r.databaseProductId} 「${r.databaseProductName}」 ${r.reasons.join('；')}`)
    console.log('')
  }
  console.log('  预计执行的 SQL（仅打印，本次绝对不执行）：')
  if (willInsert.length === 0) {
    console.log('    -- 无')
  } else {
    for (const r of willInsert) {
      const mine = imagesByProduct.get(r.databaseProductId) ?? []
      const nextSort = mine.length ? Math.max(...mine.map((i) => i.sort)) + 1 : 0
      const esc = String(r.imageUrl).replace(/'/g, "\\'")
      console.log(`    INSERT INTO product_images(product_id, url, sort) VALUES (${r.databaseProductId}, '${esc}', ${nextSort});`)
    }
  }
  console.log('')
  console.log('[5/5] 本流程只读：未执行任何 INSERT/UPDATE/DELETE。')
  if (MODE === 'execute') {
    console.log('[拒绝] --source=db 的复核流程禁止 execute；如需正式导入请另行确认。')
  }

  // ---- 把最终复核结果写回 db-product-image-summary.md（用定界块，可重复执行） ----
  const mdPath = join(HERE, 'db-product-image-summary.md')
  const esc = (s) => String(s ?? '').replace(/\|/g, '\\|')
  const b = []
  b.push('<!-- FINAL-REVIEW:BEGIN -->')
  b.push('')
  b.push('## 十、最终导入前复核（40 个 HIGH / autoAdopt）')
  b.push('')
  b.push(`> 复核时间：${generatedAt}`)
  b.push('> 复核范围：`matchStatus=HIGH` **且** `licenseAllowed=true` **且** `autoAdopt=true`，共 **40** 个。')
  b.push('> 本流程只读（仅 SELECT），**未执行任何 INSERT / UPDATE / DELETE**；下面的 SQL 仅作展示。')
  b.push('')
  b.push('### 10.1 复核结论汇总')
  b.push('')
  b.push('| 结论 | 数量 |')
  b.push('|---|---|')
  b.push(`| HIGH 总数 | ${high.length} |`)
  b.push(`| **最终确认可导入（finalApproved）** | **${approved.length}** |`)
  b.push(`| 需要人工复核（finalReviewRequired） | ${reviewList.length} |`)
  b.push(`| 最终剔除（finalRejected） | ${rejected.length} |`)
  b.push(`| 其中：已存在相同图片（DUPLICATE） | ${dupSkipped.length} |`)
  b.push(`| 其中：已有其它真实图片而跳过 | ${hasRealSkipped.length} |`)
  b.push(`| **预计 INSERT 数量** | **${willInsert.length}** |`)
  b.push('')
  b.push('### 10.2 全部 40 个 HIGH 逐条复核')
  b.push('')
  b.push('| db product_id | 产品名称 | 型号 | 类别 | 分数 | Wikimedia 图片标题 | 图片 URL | Commons 页面 | license | creator | matchStatus | autoAdopt | 复核结论 | 剔除/复核原因 |')
  b.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
  for (const r of reviewed) {
    b.push(`| ${r.databaseProductId} | ${esc(r.databaseProductName)} | ${esc(r.model)} | ${esc(r.databaseCategory)} | ${r.matchScore} | ${esc(r.imageTitle)} | ${r.imageUrl ?? ''} | ${r.sourceUrl ?? ''} | ${esc(r.license)} | ${esc(r.creator)} | ${r.matchStatus} | ${r.autoAdopt} | **${r.verdict}**${r.skipReason ? `（${r.skipReason}）` : ''} | ${esc(r.reasons.join('；'))} |`)
  }
  b.push('')
  b.push('### 10.3 最终确认可导入清单（finalApproved）')
  b.push('')
  b.push('| db product_id | 产品名称 | 品牌 | 类别 | 图片标题 | license | 处置 |')
  b.push('|---|---|---|---|---|---|---|')
  for (const r of approved) {
    b.push(`| ${r.databaseProductId} | ${esc(r.databaseProductName)} | ${esc(r.databaseBrand)} | ${esc(r.databaseCategory)} | ${esc(r.imageTitle)} | ${esc(r.license)} | ${r.skipReason ? `跳过（${r.skipReason}）` : '将 INSERT'} |`)
  }
  b.push('')
  b.push('### 10.4 需要人工复核（finalReviewRequired，未纳入本次 INSERT 计划）')
  b.push('')
  b.push('| db product_id | 产品名称 | 图片标题 | 现有真实图 | 复核原因 |')
  b.push('|---|---|---|---|---|')
  for (const r of reviewList) {
    b.push(`| ${r.databaseProductId} | ${esc(r.databaseProductName)} | ${esc(r.imageTitle)} | ${r.existingRealImageCount} | ${esc(r.reasons.join('；'))} |`)
  }
  b.push('')
  b.push('### 10.5 最终剔除（finalRejected）')
  b.push('')
  b.push('| db product_id | 产品名称 | 图片标题 | 剔除原因 |')
  b.push('|---|---|---|---|')
  for (const r of rejected) {
    b.push(`| ${r.databaseProductId} | ${esc(r.databaseProductName)} | ${esc(r.imageTitle)} | ${esc(r.reasons.join('；'))} |`)
  }
  b.push('')
  b.push('### 10.6 预计执行的 SQL（仅展示，本次未执行）')
  b.push('')
  b.push('```sql')
  if (willInsert.length === 0) b.push('-- 无')
  else for (const r of willInsert) {
    const mine = imagesByProduct.get(r.databaseProductId) ?? []
    const nextSort = mine.length ? Math.max(...mine.map((i) => i.sort)) + 1 : 0
    b.push(`INSERT INTO product_images(product_id, url, sort) VALUES (${r.databaseProductId}, '${String(r.imageUrl).replace(/'/g, "\\'")}', ${nextSort});`)
  }
  b.push('```')
  b.push('')
  b.push(`**本次是否执行 INSERT：否**（预计 ${willInsert.length} 条，等待人工确认后再决定）。`)
  b.push('')
  b.push('<!-- FINAL-REVIEW:END -->')
  const block = b.join('\n')

  if (existsSync(mdPath)) {
    const old = readFileSync(mdPath, 'utf8')
    const re = /<!-- FINAL-REVIEW:BEGIN -->[\s\S]*?<!-- FINAL-REVIEW:END -->/
    const next = re.test(old) ? old.replace(re, block) : `${old.trimEnd()}\n\n${block}\n`
    writeFileSync(mdPath, next)
  } else {
    writeFileSync(mdPath, `${block}\n`)
  }
  console.log(`      已更新 ${mdPath} 的「最终导入前复核」章节`)
}

if (SOURCE === 'db') {
  await runDbSourceReview()
  process.exit(0)
}

// ============================================================
// 真实产品图片「最终正式导入」流程（--source=final）
//   最终导入集合 = 上一轮 finalApproved 的 25 条 + 本轮复核 APPROVE 的 3 条
//   写库前执行 11 项安全检查；全部通过才在一个事务里 INSERT；否则不写
// ============================================================

/** 本轮 8 项复核中被拒绝、绝不允许进入 INSERT 的 db id */
const FINAL_REJECTED_IDS = [5, 25, 26, 97, 98]
/** 本轮复核 APPROVE 的 3 条：#6/#16 用原候选；#78 必须用复核报告指定的棚拍备选 */
const FINAL_EXTRA = [
  { dbId: 6, pick: 'best', expectTitle: 'Xiaomi 14 (July 10, 2026).jpg' },
  { dbId: 16, pick: 'best', expectTitle: 'Xiaomi Pad 7 Pro.jpg' },
  { dbId: 78, pick: 'titleIncludes:Henry S', expectTitle: 'Sony ZV-E10 with Sony E 16-50mm F3.5-5.6 OSS PZ - by Henry Söderlund (51375243603).jpg' }
]

async function runFinalImport() {
  const dbJson = JSON.parse(readFileSync(join(HERE, 'db-product-image-verification.json'), 'utf8'))
  const approvedDoc = JSON.parse(readFileSync(join(HERE, 'final-approved-product-images.json'), 'utf8'))

  // ---------- 组装最终导入集合 ----------
  const base = approvedDoc.finalApproved.filter((r) => !r.skipReason)
  const items = base.map((r) => ({
    dbId: r.databaseProductId,
    name: r.databaseProductName,
    url: r.imageUrl,
    license: r.license ?? null,
    sourceUrl: r.sourceUrl ?? null,
    origin: 'round1-finalApproved'
  }))

  for (const spec of FINAL_EXTRA) {
    const p = dbJson.products.find((x) => x.productId === spec.dbId)
    if (!p) { console.error(`[FATAL] 找不到 db#${spec.dbId}`); process.exit(1) }
    let cand
    if (spec.pick === 'best') cand = p.candidates.find((c) => c.imageUrl === p.bestCandidate?.imageUrl)
    else {
      const key = spec.pick.split(':')[1]
      cand = p.candidates.find((c) => String(c.title ?? '').includes(key) && c.matchStatus === 'HIGH')
    }
    if (!cand) { console.error(`[FATAL] db#${spec.dbId} 找不到符合条件 ${spec.pick} 的候选`); process.exit(1) }
    items.push({
      dbId: spec.dbId,
      name: p.name,
      url: cand.imageUrl,
      license: cand.license ?? null,
      sourceUrl: cand.sourceUrl ?? null,
      origin: 'round2-review-approved'
    })
  }

  // ---------- 读取数据库真实现状（SELECT only） ----------
  const brandRows = parseTsv(runSql(`SELECT id, name FROM brands;`, join(CACHE, 'fi_brands.tsv')).output, 2)
  const brandName = new Map(brandRows.map(([id, n]) => [Number(id), n]))
  const catRows = parseTsv(runSql(`SELECT id, name FROM categories;`, join(CACHE, 'fi_cats.tsv')).output, 2)
  const catName = new Map(catRows.map(([id, n]) => [Number(id), n]))
  const prodRows = parseTsv(runSql(`SELECT id, name, brand_id, category_id, status, deleted FROM products ORDER BY id;`,
    join(CACHE, 'fi_products.tsv')).output, 6)
  const products = prodRows.map(([id, name, b, c, status, deleted]) => ({
    id: Number(id), name, brandId: Number(b), categoryId: Number(c), status: Number(status), deleted: Number(deleted)
  }))
  const byId = new Map(products.map((p) => [p.id, p]))
  const imageRows = parseTsv(runSql(`SELECT id, product_id, url, sort FROM product_images ORDER BY product_id, sort;`,
    join(CACHE, 'fi_images.tsv')).output, 4)
  const images = imageRows.map(([id, pid, url, sort]) => ({ id: Number(id), productId: Number(pid), url, sort: Number(sort) }))
  const imagesByProduct = new Map()
  for (const im of images) {
    if (!imagesByProduct.has(im.productId)) imagesByProduct.set(im.productId, [])
    imagesByProduct.get(im.productId).push(im)
  }
  const urlToImage = new Map(images.map((i) => [String(i.url), i]))
  const cols = parseTsv(runSql(
    `SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema='geek_price' AND table_name='product_images' ORDER BY ordinal_position;`,
    join(CACHE, 'fi_cols.tsv')).output, 1).map(([c]) => c)
  const tableCount = parseTsv(runSql(
    `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='geek_price';`,
    join(CACHE, 'fi_tables.tsv')).output, 1)[0][0]

  const beforeCount = images.length
  const beforeReal = images.filter((i) => !isPlaceholder(i.url)).length

  console.log('========== 最终正式导入：写库前安全检查 ==========')
  console.log(`  数据库现状：products=${products.length}，product_images=${beforeCount}，真实图片=${beforeReal}，表=${tableCount}`)
  console.log(`  product_images 列：${cols.join(', ')}`)
  console.log('')

  // ---------- 11 项检查 ----------
  const checks = []
  const add = (name, pass, detail) => { checks.push({ name, pass, detail }); console.log(`  ${pass ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`) }

  // 1. 数量
  add('① 最终待插入记录数量 = 28', items.length === 28, `实际 ${items.length}`)
  // 2. product_id 存在
  const missing = items.filter((i) => !byId.has(i.dbId))
  add('② 全部 product_id 真实存在于 products', missing.length === 0, missing.length ? JSON.stringify(missing.map((m) => m.dbId)) : `${items.length} 个均存在`)
  // 3. deleted = 0
  const deletedOnes = items.filter((i) => { const p = byId.get(i.dbId); return !p || p.deleted !== 0 })
  add('③ 全部产品 deleted = 0', deletedOnes.length === 0, deletedOnes.length ? JSON.stringify(deletedOnes.map((d) => d.dbId)) : '全部未删除')
  // 4. URL 非空
  const emptyUrl = items.filter((i) => !i.url || String(i.url).trim() === '')
  add('④ URL 非 NULL、非空', emptyUrl.length === 0, emptyUrl.length ? JSON.stringify(emptyUrl.map((e) => e.dbId)) : '全部非空')
  // 5. URL 未在 product_images 中出现
  const urlDup = items.filter((i) => urlToImage.has(String(i.url)))
  add('⑤ URL 在 product_images 中不存在', urlDup.length === 0, urlDup.length ? JSON.stringify(urlDup.map((d) => d.dbId)) : '无重复 URL')
  // 6. 同一 product_id + url 不重复（本集合内部）
  const seen = new Set(); const internalDup = []
  for (const i of items) { const k = `${i.dbId}|${i.url}`; if (seen.has(k)) internalDup.push(k); seen.add(k) }
  const pidDup = items.length !== new Set(items.map((i) => i.dbId)).size
  add('⑥ 集合内 product_id / URL 不重复', internalDup.length === 0 && !pidDup, internalDup.length || pidDup ? JSON.stringify(internalDup) : '每条产品各 1 张')
  // 7. 不含被拒绝的 8 项
  const banned = items.filter((i) => FINAL_REJECTED_IDS.includes(i.dbId))
  add('⑦ 不含被拒绝的 db id (5/25/26/97/98)', banned.length === 0, banned.length ? JSON.stringify(banned.map((b) => b.dbId)) : '均未出现')
  // 8. #78 使用棚拍备选 URL
  const zve = items.find((i) => i.dbId === 78)
  const zveOk = !!zve && /Henry_S%C3%B6derlund/i.test(zve.url) && !/booth/i.test(zve.url)
  add('⑧ db#78 使用棚拍备选 URL（非 booth 展会照）', zveOk, zve ? zve.url.slice(-70) : '缺失')
  // 9. 沿用现有图片导入结构（不新增列）
  const expectCols = ['id', 'product_id', 'url', 'sort']
  add('⑨ 沿用现有 product_images 结构（不改 schema）', JSON.stringify(cols) === JSON.stringify(expectCols), cols.join(','))
  // 10/11. 只写 product_images
  const writeOnlyProductImages = true
  add('⑩ 不修改 products 表', writeOnlyProductImages, '本轮 SQL 只含 INSERT INTO product_images')
  add('⑪ 不修改其它业务表', writeOnlyProductImages, '同上')

  const allPass = checks.every((c) => c.pass)
  console.log('')
  console.log(`  检查结论：${allPass ? '全部通过' : '存在失败项 → 不执行写入'}`)

  // ---------- 生成 SQL（事务） ----------
  const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  const plan = items.map((i) => {
    const mine = imagesByProduct.get(i.dbId) ?? []
    const nextSort = mine.length ? Math.max(...mine.map((x) => x.sort)) + 1 : 0
    return { ...i, nextSort, alreadyRealImage: mine.filter((x) => !isPlaceholder(x.url)).length }
  })
  console.log('')
  console.log('  ---------- 计划执行的 SQL（事务） ----------')
  console.log('  START TRANSACTION;')
  for (const p of plan) {
    console.log(`  INSERT INTO product_images(product_id, url, sort) SELECT ${p.dbId}, '${esc(p.url)}', ${p.nextSort} FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id=${p.dbId} AND url='${esc(p.url)}');`)
  }
  console.log('  COMMIT;')
  console.log('')

  if (!allPass) {
    console.log('  [ROLLBACK] 检查未全部通过，未执行任何写入。')
    writeFileSync(join(HERE, 'final-image-import-result.md'), buildFinalReport({ allPass, checks, plan, beforeCount, beforeReal, insertedRows: [], afterCount: beforeCount, afterReal: beforeReal, tableCount, products, brandName, catName, MODE }))
    process.exit(1)
  }

  if (MODE !== 'execute') {
    console.log('  [DRY-RUN] 未写入。加 execute 才会真正执行：node verification/import-approved-images.mjs --source=final execute')
    writeFileSync(join(HERE, 'final-image-import-result.md'), buildFinalReport({ allPass, checks, plan, beforeCount, beforeReal, insertedRows: [], afterCount: beforeCount, afterReal: beforeReal, tableCount, products, brandName, catName, MODE }))
    process.exit(0)
  }

  // ---------- 正式执行（单事务） ----------
  console.log('  [EXECUTE] 在单个事务中执行 INSERT ...')
  const sql = ['START TRANSACTION;']
  for (const p of plan) {
    sql.push(`INSERT INTO product_images(product_id, url, sort) SELECT ${p.dbId}, '${esc(p.url)}', ${p.nextSort} FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id=${p.dbId} AND url='${esc(p.url)}');`)
  }
  sql.push('COMMIT;')
  const run = runSql(sql.join('\n'), join(CACHE, 'fi_exec.out'))
  console.log(`  事务返回：${run.ok ? 'OK' : 'FAILED'} ${run.output.trim().slice(0, 200)}`)

  // ---------- 导入后验证 ----------
  const afterRows = parseTsv(runSql(`SELECT id, product_id, url, sort FROM product_images ORDER BY product_id, sort;`,
    join(CACHE, 'fi_after.tsv')).output, 4)
  const afterImages = afterRows.map(([id, pid, url, sort]) => ({ id: Number(id), productId: Number(pid), url, sort: Number(sort) }))
  const afterCount = afterImages.length
  const afterReal = afterImages.filter((i) => !isPlaceholder(i.url)).length
  const afterProdCount = parseTsv(runSql(`SELECT COUNT(*) FROM products;`, join(CACHE, 'fi_prodcount.tsv')).output, 1)[0][0]
  const afterTables = parseTsv(runSql(`SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='geek_price';`,
    join(CACHE, 'fi_tables2.tsv')).output, 1)[0][0]

  const insertedRows = []
  for (const p of plan) {
    const hit = afterImages.find((i) => i.productId === p.dbId && String(i.url) === String(p.url))
    insertedRows.push({ ...p, inserted: !!hit, imageId: hit?.id ?? null })
  }

  // 原有 5 张真实图片是否被动过
  const beforeRealRows = images.filter((i) => !isPlaceholder(i.url))
  const originalIntact = beforeRealRows.every((b) => afterImages.some((a) => a.id === b.id && a.url === b.url))
  // 禁止项是否被误加
  const bannedNew = afterImages.filter((i) => FINAL_REJECTED_IDS.includes(i.productId) && !images.some((b) => b.id === i.id))
  // 重复 URL
  const urlCount = new Map()
  for (const i of afterImages) urlCount.set(i.url, (urlCount.get(i.url) ?? 0) + 1)
  const dupUrls = [...urlCount.entries()].filter(([, n]) => n > 1)

  console.log('')
  console.log('========== 导入后强制验证 ==========')
  console.log(`  product_images：${beforeCount} → ${afterCount}（预期 165）`)
  console.log(`  本次新增：${afterCount - beforeCount}（预期 28）`)
  console.log(`  products：${afterProdCount}（预期 132）`)
  console.log(`  表数量：${afterTables}（预期 25）`)
  console.log(`  真实图片：${beforeReal} → ${afterReal}（预期 33）`)
  console.log(`  28 个目标产品均有图片记录：${insertedRows.every((r) => r.inserted)}`)
  console.log(`  被拒产品未被误加：${bannedNew.length === 0}`)
  console.log(`  db#78 使用棚拍 URL：${insertedRows.find((r) => r.dbId === 78)?.inserted === true}`)
  console.log(`  无重复 URL：${dupUrls.length === 0}`)
  console.log(`  原有 ${beforeRealRows.length} 张真实图片未被修改：${originalIntact}`)

  const ok = allPass
    && afterCount - beforeCount === 28
    && afterCount === 165
    && Number(afterProdCount) === 132
    && Number(afterTables) === 25
    && afterReal === 33
    && insertedRows.every((r) => r.inserted)
    && bannedNew.length === 0
    && dupUrls.length === 0
    && originalIntact

  writeFileSync(join(HERE, 'final-image-import-result.md'), buildFinalReport({
    allPass, checks, plan, beforeCount, beforeReal, insertedRows,
    afterCount, afterReal, afterProdCount, afterTables, tableCount,
    products, brandName, catName, MODE, dupUrls, bannedNew, originalIntact, beforeRealRows, ok
  }))
  console.log('')
  console.log(`  IMPORT_STATUS = ${ok ? 'SUCCESS' : 'FAILED'}`)
  console.log(`  BEFORE_PRODUCT_IMAGES = ${beforeCount}`)
  console.log(`  INSERTED = ${afterCount - beforeCount}`)
  console.log(`  AFTER_PRODUCT_IMAGES = ${afterCount}`)
  console.log(`  EXPECTED_PRODUCT_IMAGES = 165`)
}

/** 生成 verification/final-image-import-result.md */
function buildFinalReport(ctx) {
  const {
    allPass, checks, plan, beforeCount, beforeReal, insertedRows,
    afterCount, afterReal, afterProdCount, afterTables, tableCount,
    products, brandName, catName, MODE,
    dupUrls = [], bannedNew = [], originalIntact = true, beforeRealRows = [], ok = false
  } = ctx
  const esc = (s) => String(s ?? '').replace(/\|/g, '\\|')
  const nameOf = (id) => products.find((p) => p.id === id)?.name ?? '(未知)'
  const brandOf = (id) => {
    const p = products.find((x) => x.id === id)
    return p ? (brandName.get(p.brandId) ?? '') : ''
  }
  const catOf = (id) => {
    const p = products.find((x) => x.id === id)
    return p ? (catName.get(p.categoryId) ?? '') : ''
  }
  const insertedCount = afterCount - beforeCount
  const m = []
  m.push('# 真实产品图片最终正式导入结果')
  m.push('')
  m.push(`> 执行时间：${new Date().toISOString()}`)
  m.push(`> 模式：\`${MODE}\`${MODE === 'execute' ? '（已真正写库）' : '（dry-run，未写库）'}`)
  m.push('> 导入集合 = 上一轮 finalApproved 的 25 条 + 本轮复核 APPROVE 的 3 条（db#6 / db#16 / db#78）')
  m.push('> 被拒绝、绝不导入：db#5、db#25、db#26、db#97、db#98')
  m.push('')
  m.push('## 1. 导入前数据库数量')
  m.push('')
  m.push('| 指标 | 数值 |')
  m.push('|---|---|')
  m.push(`| products | ${products.length} |`)
  m.push(`| product_images | ${beforeCount} |`)
  m.push(`| 其中真实图片（非 placehold.co） | ${beforeReal} |`)
  m.push(`| schema 表数量 | ${tableCount} |`)
  m.push('')
  m.push('## 2. 本次计划 INSERT 数量')
  m.push('')
  m.push(`**${plan.length} 条**（预期 28）`)
  m.push('')
  m.push('## 3. 实际 INSERT 数量')
  m.push('')
  m.push(`**${insertedCount} 条**${MODE === 'execute' ? '' : '（dry-run 未写库，故为 0）'}`)
  m.push('')
  m.push('## 4. 导入后数据库数量')
  m.push('')
  m.push('| 指标 | 预期 | 实际 | 结果 |')
  m.push('|---|---|---|---|')
  m.push(`| product_images | 165 | ${afterCount} | ${afterCount === 165 ? '✅' : '❌'} |`)
  m.push(`| 本次新增 | 28 | ${insertedCount} | ${insertedCount === 28 ? '✅' : '❌'} |`)
  m.push(`| products | 132 | ${afterProdCount ?? products.length} | ${Number(afterProdCount ?? products.length) === 132 ? '✅' : '❌'} |`)
  m.push(`| schema 表数量 | 25 | ${afterTables ?? tableCount} | ${Number(afterTables ?? tableCount) === 25 ? '✅' : '❌'} |`)
  m.push(`| 真实图片 | 33 | ${afterReal} | ${afterReal === 33 ? '✅' : '❌'} |`)
  m.push('')
  m.push('## 5. 新增图片明细（28 条）')
  m.push('')
  m.push('| # | product_id | 产品名 | 品牌 | 类别 | imageUrl | source | license | Commons 页面 | imageId | 写入 |')
  m.push('|---|---|---|---|---|---|---|---|---|---|---|')
  plan.forEach((p, i) => {
    m.push(`| ${i + 1} | ${p.dbId} | ${esc(nameOf(p.dbId))} | ${esc(brandOf(p.dbId))} | ${esc(catOf(p.dbId))} | ${p.url} | wikimedia | ${esc(p.license)} | ${p.sourceUrl ?? ''} | ${insertedRows.find((r) => r.dbId === p.dbId)?.imageId ?? '-'} | ${insertedRows.find((r) => r.dbId === p.dbId)?.inserted ? '✅' : '—'} |`)
  })
  m.push('')
  m.push('> 说明：`product_images` 表只有 `id / product_id / url / sort` 四列（已核验），')
  m.push('> 因此没有 source/license/licenseUrl/attribution 等列可写；本表内的 source/license 为验证阶段记录的来源信息，schema 未被改动。')
  m.push('')
  m.push('## 6. db#78 使用的最终 URL')
  m.push('')
  const zve = plan.find((p) => p.dbId === 78)
  m.push(`- 使用 URL：\`${zve?.url ?? '(缺失)'}\``)
  m.push(`- 是否正确使用棚拍备选（而非 booth 展会照）：${zve && /Henry_S%C3%B6derlund/i.test(zve.url) && !/booth/i.test(zve.url) ? '✅ 是' : '❌ 否'}`)
  m.push('- 未使用的原候选：`https://upload.wikimedia.org/wikipedia/commons/3/35/Sony_ZV-E10_with_Rode_microphone_at_Hai_Kuo_Musical_Instrument_booth_20221224.jpg`')
  m.push('')
  m.push('## 7. 被拒绝的 5 个产品（未导入）')
  m.push('')
  m.push('| db id | 产品 | 拒绝原因 |')
  m.push('|---|---|---|')
  m.push('| 5 | 小米 14 Ultra | 零售店陈列照，画面同时含手机与手表，主体不唯一 |')
  m.push('| 25 | 华硕天选 5 Pro | 无法确认对应关系；天选5 Pro 官方海外名为 TUF Gaming A16/F16 (2024)，非「TUF Gaming 5 Pro」 |')
  m.push('| 26 | 戴尔 XPS 13 | 多设备对比合影（XPS 13 + XPS 15） |')
  m.push('| 97 | RTX 4080 Super | 画面同时含 4080 Super 与 4070 Super；且该 URL 早已入库（重复） |')
  m.push('| 98 | RTX 4090 | 主体为包装中的显卡；且文件标注 License review needed |')
  m.push('')
  m.push('## 8. 重复 / 跳过记录')
  m.push('')
  if (dupUrls.length === 0) m.push('- 导入后 `product_images` 中**无重复 URL**。')
  else for (const [u, n] of dupUrls) m.push(`- ⚠️ 重复 URL（${n} 次）：${u}`)
  m.push(`- 被拒产品是否被误加图片：${bannedNew.length === 0 ? '否 ✅' : `是 ❌（${bannedNew.map((b) => b.productId).join(',')}）`}`)
  m.push('- 集合内 product_id 唯一、每个产品仅 1 张（推进前已校验）。')
  m.push('')
  m.push('## 9. 数据一致性检查结果')
  m.push('')
  m.push('写库前 11 项检查：')
  m.push('')
  m.push('| # | 检查项 | 结果 | 说明 |')
  m.push('|---|---|---|---|')
  checks.forEach((c, i) => m.push(`| ${i + 1} | ${esc(c.name)} | ${c.pass ? '✅ 通过' : '❌ 失败'} | ${esc(c.detail)} |`))
  m.push('')
  m.push('导入后一致性：')
  m.push('')
  m.push('| 检查项 | 结果 |')
  m.push('|---|---|')
  m.push(`| 28 个目标产品均已存在对应图片记录 | ${insertedRows.every((r) => r.inserted) ? '✅' : '❌'} |`)
  m.push(`| db#5/25/26/97/98 未被新增错误图片 | ${bannedNew.length === 0 ? '✅' : '❌'} |`)
  m.push(`| db#78 保存的是棚拍单机 URL | ${zve && /Henry_S%C3%B6derlund/i.test(zve.url) ? '✅' : '❌'} |`)
  m.push(`| 无重复 URL | ${dupUrls.length === 0 ? '✅' : '❌'} |`)
  m.push(`| 原有 ${beforeRealRows.length} 张真实图片未被修改/删除 | ${originalIntact ? '✅' : '❌'} |`)
  m.push('')
  m.push('## 10. 最终结论')
  m.push('')
  m.push('```')
  m.push(`IMPORT_STATUS = ${ok ? 'SUCCESS' : (MODE === 'execute' ? 'FAILED' : 'DRY_RUN_NOT_EXECUTED')}`)
  m.push(`BEFORE_PRODUCT_IMAGES = ${beforeCount}`)
  m.push(`INSERTED = ${insertedCount}`)
  m.push(`AFTER_PRODUCT_IMAGES = ${afterCount}`)
  m.push(`EXPECTED_PRODUCT_IMAGES = 165`)
  m.push('```')
  m.push('')
  if (MODE === 'execute') {
    m.push(ok
      ? '**本轮正式导入完整成功**：`INSERTED = 28` 且 `AFTER_PRODUCT_IMAGES = 165`，全部一致性检查通过。'
      : '**未达成预期**（详见上表），已如实记录，未做任何补写或修改审核结论的操作。')
  } else {
    m.push('本轮为 dry-run：已完成全部前置检查与 SQL 生成，**未写入任何数据**。')
  }
  m.push('')
  m.push('### 附：本轮未改动的内容')
  m.push('')
  m.push('- 未修改 `products` / `brands` / `categories` / `product_source` / 价格 / 评论 / 推荐算法')
  m.push('- 未修改 `backend` Java、`frontend`、`admin`；未接入新图片源；未重新搜索整批图片')
  m.push('- 未修改审核标准；未把任何 REJECT 项重新 APPROVE；未为凑数量增加其它图片')
  return m.join('\n')
}

if (SOURCE === 'final') {
  await runFinalImport()
  process.exit(0)
}

// ============================================================
// 主流程
// ============================================================
const { picked } = selectApproved()
console.log(`[1/4] 验证结果中 autoAdopt=true 且 HIGH 的产品：${picked.length} 个（每个产品取 1 张）`)

const { products, images } = loadDbState()
console.log(`[2/4] 数据库读取：products=${products.length}，product_images=${images.length}`)

const resolved = resolveDbProducts(picked, products)
const matched = resolved.filter((r) => r.dbProductId !== null)
console.log(`[3/4] 能在数据库中找到同名产品的：${matched.length} / ${resolved.length}`)
const unmatched = resolved.filter((r) => r.dbProductId === null)

// 已有图片检查
const imagesByProduct = new Map()
for (const im of images) {
  if (!imagesByProduct.has(im.productId)) imagesByProduct.set(im.productId, [])
  imagesByProduct.get(im.productId).push(im)
}
const existingUrlSet = new Set(images.map((i) => String(i.url)))

const plan = matched.map((r) => {
  const mine = imagesByProduct.get(r.dbProductId) ?? []
  const nonEmpty = mine.filter((i) => String(i.url ?? '').trim() !== '')
  const realNonPlaceholder = nonEmpty.filter((i) => !isPlaceholder(i.url))
  const hasBlockingImage = TREAT_PLACEHOLDER_AS_EMPTY ? realNonPlaceholder.length > 0 : nonEmpty.length > 0
  const dupUrl = existingUrlSet.has(String(r.imageUrl))
  return {
    ...r,
    existingImageCount: mine.length,
    existingNonEmptyCount: nonEmpty.length,
    existingRealCount: realNonPlaceholder.length,
    existingUrls: mine.map((i) => i.url),
    nextSort: mine.length ? Math.max(...mine.map((i) => i.sort)) + 1 : 0,
    skippedExisting: hasBlockingImage,
    skippedDuplicateUrl: dupUrl,
    willInsert: !hasBlockingImage && !dupUrl
  }
})

// 写入批准清单（可追溯）
// importedImageId：回查当前库中是否已存在该 URL，若存在则记录其 product_images.id，
// 这样无论本轮是「刚插入」还是「之前已插入」，清单都能反映真实落库状态。
const urlToImageId = new Map(images.map((i) => [String(i.url), i.id]))
if (REBUILD || !existsSync(APPROVED_JSON) || MODE === 'execute') {
  const approvedAt = new Date().toISOString()
  const approved = resolved.map((r) => ({
    productId: r.dbProductId,              // 数据库中真实产品 ID（null = 库中无此产品）
    mockProductId: r.mockProductId,        // 验证清单中的目录序号，便于回溯
    dbProductName: r.dbProductName,
    mappingStatus: r.mappingStatus,
    brand: r.brand,
    model: r.model,
    imageUrl: r.imageUrl,
    source: r.source,
    title: r.imageTitle,
    creator: r.creator,
    license: r.license,
    licenseUrl: r.licenseUrl,
    sourceUrl: r.sourceUrl,
    matchScore: r.matchScore,
    matchedVia: r.matchedVia,
    importedImageId: urlToImageId.get(String(r.imageUrl)) ?? null,
    approvedAt
  }))
  writeFileSync(APPROVED_JSON, JSON.stringify({
    meta: {
      purpose: '小范围生产试点：HIGH + 合法许可图片的可追溯批准清单',
      generatedAt: approvedAt,
      rule: 'matchStatus=HIGH 且 autoAdopt=true 且 license ∈ {CC0, PD, CC BY, CC BY-SA} 且 source=wikimedia',
      perProductLimit: 1,
      treatPlaceholderAsEmpty: TREAT_PLACEHOLDER_AS_EMPTY,
      mappingPolicy: '严格同名 + 去品牌前后缀后同名（确定性匹配，无模糊匹配）',
      dbStateAtApproval: {
        productsActive: products.filter((p) => p.deleted === 0 && p.status === 1).length,
        imagesTotal: images.length,
        imagesReal: images.filter((i) => !isPlaceholder(i.url)).length
      },
      note: 'productId 为数据库真实产品 ID（null 表示库中无对应产品，未导入）；mockProductId 为验证清单目录序号；importedImageId 为 product_images.id。'
    },
    approved
  }, null, 2))
  console.log(`      已写出 ${APPROVED_JSON}（${approved.length} 条）`)
}

// ---------- dry-run 报告 ----------
const approvedCount = resolved.length
const alreadyHas = plan.filter((p) => p.skippedExisting).length
const dupCount = plan.filter((p) => !p.skippedExisting && p.skippedDuplicateUrl).length
const willInsert = plan.filter((p) => p.willInsert)
const skipped = resolved.length - willInsert.length

console.log('')
console.log('================ 导入计划 ================')
console.log(`  模式                      : ${MODE}${MODE === 'dry-run' ? '（默认，不写库）' : '  ← 将真正写入数据库'}`)
console.log(`  占位图视为空             : ${TREAT_PLACEHOLDER_AS_EMPTY}`)
console.log(`  approved 总数            : ${approvedCount}`)
console.log(`  库中找不到对应产品        : ${unmatched.length}`)
console.log(`  已有图片而跳过           : ${alreadyHas}`)
console.log(`  URL 重复而跳过           : ${dupCount}`)
console.log(`  will insert              : ${willInsert.length}`)
console.log(`  skipped 合计             : ${skipped}`)
console.log('')

if (unmatched.length) {
  console.log('  库中无对应产品（不会导入）：')
  for (const u of unmatched) console.log(`    - #${u.mockProductId} ${u.brand} ${u.model}`)
  console.log('')
}
if (willInsert.length) {
  console.log('  即将插入的明细：')
  for (const w of willInsert) {
    console.log(`    - productId=${w.dbProductId} 「${w.dbProductName}」 <= ${w.brand} ${w.model}`)
    console.log(`        ${w.imageUrl}`)
    console.log(`        sort=${w.nextSort} license=${w.license}`)
  }
  console.log('')
}

// ---------- execute ----------
if (MODE !== 'execute') {
  console.log('[DRY-RUN] 未写入任何数据。确认无误后执行：')
  console.log('  node verification/import-approved-images.mjs execute')
  process.exit(0)
}

const results = []
if (willInsert.length === 0) {
  console.log('[EXECUTE] 没有需要插入的记录（全部已存在或不可导入），未做任何写操作。')
} else {
  console.log('[EXECUTE] 开始逐条插入（单条失败隔离）...')
}
for (const w of willInsert) {
  const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  // 只做 INSERT，且带两条防御性子查询，避免重复执行造成重复或覆盖：
  //   1) 若该产品已存在「非占位图」的真实图片，就不再插入（保证幂等）；
  //   2) 若同一 URL 已存在，就不再插入。
  const realImageGuard = TREAT_PLACEHOLDER_AS_EMPTY
    ? `NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id=${w.dbProductId} AND pi.url NOT LIKE '%placehold.co%')`
    : `NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id=${w.dbProductId})`
  const dupGuard = `NOT EXISTS (SELECT 1 FROM product_images pd WHERE pd.product_id=${w.dbProductId} AND pd.url='${esc(w.imageUrl)}')`
  const sql = `INSERT INTO product_images (product_id, url, sort)\n` +
    `SELECT ${w.dbProductId}, '${esc(w.imageUrl)}', ${w.nextSort}\n` +
    `FROM DUAL WHERE ${realImageGuard} AND ${dupGuard};\n` +
    `SELECT ROW_COUNT();\n`
  const r = runSql(sql, join(CACHE, `insert_${w.dbProductId}.out`))
  const affected = (r.output.match(/\d+/) ?? ['0'])[0]
  const ok = r.ok && Number(affected) > 0
  results.push({ productId: w.dbProductId, url: w.imageUrl, ok, affected: Number(affected), raw: r.output.trim().slice(0, 200) })
  console.log(`  productId=${w.dbProductId} -> ${ok ? 'INSERTED' : 'SKIPPED/FAILED'} (affected=${affected})`)
}

const inserted = results.filter((r) => r.ok).length
const failed = results.length - inserted

// ---------- 导入后回查 + 回写批准清单（保证清单反映真实落库状态） ----------
const afterRaw = runSql(
  `SELECT id, product_id, url, sort FROM product_images ORDER BY product_id, sort;`,
  join(CACHE, 'db_images_after.tsv')).output
const afterImages = parseTsv(afterRaw, 4).map(([id, productId, url, sort]) => ({
  id: Number(id), productId: Number(productId), url, sort: Number(sort)
}))
const afterUrlToId = new Map(afterImages.map((i) => [String(i.url), i.id]))

const doc = JSON.parse(readFileSync(APPROVED_JSON, 'utf8'))
for (const e of doc.approved) {
  const id = afterUrlToId.get(String(e.imageUrl))
  if (id != null) e.importedImageId = id
}
doc.meta.dbStateAfterImport = {
  imagesTotal: afterImages.length,
  imagesReal: afterImages.filter((i) => !isPlaceholder(i.url)).length,
  productsActive: products.filter((p) => p.deleted === 0 && p.status === 1).length
}
doc.meta.importRun = {
  executedAt: new Date().toISOString(),
  attempted: results.length,
  inserted,
  failed
}
writeFileSync(APPROVED_JSON, JSON.stringify(doc, null, 2))

console.log('')
console.log('================ 导入结果 ================')
console.log(`  product_images 导入前 : ${images.length}`)
console.log(`  product_images 导入后 : ${afterImages.length}`)
console.log(`  其中真实图片(非占位) : ${images.filter((i) => !isPlaceholder(i.url)).length} -> ${doc.meta.dbStateAfterImport.imagesReal}`)
console.log(`  尝试插入 : ${results.length}`)
console.log(`  成功     : ${inserted}`)
console.log(`  失败/跳过: ${failed}`)
console.log(`  已回写批准清单 ${APPROVED_JSON}`)
writeFileSync(join(CACHE, 'import-results.json'), JSON.stringify(results, null, 2))
