import { readFileSync } from 'node:fs'
const p = 'E:/第三学期/Geek Price Comparison/verification/open-image-inventory-20261010/_src/inventory-raw.json'
const d = JSON.parse(readFileSync(p, 'utf8'))
const dec = (u) => { try { return decodeURIComponent(u) } catch { return u } }
const hi = d.inventory.filter((x) => x.bestStatus === 'NEW_HIGH_CONFIDENCE')
console.log(`HIGH 候选数 = ${hi.length}\n`)
for (const r of hi) {
  const c = r.candidates[0]
  console.log(`#${r.productId} ${r.productName} [${r.brand}/${r.category}] model="${r.normalizedModel}" 未译=${JSON.stringify(r.untranslatedCjk)}`)
  console.log(`   图片title: ${dec(String(c.imageUrl ?? '').split('/').pop()).slice(0,90)}`)
  console.log(`   sourcePage: ${dec(c.sourcePageUrl)}`)
  console.log(`   evidence : ${c.matchEvidence}`)
  console.log(`   license  : ${c.license} | author: ${String(c.author||'').slice(0,50)}`)
  console.log(`   alt候选  : ${r.candidates.length} 条`)
  console.log('')
}
