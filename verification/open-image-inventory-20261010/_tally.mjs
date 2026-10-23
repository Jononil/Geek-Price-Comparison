import { readFileSync } from 'node:fs'
const p = 'E:/第三学期/Geek Price Comparison/verification/open-image-inventory-20261010/_src/inventory-raw.json'
const d = JSON.parse(readFileSync(p, 'utf8'))
console.log('missingCount =', d.missingCount, ' inventory 条数 =', d.inventory.length)
const tally = {}
for (const r of d.inventory) tally[r.bestStatus] = (tally[r.bestStatus] ?? 0) + 1
console.log('bestStatus 实际分布 =', JSON.stringify(tally, null, 1))
const sum = Object.values(tally).reduce((a, b) => a + b, 0)
console.log('合计 =', sum)
console.log('\n未被我统计到的状态（即全候选 REJECT 但 bestStatus=REJECT 的）：')
console.log('  REJECT =', tally.REJECT ?? 0, ' ← 这些其实也应归入 NO_QUALIFIED_IMAGE')
