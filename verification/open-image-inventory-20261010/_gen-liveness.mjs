import { readFileSync, writeFileSync } from 'node:fs'
const ROOT = 'E:/第三学期/Geek Price Comparison'
const OUT = `${ROOT}/verification/open-image-inventory-20261010`
// 从 product-image-inventory.json 取 EXISTING_VALID 的真实图 URL
const inv = JSON.parse(readFileSync(`${OUT}/product-image-inventory.json`, 'utf8'))
const rows = []
for (const p of inv.products) for (const u of p.existingRealImageUrls) rows.push({ productId: p.productId, productName: p.productName, url: u })
console.log(`待检真实图 ${rows.length} 条`)
const html = '<html><head><meta charset="utf-8"></head><body>' +
  rows.map((r, i) => `<div><img id="i${i}" src="${r.url.replace(/&/g, '&amp;')}"></div>`).join('') +
  '</body></html>'
writeFileSync(`${OUT}/_ro/liveness.html`, html)
writeFileSync(`${OUT}/_ro/liveness-rows.json`, JSON.stringify(rows, null, 1))
console.log('HTML 已生成：_ro/liveness.html')
