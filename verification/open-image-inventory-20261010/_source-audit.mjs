#!/usr/bin/env node
/**
 * 开放资源可用性核验（阶段 A 第二/三阶段）
 * 对「仍缺图」的商品，用严格规则核对各来源；只审计，不写库。
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { buildSignals, scoreCandidate, tokenize, stripLeadingBrand, isAutoAdoptLicense } from '../lib/matching.mjs'

const ROOT = 'E:/第三学期/Geek Price Comparison'
const OUT = `${ROOT}/verification/open-image-inventory-20261010`
const CACHE = `${OUT}/_src`
mkdirSync(CACHE, { recursive: true })
const MYSQL = 'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe'
const UA = 'GeekPriceGraduationProject/1.0 (stage-A open image inventory; read-only)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function q(sql, tag) {
  if (!/^\s*(select|show)\b/i.test(sql)) throw new Error('[只读保护]')
  const s = `${CACHE}/${tag}.sql`, b = `${CACHE}/${tag}.bat`, o = `${CACHE}/${tag}.out`, e = `${CACHE}/${tag}.err`
  writeFileSync(s, sql, 'utf8')
  writeFileSync(b, `@echo off\r\n"${MYSQL}" -h 127.0.0.1 -u root -p123456 --default-character-set=utf8mb4 -N -B geek_price < "${s}" > "${o}" 2> "${e}"\r\n`, 'utf8')
  try { execFileSync('cmd.exe', ['/c', b], { stdio: 'inherit' }) } catch { }
  return existsSync(o) ? readFileSync(o, 'utf8') : ''
}
const rs = (sql, t) => q(sql, t).split(/\r?\n/).filter((l) => l.trim() !== '').map((l) => l.split('\t'))

// ---------- 取当前仍缺图的商品 ----------
const brands = new Map(rs('SELECT id, name FROM brands;', 'b').map(([i, n]) => [Number(i), n]))
const cats = new Map(rs('SELECT id, name FROM categories;', 'c').map(([i, n]) => [Number(i), n]))
const all = rs('SELECT id, name, brand_id, category_id FROM products WHERE deleted=0 ORDER BY id;', 'p')
  .map(([id, name, b, c]) => ({ id: Number(id), name, brand: brands.get(Number(b)) ?? '', category: cats.get(Number(c)) ?? '' }))
const hasReal = new Set(rs("SELECT DISTINCT product_id FROM product_images WHERE url NOT LIKE '%placehold.co%';", 'r').map(([p]) => Number(p)))
const missing = all.filter((p) => !hasReal.has(p.id))
console.log(`商品 ${all.length}，已有真实图 ${hasReal.size}，仍缺图 ${missing.length}`)

// ---------- 品牌英文对照（沿用既有显式表，不新造） ----------
const BRAND_EN = {
  小米: 'Xiaomi', 联想: 'Lenovo', 华硕: 'ASUS', 苹果: 'Apple', 华为: 'Huawei', 戴尔: 'Dell',
  微星: 'MSI', 海盗船: 'Corsair', 英伟达: 'NVIDIA', 惠普: 'HP', 三星: 'Samsung', 索尼: 'Sony',
  雷蛇: 'Razer', 达尔优: 'Dareu', 致态: 'ZhiTai', 金士顿: 'Kingston', 一加: 'OnePlus', 荣耀: 'Honor',
  机械革命: 'Mechrevo', 明基: 'BenQ', 泰坦军团: 'Titan Army', 森海塞尔: 'Sennheiser', 漫步者: 'Edifier',
  水月雨: 'Moondrop', 铁三角: 'Audio-Technica', 珂芝: 'Kzzi', 樱桃: 'Cherry', 狼蛛: 'AULA',
  雷柏: 'Rapoo', 卓威: 'ZOWIE', 多彩: 'Delux', 尼康: 'Nikon', 富士: 'Fujifilm', 松下: 'Panasonic',
  佳明: 'Garmin', 微软: 'Microsoft', 七彩虹: 'Colorful', 西数: 'Western Digital', 铠侠: 'Kioxia',
  海康威视: 'Hikvision', 宏碁: 'Acer', 芝奇: 'G.Skill', 威刚: 'ADATA', 英睿达: 'Crucial',
  光威: 'Gloway', 中兴: 'ZTE', 'TP-Link': 'TP-Link', LG: 'LG', AOC: 'AOC', Bose: 'Bose',
  vivo: 'vivo', OPPO: 'OPPO', Keychron: 'Keychron', Intel: 'Intel', AMD: 'AMD', Valve: 'Valve'
}
const LINE_EN = {
  拯救者: 'Legion', 小新: 'Xiaoxin', 天选: 'TUF Gaming', 暗影精灵: 'OMEN', 绝影: 'Stealth',
  玄龙骑士: 'Odyssey', 掠夺者: 'Predator', 幻光戟: 'Trident Z', 骇客神条: 'FURY',
  复仇者: 'Vengeance', 玩家国度: 'ROG', 海皇戟: 'Trident'
}
function extractModel(name, brand) {
  let s = String(name ?? '').trim()
  if (brand && s.startsWith(brand)) s = s.slice(brand.length).trim()
  return stripLeadingBrand(s) || s
}
function translate(m) {
  let out = String(m); const used = []
  for (const [zh, en] of Object.entries(LINE_EN)) if (out.includes(zh)) { out = out.split(zh).join(en); used.push(`${zh}→${en}`) }
  return { translated: out.replace(/\s+/g, ' ').trim(), used, leftCjk: out.match(/[\u4e00-\u9fff]+/g) ?? [] }
}

// ---------- 来源 A：Wikimedia Commons 严格检索 ----------
async function wmSearch(query) {
  const key = query.replace(/[^a-z0-9]+/gi, '_').slice(0, 80)
  const cf = `${CACHE}/wm_${key}.json`
  if (existsSync(cf)) { try { return JSON.parse(readFileSync(cf, 'utf8')) } catch { } }
  const p = new URLSearchParams({
    action: 'query', format: 'json', generator: 'search', gsrsearch: query, gsrnamespace: '6',
    gsrlimit: '20', prop: 'imageinfo', iiprop: 'url|size|extmetadata|mime', iiurlwidth: '500',
    iiextmetadatafilter: 'ImageDescription|ObjectName|Categories|Artist|LicenseShortName|LicenseUrl'
  })
  let out = { results: [], error: null }
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(`https://commons.wikimedia.org/w/api.php?${p}`, { headers: { 'User-Agent': UA } })
      if (r.status === 429) { await sleep(15000); continue }
      if (!r.ok) { out.error = `HTTP ${r.status}`; break }
      const j = await r.json()
      const clean = (s) => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      out.results = Object.values(j.query?.pages ?? {}).map((pg) => {
        const ii = pg.imageinfo?.[0] ?? {}, em = ii.extmetadata ?? {}
        return {
          source: 'wikimedia_commons',
          title: String(pg.title).replace(/^File:/, ''),
          imageUrl: ii.thumburl, originalUrl: ii.url,
          width: ii.width, height: ii.height, mime: ii.mime,
          description: clean(em.ImageDescription?.value), objectName: clean(em.ObjectName?.value),
          categories: clean(em.Categories?.value), creator: clean(em.Artist?.value).slice(0, 120),
          license: clean(em.LicenseShortName?.value), licenseUrl: clean(em.LicenseUrl?.value),
          sourcePageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(pg.title).replace(/%3A/, ':')}`
        }
      })
      break
    } catch (e) { out.error = e.message; await sleep(6000) }
  }
  writeFileSync(cf, JSON.stringify(out))
  return out
}

// ---------- 来源 B：Openverse（可达性优先检查，仅一次） ----------
async function openverseProbe() {
  const u = 'https://api.openverse.org/v1/images/?q=laptop&page_size=1'
  try {
    const ctl = AbortSignal.timeout(15000)
    const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: ctl })
    return { reachable: r.ok, status: r.status }
  } catch (e) { return { reachable: false, status: 0, error: e.message } }
}

// ---------- 品牌身份词（必须真实出现在标题，不得由型号命中替代） ----------
const BRAND_IDENTITY = {
  小米: ['xiaomi', 'redmi'], 一加: ['oneplus'], vivo: ['vivo'], OPPO: ['oppo'],
  苹果: ['apple', 'macbook', 'airpods', 'ipad', 'iphone'], 华为: ['huawei'], 荣耀: ['honor'],
  联想: ['lenovo', 'thinkbook', 'thinkpad', 'legion'], 戴尔: ['dell'], 惠普: ['hp', 'omen'],
  华硕: ['asus', 'rog', 'tuf'], 微星: ['msi'], 机械革命: ['mechrevo'], 宏碁: ['acer', 'predator'],
  三星: ['samsung'], LG: ['lg'], AOC: ['aoc'], 明基: ['benq'], 泰坦军团: ['titan army'],
  索尼: ['sony', 'playstation'], 森海塞尔: ['sennheiser'], 漫步者: ['edifier'], 水月雨: ['moondrop'],
  铁三角: ['audio technica', 'ath'], Bose: ['bose'], 雷蛇: ['razer'], 达尔优: ['dareu'],
  雷柏: ['rapoo'], 卓威: ['zowie'], 多彩: ['delux'], 珂芝: ['kzzi'], 樱桃: ['cherry'],
  狼蛛: ['aula'], Keychron: ['keychron'], 海盗船: ['corsair'], 尼康: ['nikon'], 富士: ['fujifilm'],
  松下: ['panasonic', 'lumix'], 佳明: ['garmin'], 微软: ['microsoft', 'xbox'], Valve: ['valve', 'steam deck'],
  英伟达: ['nvidia', 'geforce'], AMD: ['amd', 'radeon', 'ryzen'], Intel: ['intel', 'core i'],
  七彩虹: ['colorful'], 致态: ['zhitai'], 西数: ['western digital', 'wd_black', 'wd black'],
  铠侠: ['kioxia'], 金士顿: ['kingston'], 海康威视: ['hikvision'], 芝奇: ['g.skill', 'gskill'],
  威刚: ['adata', 'xpg'], 英睿达: ['crucial'], 光威: ['gloway'], 'TP-Link': ['tp link'], 中兴: ['zte']
}

/** 对应关系未经证实的产品（历史审核结论），不得判为 HIGH */
const CONTESTED = new Set([5, 25])
const nz = (s) => String(s ?? '').toLowerCase().replace(/^file:/, '').replace(/\.(jpe?g|png|gif|webp|tiff?|svg)$/, ' ').replace(/[^a-z0-9]+/g, ' ').trim()
function subjectFlags(text) {
  const t = String(text ?? '').toLowerCase(); const bad = []
  if (/die shot|wafer|micrograph|delid|裸片|晶圆|显微|\bccx\b|\bccd\b|iod@|nmesf|@\d+nm/.test(t)) bad.push('chip_die')
  if (/\bbox\b|packaging|packshot|unboxing|包装|开箱/.test(t)) bad.push('packaging')
  if (/vergleich|comparison|\bvs\b|对比|compared to/.test(t)) bad.push('comparison')
  if (/\bshop\b|\bstore\b|booth|expo\b|exhibition|陈列|专柜|门店|ausgestellt|on display/.test(t)) bad.push('store')
  if (/\blogo\b|wordmark|\bsvg\b|clipart|vector|emblem/.test(t)) bad.push('logo')
  if (/screenshot|media from youtube|youtube|geekerwan|极客湾|мой компьютер|zmaslo|leistungsanalyse|\breview\b|评测/.test(t)) bad.push('screenshot_video')
  if (/license review needed/.test(t)) bad.push('license_unreviewed')
  if (/\bpeople\b|\bperson\b|\bman\b|\bwoman\b|portrait|hands?\b|人物/.test(t)) bad.push('people')
  if (/\bcable\b|charger|adapter|\bcase\b|cover|sleeve|\bstand\b|dock\b|mount\b|holder|配件|keycap/.test(t)) bad.push('accessory')
  if (/\bmotherboard\b|mainboard|\bpcb\b/.test(t)) bad.push('internal_part')
  if (/\bswitch\b|\bopened\b|teardown|disassembl|\binternals?\b/.test(t)) bad.push('part_or_teardown')
  if (/spec tag|spec label|nameplate|sticker|铭牌/.test(t)) bad.push('label_not_product')
  return bad
}
const VARIANT = ['ultra', 'pro', 'max', 'super', 'ti', 'plus', 'x3d', 'oled', 'mini', 'classic', 'lite']
const caps = (s) => [...(` ${String(s ?? '').toLowerCase()} `).matchAll(/(\d+(?:\.\d+)?)\s*(tb|gb)\b/g)].map((m) => `${m[1]}${m[2]}`).sort().join(',')

// ---------- 主流程 ----------
console.log('\n检查 Openverse 可达性 ...')
const ov = await openverseProbe()
console.log(`  Openverse: reachable=${ov.reachable} status=${ov.status}${ov.error ? ' err=' + ov.error : ''}`)

console.log('\n对仍缺图商品进行 Wikimedia 严格检索 ...')
const inventory = []
for (let i = 0; i < missing.length; i++) {
  const p = missing[i]
  const brandEn = BRAND_EN[p.brand] ?? p.brand
  const modelRaw = extractModel(p.name, p.brand)
  const { translated, used, leftCjk } = translate(modelRaw)

  const queries = [...new Set([`${brandEn} ${translated}`, translated, `${brandEn} ${modelRaw}`].filter(Boolean))].slice(0, 3)
  const pool = new Map()
  for (const qq of queries) {
    const r = await wmSearch(qq)
    for (const c of r.results) if (!pool.has(c.imageUrl)) pool.set(c.imageUrl, { ...c, via: qq })
    await sleep(1200)
  }

  const fullModelNz = nz(translated)
  const prodCaps = caps(translated)
  const brandKeys = nz(brandEn)
  const cands = []
  for (const c of pool.values()) {
    const titleNz = nz(c.title)
    const meta = [c.title, c.description, c.objectName, c.categories].join(' ')
    const flags = subjectFlags(meta)
    const licOk = isAutoAdoptLicense(c.license)
    // 品牌必须由「品牌身份词」在标题中证实；绝不允许用型号命中替代（历史上 A98/K75/M800/Sabre 皆因此误配）
    const brandWords = (BRAND_IDENTITY[p.brand] ?? []).map(nz).filter(Boolean)
    const brandHit = brandWords.length === 0 ? false : brandWords.some((w) => titleNz.includes(w))
    const modelHit = fullModelNz.length >= 3 && titleNz.includes(fullModelNz)
    // 型号需含可区分 token，避免「32gb」这类纯容量/纯数字冒充精确型号
    const mTokens = fullModelNz.split(' ').filter((t) => t.length >= 2)
    const hasDistinctive = mTokens.some((t) => !/^\d+$/.test(t))
    const anchor = mTokens.filter((t) => !/^\d+$/.test(t) && t.length >= 3)
    const anchorHit = anchor.length === 0 ? false : anchor.some((t) => titleNz.includes(t))
    const vConf = VARIANT.filter((v) => new RegExp(`\\b${v}\\b`).test(fullModelNz) !== new RegExp(`\\b${v}\\b`).test(titleNz))
    const capConf = prodCaps && caps(c.title) && prodCaps !== caps(c.title)
    const noMeta = !String(c.description ?? '').trim() && !String(c.categories ?? '').trim()

    let status = 'REJECT', reason = ''
    if (!brandHit) { reason = `标题无品牌身份词（${(BRAND_IDENTITY[p.brand] ?? []).join('/') || '未定义'}）` }
    else if (flags.length) { status = 'REJECT'; reason = '主体不合格: ' + flags.join(',') }
    else if (noMeta) { reason = '无描述无分类，主体无法核验' }
    else if (!licOk) { status = 'SOURCE_UNVERIFIED'; reason = `许可不可用/无法核验（${c.license || '缺失'}）` }
    else if (!c.imageUrl) { reason = '无可用的 500px 缩略图' }
    else if (CONTESTED.has(p.id)) { status = 'REVIEW_REQUIRED'; reason = '该产品线中文名与海外名对应关系未经证实（历史审核结论）' }
    else if (!hasDistinctive || !anchorHit) { status = 'REVIEW_REQUIRED'; reason = !hasDistinctive ? '型号含纯容量/纯数字，无法确认精确型号' : '缺型号关键锚点' }
    else if (modelHit && vConf.length === 0 && !capConf) { status = 'NEW_HIGH_CONFIDENCE'; reason = '标题含完整型号且无变体/容量冲突' }
    else { status = 'REVIEW_REQUIRED'; reason = [vConf.length ? '变体差异:' + vConf.join('/') : '标题未含完整型号', capConf ? `容量不同(${prodCaps} vs ${caps(c.title)})` : ''].filter(Boolean).join('；') }

    cands.push({
      productId: p.id, productName: p.name, brand: p.brand, normalizedModel: translated,
      source: c.source, sourcePageUrl: c.sourcePageUrl, imageUrl: c.imageUrl,
      license: c.license, licenseUrl: c.licenseUrl, author: c.creator,
      matchStatus: status, matchEvidence: reason || '品牌+完整型号+主体+许可均通过',
      imageType: flags.length ? flags.join(',') : 'product_body',
      accessibilityStatus: c.imageUrl ? 'reachable_thumb' : 'no_thumb',
      reviewReason: status === 'REVIEW_REQUIRED' ? reason : (status === 'REJECT' ? reason : ''),
      autoAdopt: status === 'NEW_HIGH_CONFIDENCE' && licOk ? true : false
    })
  }
  const rank = { NEW_HIGH_CONFIDENCE: 3, REVIEW_REQUIRED: 2, SOURCE_UNVERIFIED: 1, REJECT: 0 }
  cands.sort((a, b) => rank[b.matchStatus] - rank[a.matchStatus])
  inventory.push({
    productId: p.id, productName: p.name, brand: p.brand, category: p.category,
    normalizedModel: translated, lineTranslations: used, untranslatedCjk: leftCjk,
    queries, poolSize: pool.size,
    bestStatus: cands[0]?.matchStatus ?? 'NO_QUALIFIED_IMAGE',
    candidates: cands.slice(0, 5)
  })
  if ((i + 1) % 15 === 0 || i === missing.length - 1) {
    const hi = inventory.filter((x) => x.bestStatus === 'NEW_HIGH_CONFIDENCE').length
    const rv = inventory.filter((x) => x.bestStatus === 'REVIEW_REQUIRED').length
    console.log(`  [${i + 1}/${missing.length}] 累计 HIGH=${hi} REVIEW=${rv}`)
  }
}

const srcDir = `${OUT}/_src`
writeFileSync(`${srcDir}/inventory-raw.json`, JSON.stringify({ openverse: ov, missingCount: missing.length, inventory }, null, 2))
const by = (s) => inventory.filter((x) => x.bestStatus === s).length
console.log('\n=========== 缺图商品检索结果 ===========')
console.log(`  NEW_HIGH_CONFIDENCE = ${by('NEW_HIGH_CONFIDENCE')}`)
console.log(`  REVIEW_REQUIRED     = ${by('REVIEW_REQUIRED')}`)
console.log(`  SOURCE_UNVERIFIED   = ${by('SOURCE_UNVERIFIED')}`)
console.log(`  NO_QUALIFIED_IMAGE  = ${by('NO_QUALIFIED_IMAGE')}（全部候选被拒）`)
console.log(`  合计 = ${inventory.length}`)
