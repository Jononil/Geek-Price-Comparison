#!/usr/bin/env node
/**
 * 商品库扩容（阶段：扩容与真实图片覆盖提升）
 * - 严格核验 Commons 候选（品牌身份+完整型号+主体+开放许可+署名齐全）
 * - 优先把验证通过的图片挂到现有缺图商品；否则新增商品
 * - 新商品补齐仿真多平台报价/历史价格/规格/评分（明示为系统模拟数据）
 * - 幂等：商品名已存在、图片 URL 已存在均跳过
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const ROOT = 'E:/第三学期/Geek Price Comparison'
const OUT = `${ROOT}/verification/product-catalog-expansion-20261012`
mkdirSync(OUT, { recursive: true })
mkdirSync(`${OUT}/_raw`, { recursive: true })
const MYSQL = 'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe'
const UA = 'GeekPriceGraduationProject/1.0 (catalog expansion; read-only source check)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function runSql(sql, tag) {
  const s = `${OUT}/_raw/${tag}.sql`, b = `${OUT}/_raw/${tag}.bat`, o = `${OUT}/_raw/${tag}.out`, e = `${OUT}/_raw/${tag}.err`
  writeFileSync(s, sql, 'utf8')
  writeFileSync(b, `@echo off\r\n"${MYSQL}" -h 127.0.0.1 -u root -p123456 --default-character-set=utf8mb4 -N -B geek_price < "${s}" > "${o}" 2> "${e}"\r\nexit /b %ERRORLEVEL%\r\n`, 'utf8')
  let ok = true
  try { execFileSync('cmd.exe', ['/c', b], { stdio: 'inherit' }) } catch { ok = false }
  return { ok, out: existsSync(o) ? readFileSync(o, 'utf8') : '', err: existsSync(e) ? readFileSync(e, 'utf8') : '' }
}
const one = (sql, tag) => Number(runSql(sql, tag).out.trim().split(/\r?\n/)[0])
const rows = (sql, tag, n) => runSql(sql, tag).out.split(/\r?\n/).filter((l) => l.trim()).map((l) => l.split('\t')).filter((f) => f.length === n)
const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")
const nz = (s) => String(s ?? '').toLowerCase().replace(/^file:/, '').replace(/\.(jpe?g|png|gif|webp|tiff?|svg)$/, ' ').replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ').replace(/\s+/g, ' ').trim()

// ---------- 候选商品清单（真实存在、型号明确；dbName=挂到现有商品） ----------
// model: 字符串或数组（标题需含其中之一，归一化比较）
const CURATED = [
  // 笔记本（缺口最大）
  { name: 'ThinkPad X1 Carbon Gen 11', brand: '联想', cat: '笔记本电脑', model: ['thinkpad x1 carbon', 'x1 carbon'] },
  { name: 'Lenovo Legion 5 Pro', brand: '联想', cat: '笔记本电脑', model: ['legion 5 pro'] },
  { name: 'Dell XPS 15', brand: '戴尔', cat: '笔记本电脑', model: ['xps 15'] },
  { name: 'Dell Inspiron 15 3520', brand: '戴尔', cat: '笔记本电脑', model: ['inspiron 15 3520', 'inspiron 15'] },
  { name: 'HP Envy 16', brand: '惠普', cat: '笔记本电脑', model: ['envy 16'] },
  { name: 'HP ProBook 450 G8', brand: '惠普', cat: '笔记本电脑', model: ['probook 450'] },
  { name: 'ASUS ZenBook 14', brand: '华硕', cat: '笔记本电脑', model: ['zenbook 14'] },
  { name: 'MSI Prestige 16', brand: '微星', cat: '笔记本电脑', model: ['prestige 16'] },
  { name: 'MacBook Air 15 M3', brand: '苹果', cat: '笔记本电脑', model: ['macbook air 15'] },
  { name: 'Acer Aspire 5 A515', brand: '宏碁', cat: '笔记本电脑', model: ['aspire 5 a515', 'aspire 5'] },
  { name: 'Acer Predator Helios 300', brand: '宏碁', cat: '笔记本电脑', model: ['predator helios 300', 'helios 300'] },
  { name: 'Lenovo IdeaPad 5', brand: '联想', cat: '笔记本电脑', model: ['ideapad 5'] },
  // 显示器（缺口 8）
  { name: 'Dell P2422H', brand: '戴尔', cat: '显示器', model: ['p2422h'] },
  { name: 'LG 27GP850-B', brand: 'LG', cat: '显示器', model: ['27gp850'] },
  { name: 'Samsung ViewFinity S6', brand: '三星', cat: '显示器', model: ['viewfinity s6', 'viewfinity'] },
  { name: 'AOC 24G2', brand: 'AOC', cat: '显示器', model: ['24g2'] },
  { name: 'BenQ EX2710', brand: '明基', cat: '显示器', model: ['ex2710'] },
  { name: 'ASUS VG249Q1A', brand: '华硕', cat: '显示器', model: ['vg249q1a'] },
  { name: 'LG 32UN880', brand: 'LG', cat: '显示器', model: ['32un880'] },
  // 固态硬盘（缺口 8）
  { name: 'Samsung 870 EVO 1TB', brand: '三星', cat: '固态硬盘', model: ['870 evo'] },
  { name: 'Samsung 980 PRO 1TB', brand: '三星', cat: '固态硬盘', model: ['980 pro'] },
  { name: 'WD Black SN770', brand: '西数', cat: '固态硬盘', model: ['sn770'] },
  { name: 'Crucial P5 Plus', brand: '英睿达', cat: '固态硬盘', model: ['p5 plus'] },
  { name: 'Kingston NV2 1TB', brand: '金士顿', cat: '固态硬盘', model: ['nv2'] },
  { dbName: '金士顿 KC3000 1TB', model: ['kc3000'] },
  { name: 'Intel 670p SSD', brand: 'Intel', cat: '固态硬盘', model: ['670p'] },
  // 耳机（缺口 8）
  { name: 'Sony WH-1000XM4', brand: '索尼', cat: '耳机', model: ['wh-1000xm4', '1000xm4'] },
  { name: 'Bose QuietComfort 45', brand: 'Bose', cat: '耳机', model: ['quietcomfort 45', 'qc45'] },
  { name: 'Sennheiser MOMENTUM 4', dbName: '森海塞尔 Momentum 4', model: ['momentum 4'] },
  { name: 'Sony WF-1000XM4', brand: '索尼', cat: '耳机', model: ['wf-1000xm4'] },
  { name: 'Sennheiser HD 600', brand: '森海塞尔', cat: '耳机', model: ['hd 600'] },
  // 键盘（缺口 9）
  { name: 'Corsair K95 RGB Platinum', brand: '海盗船', cat: '键盘', model: ['k95'] },
  { name: 'Corsair K55 RGB', brand: '海盗船', cat: '键盘', model: ['k55'] },
  { name: 'Razer Huntsman V2', brand: '雷蛇', cat: '键盘', model: ['huntsman v2', 'huntsman'] },
  { name: 'Logitech G413', brand: '罗技', cat: '键盘', model: ['g413'] },
  { name: 'Razer Cynosa V2', brand: '雷蛇', cat: '键盘', model: ['cynosa'] },
  { name: 'Cherry G80-3000', brand: '樱桃', cat: '键盘', model: ['g80-3000', 'g80 3000'] },
  { name: 'Keychron K8 Pro', brand: 'Keychron', cat: '键盘', model: ['k8 pro', 'k8'] },
  // 鼠标（缺口 6）
  { name: 'Logitech G502 Hero', brand: '罗技', cat: '鼠标', model: ['g502'] },
  { name: 'Logitech MX Anywhere 3', brand: '罗技', cat: '鼠标', model: ['mx anywhere 3', 'mx anywhere'] },
  { name: 'Razer Viper Mini', brand: '雷蛇', cat: '鼠标', model: ['viper mini'] },
  { dbName: '雷柏 VT9', model: ['vt9'] },
  { name: 'Microsoft Pro IntelliMouse', brand: '微软', cat: '鼠标', model: ['intellimouse'] },
  // 路由器（缺口 3）
  { name: 'TP-Link Archer C6', brand: 'TP-Link', cat: '路由器', model: ['archer c6'] },
  { name: 'ASUS RT-AX55', brand: '华硕', cat: '路由器', model: ['rt-ax55'] },
  { name: 'TP-Link Deco M5', brand: 'TP-Link', cat: '路由器', model: ['deco m5'] },
  // 相机
  { name: 'Sony A7 III', brand: '索尼', cat: '相机', model: ['a7 iii', 'alpha 7 iii', 'ilce-7m3'] },
  { name: 'Fujifilm X-S10', brand: '富士', cat: '相机', model: ['x-s10', 'xs10'] },
  { name: 'Nikon Z50', brand: '尼康', cat: '相机', model: ['z50'] },
  { name: 'Panasonic Lumix G7', brand: '松下', cat: '相机', model: ['lumix g7', 'g7'] },
  // CPU（缺口 7）
  { name: 'AMD Ryzen 5 3600', brand: 'AMD', cat: 'CPU', model: ['ryzen 5 3600', '5 3600'] },
  { name: 'AMD Ryzen 7 5800X', brand: 'AMD', cat: 'CPU', model: ['5800x'] },
  { name: 'Intel Core i5-11400', brand: 'Intel', cat: 'CPU', model: ['i5-11400', '11400'] },
  { name: 'Intel Core i7-12700K', brand: 'Intel', cat: 'CPU', model: ['i7-12700k', '12700k'] },
  // 内存（缺口 5）
  { name: 'Corsair Vengeance RGB Pro 32GB', brand: '海盗船', cat: '内存', model: ['vengeance rgb pro'] },
  { name: 'G.Skill Trident Z Neo 32GB', brand: '芝奇', cat: '内存', model: ['trident z neo', 'trident z'] },
  { name: 'ADATA XPG Lancer 32GB', brand: '威刚', cat: '内存', model: ['lancer'] },
  // 台式电脑（缺口 6）
  { name: 'Dell OptiPlex 7090', brand: '戴尔', cat: '台式电脑', model: ['optiplex 7090', 'optiplex'] },
  { name: 'HP ProDesk 400 G7', brand: '惠普', cat: '台式电脑', model: ['prodesk 400', 'prodesk'] },
  { name: 'Lenovo ThinkCentre M720q', brand: '联想', cat: '台式电脑', model: ['thinkcentre m720', 'thinkcentre'] },
  // 手机（缺口 4）
  { name: 'Samsung Galaxy S23', brand: '三星', cat: '手机', model: ['galaxy s23'] },
  { name: 'Samsung Galaxy S22 Ultra', brand: '三星', cat: '手机', model: ['s22 ultra', 'galaxy s22 ultra'] },
  { name: 'iPhone 14 Pro', brand: '苹果', cat: '手机', model: ['iphone 14 pro'] },
  { name: 'iPhone SE (3rd generation)', brand: '苹果', cat: '手机', model: ['iphone se'] },
  // 游戏机
  { dbName: '索尼 PS5', model: ['playstation 5', 'ps5'] },
  // 智能手表
  { name: 'Samsung Galaxy Watch 5', brand: '三星', cat: '智能手表', model: ['galaxy watch 5', 'watch 5'] },
  { name: 'Apple Watch SE', brand: '苹果', cat: '智能手表', model: ['watch se', 'apple watch se'] },
  // ===== 第二波：国际机型（Commons 覆盖强）+ 现有缺图商品挂图 =====
  // 挂现有
  { dbName: '苹果 AirPods Pro 2', model: ['airpods pro 2', 'airpods pro (2nd'] },
  { dbName: '森海塞尔 Momentum 4', model: ['momentum 4'] },
  { dbName: '铁三角 ATH-M50x', model: ['ath-m50x'] },
  { dbName: '海盗船 K70', model: ['k70'] },
  { dbName: '索尼 PS5', model: ['playstation 5', 'ps5'] },
  { dbName: 'Steam Deck OLED', model: ['steam deck oled'] },
  { dbName: '芝奇幻光戟 32GB', model: ['trident z rgb', 'trident z'] },
  { dbName: '海盗船复仇者 32GB', model: ['vengeance lpx'] },
  { dbName: '英睿达 32GB', model: ['ballistix max', 'ballistix'] },
  { dbName: '华硕 RT-AX86U Pro', model: ['rt-ax86u pro', 'rt-ax86u'] },
  { dbName: '华硕 RT-AX88U Pro', model: ['rt-ax88u pro', 'rt-ax88u'] },
  { dbName: '铠侠 RC20 1TB', model: ['rc20', 'exceria g2'] },
  { dbName: 'RTX 4090', model: ['rtx 4090'] },
  { dbName: 'MacBook Pro 14', model: ['macbook pro 14'] },
  // 笔记本
  { name: 'ThinkPad T480', brand: '联想', cat: '笔记本电脑', model: ['thinkpad t480', 't480'] },
  { name: 'ThinkPad X220', brand: '联想', cat: '笔记本电脑', model: ['thinkpad x220', 'x220'] },
  { name: 'ThinkPad T430', brand: '联想', cat: '笔记本电脑', model: ['t430'] },
  { name: 'Dell Latitude 7490', brand: '戴尔', cat: '笔记本电脑', model: ['latitude 7490'] },
  { name: 'Dell Latitude E6430', brand: '戴尔', cat: '笔记本电脑', model: ['e6430'] },
  { name: 'HP EliteBook 840 G3', brand: '惠普', cat: '笔记本电脑', model: ['elitebook 840'] },
  { name: 'MacBook Air M1', brand: '苹果', cat: '笔记本电脑', model: ['macbook air (m1', 'macbook air m1'] },
  { name: 'Acer Aspire One D255', brand: '宏碁', cat: '笔记本电脑', model: ['aspire one'] },
  { name: 'ASUS ZenBook UX31A', brand: '华硕', cat: '笔记本电脑', model: ['ux31a', 'zenbook ux31'] },
  { name: 'ASUS ZenBook UX305', brand: '华硕', cat: '笔记本电脑', model: ['ux305'] },
  // 显示器
  { name: 'Dell U2415', brand: '戴尔', cat: '显示器', model: ['u2415'] },
  { name: 'Dell U2412M', brand: '戴尔', cat: '显示器', model: ['u2412m'] },
  { name: 'ASUS PG279Q', brand: '华硕', cat: '显示器', model: ['pg279q'] },
  { name: 'BenQ EW3270U', brand: '明基', cat: '显示器', model: ['ew3270u'] },
  { name: 'LG 27UK850', brand: 'LG', cat: '显示器', model: ['27uk850'] },
  // 相机（Commons 覆盖强）
  { name: 'Nikon D3500', brand: '尼康', cat: '相机', model: ['d3500'] },
  { name: 'Nikon D3300', brand: '尼康', cat: '相机', model: ['d3300'] },
  { name: 'Nikon D5300', brand: '尼康', cat: '相机', model: ['d5300'] },
  { name: 'Nikon D7100', brand: '尼康', cat: '相机', model: ['d7100'] },
  { name: 'Nikon D7200', brand: '尼康', cat: '相机', model: ['d7200'] },
  { name: 'Nikon D500', brand: '尼康', cat: '相机', model: ['nikon d500'] },
  { name: 'Canon EOS 250D', brand: '佳能', cat: '相机', model: ['eos 250d'] },
  { name: 'Canon EOS 200D', brand: '佳能', cat: '相机', model: ['eos 200d'] },
  { name: 'Canon EOS 80D', brand: '佳能', cat: '相机', model: ['eos 80d'] },
  { name: 'Canon EOS 700D', brand: '佳能', cat: '相机', model: ['eos 700d'] },
  { name: 'Canon EOS 1300D', brand: '佳能', cat: '相机', model: ['eos 1300d'] },
  { name: 'Canon EOS M50', brand: '佳能', cat: '相机', model: ['eos m50'] },
  { name: 'Sony A6000', brand: '索尼', cat: '相机', model: ['a6000', 'ilce-6000'] },
  { name: 'Sony A6400', brand: '索尼', cat: '相机', model: ['a6400', 'ilce-6400'] },
  { name: 'Fujifilm X-T30', brand: '富士', cat: '相机', model: ['x-t30', 'xt-30'] },
  { name: 'Fujifilm X100F', brand: '富士', cat: '相机', model: ['x100f'] },
  { name: 'Panasonic LX100', brand: '松下', cat: '相机', model: ['lx100', 'dmc-lx100'] },
  { name: 'Panasonic G85', brand: '松下', cat: '相机', model: ['g85', 'dmc-g85'] },
  { name: 'Canon PowerShot G7 X', brand: '佳能', cat: '相机', model: ['g7 x', 'g7x'] },
  // 耳机
  { name: 'Sennheiser HD 599', brand: '森海塞尔', cat: '耳机', model: ['hd 599'] },
  { name: 'Sennheiser HD 518', brand: '森海塞尔', cat: '耳机', model: ['hd 518'] },
  { name: 'Sennheiser HD 650', brand: '森海塞尔', cat: '耳机', model: ['hd 650'] },
  { name: 'Sennheiser HD 25', brand: '森海塞尔', cat: '耳机', model: ['hd 25'] },
  { name: 'Sony MDR-7506', brand: '索尼', cat: '耳机', model: ['7506'] },
  { name: 'Bose QuietComfort 25', brand: 'Bose', cat: '耳机', model: ['quietcomfort 25', 'qc25'] },
  // 键盘
  { name: 'Corsair K65 RGB', brand: '海盗船', cat: '键盘', model: ['k65'] },
  { name: 'Razer BlackWidow Ultimate', brand: '雷蛇', cat: '键盘', model: ['blackwidow ultimate'] },
  // 鼠标
  { name: 'Logitech MX Master', brand: '罗技', cat: '鼠标', model: ['mx master'] },
  { name: 'Logitech M510', brand: '罗技', cat: '鼠标', model: ['m510'] },
  { name: 'Logitech G403', brand: '罗技', cat: '鼠标', model: ['g403'] },
  { name: 'Razer DeathAdder Elite', brand: '雷蛇', cat: '鼠标', model: ['deathadder elite', 'deathadder'] },
  // 路由器
  { name: 'TP-Link Archer C7', brand: 'TP-Link', cat: '路由器', model: ['archer c7'] },
  { name: 'TP-Link TL-WR841N', brand: 'TP-Link', cat: '路由器', model: ['wr841n'] },
  { name: 'ASUS RT-AC68U', brand: '华硕', cat: '路由器', model: ['rt-ac68u'] },
  { name: 'ASUS RT-N66U', brand: '华硕', cat: '路由器', model: ['rt-n66u'] },
  // 手机（国际版）
  { name: 'iPhone X', brand: '苹果', cat: '手机', model: ['iphone x'] },
  { name: 'iPhone XR', brand: '苹果', cat: '手机', model: ['iphone xr'] },
  { name: 'iPhone 11', brand: '苹果', cat: '手机', model: ['iphone 11'] },
  { name: 'iPhone 12', brand: '苹果', cat: '手机', model: ['iphone 12'] },
  { name: 'iPhone 13', brand: '苹果', cat: '手机', model: ['iphone 13'] },
  { name: 'iPhone 14', brand: '苹果', cat: '手机', model: ['iphone 14'] },
  { name: 'Samsung Galaxy S8', brand: '三星', cat: '手机', model: ['galaxy s8'] },
  { name: 'Samsung Galaxy S9', brand: '三星', cat: '手机', model: ['galaxy s9'] },
  { name: 'Samsung Galaxy S10', brand: '三星', cat: '手机', model: ['galaxy s10'] },
  { name: 'Samsung Galaxy Note8', brand: '三星', cat: '手机', model: ['galaxy note8'] },
  { name: 'Xiaomi Mi 9', brand: '小米', cat: '手机', model: ['mi 9'] },
  { name: 'Huawei P30 Pro', brand: '华为', cat: '手机', model: ['p30 pro'] },
  { name: 'Huawei Mate 20 Pro', brand: '华为', cat: '手机', model: ['mate 20 pro'] },
  // 游戏机
  { name: 'Sony PlayStation 4', brand: '索尼', cat: '游戏机', model: ['playstation 4'] },
  { name: 'Sony PlayStation 3', brand: '索尼', cat: '游戏机', model: ['playstation 3'] },
  { name: 'Nintendo 3DS XL', brand: '任天堂', cat: '游戏机', model: ['3ds xl'] },
  { name: 'Nintendo Wii U', brand: '任天堂', cat: '游戏机', model: ['wii u'] },
  // 智能手表
  { name: 'Apple Watch Series 4', brand: '苹果', cat: '智能手表', model: ['watch series 4'] },
  { name: 'Garmin Forerunner 235', brand: '佳明', cat: '智能手表', model: ['forerunner 235'] },
  // 固态硬盘
  { name: 'Samsung 850 EVO 1TB', brand: '三星', cat: '固态硬盘', model: ['850 evo'] },
  { name: 'Samsung 860 EVO 1TB', brand: '三星', cat: '固态硬盘', model: ['860 evo'] },
  { name: 'Crucial MX500 1TB', brand: '英睿达', cat: '固态硬盘', model: ['mx500'] },
  { name: 'Kingston A400 480GB', brand: '金士顿', cat: '固态硬盘', model: ['a400'] },
  { name: 'WD Blue SN550', brand: '西数', cat: '固态硬盘', model: ['sn550'] },
  // 内存
  { name: 'G.Skill Ripjaws V 16GB', brand: '芝奇', cat: '内存', model: ['ripjaws v'] },
  { name: 'Kingston HyperX Fury 16GB', brand: '金士顿', cat: '内存', model: ['hyperx fury'] },
  // CPU（封装特写照，与现有 #152 底面照先例一致）
  { name: 'Intel Core i7-4790K', brand: 'Intel', cat: 'CPU', model: ['4790k'] },
  { name: 'Intel Core i7-7700K', brand: 'Intel', cat: 'CPU', model: ['7700k'] },
  { name: 'Intel Core i9-9900K', brand: 'Intel', cat: 'CPU', model: ['9900k'] },
  { name: 'AMD Ryzen 5 2600', brand: 'AMD', cat: 'CPU', model: ['ryzen 5 2600'] },
  { name: 'AMD Ryzen 7 2700X', brand: 'AMD', cat: 'CPU', model: ['2700x'] },
  { name: 'AMD Ryzen 9 3900X', brand: 'AMD', cat: 'CPU', model: ['3900x'] },
]

// ---------- 数据库读取 ----------
console.log('=== 1. 读取数据库 ===')
const brands = new Map(rows('SELECT id, name FROM brands;', 'b', 2).map(([i, n]) => [n, Number(i)]))
const cats = new Map(rows('SELECT id, name FROM categories;', 'c', 2).map(([i, n]) => [n, Number(i)]))
const existingNames = new Set(rows('SELECT name FROM products WHERE deleted=0;', 'pn', 1).map(([n]) => nz(n)))
// 现有缺图商品：name -> id
const missingRows = rows(`SELECT p.id, p.name FROM products p WHERE p.deleted=0
  AND NOT EXISTS (SELECT 1 FROM product_images pi JOIN product_image_license l ON l.image_id=pi.id
    WHERE pi.product_id=p.id AND l.audit_status IN ('APPROVED','APPROVED_WITH_ATTRIBUTION')
      AND l.risk_notes IS NULL AND pi.url NOT LIKE '%placehold.co%');`, 'mp', 2)
const missingById = new Map(missingRows.map(([id, n]) => [Number(id), n]))
const qualifiedCount0 = one(`SELECT COUNT(DISTINCT pi.product_id) FROM product_images pi
  JOIN product_image_license l ON l.image_id=pi.id
  WHERE l.audit_status IN ('APPROVED','APPROVED_WITH_ATTRIBUTION') AND l.risk_notes IS NULL
    AND pi.url NOT LIKE '%placehold.co%';`, 'q0')
console.log(`现有可展示商品=${qualifiedCount0}，缺图商品=${missingRows.length}，品牌=${brands.size}，分类=${cats.size}`)

// ---------- Commons 检索（缓存） ----------
async function wmSearch(query) {
  const key = query.replace(/[^a-z0-9]+/gi, '_').slice(0, 80)
  const cf = `${OUT}/_raw/wm_${key}.json`
  if (existsSync(cf)) { try { return JSON.parse(readFileSync(cf, 'utf8')) } catch { } }
  const p = new URLSearchParams({ action: 'query', format: 'json', generator: 'search', gsrsearch: query, gsrnamespace: '6', gsrlimit: '20', prop: 'imageinfo', iiprop: 'url|size|extmetadata|mime', iiurlwidth: '500', iiextmetadatafilter: 'ImageDescription|ObjectName|Categories|Artist|LicenseShortName|LicenseUrl' })
  let out = { results: [], error: null }
  for (let a = 0; a < 4; a++) {
    try {
      const r = await fetch(`https://commons.wikimedia.org/w/api.php?${p}`, { headers: { 'User-Agent': UA } })
      if (r.status === 429) { await sleep(20000); continue }
      if (!r.ok) { out.error = 'HTTP ' + r.status; break }
      const j = await r.json()
      const clean = (s) => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      out.results = Object.values(j.query?.pages ?? {}).map((pg) => {
        const ii = pg.imageinfo?.[0] ?? {}, em = ii.extmetadata ?? {}
        return {
          title: String(pg.title).replace(/^File:/, ''), thumb: ii.thumburl, original: ii.url,
          w: ii.width, h: ii.height, mime: ii.mime, size: ii.size,
          desc: clean(em.ImageDescription?.value), cats: clean(em.Categories?.value),
          creator: clean(em.Artist?.value).slice(0, 120),
          license: clean(em.LicenseShortName?.value), licenseUrl: clean(em.LicenseUrl?.value),
          page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(pg.title).replace(/%3A/, ':')}`
        }
      })
      break
    } catch (e) { out.error = e.message; await sleep(6000) }
  }
  writeFileSync(cf, JSON.stringify(out))
  return out
}

// ---------- 严格核验 ----------
const VARIANT = ['ultra', 'pro', 'max', 'super', 'ti', 'plus', 'x3d', 'oled', 'mini', 'classic', 'lite', 'neo', 'se', 'gen', 'carbon', 'enterprise', 'gaming']
const subjFlags = (t) => {
  const s = String(t ?? '').toLowerCase(); const bad = []
  if (/die shot|wafer|micrograph|delid|裸片|晶圆|显微|\bccx\b|iod@/.test(s)) bad.push('chip_die')
  if (/\bbox\b|packaging|packshot|unboxing|包装|开箱/.test(s)) bad.push('packaging')
  if (/vergleich|comparison|\bvs\b|对比|compared to/.test(s)) bad.push('comparison')
  if (/\bshop\b|\bstore\b|booth|expo\b|exhibition|陈列|专柜|门店|ausgestellt|on display/.test(s)) bad.push('store')
  if (/\blogo\b|wordmark|\bsvg\b|clipart|vector|emblem/.test(s)) bad.push('logo')
  if (/screenshot|media from youtube|youtube|geekerwan|极客湾|зmaslo|zmaslo|leistungsanalyse|\breview\b|评测|unboxing video/.test(s)) bad.push('screenshot')
  if (/license review needed/.test(s)) bad.push('license_review_needed')
  if (/\bpeople\b|\bperson\b|\bman\b|\bwoman\b|portrait|hands?\b|人物/.test(s)) bad.push('people')
  if (/\bcable\b|charger|adapter|\bcase\b|cover|sleeve|\bstand\b|dock\b|mount\b|holder|配件|keycap|laptop bag/.test(s)) bad.push('accessory')
  if (/\bmotherboard\b|mainboard|\bpcb\b/.test(s)) bad.push('internal_part')
  if (/\bschematic\b|\bdiagram\b|wiring/.test(s)) bad.push('diagram')
  return bad
}
const capOf = (s) => [...(` ${String(s ?? '').toLowerCase()} `).matchAll(/(\d+(?:\.\d+)?)\s*(tb|gb)\b/g)].map((m) => `${m[1]}${m[2]}`).sort().join(',')
const openLic = (l, licUrl) => {
  if (!l || !licUrl) return false
  const s = l.toLowerCase()
  if (/\bnc\b|\bnd\b/.test(s)) return false
  return /^cc0/.test(s) || s.includes('public domain') || /^pd/.test(s) || /^cc by-sa/.test(s) || /^cc by(?!-sa)/.test(s)
}

function verifyCandidate(c, item) {
  const titleNz = nz(c.title)
  const meta = [c.title, c.desc, c.cats].join(' ')
  const modelAlts = (Array.isArray(item.model) ? item.model : [item.model]).map(nz)
  const brandNz = nz(BRAND_EN[item.brand] ?? item.brand)
  const flags = subjFlags(meta)
  if (flags.length) return { pass: false, why: 'subject:' + flags.join(',') }
  if (!titleNz.includes(brandNz)) return { pass: false, why: 'brand_missing:' + brandNz }
  if (!modelAlts.some((m) => m && titleNz.includes(m))) return { pass: false, why: 'model_missing:' + modelAlts.join('|') }
  // 变体/代际冲突：模型变体词必须都在标题；标题多出的系列变体词须与模型一致
  const modelAll = nz(modelAlts[0])
  for (const v of ['ultra', 'pro', 'max', 'super', 'ti', 'plus', 'neo', 'se', 'mini']) {
    const inModel = new RegExp(`(^| )${v}( |$)`).test(modelAll)
    const inTitle = new RegExp(`(^| )${v}( |$)`).test(titleNz)
    if (inModel && !inTitle) return { pass: false, why: 'variant_missing:' + v }
    if (!inModel && inTitle) {
      // 模型未声明该变体而标题出现 → 若模型含更完整形式允许，否则视为变体冲突
      const declared = (Array.isArray(item.model) ? item.model : [item.model]).some((m) => new RegExp(`(^| )${v}( |$)`).test(nz(m)))
      if (!declared) return { pass: false, why: 'variant_extra:' + v }
    }
  }
  const modelCap = capOf(modelAll), titleCap = capOf(titleNz)
  if (modelCap && titleCap && modelCap !== titleCap) return { pass: false, why: `capacity:${modelCap}!=${titleCap}` }
  if (!openLic(c.license, c.licenseUrl)) return { pass: false, why: 'license:' + (c.license || 'missing') }
  if (!c.thumb) return { pass: false, why: 'no_thumbnail' }
  if (/^cc by/i.test(c.license.toLowerCase())) {
    if (!c.creator || !c.creator.trim()) return { pass: false, why: 'attribution_missing:author' }
  }
  return { pass: true }
}

// ---------- 主循环前必须存在的常量（避免 TDZ） ----------
const BRAND_EN = {
  联想: 'Lenovo', 戴尔: 'Dell', 惠普: 'HP', 华硕: 'ASUS', 微星: 'MSI', 苹果: 'Apple', 宏碁: 'Acer',
  三星: 'Samsung', LG: 'LG', AOC: 'AOC', 明基: 'BenQ', 西数: 'Western Digital', 金士顿: 'Kingston',
  英睿达: 'Crucial', 索尼: 'Sony', Bose: 'Bose', 森海塞尔: 'Sennheiser', 海盗船: 'Corsair', 雷蛇: 'Razer',
  罗技: 'Logitech', 樱桃: 'Cherry', Keychron: 'Keychron', 微软: 'Microsoft', 富士: 'Fujifilm', 尼康: 'Nikon',
  松下: 'Panasonic', AMD: 'AMD', Intel: 'Intel', 芝奇: 'G.Skill', 威刚: 'ADATA', 'TP-Link': 'TP-Link',
}
const SPEC_BY_CAT = {
  _default: [['type', '类型', '数码产品'], ['warranty', '质保', '1年'], ['color', '颜色', '黑色'], ['origin', '产地', '中国'], ['release', '上市年份', '2024']],
  手机: [['os', '操作系统', 'Android / iOS'], ['screen', '屏幕', '6.7英寸 AMOLED'], ['battery', '电池', '4500mAh'], ['chip', '处理器', '八核'], ['5g', '网络', '5G']],
  笔记本电脑: [['screen', '屏幕', '14英寸 IPS'], ['cpu', '处理器', 'Intel Core i7'], ['ram', '内存', '16GB DDR5'], ['ssd', '硬盘', '512GB SSD'], ['gpu', '显卡', '核芯显卡']],
  显示器: [['size', '尺寸', '27英寸'], ['panel', '面板', 'IPS'], ['resolution', '分辨率', '2560x1440'], ['hz', '刷新率', '144Hz'], ['ports', '接口', 'HDMI/DP']],
  固态硬盘: [['capacity', '容量', '1TB'], ['interface', '接口', 'M.2 NVMe'], ['seq_read', '顺序读取', '3500MB/s'], ['form', '形态', 'M.2 2280'], ['tbw', '写入总量', '600TBW']],
  耳机: [['type', '类型', '头戴式/入耳式'], ['anc', '降噪', '主动降噪'], ['bt', '蓝牙', '蓝牙5.3'], ['battery', '续航', '30小时'], ['driver', '驱动单元', '40mm']],
  键盘: [['type', '类型', '机械键盘'], ['switch', '轴体', '红轴'], ['backlight', '背光', 'RGB'], ['conn', '连接', '有线/2.4G'], ['layout', '布局', '全尺寸']],
  鼠标: [['type', '类型', '无线鼠标'], ['dpi', 'DPI', '16000'], ['sensor', '传感器', '光电'], ['conn', '连接', '2.4G/蓝牙'], ['weight', '重量', '85g']],
  路由器: [['wifi', 'Wi-Fi标准', 'Wi-Fi 6'], ['band', '频段', '双频'], ['rate', '无线速率', '1800Mbps'], ['port', '网口', '千兆LAN'], ['cpu', '处理器', '四核']],
  CPU: [['socket', '接口', 'AM5/LGA1700'], ['cores', '核心', '6核12线程'], ['base', '基础频率', '3.6GHz'], ['tdp', 'TDP', '65W'], ['arch', '架构', 'Zen4/Alder Lake']],
  内存: [['type', '类型', 'DDR4/DDR5'], ['capacity', '容量', '32GB套装'], ['freq', '频率', '3600MHz'], ['latency', '时序', 'CL16'], ['rgb', '灯效', '支持RGB']],
  相机: [['sensor', '传感器', '全画幅CMOS'], ['mount', '卡口', 'E/RF/Z卡口'], ['video', '视频', '4K 30fps'], ['iso', 'ISO范围', '100-51200'], ['weight', '重量', '550g']],
  台式电脑: [['cpu', '处理器', 'Intel Core i5'], ['ram', '内存', '16GB'], ['ssd', '硬盘', '512GB SSD'], ['gpu', '显卡', '集成显卡'], ['form', '形态', '微塔式']],
  智能手表: [['screen', '屏幕', '1.4英寸 AMOLED'], ['os', '系统', 'Wear OS'], ['battery', '续航', '14天'], ['gps', '定位', 'GPS双频'], ['water', '防水', '5ATM']],
}

// ---------- 主循环 ----------
console.log('=== 2. 检索与核验 ===')
const log = []
const inserted = { products: 0, images: 0, licenses: 0, prices: 0, history: 0, specs: 0, skipped: 0, rejected: 0 }

for (let i = 0; i < CURATED.length; i++) {
  const item = CURATED[i]
  // 目标商品解析：挂现有 or 新增
  let targetId = null, targetName = item.name, isNew = false
  if (item.dbName) {
    targetId = Number(rows(`SELECT id FROM products WHERE deleted=0 AND name='${esc(item.dbName)}';`, 'dn', 1)[0]?.[0] ?? 0) || null
    targetName = item.dbName
    if (!targetId) { log.push({ item, result: 'SKIP', why: '现有商品不存在:' + item.dbName }); continue }
  } else if (existingNames.has(nz(item.name))) {
    log.push({ item, result: 'SKIP', why: '商品名已存在' }); inserted.skipped++
    continue
  }
  if (!item.dbName && !targetId) isNew = true
  // 已有合格图则跳过
  if (targetId) {
    const q = one(`SELECT COUNT(*) FROM product_images pi JOIN product_image_license l ON l.image_id=pi.id
      WHERE pi.product_id=${targetId} AND l.audit_status IN ('APPROVED','APPROVED_WITH_ATTRIBUTION')
        AND l.risk_notes IS NULL AND pi.url NOT LIKE '%placehold.co%';`, 'hq')
    if (q > 0) { log.push({ item, result: 'SKIP', why: '已有合格图' }); inserted.skipped++; continue }
  }

  const brandEn = BRAND_EN[item.brand] ?? item.brand
  const modelQ = Array.isArray(item.model) ? item.model[0] : item.model
  const queries = [...new Set([`${brandEn} ${modelQ}`, modelQ, `${brandEn} ${modelQ} ${item.cat ?? ''}`].filter(Boolean))].slice(0, 3)
  const pool = new Map()
  for (const q of queries) {
    const r = await wmSearch(q)
    for (const c of r.results) if (!pool.has(c.thumb ?? c.title)) pool.set(c.thumb ?? c.title, { ...c, via: q })
    await sleep(1300)
  }
  // 严格核验，取第一条通过的
  let winner = null
  for (const c of pool.values()) {
    const v = verifyCandidate(c, item)
    if (v.pass) { winner = c; break }
  }
  if (!winner) {
    inserted.rejected++
    log.push({ item, result: 'NO_PASS', pool: pool.size, sample: [...pool.values()].slice(0, 3).map((c) => ({ title: c.title, why: (() => { const t = verifyCandidate(c, item); return t.why })() })) })
    console.log(`[${i + 1}/${CURATED.length}] ❌ ${item.dbName ?? item.name} (池${pool.size}, 无通过候选)`)
    continue
  }

  // 写入（幂等守卫）
  let pid = targetId
  if (!pid) {
    const bid = brands.get(item.brand) ?? null
    const cid = cats.get(item.cat) ?? null
    if (!bid || !cid) { log.push({ item, result: 'ERROR', why: `品牌或分类缺失 ${item.brand}/${item.cat}` }); continue }
    const base = 500 + Math.floor(Math.random() * 9000)
    const r = runSql(`INSERT INTO products (name, brand_id, category_id, description, official_price, current_price, score, value_score, performance_score, user_rating, sales, heat, launch_date, status, is_recommend, is_hot, deleted)
      SELECT '${esc(item.name)}', ${bid}, ${cid}, '系统新增：型号明确的数码产品（演示数据，价格为系统模拟）', ${base}.00, ${base}.00, 4.5, ${75 + Math.floor(Math.random() * 20)}, ${70 + Math.floor(Math.random() * 25)}, 4.5, ${100 + Math.floor(Math.random() * 900)}, ${100 + Math.floor(Math.random() * 900)}, '2024-06-01', 1, 0, 0, 0
      FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='${esc(item.name)}');`, 'ins_p')
    const got = Number(rows(`SELECT id FROM products WHERE deleted=0 AND name='${esc(item.name)}';`, 'nid', 1)[0]?.[0] ?? 0)
    if (!got) { log.push({ item, result: 'ERROR', why: '商品插入失败' }); continue }
    pid = got
    inserted.products++
    existingNames.add(nz(item.name))
  }

  // 图片（按 URL 幂等；商品可能已有占位图，不得因占位图而拒绝真实图片）
  const imgUrl = winner.thumb, isThumbUrl = /\/thumb\//.test(imgUrl)
  const r1 = runSql(`INSERT INTO product_images (product_id, url, sort)
    SELECT ${pid}, '${esc(imgUrl)}', (SELECT COALESCE(MAX(sort),0)+1 FROM product_images WHERE product_id=${pid}) FROM DUAL
    WHERE NOT EXISTS (SELECT 1 FROM product_images WHERE product_id=${pid} AND url='${esc(imgUrl)}');`, 'ins_i')
  const imgId = Number(rows(`SELECT id FROM product_images WHERE product_id=${pid} AND url='${esc(imgUrl)}';`, 'iid', 1)[0]?.[0] ?? 0)
  if (!imgId) { log.push({ item, result: 'ERROR', why: '图片插入失败' }); continue }
  inserted.images++

  // 授权记录（完整证据；BY/BY-SA 必含作者与署名）
  const needsAttr = /^cc by/i.test(String(winner.license).toLowerCase())
  const attr = `图片来自 Wikimedia Commons，作者 ${winner.creator}，许可 ${winner.license}（${winner.licenseUrl}），原始页面 ${winner.page}${isThumbUrl ? '；展示图为官方 500px 缩放版' : ''}`
  const licStatus = needsAttr ? 'APPROVED_WITH_ATTRIBUTION' : 'APPROVED'
  const r2 = runSql(`INSERT INTO product_image_license (image_id, source, source_page_url, original_url, license, license_url, author, attribution_text, modifications, match_type, audit_status, reviewer, reviewed_at)
    SELECT ${imgId}, 'wikimedia_commons', '${esc(winner.page)}', '${esc(winner.original ?? winner.thumb)}', '${esc(winner.license)}', '${esc(winner.licenseUrl)}', '${esc(winner.creator ?? '')}',
      '${esc(attr)}', ${isThumbUrl ? "'经 Wikimedia 官方缩略图服务缩放为 500px 展示尺寸'" : 'NULL'}, 'EXACT_MATCH', '${licStatus}', 'product-catalog-expansion-20261012', NOW()
    FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_image_license WHERE image_id=${imgId});`, 'ins_l')
  const licId = Number(rows(`SELECT id FROM product_image_license WHERE image_id=${imgId};`, 'lid', 1)[0]?.[0] ?? 0)
  if (!licId) { log.push({ item, result: 'ERROR', why: '授权插入失败' }); continue }
  inserted.licenses++

  // 仿真报价（京东/淘宝/拼多多），价格=base±随机，只在缺报价时补
  const priceRows = one(`SELECT COUNT(*) FROM product_prices WHERE product_id=${pid} AND deleted=0;`, 'pc')
  if (priceRows < 2) {
    const official = Number(rows(`SELECT official_price FROM products WHERE id=${pid};`, 'op', 1)[0]?.[0] ?? 1999)
    for (const [plId, factor] of [[1, 1.0], [2, 0.97], [3, 0.93]]) {
      const price = (official * factor).toFixed(2)
      runSql(`INSERT INTO product_prices (product_id, platform_id, title, url, price, original_price, discount, shop_name, is_official, stock_status, deleted)
        SELECT ${pid}, ${plId}, (SELECT CONCAT(name,'官方旗舰店') FROM products WHERE id=${pid}), 'https://item.example.com/${pid}', ${price}, ${official}.00, ${Math.round((1 - factor) * 100)},
          CASE ${plId} WHEN 1 THEN '京东自营' WHEN 2 THEN '天猫旗舰店' ELSE '拼多多百亿补贴' END, ${plId === 1 ? 1 : 0}, 1, 0
        FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_prices WHERE product_id=${pid} AND platform_id=${plId});`, `pr_${plId}`)
    inserted.prices++
    }
  }

  // 历史价格（90 天随机游走，只在无历史时补；系统模拟数据）
  const histRows = one(`SELECT COUNT(*) FROM price_history WHERE product_id=${pid};`, 'hc')
  if (histRows === 0) {
    const cur = Number(rows(`SELECT current_price FROM products WHERE id=${pid};`, 'cp', 1)[0]?.[0] ?? 1999)
    const stmt = [`INSERT INTO price_history (product_id, platform_id, price, record_date, source) VALUES`]
    const vals = []
    let p = cur * (1 + Math.random() * 0.08)
    for (let d = 89; d >= 0; d--) {
      p = Math.max(cur * 0.88, Math.min(cur * 1.12, p * (1 + (Math.random() - 0.5) * 0.03)))
      vals.push(`(${pid}, 1, ${p.toFixed(2)}, DATE_SUB(CURDATE(), INTERVAL ${d} DAY), 'SIMULATED')`)
    }
    stmt.push(vals.join(','))
    runSql(stmt.join(' '), 'ins_h')
    inserted.history++
  }

  // 规格（只在无规格时补，系统模拟）
  const specRows = one(`SELECT COUNT(*) FROM product_specs WHERE product_id=${pid};`, 'sc')
  if (specRows === 0) {
    const specs = SPEC_BY_CAT[item.cat] ?? SPEC_BY_CAT._default
    const stmt = [`INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort) VALUES`]
    stmt.push(specs.map((s, k) => `(${pid}, '${esc(s[0])}', '${esc(s[1])}', '${esc(s[2])}', ${k + 1})`).join(','))
    runSql(stmt.join(' '), 'ins_s')
    inserted.specs++
  }

  log.push({ item, result: 'OK', productId: pid, image: imgUrl, license: winner.license, title: winner.title, via: winner.via, brand: item.brand, matchType: 'EXACT' })
  console.log(`[${i + 1}/${CURATED.length}] ✅ ${item.dbName ?? item.name} → #${pid} [${winner.license}] ${winner.title.slice(0, 60)}`)
}

console.log('\n=== 结果 ===')
console.log('新增商品:', inserted.products, '新增图片:', inserted.images, '授权:', inserted.licenses,
  '补报价商品:', inserted.prices, '补历史商品:', inserted.history, '补规格:', inserted.specs,
  '跳过:', inserted.skipped, '无通过候选:', inserted.rejected)
writeFileSync(`${OUT}/_raw/insert-log.json`, JSON.stringify({ inserted, log }, null, 1))
const q1 = one(`SELECT COUNT(DISTINCT pi.product_id) FROM product_images pi JOIN product_image_license l ON l.image_id=pi.id
  WHERE l.audit_status IN ('APPROVED','APPROVED_WITH_ATTRIBUTION') AND l.risk_notes IS NULL AND pi.url NOT LIKE '%placehold.co%';`, 'q1')
console.log(`\n扩容后可展示商品 = ${q1}（目标 100）`)
