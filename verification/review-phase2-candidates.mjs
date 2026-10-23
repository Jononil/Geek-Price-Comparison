#!/usr/bin/env node
/**
 * 第二阶段：对 phase-1 的 13 条可信候选做导入前最终复核（不写库、不改代码）
 * ============================================================================
 * 判定依据：
 *   - phase-1 记录的 matchStatus / matchReasons / license / thumbnailUrl
 *   - 本轮新拉取的 Commons extmetadata（description / categories / ObjectName）
 *   - 缩略图逐条下载验证（13/13 可访问）
 *   - 上轮浏览器验证：#101 原图在真实浏览器中加载失败
 *
 * 结论集：
 *   FINAL_APPROVED / FINAL_REJECTED / HOLD_LOW
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const phase1 = JSON.parse(readFileSync(join(HERE, 'image-candidates-phase1.json'), 'utf8'))
const meta = JSON.parse(readFileSync(join(HERE, '.p2img', 'commons-meta.json'), 'utf8'))
const dlLog = JSON.parse(readFileSync(join(HERE, '.p2img', 'download-log.json'), 'utf8'))
const trusted = phase1.products.filter((p) => p.candidateCount > 0 && !p.needsReview)

// ---------------------------------------------------------------
// 逐条人工复核结论（元数据证据见 reviewEvidence）
// ---------------------------------------------------------------
const REVIEW = {
  // ---- HIGH 7 条 ----
  13: {
    decision: 'FINAL_APPROVED',
    subjectCheck: '单一设备特写：M4 iPad Pro 的背部摄像头模组（Apple Store 展示机特写，主体为产品本身，非店铺全景/多设备图）',
    modelCheck: '标题含「M4 iPad Pro」；Commons 专类 IPad Pro (7th generation) 即 M4 iPad Pro —— 品牌+完整型号成立',
    licenseCheck: 'CC BY-SA 4.0，允许使用',
    urlCheck: '缩略图下载 200（35KB）',
    evidence: 'desc="Apple ストア名古屋栄に展示されてたM4 iPad Proのバックカメラ" cats="Self-published work|IPad Pro (7th generation)"'
  },
  76: {
    decision: 'FINAL_APPROVED',
    subjectCheck: '单一设备整机照：一台 Fujifilm X-T5 相机（Fujifilm Square 展厅陈列机，单机特写，无多设备/对比）',
    modelCheck: '标题含「Fujifilm X-T5」；Commons 专类 Fujifilm X-T5 —— 品牌+完整型号成立',
    licenseCheck: 'CC BY-SA 4.0，允许使用',
    urlCheck: '缩略图下载 200（46KB）',
    evidence: 'desc="Fujifilm X-T5 (photo taken at Fujifilm Square)" cats="Fujifilm X-T5|Self-published work"'
  },
  80: {
    decision: 'FINAL_APPROVED',
    subjectCheck: '单一设备整机照：一台 Panasonic LUMIX S5 II 相机',
    modelCheck: '标题含「Panasonic LUMIX S5 II」；Commons 专类 Panasonic Lumix DC-S5M2（即 S5 II 官方型号码）—— 品牌+完整型号成立',
    licenseCheck: 'CC BY 2.0，允许使用',
    urlCheck: '缩略图下载 200（29KB）',
    evidence: 'desc="Panasonic LUMIX S5 II" cats="Panasonic Lumix DC-S5M2|Flickr images reviewed by FlickreviewR 2"'
  },
  81: {
    decision: 'FINAL_APPROVED',
    subjectCheck: '单一设备：一块 Apple Watch Series 9 手表',
    modelCheck: '标题含「Apple Watch Series 9」；Commons 专类 Apple Watch Series 9 —— 品牌+完整型号成立',
    licenseCheck: 'CC BY-SA 4.0，允许使用',
    urlCheck: '缩略图下载 200（58KB）',
    evidence: 'desc="Apple Watch Series 9" cats="Self-published work|...|Apple Watch Series 9"'
  },
  85: {
    decision: 'FINAL_APPROVED',
    subjectCheck: '单一设备：一块 Garmin Forerunner 265 手表',
    modelCheck: 'desc 明确「Garmin Forerunner 265」；Commons 专类 Garmin Forerunner 265 —— 品牌+完整型号成立',
    licenseCheck: 'CC0，允许使用',
    urlCheck: '缩略图下载 200（50KB）',
    evidence: 'desc="Garmin Forerunner 265" cats="CC-Zero|Garmin Forerunner 265|Self-published work|..."'
  },
  91: {
    decision: 'FINAL_APPROVED',
    subjectCheck: '单一主体：一台 Xbox Series X 主机（附带其配套手柄——官方标配呈现方式，非多机型对比）',
    modelCheck: 'desc 明确「Xbox Series X」；Commons 专类 Xbox Series X —— 品牌+完整型号成立',
    licenseCheck: 'CC BY-SA 4.0，允许使用',
    urlCheck: '缩略图下载 200（54KB）',
    evidence: 'desc="Zu sehen ist die Xbox Series X mit Controller von Microsoft" cats="Xbox Series X|Self-published work"'
  },
  107: {
    decision: 'FINAL_APPROVED',
    subjectCheck: '单一设备：一颗 Intel Core i9-14900K 处理器实物（600x575 产品照；非裸片显微图，非评测截图）',
    modelCheck: '标题=「Intel i9-14900K」；Commons 专类 Intel Core i9-14900K —— 品牌+完整型号成立',
    licenseCheck: 'CC BY-SA 4.0，允许使用（自传作品，无 License review needed 标记——同系列的 YouTube 截图候选均有该标记，已排除）',
    urlCheck: '缩略图下载 200（26KB）',
    evidence: 'desc="Intel i9-14900K" cats="Self-published work|Intel Core i9-14900K"'
  },

  // ---- MEDIUM 2 条 ----
  101: {
    decision: 'FINAL_REJECTED',
    subjectCheck: '❌ 评测视频截图，desc 自述「Video about the NVIDIA GeForce RTX 4060 Ti; compared to other models」——对比图；且 Commons 分类同时挂 NVIDIA GeForce RTX 4070，画面含多张不同型号显卡',
    modelCheck: '型号本身可确认（RTX 4060 Ti），但主体不成立',
    licenseCheck: 'CC BY 3.0（Media from YouTube）',
    urlCheck: '❌ 上一轮真实浏览器验证中原图加载失败（13 条中唯一失败项）；按本轮规则直接 FINAL_REJECTED，不导入',
    evidence: 'desc="Video about the NVIDIA GeForce RTX 4060 Ti; compared to other models." cats="Media from YouTube|...|NVIDIA GeForce RTX 4070|...|NVIDIA GeForce RTX 4060 Ti"'
  },
  122: {
    decision: 'FINAL_REJECTED',
    subjectCheck: '❌ 整机照而非内存条主体：desc 是一整份装机配置单（CPU: Intel Core Ultra 7 265KF / GPU: Gigabyte AORUS RTX 5080 / RAM: Kingston Fury Beast / SSD: ADATA...），金士顿内存条只是画面中众多配件之一',
    modelCheck: '型号可确认（Kingston Fury = 骇客神条，32GB），但按本轮规则「仍只是整机照而非内存条主体 ⇒ FINAL_REJECTED」',
    licenseCheck: 'CC0',
    urlCheck: '缩略图下载 200（74KB）',
    evidence: 'desc="CPU: Intel Core Ultra 7 265KF — 20 cores... GPU: Gigabyte AORUS MASTER ICE GeForce RTX 5080... RAM: Kingston Fury Beast RGB 32GB (2×16GB) DDR5-6000 CL30 SSD: ADATA Legend 90..."'
  },

  // ---- LOW 4 条：全部 HOLD_LOW（本轮元数据进一步证实不能强行采用）----
  8: {
    decision: 'HOLD_LOW',
    subjectCheck: '单一手机正面照（front of smartphones），但——',
    modelCheck: '❌ 型号不符：desc/Cats 均为「Vivo X100」，而数据库产品是「vivo X100 Ultra」——是 X100，不是 X100 Ultra',
    licenseCheck: 'CC BY-SA 4.0',
    urlCheck: '缩略图下载 200（81KB）',
    evidence: 'desc="Vivo X100" cats="...|Vivo X100|Front of smartphones"；phase-1 打分本身含「-20 只有品牌、没有型号」'
  },
  50: {
    decision: 'HOLD_LOW',
    subjectCheck: '单一耳机照，但——',
    modelCheck: '❌ 型号不符：desc="Sennheiser Momentum 1.0 headset" 是 Momentum 1.0（2014 年款），数据库产品是 Momentum 4',
    licenseCheck: 'CC BY-SA 4.0',
    urlCheck: '缩略图下载 200（44KB）',
    evidence: 'desc="Sennheiser Momentum 1.0 headset" cats="...|Sennheiser headphones"'
  },
  64: {
    decision: 'HOLD_LOW',
    subjectCheck: '❌ 仅是键盘上「Super 键」的单键特写（desc="Super key of an English (US) keyboard"），不是键盘整机产品图',
    modelCheck: 'phase-1 已扣「变体冲突（标题多出 super）」；实际 Super 是按键名而非型号后缀——主体亦不合适',
    licenseCheck: 'CC BY-SA 4.0',
    urlCheck: '原图 490x478 下载 200（72KB，无缩略图版）',
    evidence: 'desc="Super key of an English (US) keyboard" cats="Self-published work|All media needing categories as of 2025|..."'
  },
  82: {
    decision: 'HOLD_LOW',
    subjectCheck: '单一手表照，但——',
    modelCheck: '❌ 型号不符：desc="Huawei Watch GT 2e"，数据库产品是「华为 Watch GT 4」——是 GT 2e（2020 年款），不是 GT 4',
    licenseCheck: 'CC BY-SA 4.0',
    urlCheck: '缩略图下载 200（85KB）',
    evidence: 'desc="Huawei Watch GT 2e" cats="OLED|Smartwatches|...|Huawei products|..."'
  }
}

// ---------------------------------------------------------------
// 组装输出
// ---------------------------------------------------------------
const rows = []
for (const p of trusted) {
  const c = p.candidates[0]
  const r = REVIEW[p.productId]
  if (!r) throw new Error(`缺少 #${p.productId} 的复核结论`)
  const m = meta[String(c.title).replace(/^File:/, '')]
  const dl = dlLog.find((x) => x.id === p.productId)
  // 规则 6：导入 URL 一律用缩略图版本（禁止超大原图）
  const importUrl = (r.decision === 'FINAL_APPROVED')
    ? (c.thumbnailUrl && c.thumbnailUrl !== c.imageUrl ? c.thumbnailUrl : c.imageUrl)
    : null
  rows.push({
    productId: p.productId,
    productName: p.productName,
    brand: p.brand,
    brandEn: p.brandEn,
    model: p.model,
    category: p.category,
    phase1Status: c.matchStatus,
    phase1Score: c.matchScore,
    imageTitle: String(c.title).replace(/^File:/, ''),
    originalUrl: c.imageUrl,
    thumbnailUrl: c.thumbnailUrl ?? null,
    importUrl,
    commonsPage: c.commonsPage,
    license: c.license,
    licenseAllowed: c.licenseAllowed,
    creator: c.creator,
    matchReasons: c.matchReasons,
    commonsDescription: m?.desc ?? null,
    commonsCategories: m?.cats ?? null,
    naturalSize: m?.size ?? null,
    mime: m?.mime ?? null,
    thumbDownloadStatus: dl?.status ?? null,
    thumbDownloadKB: dl ? Math.round(dl.bytes / 1024) : null,
    decision: r.decision,
    subjectCheck: r.subjectCheck,
    modelCheck: r.modelCheck,
    licenseCheck: r.licenseCheck,
    urlCheck: r.urlCheck,
    reviewEvidence: r.evidence
  })
}

const approved = rows.filter((x) => x.decision === 'FINAL_APPROVED')
const rejected = rows.filter((x) => x.decision === 'FINAL_REJECTED')
const holdLow = rows.filter((x) => x.decision === 'HOLD_LOW')
const generatedAt = new Date().toISOString()

// ---------- JSON ----------
const jsonOut = {
  meta: {
    purpose: '第二阶段：phase-1 可信候选（13 条）导入前最终复核。未写数据库、未改前后端代码。',
    generatedAt,
    input: 'image-candidates-phase1.json 中 13 条可信候选（不重新搜索、不处理 72 无候选、不处理 14 条人工复核项）',
    rules: {
      HIGH: '逐条确认品牌+完整型号+图片主体；URL 可访问；许可允许；排除包装图/对比图/多设备图/展台图',
      MEDIUM: '人工级确认主体与型号；#101 因 URL 验证不可用直接 REJECTED；#122 若为整机照直接 REJECTED',
      LOW: '全部 HOLD_LOW 暂不导入，不为数量强行采用',
      importUrl: '批准项一律使用 Wikimedia 500px 缩略图，禁止直接使用超大原图'
    },
    stats: {
      reviewed: rows.length,
      finalApproved: approved.length,
      finalRejected: rejected.length,
      holdLow: holdLow.length,
      byPhase1Status: {
        HIGH: { approved: approved.filter((x) => x.phase1Status === 'HIGH').length, rejected: rejected.filter((x) => x.phase1Status === 'HIGH').length, hold: 0 },
        MEDIUM: { approved: 0, rejected: rejected.filter((x) => x.phase1Status === 'MEDIUM').length, hold: 0 },
        LOW: { approved: 0, rejected: 0, hold: holdLow.length }
      },
      note: '批准的 7 条全部来自 phase-1 HIGH；LOW 4 条经本轮元数据核实全部存在型号/主体不符，维持 HOLD_LOW 正确'
    }
  },
  finalApproved: approved,
  finalRejected: rejected,
  holdLow
}
writeFileSync(join(HERE, 'image-candidates-phase2-approved.json'), JSON.stringify(jsonOut, null, 2))

// ---------- CSV（最终批准清单）----------
const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
const head = ['product_id', '产品名称', '品牌', '型号', '分类', '图片标题', '导入URL(500px缩略图)', '原URL', 'Wikimedia页面', '许可证', 'creator', 'matchStatus', 'matchScore', '复核结论', '主体确认', '型号确认']
const csv = [head.join(',')]
for (const x of approved) {
  csv.push([x.productId, x.productName, x.brand, x.model, x.category, x.imageTitle, x.importUrl, x.originalUrl, x.commonsPage,
    x.license, x.creator, x.phase1Status, x.phase1Score, x.decision, x.subjectCheck, x.modelCheck].map(esc).join(','))
}
writeFileSync(join(HERE, 'image-candidates-phase2-approved.csv'), '\uFEFF' + csv.join('\n') + '\n')

// ---------- Markdown 报告 ----------
const md = []
md.push('# 补充商品图片 · 第二阶段导入前最终复核报告')
md.push('')
md.push(`> 生成时间：${generatedAt}`)
md.push('> 范围：**仅** phase-1 的 13 条可信候选（HIGH 7 + MEDIUM 2 + LOW 4）。未重新搜索其它来源；未处理 72 个无候选与 14 条人工复核项。')
md.push('> 本轮**未写入数据库**、未修改产品表、未修改前端、未修改图片展示逻辑。')
md.push('> 复核依据：phase-1 打分记录 + 本轮新拉取的 Commons 完整元数据（description / categories）+ 缩略图逐条下载验证（13/13 返回 200）+ 上轮真实浏览器验证结果。')
md.push('> 导入 URL 策略：**批准项一律使用 Wikimedia 500px 缩略图**，禁止直接使用超大原图（原图最大达 7133×5706，缩略图仅 26–58KB）。')
md.push('')
md.push('## 一、最终统计')
md.push('')
md.push('| 复核结论 | 数量 | 明细 |')
md.push('|---|---|---|')
md.push(`| **FINAL_APPROVED** | **${approved.length}** | ${approved.map((x) => `#${x.productId}`).join('、')} |`)
md.push(`| **FINAL_REJECTED** | **${rejected.length}** | ${rejected.map((x) => `#${x.productId}`).join('、')} |`)
md.push(`| **HOLD_LOW** | **${holdLow.length}** | ${holdLow.map((x) => `#${x.productId}`).join('、')} |`)
md.push(`| 合计 | ${rows.length} | — |`)
md.push('')
md.push('| 按 phase-1 状态 | 批准 | 拒绝 | 暂缓 |')
md.push('|---|---|---|---|')
md.push(`| HIGH 7 | ${approved.length} | 0 | 0 |`)
md.push(`| MEDIUM 2 | 0 | ${rejected.length} | 0 |`)
md.push(`| LOW 4 | 0 | 0 | ${holdLow.length} |`)
md.push('')
md.push(`**最终批准数量：${approved.length} 条**`)
md.push('')
md.push('> 本轮元数据核实的关键发现：LOW 4 条**全部**存在型号不符或主体不当（#8 实为 Vivo X100 而非 X100 Ultra；#50 实为 Momentum 1.0 而非 Momentum 4；#64 仅是 Super 单键特写；#82 实为 Watch GT 2e 而非 GT 4）——维持 HOLD_LOW、不强行采用的决定完全正确。')
md.push('')

md.push('## 二、FINAL_APPROVED（7 条）')
md.push('')
md.push('> 逐条满足：品牌 + 完整型号成立 ｜ 图片主体为单一产品本体 ｜ URL 可访问 ｜ 许可允许 ｜ 非包装图/对比图/多设备图/展台图')
md.push('')
for (const x of approved) {
  md.push(`### #${x.productId} ${x.productName}（${x.brand} / ${x.category}）`)
  md.push('')
  md.push(`| 项目 | 内容 |`)
  md.push(`|---|---|`)
  md.push(`| 图片标题 | ${x.imageTitle} |`)
  md.push(`| **导入 URL（500px 缩略图）** | ${x.importUrl} |`)
  md.push(`| 原图 URL | ${x.originalUrl}（${x.naturalSize}，仅存档，不直接使用） |`)
  md.push(`| Wikimedia 页面 | ${x.commonsPage} |`)
  md.push(`| 许可证 | ${x.license}（creator: ${x.creator}） |`)
  md.push(`| matchStatus | ${x.phase1Status} ${x.phase1Score} |`)
  md.push(`| 品牌+完整型号 | ${x.modelCheck} |`)
  md.push(`| 图片主体 | ${x.subjectCheck} |`)
  md.push(`| URL 验证 | ${x.urlCheck} |`)
  md.push(`| Commons 元数据证据 | ${x.reviewEvidence} |`)
  md.push('')
}
md.push('#### 批准项的导入计划预览（本轮不执行）')
md.push('')
md.push('| product_id | 产品 | 导入 URL（缩略图） | 许可证 |')
md.push('|---|---|---|---|')
for (const x of approved) {
  md.push(`| ${x.productId} | ${x.productName} | ${x.importUrl} | ${x.license} |`)
}
md.push('')
md.push('> 这 7 个产品目前仅有 placehold.co 占位图（sort=0），后续正式导入时建议 `sort=1`，与既有 33 张真实图保持一致。')
md.push('')

md.push('## 三、FINAL_REJECTED（2 条）')
md.push('')
for (const x of rejected) {
  md.push(`### #${x.productId} ${x.productName}（${x.brand}，phase-1 ${x.phase1Status} ${x.phase1Score}）`)
  md.push('')
  md.push(`- 图片标题：${x.imageTitle}`)
  md.push(`- 主体确认：${x.subjectCheck}`)
  md.push(`- 型号确认：${x.modelCheck}`)
  md.push(`- URL 验证：${x.urlCheck}`)
  md.push(`- 元数据证据：${x.reviewEvidence}`)
  md.push('')
}
md.push('## 四、HOLD_LOW（4 条，本轮全部暂不导入）')
md.push('')
md.push('> 按 phase-1 规则本就不得强行采用；本轮元数据进一步证实**没有一条值得转正**：')
md.push('')
md.push('| product_id | 产品 | 候选图 | 元数据揭示的事实 |')
md.push('|---|---|---|---|')
for (const x of holdLow) {
  md.push(`| ${x.productId} | ${x.productName} | ${x.imageTitle} | ${x.modelCheck} |`)
}
md.push('')
for (const x of holdLow) {
  md.push(`#### #${x.productId} ${x.productName}`)
  md.push(`- 标题：${x.imageTitle}｜desc：${x.commonsDescription}｜cats：${x.commonsCategories}`)
  md.push(`- 结论：${x.subjectCheck}`)
  md.push('')
}
md.push('## 五、本轮未做的事（自查）')
md.push('')
md.push('- 未执行任何 INSERT / UPDATE / DELETE；数据库保持 products=132 / product_images=165 / 真实图=33')
md.push('- 未修改产品表、前端、图片展示逻辑、审核标准')
md.push('- 未重新搜索其它来源；未处理 72 无候选与 14 人工复核项；未把任何 REJECT/LOW 项转正')
md.push('- 未使用 ABO / TechAPI / 任何新图片源')
md.push('')
writeFileSync(join(HERE, 'image-candidates-phase2-review.md'), md.join('\n'))

console.log(`FINAL_APPROVED = ${approved.length}`)
console.log(`FINAL_REJECTED = ${rejected.length}`)
console.log(`HOLD_LOW = ${holdLow.length}`)
console.log(`已生成：image-candidates-phase2-review.md / -approved.json / -approved.csv`)
