// 召回率核查：对未命中产品换用更宽/更常见的搜索词，判断是「来源确实没有」还是「查询太窄」
import { readFileSync } from 'node:fs'

const UA = 'GeekPriceImageVerification/1.0 (feasibility study)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function wm(query) {
  const url = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2',
    generator: 'search', gsrsearch: query, gsrnamespace: '6', gsrlimit: '8', prop: 'imageinfo', iiprop: 'url'
  })
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } })
      const j = await r.json()
      await sleep(450)
      return (j.query?.pages ?? []).map((p) => p.title)
    } catch (e) {
      if (attempt === 4) return [`<ERR ${e.code ?? e.message}>`]
      await sleep(1500 * attempt)
    }
  }
}

const CASES = [
  ['#14 MacBook Pro 14 M4', ['MacBook Pro 14 M4', 'MacBook Pro M4', 'MacBook Pro (M4)', 'MacBook Pro 14-inch']],
  ['#16 Legion Y9000P', ['Legion Y9000P', 'Lenovo Legion', 'Legion laptop']],
  ['#17 Xiaoxin Pro 16', ['Xiaoxin Pro 16', 'Lenovo Xiaoxin', 'Xiaoxin laptop']],
  ['#25 Odyssey G8 32', ['Odyssey G8 32', 'Samsung Odyssey G8', 'Samsung Odyssey monitor']],
  ['#27 ASUS PG27UQR', ['PG27UQR', 'ASUS ROG Swift monitor', 'ASUS monitor']],
  ['#29 WH-1000XM6', ['WH-1000XM6', 'WH-1000XM5', 'Sony WH-1000XM', 'Sony headphones']],
  ['#30 FreeBuds Pro 4', ['FreeBuds Pro 4', 'Huawei FreeBuds', 'Huawei FreeBuds Pro']],
  ['#31 Bose QC Ultra', ['Bose QC Ultra', 'Bose QuietComfort Ultra', 'Bose QuietComfort']],
  ['#32 JBL Tune 770NC', ['JBL Tune 770NC', 'JBL Tune', 'JBL headphones']],
  ['#37 DeathAdder V3 Pro', ['DeathAdder V3 Pro', 'Razer DeathAdder', 'Razer mouse']],
  ['#39 Sony A7M4', ['Sony A7M4', 'Sony A7 IV', 'Sony Alpha 7 IV']],
  ['#44 Xiaomi Watch S4', ['Xiaomi Watch S4', 'Xiaomi Watch', 'Xiaomi Smart Band']],
  ['#47 Huawei Q6', ['Huawei Q6', 'Huawei router', 'Huawei WiFi router']],
  ['#48 Xiaomi AX9000', ['Xiaomi AX9000', 'Xiaomi router', 'Xiaomi Mi Router']]
]

for (const [label, queries] of CASES) {
  console.log(`\n### ${label}`)
  for (const q of queries) {
    const t = await wm(q)
    console.log(`   "${q}" -> ${t.length} 条 ${t.length ? '| ' + t.slice(0, 3).map((x) => x.replace('File:', '')).join(' / ') : ''}`)
  }
}
