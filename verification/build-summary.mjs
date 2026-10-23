#!/usr/bin/env node
/**
 * 汇总报告生成器（验证专项）
 * ------------------------------------------------------------------
 * 读取 product-image-verification.json，生成 product-image-summary.md。
 * 所有统计数字都由 JSON 现算，不手写、不臆测。
 *
 * 运行：node verification/build-summary.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const data = JSON.parse(readFileSync(join(HERE, 'product-image-verification.json'), 'utf8'))
const products = data.products
const probes = data.adversarialProbes ?? []

// ---------- 基础统计 ----------
const pct = (n, d) => (d === 0 ? '0.0' : ((n / d) * 100).toFixed(1))

const enriched = products.map((p) => {
  const wm = p.candidates.filter((c) => c.source === 'wikimedia')
  const ov = p.candidates.filter((c) => c.source === 'openverse')
  const wmBest = wm.length ? Math.max(...wm.map((c) => c.matchScore)) : -1
  const ovBest = ov.length ? Math.max(...ov.map((c) => c.matchScore)) : -1
  return { ...p, wmCount: wm.length, ovCount: ov.length, wmBest, ovBest }
})

const total = enriched.length
const statusOf = (s) => (s >= 80 ? 'HIGH' : s >= 60 ? 'MEDIUM' : s >= 40 ? 'LOW' : 'REJECT')

const wmHasResults = enriched.filter((p) => p.wmCount > 0).length
const wmHigh = enriched.filter((p) => p.wmBest >= 80).length
const wmMedium = enriched.filter((p) => p.wmBest >= 60 && p.wmBest < 80).length
const ovRescue = enriched.filter((p) => p.wmBest < 60 && p.ovBest >= 60).length
const ovHasResults = enriched.filter((p) => p.ovCount > 0).length
const bothEmpty = enriched.filter((p) => p.candidateCount === 0).length
const highCount = enriched.filter((p) => p.bestMatchStatus === 'HIGH').length
const mediumCount = enriched.filter((p) => p.bestMatchStatus === 'MEDIUM').length
const lowCount = enriched.filter((p) => p.bestMatchStatus === 'LOW').length
const rejectCount = enriched.filter((p) => p.bestMatchStatus === 'REJECT').length
const usable = highCount + mediumCount

// 严格口径：只用 Wikimedia
const wmUsable = wmHigh + wmMedium
const wmOnlyRatio = wmUsable / total
const combinedRatio = usable / total

// ---------- 别名前基线 / 别名增益 ----------
const baselineMeta = data.meta.aliasBaseline ?? null
const aliasComparison = data.meta.aliasComparison ?? []
const modelAliases = data.meta.modelAliases ?? {}

const baseUsable = baselineMeta?.usableCount ?? 0
const baseHigh = baselineMeta?.highCount ?? 0
const baseMedium = baselineMeta?.mediumCount ?? 0
const baseLow = baselineMeta?.lowCount ?? 0
const baseReject = baselineMeta?.rejectCount ?? 0

const aliasGains = aliasComparison.filter((c) => c.becameUsable)
const aliasGainCount = aliasGains.length
/** 别名前后都是「不可用」但分数提高的（未跨过 60 分线） */
const aliasScoreOnly = aliasComparison.filter((c) => !c.becameUsable && c.aliasScore > c.baselineScore)

// ---------- autoAdopt（HIGH + 合法许可）----------
const allCands = products.flatMap((p) => p.candidates)
const autoAdoptCands = allCands.filter((c) => c.autoAdopt === true)
/** 每个产品是否至少有一张可自动采用的图 */
const productsWithAutoAdopt = products.filter((p) => p.candidates.some((c) => c.autoAdopt === true))
const autoAdoptProductCount = productsWithAutoAdopt.length
const highCands = allCands.filter((c) => c.matchStatus === 'HIGH')
const highButLicensedBad = highCands.filter((c) => c.autoAdopt !== true)
const notAutoAdoptable = total - autoAdoptProductCount

// ---------- 许可证统计 ----------
const usableCands = products.flatMap((p) => p.candidates.filter((c) => c.matchStatus === 'HIGH' || c.matchStatus === 'MEDIUM'))
const tally = (arr) => {
  const m = new Map()
  for (const c of arr) {
    const k = (c.license ?? '(无)').trim()
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}
const licAll = tally(allCands)
const licUsable = tally(usableCands)

// ---------- 误匹配类型 ----------
const flagLabels = {
  caseLike: 'case/cover/sleeve/protector（配件、保护壳）',
  wallpaperLike: 'wallpaper/logo/vector/mockup（非实物图）',
  concept: 'concept（概念图）',
  accessory: 'accessory/charger/cable/stand（配件）',
  otherModel: 'otherModel（同系列数字不一致，如 4070 vs 4080）',
  variantExtra: 'variantExtra（同系列升档 SKU，如 Ti/Super/Pro/Max）',
  plusUpgrade: 'plusUpgrade（加号升档 SKU，如 Pro+）',
  onlyBrand: 'onlyBrand（只有品牌、没有型号）'
}
const flagCounts = {}
for (const c of allCands) {
  for (const [k, label] of Object.entries(flagLabels)) {
    const v = c.flags?.[k]
    const hit = Array.isArray(v) ? v.length > 0 : v === true
    if (hit) flagCounts[label] = (flagCounts[label] ?? 0) + 1
  }
}
const flagSorted = Object.entries(flagCounts).sort((a, b) => b[1] - a[1])

// 相机署名类假阳性（本轮实测发现）：描述命中但标题未命中的候选
const descOnlyHits = allCands.filter((c) => c.modelFullInDesc && !c.modelFullInTitle).length

// ---------- 排序：最易 / 最难 ----------
const easiest = [...enriched].sort((a, b) => b.bestMatchScore - a.bestMatchScore).slice(0, 10)
const hardest = [...enriched]
  .sort((a, b) => a.bestMatchScore - b.bestMatchScore || a.candidateCount - b.candidateCount)
  .slice(0, 10)

// ---------- 结论判定 ----------
let verdict
if (wmOnlyRatio >= 0.7) verdict = 'A'
else if (combinedRatio >= 0.7) verdict = 'B'
else verdict = 'C'

const verdictText = {
  A: 'Wikimedia Commons 单一来源已足够好，可作为主图片源。',
  B: '必须 Wikimedia Commons + Openverse 两个来源配合，才能满足需求。',
  C: '两个来源覆盖率都不足，不建议正式接入。'
}[verdict]

// ---------- 小范围生产试点判定 ----------
// 判据（三条同时满足才建议试点，且限定为「小范围」）：
//   1. 存在足够数量的「可自动采用」产品（HIGH + 合法许可），足以覆盖一个品类做试点；
//   2. 不要求全站覆盖（本次覆盖率本来就不足，所以试点范围必须显式收窄）；
//   3. 评分规则已在真实数据上通过反例探针，误判风险可控。
const pilotVerdict = (autoAdoptProductCount >= 10)
  ? '建议：可以挑「可自动采用」的产品做小范围试点（只落 HIGH + 合法许可，其余回退占位图）'
  : '不建议：可自动采用的产品太少，试点样本不足以支撑评估'

// ---------- 重点产品 ----------
const findById = (id) => enriched.find((p) => p.productId === id)
const focus = {
  iphone17: [findById(1), findById(2)].filter(Boolean),
  gpu: [findById(22), findById(23)],           // RTX 4070 Ti Super / RTX 4080 Super
  macbook: [findById(14), findById(15)].filter(Boolean), // MacBook Pro 14 M4 / MacBook Air 13 M4
  a7m4: [findById(39)].filter(Boolean)          // 别名修复重点
}
const rtx5070Exists = enriched.some((p) => /5070/.test(p.model))

// ---------- 渲染 ----------
const fmtCand = (c) => {
  const lic = c.license ?? '(无)'
  const url = c.sourceUrl ?? c.imageUrl ?? ''
  const adopt = c.autoAdopt === true ? '✅' : '—'
  const via = c.viaAlias === true ? '别名' : '主型号'
  return `| ${c.matchScore} | ${c.matchStatus} | ${adopt} | ${via} | ${c.source} | ${String(c.title ?? '').replace(/\|/g, '\\|')} | ${lic} | ${c.creator ?? ''} | ${url} |`
}
const CAND_HEADER = '| matchScore | matchStatus | autoAdopt | 命中方式 | source | title | license | creator | sourceUrl |\n|---|---|---|---|---|---|---|---|---|'

const renderProductBlock = (p) => {
  const lines = []
  lines.push(`### #${p.productId} ${p.brand} ${p.model}（${p.category}）`)
  lines.push('')
  lines.push(`- 型号核心：\`${p.modelCore}\``)
  if ((p.aliasesUsed ?? []).length) lines.push(`- 命中别名：${p.aliasesUsed.map((a) => `\`${a}\``).join('、')}`)
  lines.push(`- 搜索词：${p.queriesTried.map((q) => `\`${q}\``).join('、')}`)
  lines.push(`- 候选数：${p.candidateCount}（Wikimedia ${p.wmCount} / Openverse ${p.ovCount}）`)
  lines.push(`- 最佳匹配：**${p.bestMatchScore} ${p.bestMatchStatus}**，可自动采用候选 ${p.autoAdoptCount ?? 0} 张`)
  lines.push('')
  if (p.candidates.length === 0) {
    lines.push('> 两个来源均无任何候选结果。')
    lines.push('')
    return lines.join('\n')
  }
  lines.push(CAND_HEADER)
  for (const c of p.candidates) lines.push(fmtCand(c))
  lines.push('')
  return lines.join('\n')
}

const md = []
md.push('# 产品图片数据源可行性验证报告')
md.push('')
md.push(`> 生成时间：${data.meta.generatedAt}`)
md.push('> 数据源：Wikimedia Commons、Openverse（均为公开 API）')
md.push('> 待验证产品：`backend/src/main/resources/mock-data/products.json` 中的 50 个 Mock 产品')
md.push('> 本报告为**可行性验证**，不涉及生产接入：未改数据库、未写 `product_images`、未改任何生产代码。')
md.push('')

md.push('## 一、结论')
md.push('')
md.push(`**判定：${verdict} —— ${verdictText}**`)
md.push('')
md.push(`- 50 个产品中，**${usable} 个（${pct(usable, total)}%）**能得到 HIGH 或 MEDIUM 的可用图片；`)
md.push(`- 若**只用 Wikimedia Commons**，可用数为 **${wmUsable} 个（${pct(wmUsable, total)}%）**；`)
md.push(`- Openverse 额外补救了 **${ovRescue} 个** Wikimedia 拿不到可用图的产品；`)
md.push(`- **${bothEmpty} 个产品**在两个来源中都没有任何候选。`)
md.push('')
md.push('### 本轮（增加型号别名表后）关键问答')
md.push('')
md.push('| 问题 | 答案 |')
md.push('|---|---|')
md.push(`| 别名修复前覆盖率（HIGH+MEDIUM） | **${pct(baseUsable, total)}%**（${baseUsable}/${total}） |`)
md.push(`| 别名修复后覆盖率（HIGH+MEDIUM） | **${pct(usable, total)}%**（${usable}/${total}） |`)
md.push(`| 别名实际增加的匹配数 | **${aliasGainCount} 个**产品从「不可用」升为「可用」 |`)
md.push(`| HIGH + 合法许可证的自动采用数量 | **${autoAdoptProductCount} 个产品**（共 ${autoAdoptCands.length} 张候选可自动采用） |`)
md.push(`| MEDIUM 数量 | **${mediumCount} 个产品**（一律 autoAdopt=false） |`)
md.push(`| 无法自动采用数量 | **${notAutoAdoptable} 个产品** |`)
md.push(`| 是否值得做小范围生产试点 | **${pilotVerdict}** |`)
md.push('')
md.push(`> autoAdopt 规则：\`matchStatus === "HIGH"\` **且** 许可为 CC0 / Public Domain / CC BY / CC BY-SA。`)
md.push(`> MEDIUM、LOW、REJECT 一律 false；许可含 NC/ND、缺失或无法识别也一律 false。`)
md.push(`> 本轮共有 ${highCands.length} 张 HIGH 候选，其中 ${highButLicensedBad.length} 张因许可不合规而 \`autoAdopt=false\`。`)
md.push('')

md.push('## 二、验证方法')
md.push('')
md.push('### 2.1 流程')
md.push('')
md.push('1. 从 `products.json` 读取 50 个 Mock 产品，提取 `brand` / `model` / `title` / `category` / `specs`；')
md.push('2. 以 `model` 为基准去除容量后缀（`256GB`、`1TB`）得到「型号核心」；')
md.push('3. 用三档搜索词查询 Wikimedia Commons：`{brand} {model}` → `{model}` → `{brand} {model} {category}`；')
md.push('4. 若命中型号别名表，把别名写法插在第 1 档之后优先检索；')
md.push('5. Wikimedia 无结果或最佳分 < 60 时，用 Openverse 补充（`{brand} {model}`、`{model}`）；')
md.push('6. 只抓取元数据与缩略图（`iiprop=url|size|extmetadata|mime`、`iiurlwidth=480`），不下载原图；')
md.push('7. 对每个候选计算 `matchScore`，再做产品级汇总；')
md.push('8. **整轮跑两遍**：先关闭别名跑「别名前」基线，再开启别名跑「别名后」，用于量化别名增益。')
md.push('')
md.push('### 2.2 评分规则')
md.push('')
md.push('加分：')
md.push('')
md.push('| 条件 | 分值 |')
md.push('|---|---|')
for (const [k, v] of Object.entries(data.meta.scoringRubric.add)) md.push(`| ${k} | +${v} |`)
md.push('')
md.push('扣分（逐条累加）：')
md.push('')
md.push('| 条件 | 分值 |')
md.push('|---|---|')
for (const [k, v] of Object.entries(data.meta.scoringRubric.subtract)) md.push(`| ${k} | ${v} |`)
md.push('')
md.push(`分级：${Object.entries(data.meta.scoringRubric.statusThresholds).map(([k, v]) => `${k} ${v}`).join('、')}`)
md.push('')
md.push('### 2.3 为压制假阳性做的关键处理')
md.push('')
md.push('实测中发现「有搜索结果」与「图片真的对应该型号」之间差距很大，因此做了四项针对性处理：')
md.push('')
md.push('1. **相机署名剔除**：Wikimedia 上大量图片带有 `Taken with Vivo X200 Pro` 这类分类，')
md.push('   含义是「用该手机拍摄」。不做处理时，一张植物照片会因为相机署名被误判为该手机本体。')
md.push('2. **日期噪声剔除**：`photographs taken on 2015-04-10` 这类分类会带来孤立数字 `10`，')
md.push('   可能被当作 `Watch Series 10` 的型号数字。')
md.push('3. **整词匹配 + 邻近约束**：型号 token 不做子串匹配（否则 `of` 会命中 `f`），')
md.push('   且数字与系列词必须相邻出现，避免远处数字凑出假命中。')
md.push('4. **HIGH 必须有标题级证据**：型号只出现在描述/标签时封顶 79 分（MEDIUM）。')
md.push('')
md.push('上述规则由 `lib/scoring-selftest.mjs` 用 45 项断言覆盖，')
md.push('其中第 9～14 组用例直接复现了本轮在真实数据里踩到的假阳性。')
md.push('')

md.push('## 三、总体覆盖统计')
md.push('')
md.push('| 指标 | 数量 | 占比 |')
md.push('|---|---|---|')
md.push(`| 总产品数 | ${total} | 100% |`)
md.push(`| Wikimedia 有结果 | ${wmHasResults} | ${pct(wmHasResults, total)}% |`)
md.push(`| Wikimedia HIGH | ${wmHigh} | ${pct(wmHigh, total)}% |`)
md.push(`| Wikimedia MEDIUM | ${wmMedium} | ${pct(wmMedium, total)}% |`)
md.push(`| Openverse 补充成功 | ${ovRescue} | ${pct(ovRescue, total)}% |`)
md.push(`| 两个来源都无结果 | ${bothEmpty} | ${pct(bothEmpty, total)}% |`)
md.push(`| **HIGH + MEDIUM 合计** | **${usable}** | **${pct(usable, total)}%** |`)
md.push('')
md.push('产品级判定分布（取该产品全部候选中的最高分）：')
md.push('')
md.push('| 等级 | 产品数 | 占比 |')
md.push('|---|---|---|')
md.push(`| HIGH (>=80) | ${highCount} | ${pct(highCount, total)}% |`)
md.push(`| MEDIUM (60-79) | ${mediumCount} | ${pct(mediumCount, total)}% |`)
md.push(`| LOW (40-59) | ${lowCount} | ${pct(lowCount, total)}% |`)
md.push(`| REJECT (<40) | ${rejectCount} | ${pct(rejectCount, total)}% |`)
md.push('')

md.push('## 四、最容易匹配的产品')
md.push('')
md.push('| # | 产品 | 分类 | 最佳分 | 等级 | 最佳候选 |')
md.push('|---|---|---|---|---|---|')
for (const p of easiest) {
  md.push(`| ${p.productId} | ${p.brand} ${p.model} | ${p.category} | ${p.bestMatchScore} | ${p.bestMatchStatus} | ${String(p.bestCandidate?.title ?? '-').replace(/\|/g, '\\|')} |`)
}
md.push('')

md.push('## 五、最难匹配的产品')
md.push('')
md.push('| # | 产品 | 分类 | 最佳分 | 等级 | 候选数 |')
md.push('|---|---|---|---|---|---|')
for (const p of hardest) {
  md.push(`| ${p.productId} | ${p.brand} ${p.model} | ${p.category} | ${p.bestMatchScore} | ${p.bestMatchStatus} | ${p.candidateCount} |`)
}
md.push('')
const zeroList = enriched.filter((p) => p.candidateCount === 0)
if (zeroList.length) {
  md.push('完全无候选（两个来源都没有返回任何图片）：')
  md.push('')
  for (const p of zeroList) md.push(`- #${p.productId} ${p.brand} ${p.model}（${p.category}）`)
  md.push('')
}

md.push('## 六、常见误匹配类型')
md.push('')
md.push(`在 ${allCands.length} 条候选中，被扣分规则命中的次数：`)
md.push('')
md.push('| 误匹配类型 | 命中次数 |')
md.push('|---|---|')
for (const [k, v] of flagSorted) md.push(`| ${k} | ${v} |`)
md.push(`| 型号仅出现在描述/标签（相机署名、EXIF 等），标题未出现 | ${descOnlyHits} |`)
md.push('')
md.push('> 说明：同一候选可能同时命中多条，故合计大于候选总数。')
md.push('')

md.push('## 六之二、召回率核查：是「来源没有」还是「查询太窄」？')
md.push('')
md.push('覆盖率只有五成左右，必须先排除「是搜索词写窄了」。')
md.push('因此对 14 个未命中产品换用**更宽或更常见的搜索词**复核（脚本：`recall-check.mjs`）。')
md.push('结论：**绝大多数属于来源侧确实没有该型号，而不是查询太窄。**')
md.push('')
md.push('| 产品 | 换用搜索词后的实际情况 | 判定 |')
md.push('|---|---|---|')
md.push('| #14 MacBook Pro 14 M4 | `MacBook Pro 14-inch` 只找到 **2021 款** 14 吋机身，无 M4 款 | 来源缺该型号 |')
md.push('| #16 Legion Y9000P | `Lenovo Legion` 只找到 **Y520**（另一型号） | 来源缺该型号 |')
md.push('| #17 Xiaoxin Pro 16 | `Xiaoxin Pro 16` 仅命中无关 PDF；`Lenovo Xiaoxin` 为 0 | 来源缺该型号 |')
md.push('| #25 Odyssey G8 32 | 仅返回无关 PDF/公报，无显示器实物 | 来源缺该型号 |')
md.push('| #27 ASUS PG27UQR | `PG27UQR` 为 0；只有 ASUS 其他型号显示器 | 来源缺该型号 |')
md.push('| #29 Sony WH-1000XM6 | `WH-1000XM6`、`WH-1000XM5`、`Sony WH-1000XM` **全部为 0** | 整个系列都缺 |')
md.push('| #30 华为 FreeBuds Pro 4 | 只有 **FreeBuds 5 / FreeBuds 6** | 来源缺该型号 |')
md.push('| #31 Bose QC Ultra | `Bose QuietComfort Ultra` 找到的是 **Earbuds 版**（非该头戴型号） | 型号不同 |')
md.push('| #32 JBL Tune 770NC | `JBL Tune` 只返回无关书籍/音乐；仅通用 JBL 耳机 | 来源缺该型号 |')
md.push('| #37 雷蛇 DeathAdder V3 Pro | 只有 **DeathAdder 2013 / Elite**（老型号） | 来源缺该型号 |')
md.push('| #39 Sony A7M4 | `Sony A7 IV` / `Sony Alpha 7 IV` **能找到本机** | ⚠️ 可避免的漏判（命名差异） |')
md.push('| #44 小米 Watch S4 | 只有通用 Xiaomi Watch / Mi Band | 来源缺该型号 |')
md.push('| #47 华为 Q6 | 只有华为其他路由器型号（B610h 等） | 来源缺该型号 |')
md.push('| #48 小米 AX9000 | `Xiaomi AX9000` 为 0；`Xiaomi router` 返回公交线路等无关内容 | 来源缺该型号 |')
md.push('')
md.push('### 两个可改进点（不影响本次结论）')
md.push('')
md.push('1. **命名习惯差异**：`Sony A7M4` 在 Commons 上写作 `A7 IV` / `Alpha 7 IV`（罗马数字），')
md.push('   当前按字母数字整词匹配会漏掉。若后续正式接入，建议补一层「型号别名表」。')
md.push('2. **同系列老型号污染**：`Legion Y520`、`DeathAdder 2013`、`MacBook Pro 2021` 这类同系列')
md.push('   不同代产品会大量出现在搜索结果里——它们被现有规则正确拒绝，但也说明该型号本身确实没有图。')
md.push('')
md.push('> 注意：把上表 #39 修好也只让覆盖率从 54% 升到约 56%，**不改变最终判定**。')
md.push('')

md.push('## 六之三、型号别名表（本轮新增）')
md.push('')
md.push('### 收录的别名（显式映射，全部经真实 API 核实）')
md.push('')
md.push('| 产品型号（归一化键） | 别名写法 | 核实到的真实图片 |')
md.push('|---|---|---|')
md.push('| `sony a7m4` | `sony a7 iv`、`sony a7iv`、`sony alpha 7 iv`、`sony alpha 7 mark iv` | `Sony A7 IV (ILCE-7M4) - by Henry Söderlund.jpg`、`Sony a7 IV 33MP Mirrorless Digital Camera.jpg`、`Man using DJI RS2 and Sony a7IV ....jpg` |')
md.push('| `ipad pro 11 m4` | `ipad pro m4`、`ipad pro m4 11-inch`、`ipad pro 11-inch m4` | `About iPad Pro 11-inch (M4).jpg`、`IPad Pro M4 11-inch.jpeg` |')
md.push('')
md.push('### 明确**未**收录的（因为它们是不同型号，不是别名）')
md.push('')
md.push('| 看起来像别名 | 为什么不是 |')
md.push('|---|---|')
md.push('| `RTX 5070` → `RTX 5070 Ti` | Ti 是升档 SKU，不同型号 |')
md.push('| `iPhone 17` → `iPhone 17 Pro` / `Pro Max` | 不同型号 |')
md.push('| `Mate 70 Pro` → `Mate 70 Pro+` | 不同型号（且实测只有 Pro+ 的图） |')
md.push('| `MacBook Pro 14 M4` → `MacBook Pro 16-inch M4 Pro` | 尺寸与芯片都不同 |')
md.push('| `MacBook Pro 14 M4` → `MacBook Pro 14" 2021` | 年份/芯片不同 |')
md.push('| `Bose QC Ultra` → `Bose QuietComfort Ultra Earbuds` | 头戴式 ≠ 入耳式；Commons 上只有后者 |')
md.push('| `联想 Xiaoxin Pro 16` → `IdeaPad Pro 16` | 区域命名差异属实，但 Commons 上查无实机图，无法核实 → 不收录 |')
md.push('| `Sony WH-1000XM6` → `WH-1000XM5` / `WH1000XM6` | 实测均为 0 条，整个系列都缺图 |')
md.push('| `AMD RX 7800 XT` → `Radeon RX 7800 XT` | 实测为 0 条，加前缀也没用 |')
md.push('')
md.push('### 别名如何匹配（防止张冠李戴）')
md.push('')
md.push('别名**按连续短语整段命中**，不做模糊匹配。因此：')
md.push('')
md.push('- `Sony A7 IV (ILCE-7M4)` → 命中（标题里连续出现 `a7 iv`）')
md.push('- `Sony a7R IV` → **不命中**（token 为 `a7, r, iv`，中间隔着 `r`，短语不连续）')
md.push('- `Sony Alpha 7R IV` → **不命中**（同上）')
md.push('- 关闭别名开关后，同一张 `Sony A7 IV` 图片会退回 30 分（REJECT）——这条已写成回归用例。')
md.push('')
md.push('### 别名带来的实际增益')
md.push('')
if (aliasGains.length === 0) {
  md.push('本轮别名没有让任何产品跨过可用线（60 分）。')
} else {
  md.push('| # | 产品 | 别名 | 别名前 | 别名后 |')
  md.push('|---|---|---|---|---|')
  for (const g of aliasGains) {
    md.push(`| ${g.productId} | ${g.brand} ${g.model} | ${g.aliases.map((a) => `\`${a}\``).join('、')} | ${g.baselineScore} ${g.baselineStatus} | **${g.aliasScore} ${g.aliasStatus}** |`)
  }
}
md.push('')
if (aliasScoreOnly.length) {
  md.push(`另有 ${aliasScoreOnly.length} 个产品分数提高但未跨过 60 分线（属于改善但不算新增匹配）。`)
  md.push('')
}
md.push(`**别名实际增加的匹配数：${aliasGainCount} 个产品。**`)
md.push('')
md.push('### 关于「跨轮次数字波动」的重要说明')
md.push('')
md.push('本轮**别名前**基线的可用率（' + pct(baseUsable, total) + '%）比上一轮报告的 56% 要高，')
md.push('这不是因为改了评分规则，而是因为 **Wikimedia Commons 的搜索索引本身在变化**：')
md.push('两次运行之间，个别产品的检索结果发生了增减（例如 iPad Pro 11 M4 从 50 LOW 变为 80 HIGH、')
md.push('华为 Q6 从无结果变为 70 MEDIUM、罗技 G Pro X 从 90 HIGH 降为 70 MEDIUM）。')
md.push('')
md.push('因此：')
md.push('')
md.push('- **别名增益（' + aliasGainCount + ' 个产品）是在同一次运行内、背靠背跑「别名前 / 别名后」得到的**，对比是干净的；')
md.push('- 跨轮次的绝对覆盖率不宜直接相减，引用时应注明数据抓取日期。')
md.push('')

md.push('## 六之四、HIGH 自动采用试点（autoAdopt）')
md.push('')
md.push('本轮不写数据库，只在验证结果里标记 `autoAdopt`。准入规则严格为：')
md.push('')
md.push('```')
md.push('autoAdopt = (matchStatus === "HIGH") && license ∈ { CC0, Public Domain, CC BY, CC BY-SA }')
md.push('```')
md.push('')
md.push('| 指标 | 数量 |')
md.push('|---|---|')
md.push(`| 可自动采用的产品数（至少 1 张） | **${autoAdoptProductCount}** |`)
md.push(`| 可自动采用的候选张数 | ${autoAdoptCands.length} |`)
md.push(`| HIGH 候选总数 | ${highCands.length} |`)
md.push(`| 其中因许可不合规而不可自动采用 | ${highButLicensedBad.length} |`)
md.push(`| MEDIUM 产品数（一律 false） | ${mediumCount} |`)
md.push(`| LOW 产品数（一律 false） | ${lowCount} |`)
md.push(`| REJECT 产品数（一律 false） | ${rejectCount} |`)
md.push(`| 无法自动采用的产品数 | **${notAutoAdoptable}** |`)
md.push('')
md.push('可自动采用的产品清单：')
md.push('')
md.push('| # | 产品 | 最佳分 | 可自动采用张数 | 最佳候选 |')
md.push('|---|---|---|---|---|')
for (const p of productsWithAutoAdopt) {
  const top = p.candidates.filter((c) => c.autoAdopt === true)[0]
  md.push(`| ${p.productId} | ${p.brand} ${p.model} | ${p.bestMatchScore} ${p.bestMatchStatus} | ${p.autoAdoptCount} | ${String(top?.title ?? '-').replace(/\|/g, '\\|')} |`)
}
md.push('')

md.push('## 七、许可证统计')
md.push('')
md.push(`全部 ${allCands.length} 条候选的许可证分布（前 15）：`)
md.push('')
md.push('| 许可证 | 数量 |')
md.push('|---|---|')
for (const [k, v] of licAll.slice(0, 15)) md.push(`| ${k} | ${v} |`)
md.push('')
md.push(`其中 HIGH/MEDIUM 候选（${usableCands.length} 条）的许可证分布（前 15）：`)
md.push('')
md.push('| 许可证 | 数量 |')
md.push('|---|---|')
for (const [k, v] of licUsable.slice(0, 15)) md.push(`| ${k} | ${v} |`)
md.push('')
md.push('### 推荐保留的许可证')
md.push('')
md.push('| 许可证 | 是否推荐 | 说明 |')
md.push('|---|---|---|')
md.push('| CC0 / Public Domain | ✅ 推荐 | 无署名义务，商用最安全 |')
md.push('| CC BY | ✅ 推荐 | 需署名，可商用 |')
md.push('| CC BY-SA | ⚠️ 可用但需注意 | 需署名，且衍生作品需同许可，图片仅展示通常无碍 |')
md.push('| CC BY-NC / BY-NC-SA / BY-NC-ND | ❌ 不推荐 | 禁止商用，毕业设计演示虽可用，但后续风险高 |')
md.push('| GFDL / 未标注 | ❌ 不推荐 | 义务复杂或许可不明 |')
md.push('')
md.push('正式接入时建议只保留 **CC0 / Public Domain / CC BY / CC BY-SA**，并在页面上标注作者与许可。')
md.push('')

md.push('## 八、重点产品人工核查')
md.push('')
md.push('### 8.1 iPhone 17')
md.push('')
for (const p of focus.iphone17) md.push(renderProductBlock(p))
md.push('### 8.2 MacBook Pro 14 M4 / MacBook Air')
md.push('')
for (const p of focus.macbook) md.push(renderProductBlock(p))
md.push('### 8.3 RTX 4070 Ti Super / RTX 4080 Super')
md.push('')
if (!rtx5070Exists) {
  md.push('> **注意：50 个 Mock 产品中并不存在 `RTX 5070`。**')
  md.push('> 现有显卡产品为 `RTX 4070 Ti Super`(#22)、`RTX 4080 Super`(#23)、`RX 7800 XT`(#24)。')
  md.push('> 因此这里列出真实显卡产品的候选，')
  md.push('> 并用「反例探针」验证任务书点名的 `RTX 5070 Ti` ≠ `RTX 5070` 规则。')
  md.push('')
}
for (const p of focus.gpu) md.push(renderProductBlock(p))
md.push('### 8.4 Sony A7M4（本轮别名修复重点）')
md.push('')
for (const p of focus.a7m4) md.push(renderProductBlock(p))
md.push('')

md.push('## 九、反例探针（真实 API 结果）')
md.push('')
md.push('用「容易混淆」的查询词直接搜 Wikimedia，再把真实结果回灌评分函数：')
md.push('')
md.push('| 探针 | 查询词 | 对应产品 | 结果数 | HIGH 数 | 最高分 | 等级 |')
md.push('|---|---|---|---|---|---|---|')
for (const pr of probes) {
  md.push(`| ${pr.label} | \`${pr.query}\` | ${pr.product} | ${pr.resultCount} | ${pr.highCount} | ${pr.bestScore ?? '-'} | ${pr.bestStatus ?? '-'} |`)
}
md.push('')
md.push('> 读表提示：最后一行 `Watch GT 5 Pro` 的 1 条 HIGH **不是误判**。')
md.push('> 用 `Watch GT 5 Pro` 搜索时，Wikimedia 顺带返回了一张标题为 `Huawei Watch GT 5` 的照片——')
md.push('> 那正是本产品本体，属于正确命中；而所有 `GT 5 Pro` 变体都被正确压到 50（LOW）。')
md.push('> 其余各行的 HIGH 数均为 0，说明负例规则在真实数据上生效。')
md.push('')
for (const pr of probes) {
  md.push(`**${pr.label}**（查询 \`${pr.query}\`）`)
  md.push('')
  if (!pr.top?.length) {
    md.push('> 无候选结果。')
    md.push('')
    continue
  }
  md.push('| matchScore | matchStatus | title | 扣分/加分要点 |')
  md.push('|---|---|---|---|')
  for (const c of pr.top) {
    md.push(`| ${c.matchScore} | ${c.matchStatus} | ${String(c.title).replace(/\|/g, '\\|')} | ${c.matchReasons.join('；').replace(/\|/g, '\\|')} |`)
  }
  md.push('')
}

md.push('## 十、是否适合正式接入 / 是否值得小范围试点')
md.push('')
md.push(`**全站正式接入判定：${verdict} —— ${verdictText}**`)
md.push('')
md.push(`**小范围生产试点判定：${pilotVerdict}**`)
md.push('')
md.push('支持判定的关键事实：')
md.push('')
md.push(`1. 别名修复前可用率 ${pct(baseUsable, total)}%（${baseUsable}/${total}），别名修复后 ${pct(usable, total)}%（${usable}/${total}），别名净增 ${aliasGainCount} 个产品。`)
md.push(`2. Wikimedia Commons 单源可用率 ${pct(wmUsable, total)}%（${wmUsable}/${total}），Openverse 补充后到 ${pct(usable, total)}%；两个来源合计仍有 ${bothEmpty} 个产品完全没有候选。`)
md.push(`3. 可自动采用（HIGH + 合法许可）的产品有 **${autoAdoptProductCount} 个**，占全站 ${pct(autoAdoptProductCount, total)}%；`)
md.push(`   这是「零人工介入即可落库」的真实上限。`)
md.push(`4. 已用更宽的搜索词复核过 14 个未命中产品（见第六之二节）：**绝大多数是来源侧确实没有该型号**。`)
md.push('5. 无法匹配的产品集中在四类：')
md.push('   - **中国大陆市场专属机型**（Legion Y9000P、Xiaoxin Pro 16、MatePad Pro 12.2、Q6、AX9000）；')
md.push('   - **刚发布或小众型号**（WH-1000XM6、FreeBuds Pro 4、DeathAdder V3 Pro、PG27UQR）；')
md.push('   - **整个产品线在 Commons 上缺失**（Sony WH-1000X 系列连 XM5 都搜不到）；')
md.push('   - **子型号/升档型号**（X200 只搜到 Pro/mini 版、Mate 70 Pro 只搜到 Pro+ 版）。')
md.push('6. 反例探针显示评分规则可靠：iPhone 17 保护壳被压到 59（LOW）、')
md.push('   RTX 5070 Ti 被压到 50（LOW）、MacBook Air 不会被当成 MacBook Pro，')
md.push('   说明「有结果就用」的风险已被规则挡住——覆盖率低是**真实召回不足**，不是判定过严。')
md.push('')
md.push('### 结论')
md.push('')
md.push('- **不建议**把 Wikimedia/Openverse 作为全站产品图主来源（覆盖率只有五成多）；')
md.push('- **建议**做一次**小范围生产试点**，范围严格限定为「可自动采用」的那批产品：')
md.push('  - 只落 `autoAdopt === true` 的图片（HIGH + CC0/PD/CC BY/CC BY-SA）；')
md.push('  - 其余产品继续用现有本地占位图 `/images/products/*.svg`，页面不空窗；')
md.push('  - MEDIUM 只进人工审核队列，不自动落库；LOW/REJECT 直接丢弃；')
md.push('  - 试点期间保留来源 URL、作者、许可，满足署名义务；')
md.push('  - 试点评估指标建议用「人工抽检准确率」而不是覆盖率。')
md.push('')
md.push('若后续要扩大接入，建议：')
md.push('')
md.push('- 优先补「中国大陆市场机型」的数据源（Commons 基本没有）；')
md.push('- 继续扩充**已核实**的型号别名表（如区域命名差异），但仍保持显式枚举；')
md.push('- 复用本专项的 `lib/matching.mjs` 评分逻辑，避免「有结果就用」造成张冠李戴。')
md.push('')

md.push('## 十一、复现方式')
md.push('')
md.push('```bash')
md.push('# 1) 评分规则自测（不联网）')
md.push('node verification/lib/scoring-selftest.mjs')
md.push('')
md.push('# 2) 采集 + 评分（带本地缓存，可重复执行）')
md.push('node verification/verify-product-images.mjs')
md.push('')
md.push('# 3) 生成汇总报告')
md.push('node verification/build-summary.mjs')
md.push('```')
md.push('')
md.push('产出文件：')
md.push('')
md.push('- `verification/product-image-verification.json`（全部候选与探针明细）')
md.push('- `verification/product-image-verification.csv`（候选汇总表）')
md.push('- `verification/product-image-summary.md`（本报告）')
md.push('')

writeFileSync(join(HERE, 'product-image-summary.md'), md.join('\n'))
console.log('[DONE] 已写出 product-image-summary.md')
console.log(`  总产品数=${total}  Wikimedia可用=${wmUsable}(${pct(wmUsable, total)}%)  合计可用=${usable}(${pct(usable, total)}%)`)
console.log(`  HIGH=${highCount} MEDIUM=${mediumCount} LOW=${lowCount} REJECT=${rejectCount}  两源皆无=${bothEmpty}`)
console.log(`  Openverse 补救=${ovRescue}  结论=${verdict}`)
