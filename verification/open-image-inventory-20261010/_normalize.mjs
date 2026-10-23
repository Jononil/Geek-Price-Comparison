import { readFileSync, writeFileSync } from 'node:fs'
const ROOT = 'E:/第三学期/Geek Price Comparison'
const p = `${ROOT}/verification/open-image-inventory-20261010/_src/inventory-raw.json`
const d = JSON.parse(readFileSync(p, 'utf8'))

// 归一：全候选被拒 → NO_QUALIFIED_IMAGE
for (const r of d.inventory) if (r.bestStatus === 'REJECT') r.bestStatus = 'NO_QUALIFIED_IMAGE'
writeFileSync(p, JSON.stringify(d, null, 2))

const tally = {}
for (const r of d.inventory) tally[r.bestStatus] = (tally[r.bestStatus] ?? 0) + 1
console.log('归一后分布 =', JSON.stringify(tally))
console.log('合计 =', Object.values(tally).reduce((a, b) => a + b, 0), '（应等于 85）')

console.log('\n############ NEW_HIGH_CONFIDENCE（18）—— 必须逐条核验 ############')
for (const r of d.inventory.filter((x) => x.bestStatus === 'NEW_HIGH_CONFIDENCE')) {
  const c = r.candidates[0]
  console.log(`\n#${r.productId} ${r.productName} [${r.brand}/${r.category}]`)
  console.log(`   model=${r.normalizedModel}${r.untranslatedCjk.length ? '  未译中文:' + r.untranslatedCjk.join('/') : ''}`)
  console.log(`   title  : ${String(c.matchEvidence).slice(0, 80)}`)
  console.log(`   图片   : ${c.imageUrl.slice(-72)}`)
  console.log(`   许可   : ${c.license}  autoAdopt=${c.autoAdopt}`)
}

console.log('\n\n############ REVIEW_REQUIRED（7） ############')
for (const r of d.inventory.filter((x) => x.bestStatus === 'REVIEW_REQUIRED')) {
  const c = r.candidates[0]
  console.log(`#${String(r.productId).padEnd(4)} ${r.productName.padEnd(20)} 原因: ${c.reviewReason}`)
}

console.log('\n############ SOURCE_UNVERIFIED（1） ############')
for (const r of d.inventory.filter((x) => x.bestStatus === 'SOURCE_UNVERIFIED')) {
  console.log(`#${r.productId} ${r.productName} — ${r.candidates[0].reviewReason || r.candidates[0].matchEvidence}`)
}

console.log('\n############ NO_QUALIFIED_IMAGE（59） ############')
const noq = d.inventory.filter((x) => x.bestStatus === 'NO_QUALIFIED_IMAGE')
console.log(`共 ${noq.length} 个：${noq.map((x) => '#' + x.productId).join(', ')}`)
