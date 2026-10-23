/** 其他开放资源实测：Open Products Facts 对 85 个缺图商品的严格匹配（只审计，不写库） */
import { readFileSync, writeFileSync } from 'node:fs'
const OUT = 'E:/第三学期/Geek Price Comparison/verification/open-image-inventory-20261010'
const inv = JSON.parse(readFileSync(`${OUT}/product-image-inventory.json`, 'utf8'))
const missing = inv.products.filter((p) => p.mainStatus !== 'EXISTING_VALID')
const UA = 'GeekPriceGraduationProject/1.0 (stage-A source audit)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const B = 'https://world.openproductsfacts.org'
async function jget(url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, redirect: 'follow' })
    const t = await r.text(); let j = null; try { j = JSON.parse(t) } catch { }
    return { status: r.status, json: j }
  } catch (e) { return { status: 0, error: e.message } }
}
const nz = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

// 按品牌抓取 OPF 全部有图条目
const BRAND_EN = {
  小米: 'xiaomi', 联想: 'lenovo', 华硕: 'asus', 苹果: 'apple', 华为: 'huawei', 戴尔: 'dell',
  微星: 'msi', 海盗船: 'corsair', 英伟达: 'nvidia', 惠普: 'hp', 三星: 'samsung', 索尼: 'sony',
  雷蛇: 'razer', 达尔优: 'dareu', 致态: 'zhitai', 金士顿: 'kingston', 一加: 'oneplus', 荣耀: 'honor',
  机械革命: 'mechrevo', 明基: 'benq', 泰坦军团: 'titan army', 森海塞尔: 'sennheiser', 漫步者: 'edifier',
  水月雨: 'moondrop', 铁三角: 'audio-technica', 珂芝: 'kzzi', 樱桃: 'cherry', 狼蛛: 'aula',
  雷柏: 'rapoo', 卓威: 'zowie', 多彩: 'delux', 尼康: 'nikon', 富士: 'fujifilm', 松下: 'panasonic',
  佳明: 'garmin', 微软: 'microsoft', 七彩虹: 'colorful', 西数: 'western digital', 铠侠: 'kioxia',
  海康威视: 'hikvision', 宏碁: 'acer', 芝奇: 'g.skill', 威刚: 'adata', 英睿达: 'crucial',
  光威: 'gloway', 中兴: 'zte', 'TP-Link': 'tp-link', LG: 'lg', AOC: 'aoc', Bose: 'bose',
  vivo: 'vivo', OPPO: 'oppo', Keychron: 'keychron', Intel: 'intel', AMD: 'amd', Valve: 'valve'
}
const pool = new Map()
for (const brand of new Set(missing.map((p) => BRAND_EN[p.brand]).filter(Boolean))) {
  const r = await jget(`${B}/api/v2/search?brands_tags=${encodeURIComponent(brand)}&page_size=100&fields=code,product_name,brands,image_front_url,image_url`)
  if (r.status === 200 && r.json) {
    const items = (r.json.products ?? []).filter((p) => p.image_front_url || p.image_url)
      .map((p) => ({ name: String(p.product_name ?? ''), brands: String(p.brands ?? ''), img: p.image_front_url ?? p.image_url }))
    pool.set(brand, items)
  } else pool.set(brand, [])
  await sleep(1000)
}
const totalEntries = [...pool.values()].reduce((s, v) => s + v.length, 0)
console.log(`OPF 品牌池：${pool.size} 个品牌，有图条目共 ${totalEntries}`)

// 严格匹配（品牌 token + 型号 token 全命中，型号需非纯数字）
const hits = []
for (const p of missing) {
  const items = pool.get(BRAND_EN[p.brand]) ?? []
  if (!items.length) continue
  const toks = nz(p.normalizedModel ?? p.productName).split(' ').filter((t) => t.length >= 2)
  if (!toks.length || !toks.some((t) => !/^\d+$/.test(t))) continue
  const hit = items.find((it) => { const n = nz(it.name); return toks.every((t) => n.includes(t)) })
  if (hit) hits.push({ productId: p.productId, productName: p.productName, opfName: hit.name, img: hit.img, mainStatus: p.mainStatus })
}
console.log(`严格命中 = ${hits.length}`)
hits.forEach((h) => console.log(`  #${h.productId} ${h.productName} → OPF「${h.opfName}」 [当前状态=${h.mainStatus}]`))

// Openverse 今日复测
const ov = await jget('https://api.openverse.org/v1/images/?q=laptop&page_size=1')
console.log(`\nOpenverse 今日复测：status=${ov.status}${ov.error ? ' err=' + ov.error : ''}（reachable=${ov.status === 200}）`)

writeFileSync(`${OUT}/_ro/other-sources.json`, JSON.stringify({ opfPoolBrands: pool.size, opfEntries: totalEntries, opfHits: hits, openverse: { status: ov.status, error: ov.error ?? null } }, null, 2))
console.log('已存 _ro/other-sources.json')
