#!/usr/bin/env node
/**
 * 第三阶段：为仍缺图的 92 个产品收集候选图（EXACT_MATCH 优先，其次 SERIES_MATCH）
 * ============================================================================
 * 只做候选收集与审核，**不写数据库、不改前后端代码**。
 *
 * 匹配等级：
 *   EXACT_MATCH  品牌 + 完整型号确认
 *   SERIES_MATCH 品牌 + 产品系列确认、产品类型一致，但无法确认具体型号
 *   REJECT       无法可靠确认
 *
 * 硬性约束：
 *   - 品牌必须一致；型号/系列必须一致；产品类型必须一致
 *   - 禁止仅凭数字型号匹配
 *   - 禁止跨代际、跨产品线、跨型号冒充
 *   - 必须有开放许可（CC0/PD/CC BY/CC BY-SA）
 *   - 只输出 500px 缩略图，不用原图
 *   - 排除包装图/对比图/展台图/人物图/截图/裸片/配件
 *
 * 用法：node verification/collect-series-candidates.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { isAutoAdoptLicense } from './lib/matching.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CACHE = join(HERE, '.cache-p3')
mkdirSync(CACHE, { recursive: true })
const WM_CACHE = join(CACHE, 'wm')
mkdirSync(WM_CACHE, { recursive: true })

const OUT_JSON = join(HERE, 'series-candidates-review.json')
const OUT_CSV = join(HERE, 'series-candidates-review.csv')
const OUT_MD = join(HERE, 'series-candidates-review.md')

const UA = 'GeekPriceGraduationProject/1.0 (series candidate collection)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------- 只读数据库 ----------
const DB = { host: '127.0.0.1', port: '3306', user: 'root', password: process.env.GEEKPRICE_DB_PASSWORD ?? '123456', name: 'geek_price' }
const MYSQL = ['C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe', 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe'].find((p) => existsSync(p)) ?? 'mysql'
function select(sql, tag) {
  if (!/^\s*select\b/i.test(sql)) throw new Error('[只读保护] 非 SELECT 被拒绝')
  const inF = join(CACHE, `${tag}.sql`), bat = join(CACHE, `${tag}.bat`), outF = join(CACHE, `${tag}.out`), errF = join(CACHE, `${tag}.err`)
  writeFileSync(inF, sql, 'utf8')
  writeFileSync(bat, `@echo off\r\n"${MYSQL}" -h ${DB.host} -P ${DB.port} -u ${DB.user} -p${DB.password} --default-character-set=utf8mb4 -N -B "${DB.name}" < "${inF}" > "${outF}" 2> "${errF}"\r\n`, 'utf8')
  try { execFileSync('cmd.exe', ['/c', bat], { stdio: 'inherit' }) } catch { }
  return existsSync(outF) ? readFileSync(outF, 'utf8') : ''
}
const parseTsv = (raw, cols) => raw.split(/\r?\n/).filter((l) => l.trim() !== '').map((l) => l.split('\t')).filter((f) => f.length === cols)

// ============================================================
// 产品类型关键词（必须命中其一，保证"产品类型一致"）
// ============================================================
const CAT_TYPE = {
  '手机': ['phone', 'smartphone', 'mobile'],
  '平板电脑': ['tablet', 'pad'],
  '笔记本电脑': ['laptop', 'notebook'],
  '台式电脑': ['desktop', 'computer', 'workstation'],
  '显示器': ['monitor', 'display', 'screen'],
  '耳机': ['headphone', 'earphone', 'earbud', 'headset', 'in-ear', 'iem'],
  '键盘': ['keyboard'],
  '鼠标': ['mouse', 'mice'],
  '相机': ['camera'],
  '智能手表': ['watch', 'smartwatch'],
  '游戏机': ['console', 'playstation', 'xbox', 'steam deck', 'handheld'],
  '显卡': ['graphics card', 'geforce', 'radeon', 'gpu', 'video card', 'graphics'],
  'CPU': ['processor', 'cpu', 'ryzen', 'core i', 'socket', 'chip'],
  '固态硬盘': ['ssd', 'solid-state', 'nvme', 'solid state drive'],
  '内存': ['memory', 'ram', 'dimm', 'ddr'],
  '路由器': ['router', 'wi-fi', 'wifi', 'wireless', 'gigabit']
}

// ============================================================
// 系列目录（显式枚举，可审计）
//   must   = 必须在「标题+描述+分类」中同时出现的 token（一律含品牌 token）
//   series = 系列名（展示用）
//   search = 检索词
// ============================================================
const S = (series, must, search) => ({ series, must, search })
const SERIES = {
  // 手机
  5: S('Xiaomi 14 系列', ['xiaomi', '14'], ['Xiaomi 14 smartphone', 'Xiaomi 14 Ultra', 'Xiaomi 14 phone']),
  8: S('vivo X100 系列', ['vivo', 'x100'], ['Vivo X100', 'Vivo X100 smartphone']),
  9: S('OnePlus 数字旗舰系列', ['oneplus', '12'], ['OnePlus 12 smartphone', 'OnePlus 12']),
  12: S('Redmi K70 系列', ['redmi', 'k70'], ['Redmi K70', 'Xiaomi Redmi K70 smartphone']),
  // 平板
  17: S('Lenovo Xiaoxin/Tab 平板系列', ['lenovo', 'pad'], ['Lenovo Xiaoxin Pad', 'Lenovo Tab tablet']),
  19: S('vivo Pad 系列', ['vivo', 'pad'], ['Vivo Pad tablet', 'Vivo Pad 3']),
  20: S('OPPO Pad 系列', ['oppo', 'pad'], ['OPPO Pad tablet', 'Oppo Pad 3']),
  // 笔记本
  21: S('Lenovo Legion 系列', ['lenovo', 'legion'], ['Lenovo Legion laptop', 'Lenovo Legion Y9000P']),
  22: S('Lenovo Xiaoxin 系列', ['lenovo', 'xiaoxin'], ['Lenovo Xiaoxin laptop', 'Lenovo Xiaoxin Pro']),
  23: S('Apple MacBook Air 系列', ['macbook', 'air'], ['MacBook Air laptop', 'MacBook Air M3']),
  25: S('ASUS TUF Gaming 系列', ['asus', 'tuf'], ['ASUS TUF Gaming laptop', 'ASUS TUF Gaming A16']),
  26: S('Dell XPS 13 系列', ['dell', 'xps'], ['Dell XPS 13 laptop', 'Dell XPS 13']),
  27: S('HP OMEN 系列', ['hp', 'omen'], ['HP OMEN laptop', 'HP Omen gaming laptop']),
  28: S('Lenovo ThinkBook 系列', ['lenovo', 'thinkbook'], ['Lenovo ThinkBook laptop', 'Lenovo ThinkBook 14']),
  30: S('MSI Stealth 系列', ['msi', 'stealth'], ['MSI Stealth laptop', 'MSI Stealth 14']),
  31: S('Honor MagicBook 系列', ['honor', 'magicbook'], ['Honor MagicBook laptop', 'Honor MagicBook Pro']),
  32: S('Mechrevo 游戏本系列', ['mechrevo'], ['Mechrevo laptop', 'Mechrevo gaming laptop']),
  // 台式
  33: S('Lenovo Legion 台式系列', ['lenovo', 'legion'], ['Lenovo Legion desktop', 'Lenovo Legion tower']),
  34: S('HP OMEN 台式系列', ['hp', 'omen'], ['HP OMEN desktop', 'HP Omen gaming desktop']),
  35: S('Dell XPS 台式系列', ['dell', 'xps'], ['Dell XPS desktop', 'Dell XPS tower']),
  36: S('MSI Trident 系列', ['msi', 'trident'], ['MSI Trident desktop', 'MSI Trident gaming']),
  37: S('ASUS ROG 系列', ['asus', 'rog'], ['ASUS ROG desktop', 'ASUS ROG gaming computer']),
  38: S('Lenovo 天逸/台式系列', ['lenovo'], ['Lenovo desktop computer', 'Lenovo tower PC', 'Lenovo Tianyi desktop']),
  // 显示器
  39: S('LG UltraGear 系列', ['lg', 'ultragear'], ['LG UltraGear monitor', 'LG gaming monitor']),
  40: S('Samsung Odyssey 系列', ['samsung', 'odyssey'], ['Samsung Odyssey monitor', 'Samsung Odyssey G7']),
  41: S('Dell UltraSharp 系列', ['dell', 'ultrasharp'], ['Dell UltraSharp monitor', 'Dell U2723']),
  42: S('ASUS TUF Gaming 显示器系列', ['asus', 'tuf'], ['ASUS TUF Gaming monitor', 'ASUS TUF VG27']),
  43: S('Xiaomi 显示器系列', ['xiaomi', 'monitor'], ['Xiaomi monitor', 'Xiaomi 4K monitor']),
  44: S('AOC 显示器系列', ['aoc', 'monitor'], ['AOC monitor', 'AOC 27 inch monitor']),
  45: S('BenQ 专业显示器系列', ['benq', 'monitor'], ['BenQ monitor', 'BenQ PD monitor']),
  46: S('Titan Army 显示器系列', ['titan'], ['Titan Army monitor', 'Titan Army gaming monitor']),
  // 耳机
  47: S('Sony WH-1000X 系列', ['sony', 'wh-1000'], ['Sony WH-1000XM5', 'Sony WH-1000XM4 headphones', 'Sony WH-1000X']),
  48: S('Bose QuietComfort 系列', ['bose', 'quietcomfort'], ['Bose QuietComfort', 'Bose QuietComfort Ultra headphones']),
  49: S('Apple AirPods Pro 系列', ['airpods', 'pro'], ['AirPods Pro', 'Apple AirPods Pro']),
  50: S('Sennheiser Momentum 系列', ['sennheiser', 'momentum'], ['Sennheiser Momentum', 'Sennheiser Momentum headphones']),
  51: S('Edifier NeoBuds 系列', ['edifier'], ['Edifier NeoBuds', 'Edifier wireless earbuds']),
  52: S('Huawei FreeBuds 系列', ['huawei', 'freebuds'], ['Huawei FreeBuds', 'Huawei FreeBuds Pro']),
  53: S('Xiaomi Buds 系列', ['xiaomi', 'buds'], ['Xiaomi Buds', 'Xiaomi wireless earbuds']),
  55: S('Moondrop Starfield 系列', ['moondrop'], ['Moondrop earphone', 'Moondrop Starfield']),
  56: S('Audio-Technica ATH-M 系列', ['audio-technica', 'ath'], ['Audio-Technica ATH-M50x', 'Audio-Technica ATH-M50', 'Audio-Technica headphones']),
  // 键盘
  57: S('Keychron Q 系列', ['keychron'], ['Keychron keyboard', 'Keychron Q1']),
  59: S('Razer BlackWidow 系列', ['razer', 'blackwidow'], ['Razer BlackWidow keyboard', 'Razer BlackWidow']),
  60: S('Dareu A 系列键盘', ['dareu'], ['Dareu keyboard', 'Dareu mechanical keyboard']),
  61: S('Kzzi K 系列键盘', ['kzzi'], ['Kzzi keyboard', 'Kzzi K75']),
  62: S('Cherry MX 系列键盘', ['cherry', 'mx'], ['Cherry MX keyboard', 'Cherry keyboard']),
  63: S('AULA 机械键盘系列', ['aula'], ['AULA keyboard', 'AULA mechanical keyboard']),
  64: S('Corsair K70 系列', ['corsair', 'k70'], ['Corsair K70 keyboard', 'Corsair K70 RGB']),
  // 鼠标
  66: S('Razer Viper 系列', ['razer', 'viper'], ['Razer Viper mouse', 'Razer Viper V3']),
  68: S('Dareu A 系列鼠标', ['dareu'], ['Dareu mouse', 'Dareu gaming mouse']),
  69: S('Rapoo 鼠标系列', ['rapoo'], ['Rapoo mouse', 'Rapoo gaming mouse']),
  70: S('ZOWIE EC 系列', ['zowie', 'ec'], ['ZOWIE EC mouse', 'Zowie EC2']),
  71: S('Delux 鼠标系列', ['delux'], ['Delux mouse', 'Delux gaming mouse']),
  72: S('Corsair Sabre 系列', ['corsair', 'sabre'], ['Corsair Sabre mouse', 'Corsair gaming mouse']),
  // 相机
  75: S('Nikon Z6 系列', ['nikon', 'z6'], ['Nikon Z6 III', 'Nikon Z6 camera']),
  // 智能手表
  82: S('Huawei Watch GT 系列', ['huawei', 'watch gt'], ['Huawei Watch GT', 'Huawei Watch GT 4']),
  83: S('Xiaomi Watch S 系列', ['xiaomi', 'watch'], ['Xiaomi Watch', 'Xiaomi Watch S3']),
  86: S('OPPO Watch 系列', ['oppo', 'watch'], ['OPPO Watch', 'Oppo Watch 4 Pro']),
  87: S('Huawei Watch Ultimate 系列', ['huawei', 'ultimate'], ['Huawei Watch Ultimate', 'Huawei Watch Ultimate smartwatch']),
  // 游戏机
  90: S('Sony PlayStation 5 系列', ['playstation', 'ps5'], ['PlayStation 5 console', 'PS5 console']),
  92: S('Valve Steam Deck 系列', ['steam deck'], ['Steam Deck', 'Valve Steam Deck']),
  // 显卡
  96: S('NVIDIA GeForce RTX 4070 系列', ['geforce', '4070'], ['GeForce RTX 4070', 'RTX 4070 graphics card']),
  98: S('NVIDIA GeForce RTX 4090 系列', ['geforce', '4090'], ['GeForce RTX 4090', 'RTX 4090 graphics card']),
  99: S('AMD Radeon RX 7800 系列', ['radeon', '7800'], ['Radeon RX 7800 XT', 'AMD Radeon RX 7800']),
  101: S('NVIDIA GeForce RTX 4060 系列', ['geforce', '4060'], ['GeForce RTX 4060 Ti', 'RTX 4060 graphics card']),
  102: S('AMD Radeon RX 7600 系列', ['radeon', '7600'], ['Radeon RX 7600', 'AMD Radeon RX 7600']),
  103: S('Colorful RTX 4070 系列', ['colorful', '4070'], ['Colorful RTX 4070', 'Colorful graphics card']),
  104: S('MSI GeForce RTX 4060 系列', ['msi', '4060'], ['MSI GeForce RTX 4060', 'MSI RTX 4060 graphics card']),
  // CPU
  108: S('AMD Ryzen 7 7800X3D 系列', ['ryzen', '7800x3d'], ['Ryzen 7 7800X3D', 'AMD Ryzen 7800X3D']),
  109: S('AMD Ryzen 5 7600 系列', ['ryzen', '7600'], ['Ryzen 5 7600', 'AMD Ryzen 5 7600']),
  110: S('AMD Ryzen 9 7950X 系列', ['ryzen', '7950'], ['Ryzen 9 7950X', 'AMD Ryzen 9 7950X']),
  111: S('Intel Core i5-12400 系列', ['intel', '12400'], ['Intel Core i5-12400F', 'Intel i5-12400']),
  112: S('AMD Ryzen 7 7700 系列', ['ryzen', '7700'], ['Ryzen 7 7700', 'AMD Ryzen 7 7700']),
  // SSD
  113: S('ZhiTai TiPlus7100 系列', ['zhitai', 'tiplus'], ['ZhiTai SSD', 'ZhiTai TiPlus7100']),
  114: S('Samsung 990 PRO 系列', ['samsung', '990'], ['Samsung 990 PRO SSD', 'Samsung 990 Pro']),
  115: S('WD Black SN850X 系列', ['wd_black', 'sn850'], ['WD Black SN850X', 'WD Black SSD']),
  116: S('Kioxia RC20 系列', ['kioxia', 'rc20'], ['Kioxia RC20 SSD', 'Kioxia SSD RC20']),
  117: S('ZhiTai TiPlus5000 系列', ['zhitai', 'tiplus'], ['ZhiTai SSD', 'ZhiTai TiPlus5000']),
  118: S('Kingston KC3000 系列', ['kingston', 'kc3000'], ['Kingston KC3000 SSD', 'Kingston KC3000']),
  119: S('Hikvision C2000 系列', ['hikvision', 'c2000'], ['Hikvision C2000 SSD', 'Hikvision SSD']),
  120: S('Acer Predator GM7 系列', ['predator', 'gm7'], ['Acer Predator GM7 SSD', 'Acer Predator SSD']),
  // 内存
  121: S('G.Skill Trident Z 系列', ['g.skill', 'trident'], ['G.Skill Trident Z', 'G.Skill Trident Z RAM']),
  122: S('Kingston FURY 系列', ['kingston', 'fury'], ['Kingston FURY memory', 'Kingston Fury RAM', 'Kingston FURY Beast']),
  123: S('Corsair Vengeance 系列', ['corsair', 'vengeance'], ['Corsair Vengeance RAM', 'Corsair Vengeance memory']),
  124: S('ADATA XPG 系列', ['adata', 'xpg'], ['ADATA XPG memory', 'ADATA XPG RAM']),
  125: S('Crucial 内存系列', ['crucial', 'memory'], ['Crucial memory module', 'Crucial RAM DDR5']),
  126: S('Gloway 内存系列', ['gloway'], ['Gloway memory', 'Gloway RAM']),
  // 路由器
  127: S('ASUS RT-AX86U 系列', ['asus', 'rt-ax86'], ['ASUS RT-AX86U router', 'ASUS RT-AX86U']),
  128: S('Xiaomi AX 路由器系列', ['xiaomi', 'router'], ['Xiaomi router', 'Xiaomi AX9000']),
  129: S('TP-Link 路由器系列', ['tp-link', 'router'], ['TP-Link router', 'TP-Link Archer router']),
  130: S('Huawei 路由器系列', ['huawei', 'router'], ['Huawei router', 'Huawei WiFi router']),
  131: S('ZTE 路由器系列', ['zte', 'router'], ['ZTE router', 'ZTE WiFi router']),
  132: S('ASUS RT-AX88U 系列', ['asus', 'rt-ax88'], ['ASUS RT-AX88U router', 'ASUS RT-AX88U'])
}

// ============================================================
// 主体类型判定（排除包装/对比/展台/人物/截图/裸片/配件）
// ============================================================
/** 统一归一化：小写、去扩展名、非字母数字转空格；标题与型号两侧都用它，保证 '-' '_' '.' 处理一致 */
const nz = (s) => String(s ?? '').toLowerCase().replace(/^file:/, '')
  .replace(/\.(jpe?g|png|gif|webp|tiff?|svg)$/, ' ')
  .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()

function subjectVerdict(text) {
  const t = String(text ?? '').toLowerCase()
  const bad = []
  if (/die shot|wafer|micrograph|delid|裸片|晶圆|显微|\bccx\b|\bccd\b|iod@|nmesf|@\d+nm/.test(t)) bad.push('chip_die')
  if (/\bbox\b|packaging|packshot|unboxing|包装|开箱|retail package/.test(t)) bad.push('packaging')
  if (/vergleich|comparison|\bvs\b|对比|compared to/.test(t)) bad.push('comparison')
  if (/\bshop\b|\bstore\b|booth|expo\b|exhibition|陈列|专柜|门店|retail display|ausgestellt|displayed|on display/.test(t)) bad.push('store')
  if (/\blogo\b|wordmark|\bsvg\b|clipart|vector|emblem|badge/.test(t)) bad.push('logo')
  if (/screenshot|media from youtube|youtube|geekerwan|极客湾|мой компьютер|zmaslo|im vergleich|leistungsanalyse|\breview\b|评测|\d{2}\.\d{2}\.\d{2}\.\d{3}/.test(t)) bad.push('screenshot_video')
  if (/license review needed|license review/.test(t)) bad.push('license_unreviewed')
  if (/\bpeople\b|\bperson\b|\bman\b|\bwoman\b|\bgirl\b|\bboy\b|portrait|hands?\b|人物|musician|singer/.test(t)) bad.push('people')
  if (/\bcable\b|charger|adapter|\bcase\b|cover|sleeve|\bstand\b|dock\b|mount\b|holder|配件|keycap/.test(t)) bad.push('accessory')
  if (/\bmotherboard\b|mainboard|cpu socket|\bpcb\b/.test(t)) bad.push('internal_part')
  // 零部件/拆解/单体元件（如「Cherry MX black opened」只是拆开的单颗轴体，不是键盘）
  if (/\bswitch\b|\bswitches\b|\bopened\b|teardown|disassembl|\binternals?\b|\binside\b|\bboard\b|\bchip\b|\bdie\b|\bmodule only\b/.test(t)) bad.push('part_or_teardown')
  // 规格标签 / 铭牌 / 贴纸，不是产品本体
  if (/spec tag|spec label|specification label|nameplate|rating label|sticker|back label|铭牌|标签/.test(t)) bad.push('label_not_product')
  // 多设备/并排（"A and B"、"A & B"、复数产品名）
  if (/\band\b\s+\S+\s+\d|\s&\s|\band\s+(other|more)\b/.test(t)) bad.push('multi_device')
  if (/\bmonitores\b|\bdesktops\b|\blaptops\b|\bcameras\b|\bkeyboards\b|\bphones\b|\bmice\b|\bheadphones\b/.test(t)) bad.push('multi_device_plural')
  return bad
}

/**
 * 代际/型号冲突：标题在系列锚点后给出的数字，与本品型号数字不是同一个。
 * 例：本品「Watch GT 4」，标题「Huawei Watch GT 5」→ 冲突（不同代际，不得冒充）。
 */
function generationConflict(titleNz, anchorNz, modelNums) {
  if (!anchorNz) return null
  const idx = titleNz.indexOf(anchorNz)
  if (idx < 0) return null
  const after = titleNz.slice(idx + anchorNz.length, idx + anchorNz.length + 22)
  const m = after.match(/\b(\d{1,4})\b/)
  if (!m) return null
  const n = m[1]
  if (modelNums.includes(n)) return null
  const sameLen = modelNums.filter((x) => x.length === n.length)
  if (sameLen.length) return `${anchorNz} ${n}（本品为 ${sameLen.join('/')}）`
  return null
}

/** 型号变体词：检测「跨型号冒充」 */
const VARIANT_WORDS = ['ultra', 'pro', 'max', 'super', 'ti', 'plus', 'x3d', 'oled', 'mini', 'classic', 'lite']
/** 容量/尺寸 token（禁止混用） */
const capacityOf = (s) => [...(` ${String(s ?? '').toLowerCase()} `).matchAll(/(\d+(?:\.\d+)?)\s*(tb|gb)\b/g)].map((m) => `${m[1]}${m[2]}`).sort().join(',')

/**
 * 对应关系未经证实的产品：不得判为 EXACT_MATCH。
 * 华硕天选 5 Pro —— ASUS 官方把「天选5 Pro」对应到 TUF Gaming A16/F16 (2024)，
 * 并不存在官方名为「TUF Gaming 5 Pro」的机型（前序审核结论）。
 */
const CONTESTED = new Set([25])

/** 是否为「无元数据」候选（Commons 未提供描述也没有分类，无从验证主体） */
const hasNoMetadata = (c) => !String(c.description ?? '').trim() && !String(c.categories ?? '').trim()

/**
 * 品牌身份词：必须在标题里出现，用于排除「系列 token 恰好是常见词」的撞车。
 * 例：AULA（狼蛛）的系列锚点 `aula` 会命中拉丁语「Aula musica」（音乐厅），必须靠品牌词兜住。
 */
const BRAND_IDENTITY = {
  小米: ['xiaomi', 'redmi'], 一加: ['oneplus'], vivo: ['vivo'], OPPO: ['oppo'],
  苹果: ['apple', 'macbook', 'airpods', 'ipad'], 华为: ['huawei'], 荣耀: ['honor'],
  联想: ['lenovo', 'thinkbook', 'thinkpad', 'legion'], 戴尔: ['dell'], 惠普: ['hp', 'omen'],
  华硕: ['asus', 'rog', 'tuf'], 微星: ['msi'], 机械革命: ['mechrevo'], 宏碁: ['acer', 'predator'],
  三星: ['samsung'], LG: ['lg'], AOC: ['aoc'], 明基: ['benq'], 泰坦军团: ['titan army', 'titan'],
  索尼: ['sony', 'playstation'], 森海塞尔: ['sennheiser'], 漫步者: ['edifier'], 水月雨: ['moondrop'],
  铁三角: ['audio-technica', 'audio technica', 'ath'], Bose: ['bose'], 雷蛇: ['razer'], 达尔优: ['dareu'],
  雷柏: ['rapoo'], 卓威: ['zowie'], 多彩: ['delux'], 珂芝: ['kzzi'], 樱桃: ['cherry'],
  狼蛛: ['aula'], Keychron: ['keychron'], 海盗船: ['corsair'], 尼康: ['nikon'], 富士: ['fujifilm'],
  松下: ['panasonic', 'lumix'], 佳明: ['garmin'], 微软: ['microsoft', 'xbox'], Valve: ['valve', 'steam deck'],
  英伟达: ['nvidia', 'geforce', 'rtx'], AMD: ['amd', 'radeon', 'ryzen'], Intel: ['intel', 'core i'],
  七彩虹: ['colorful'], 致态: ['zhitai'], 西数: ['western digital', 'wd_black', 'wd black'],
  铠侠: ['kioxia'], 金士顿: ['kingston'], 海康威视: ['hikvision'], 芝奇: ['g.skill', 'gskill'],
  威刚: ['adata', 'xpg'], 英睿达: ['crucial'], 光威: ['gloway'], 'TP-Link': ['tp-link', 'tp link'], 中兴: ['zte']
}
const brandIdentityHit = (brand, titleNz) => {
  const keys = BRAND_IDENTITY[brand]
  if (!keys || keys.length === 0) return true
  return keys.some((k) => titleNz.includes(nz(k)))
}

// ============================================================
// Commons 检索（带本地缓存 + 限流退避）
// ============================================================
async function wmSearch(query) {
  const key = query.replace(/[^a-z0-9]+/gi, '_').slice(0, 90)
  const cf = join(WM_CACHE, `${key}.json`)
  if (existsSync(cf)) { try { return JSON.parse(readFileSync(cf, 'utf8')) } catch { } }
  const params = new URLSearchParams({
    action: 'query', format: 'json', generator: 'search', gsrsearch: query,
    gsrnamespace: '6', gsrlimit: '20', prop: 'imageinfo',
    iiprop: 'url|size|extmetadata|mime', iiurlwidth: '500',
    iiextmetadatafilter: 'ImageDescription|ObjectName|Categories|Artist|LicenseShortName'
  })
  let out = { results: [], error: null }
  for (let a = 0; a < 4; a++) {
    try {
      const r = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: { 'User-Agent': UA } })
      if (r.status === 429) { await sleep(20000); continue }
      if (!r.ok) { out.error = `HTTP ${r.status}`; break }
      const j = await r.json()
      const clean = (s) => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      out.results = Object.values(j.query?.pages ?? {}).map((p) => {
        const ii = p.imageinfo?.[0] ?? {}
        const em = ii.extmetadata ?? {}
        return {
          title: String(p.title).replace(/^File:/, ''),
          imageUrl: ii.url,
          thumbnailUrl: ii.thumburl,
          width: ii.width, height: ii.height, mime: ii.mime,
          description: clean(em.ImageDescription?.value),
          objectName: clean(em.ObjectName?.value),
          categories: clean(em.Categories?.value).split('|').join(' '),
          creator: clean(em.Artist?.value).replace(/\s+/g, ' ').slice(0, 80),
          license: clean(em.LicenseShortName?.value),
          sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title).replace(/%3A/, ':')}`
        }
      })
      break
    } catch (e) { out.error = e.message; await sleep(6000) }
  }
  writeFileSync(cf, JSON.stringify(out))
  return out
}

// ============================================================
// 主流程
// ============================================================
console.log('[1/3] 读取数据库中仍缺图的产品（只读 SELECT）...')
const brands = new Map(parseTsv(select('SELECT id, name FROM brands;', 'b'), 2).map(([i, n]) => [Number(i), n]))
const cats = new Map(parseTsv(select('SELECT id, name FROM categories;', 'c'), 2).map(([i, n]) => [Number(i), n]))
const products = parseTsv(select(`SELECT id, name, brand_id, category_id FROM products WHERE deleted = 0 ORDER BY id;`, 'p'), 4)
  .map(([id, name, b, c]) => ({ id: Number(id), name, brand: brands.get(Number(b)) ?? '', category: cats.get(Number(c)) ?? '' }))
const hasReal = new Set(parseTsv(select(`SELECT DISTINCT product_id FROM product_images WHERE url NOT LIKE '%placehold.co%';`, 'r'), 1).map(([x]) => Number(x)))
const targets = products.filter((p) => !hasReal.has(p.id))
console.log(`      products=${products.length}，已有真实图=${hasReal.size}，本轮目标=${targets.length}`)

// 致命保护：数据库读不到时必须报错退出，绝不能静默产出全 0 结果
if (products.length === 0) {
  console.error('\n[FATAL] 从数据库读到 0 个产品（MySQL 可能未启动）。已中止，未写出任何结果。')
  console.error('        请先启动 MySQL 后重跑：mysqld --datadir=... --port=3306')
  process.exit(1)
}

// 复用 phase-1 已抓到的候选，避免重复联网
const P1 = existsSync(join(HERE, 'image-candidates-phase1.json')) ? JSON.parse(readFileSync(join(HERE, 'image-candidates-phase1.json'), 'utf8')) : { products: [] }
const p1By = new Map(P1.products.map((x) => [x.productId, x]))

console.log('[2/3] 逐个产品检索并评级 ...')
const report = []
for (let i = 0; i < targets.length; i++) {
  const p = targets[i]
  const spec = SERIES[p.id]
  if (!spec) { console.log(`  ⚠️ #${p.id} 缺少系列定义，跳过`); continue }
  const typeWords = CAT_TYPE[p.category] ?? []
  const queries = [...new Set([...spec.search])].slice(0, 3)

  // 聚合候选：phase-1 已有的 + 本轮新检索
  const pool = new Map()
  const addCand = (c, via) => {
    const k = c.imageUrl ?? c.title
    if (!k) return
    if (!pool.has(k)) pool.set(k, { ...c, via })
  }
  for (const c of (p1By.get(p.id)?.candidates ?? [])) addCand(c, 'phase1')
  for (const q of queries) {
    const r = await wmSearch(q)
    for (const c of r.results) addCand(c, q)
    await sleep(1100)
  }

  // 评级（严格版）
  // 关键修正：型号/系列证据必须出现在**标题**里。
  // 描述与分类由上传者自由撰写（已实测出现「IPhone 文件名 + Redmi K70 检索」这种噪声），
  // 只凭描述/分类判定会产生大量假阳性。
  const fullModelNz = nz(p1By.get(p.id)?.model ?? '')
  const productCaps = capacityOf(p1By.get(p.id)?.model ?? '')
  const scored = []
  for (const c of pool.values()) {
    const titleNz = nz(c.title)
    const metaText = [c.title, c.description, c.objectName, c.categories].join(' ')
    const subjBad = subjectVerdict(metaText)
    const licOk = isAutoAdoptLicense(c.license)
    const typeHit = typeWords.length === 0 ? true : typeWords.some((t) => titleNz.includes(t) || String(c.categories ?? '').toLowerCase().includes(t))

    // 品牌与系列必须在标题命中
    const mustInTitle = spec.must.every((t) => titleNz.includes(nz(t)))
    // 完整型号（归一化后）整串出现在标题 —— 这是 EXACT 的唯一依据
    const modelPhraseHit = fullModelNz.length >= 3 && titleNz.includes(fullModelNz)
    // 型号必须含可区分 token（至少一个 token 非纯数字、且长度≥2）：
    // 防止「骇客神条 32gb」「天选 5 pro」这类中文/弱型号仅凭数字+泛词就冒充精确匹配
    const modelTokens = fullModelNz.split(' ').filter((t) => t.length >= 2)
    const modelHasDistinctive = modelTokens.some((t) => !/^\d+$/.test(t))
    // 关键锚点：型号里必须有一个长度≥3 的非纯数字 token 出现在标题中
    const modelAnchor = modelTokens.filter((t) => !/^\d+$/.test(t) && t.length >= 3)
    const anchorHit = modelAnchor.length === 0 ? false : modelAnchor.some((t) => titleNz.includes(t))
    // 品牌身份词必须出现
    const brandHit = brandIdentityHit(p.brand, titleNz)
    // 系列必须"具体"：must 里至少要有 1 个非纯品牌的区分 token 命中标题。
    // 否则只剩品牌（如 Lenovo 任意电脑）就算"系列一致"，属过宽。
    const brandWords = (BRAND_IDENTITY[p.brand] ?? []).map((k) => nz(k))
    const mustSpecific = spec.must.map((t) => nz(t)).filter((t) => !brandWords.includes(t))
    const seriesHit = mustSpecific.length === 0 ? false : mustSpecific.every((t) => titleNz.includes(t))
    // 代际冲突（系列锚点后的数字与本品型号数字不同，如 GT 5 vs GT 4）
    const seriesAnchorNz = spec.must.map((t) => nz(t)).filter((t) => t.length >= 3).find((t) => titleNz.includes(t)) ?? ''
    const modelNums = fullModelNz.split(' ').filter((t) => /^\d{1,4}$/.test(t))
    const genConflict = generationConflict(titleNz, seriesAnchorNz, modelNums)

    // 变体冲突：标题出现型号里没有的变体词，或缺少型号里有的变体词
    const variantConflict = []
    for (const v of VARIANT_WORDS) {
      const inModel = new RegExp(`\\b${v}\\b`).test(fullModelNz)
      const inTitle = new RegExp(`\\b${v}\\b`).test(titleNz)
      if (!inModel && inTitle) variantConflict.push(`标题多出「${v}」`)
      if (inModel && !inTitle) variantConflict.push(`标题缺「${v}」`)
    }
    // 容量冲突（如 2TB vs 4TB）
    const titleCaps = capacityOf(c.title)
    const capConflict = productCaps && titleCaps && productCaps !== titleCaps

    let level = 'REJECT'
    let reason = ''
    if (!mustInTitle) {
      level = 'REJECT'; reason = `标题缺少必需 token（${spec.must.filter((t) => !titleNz.includes(nz(t))).join(',')}）`
    } else if (!brandHit) {
      level = 'REJECT'; reason = `标题未出现品牌身份词（${(BRAND_IDENTITY[p.brand] ?? []).join('/')}）`
    } else if (!seriesHit) {
      level = 'REJECT'; reason = `标题未确认具体系列（需含 ${mustSpecific.join('+') || '(未定义系列 token)'}）`
    } else if (!typeHit) {
      level = 'REJECT'; reason = `产品类型不符（需含 ${typeWords.join('/')}）`
    } else if (subjBad.length) {
      level = 'REJECT'; reason = `主体不合格：${subjBad.join(',')}`
    } else if (hasNoMetadata(c)) {
      level = 'REJECT'; reason = 'Commons 无描述也无分类，无法验证主体'
    } else if (!licOk) {
      level = 'REJECT'; reason = `许可不允许（${c.license ?? '未知'}）`
    } else if (!c.thumbnailUrl) {
      level = 'REJECT'; reason = '无 500px 缩略图可用'
    } else if (genConflict) {
      level = 'REJECT'; reason = `代际冲突：标题为「${genConflict}」`
    } else if (modelPhraseHit && variantConflict.length === 0 && !capConflict && modelHasDistinctive && anchorHit && !CONTESTED.has(p.id)) {
      level = 'EXACT_MATCH'
      reason = `标题含完整型号「${p1By.get(p.id)?.model}」且无变体/容量冲突（品牌+系列 ${spec.must.join(' + ')} 亦命中）`
    } else {
      level = 'SERIES_MATCH'
      const why = []
      if (variantConflict.length) why.push(`型号差异：${variantConflict.join('、')}`)
      else if (!modelPhraseHit) why.push('标题未出现完整型号')
      if (capConflict) why.push(`容量不同（${productCaps} vs ${titleCaps}）`)
      if (!modelHasDistinctive) why.push('型号含中文/弱 token，无法确认精确型号')
      if (!anchorHit && modelAnchor.length) why.push('缺型号关键锚点')
      if (CONTESTED.has(p.id)) why.push('该产品线中文名与海外名对应关系未经证实')
      reason = `品牌+系列一致（${spec.must.join(' + ')}），产品类型为 ${typeWords.find((t) => titleNz.includes(t)) ?? typeWords[0]}；` + why.join('；')
    }
    let score = 0
    if (mustInTitle) score += 40
    if (typeHit) score += 15
    if (modelPhraseHit) score += 25
    if (licOk) score += 10
    if (!subjBad.length) score += 10
    if (variantConflict.length === 0) score += 5
    if (level === 'EXACT_MATCH') score += 10
    scored.push({ ...c, level, reason, score, mustInTitle, brandHit, seriesHit, typeHit, modelPhraseHit, licOk, subjBad, variantConflict, capConflict, genConflict, via: c.via })
  }

  scored.sort((a, b) => (b.level === 'EXACT_MATCH') - (a.level === 'EXACT_MATCH') || b.score - a.score)
  const exact = scored.filter((x) => x.level === 'EXACT_MATCH')
  const series = scored.filter((x) => x.level === 'SERIES_MATCH')
  const best = exact[0] ?? series[0] ?? null
  const rejected = scored.filter((x) => x.level === 'REJECT')

  report.push({
    productId: p.id, productName: p.name, brand: p.brand, category: p.category,
    fullModel: p1By.get(p.id)?.model ?? null,
    seriesName: spec.series, mustTokens: spec.must, queries,
    matchType: best ? best.level : 'REJECT',
    candidateCount: exact.length + series.length,
    exactCount: exact.length, seriesCount: series.length,
    poolSize: pool.size, rejectedCount: rejected.length,
    best: best ? {
      imageUrl: best.imageUrl, thumbnailUrl: best.thumbnailUrl, commonsPage: best.sourceUrl,
      title: best.title, license: best.license, creator: best.creator,
      width: best.width, height: best.height, mime: best.mime,
      matchType: best.level, score: best.score, reason: best.reason,
      subjectNote: best.description || best.objectName || '',
      categories: best.categories, via: best.via
    } : null,
    allCandidates: [...exact, ...series].slice(0, 5).map((x) => ({
      imageUrl: x.imageUrl, thumbnailUrl: x.thumbnailUrl, commonsPage: x.sourceUrl,
      title: x.title, license: x.license, creator: x.creator,
      matchType: x.level, score: x.score, reason: x.reason, via: x.via
    }))
  })
  if ((i + 1) % 10 === 0 || i === targets.length - 1) {
    const done = report.filter((r) => r.matchType !== 'REJECT').length
    console.log(`      [${i + 1}/${targets.length}] #${p.id} ${p.name} → ${best ? best.level : 'REJECT'}；累计有候选 ${done}`)
  }
}

// ============================================================
// 输出
// ============================================================
const generatedAt = new Date().toISOString()
const exactAll = report.filter((r) => r.matchType === 'EXACT_MATCH')
const seriesAll = report.filter((r) => r.matchType === 'SERIES_MATCH')
const noneAll = report.filter((r) => r.matchType === 'REJECT')

const jsonOut = {
  meta: {
    purpose: '第三阶段：为仍缺图产品收集候选（EXACT_MATCH 优先，其次 SERIES_MATCH）。未写数据库。',
    generatedAt,
    scope: `deleted=0 产品 ${products.length} 个；已有真实图 ${hasReal.size} 个（不重复处理）；本轮目标 ${targets.length} 个`,
    levels: { EXACT_MATCH: '品牌+完整型号确认', SERIES_MATCH: '品牌+产品系列一致、产品类型一致，未确认具体型号', REJECT: '无法可靠确认' },
    constraints: [
      '品牌/系列/产品类型三者必须一致', '禁止仅凭数字型号匹配', '禁止跨代际/跨产品线/跨型号冒充',
      '必须有开放许可（CC0/PD/CC BY/CC BY-SA）', '只用 500px 缩略图', '排除包装/对比/展台/人物/截图/裸片/配件'
    ],
    stats: {
      targets: targets.length,
      exactMatch: exactAll.length,
      seriesMatch: seriesAll.length,
      noReliableCandidate: noneAll.length
    }
  },
  exactMatch: exactAll,
  seriesMatch: seriesAll,
  noCandidate: noneAll
}
writeFileSync(OUT_JSON, JSON.stringify(jsonOut, null, 2))

const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
const head = ['product_id', '产品名称', '品牌', '完整型号', '图片URL', 'Commons页面', '许可证', 'matchType', '系列名称', '匹配依据', 'score', '主体说明']
const csv = [head.join(',')]
for (const r of [...exactAll, ...seriesAll]) {
  const b = r.best
  csv.push([r.productId, r.productName, r.brand, r.fullModel ?? '', b.imageUrl, b.commonsPage, b.license,
    r.matchType, r.seriesName, b.reason, b.score, (b.subjectNote || b.title).slice(0, 200)].map(esc).join(','))
}
for (const r of noneAll) {
  csv.push([r.productId, r.productName, r.brand, r.fullModel ?? '', '', '', '', 'REJECT', r.seriesName,
    `无可靠候选（系列 token：${r.mustTokens.join('+')}；池内 ${r.poolSize} 条，全部被剔除）`, 0, ''].map(esc).join(','))
}
writeFileSync(OUT_CSV, '\uFEFF' + csv.join('\n') + '\n')

const md = []
md.push('# 图片补充 · 第三阶段候选审核（EXACT_MATCH / SERIES_MATCH）')
md.push('')
md.push(`> 生成时间：${generatedAt}`)
md.push(`> 范围：数据库 deleted=0 产品 ${products.length} 个；已有真实图 ${hasReal.size} 个（**不重复处理**）；本轮目标 **${targets.length}** 个`)
md.push('> 本轮**只做候选收集与审核，未执行任何 INSERT / UPDATE / DELETE**；未改前后端代码。')
md.push('')
md.push('## 一、结果统计')
md.push('')
md.push('| 等级 | 数量 |')
md.push('|---|---|')
md.push(`| **EXACT_MATCH**（新增候选） | **${exactAll.length}** |`)
md.push(`| **SERIES_MATCH** | **${seriesAll.length}** |`)
md.push(`| **无可靠候选** | **${noneAll.length}** |`)
md.push(`| 合计 | ${report.length} |`)
md.push('')
md.push('## 二、推荐导入清单')
md.push('')
md.push('> 优先精确型号；无精确型号时才用系列级。全部为开放许可 + 500px 缩略图 + 产品主体。')
md.push('')
md.push('| # | product_id | 产品 | 品牌 | matchType | 系列 | 许可证 | 分数 | 图片标题 | 500px 缩略图 URL | Commons 页面 |')
md.push('|---|---|---|---|---|---|---|---|---|---|---|')
let n = 0
for (const r of [...exactAll, ...seriesAll]) {
  const b = r.best
  md.push(`| ${++n} | ${r.productId} | ${r.productName} | ${r.brand} | **${r.matchType}** | ${r.seriesName} | ${b.license} | ${b.score} | ${String(b.title).replace(/\|/g, '\\|').slice(0, 60)} | ${b.thumbnailUrl} | ${b.commonsPage} |`)
}
md.push('')
md.push('### 逐条匹配依据')
md.push('')
for (const r of [...exactAll, ...seriesAll]) {
  const b = r.best
  md.push(`**#${r.productId} ${r.productName}**（${r.brand} / ${r.category}）→ ${r.matchType}`)
  md.push('')
  md.push(`- 完整型号：\`${r.fullModel ?? '—'}\``)
  md.push(`- 系列名称：${r.seriesName}`)
  md.push(`- 必需 token：${r.mustTokens.join(' + ')}`)
  md.push(`- 匹配依据：${b.reason}`)
  md.push(`- 主体说明：${b.subjectNote || '(无描述)'}`)
  md.push(`- 图片标题：${b.title}`)
  md.push(`- 许可：${b.license}｜creator：${b.creator}`)
  md.push(`- 缩略图：${b.thumbnailUrl}`)
  md.push('')
}
md.push('## 三、无可靠候选的产品')
md.push('')
md.push('| product_id | 产品 | 品牌 | 系列 | 候选池 | 全部被剔除的原因 |')
md.push('|---|---|---|---|---|---|')
for (const r of noneAll) {
  md.push(`| ${r.productId} | ${r.productName} | ${r.brand} | ${r.seriesName} | ${r.poolSize} | 缺品牌/系列/类型证据，或主体、许可不合格 |`)
}
md.push('')
md.push('## 四、规则执行说明')
md.push('')
md.push('- **品牌一致**：`must` token 一律包含品牌 token（如 `corsair`、`kingston`），缺失直接 REJECT。')
md.push('- **产品类型一致**：按分类校验类型关键词（键盘须含 keyboard、内存须含 memory/ram/ddr、显卡须含 graphics/geforce/radeon…），不符直接 REJECT。')
md.push('- **禁止仅凭数字型号**：`k70`、`4060` 等数字 token 必须与品牌 token 同时命中；单独命中数字不计。')
md.push('- **禁止跨代/跨线冒充**：`must` 里的代际/系列 token（如 `x100`、`watch gt`、`wh-1000`）必须出现，X100 Ultra 不会被 X100 Pro 之类替身通过；型号级差异一律降级为 SERIES_MATCH，不标 EXACT。')
md.push('- **主体排除**：包装/开箱、对比图、展台门店、人物、截图/评测、芯片裸片、logo/矢量、配件线缆、单键/键帽、主板内部件，命中任一即 REJECT。')
md.push('- **许可**：仅 CC0 / Public Domain / CC BY / CC BY-SA；含 NC/ND 或授权未复核的一律剔除。')
md.push('- **URL**：只输出 `thumb.wikimedia.org/.../500px-` 缩略图，不使用超大原图。')
md.push('')
writeFileSync(OUT_MD, md.join('\n'))

console.log('[3/3] 已写出 JSON / CSV / Markdown')
console.log(`      EXACT_MATCH = ${exactAll.length}`)
console.log(`      SERIES_MATCH = ${seriesAll.length}`)
console.log(`      无可靠候选 = ${noneAll.length}`)
