#!/usr/bin/env node
/**
 * 商品核心参数真实性治理（阶段：参数真实性治理）
 * 1) product_specs 增加 source_url / source_type / verify_status（幂等）
 * 2) 现有规格全部标记为 template（模板数据，非核验参数）
 * 3) 删除手机品类与苹果错配商品的模板规格（iPhone 显示安卓等错误数据）
 * 4) 写入型号级参考资料（verify_status='reference'，来源=内部知识库，未联网复核——本环境官方页已归档/GSMArena 拦截/Wikipedia 不可达）
 * 5) 清空伪造的 performance_score / value_score（评分治理，随后由 ValueScoreService 按可信数据重算）
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs'
const MYSQL = 'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe'
const OUT = 'E:/第三学期/Geek Price Comparison/verification/spec-truth-20261012'
mkdirSync(`${OUT}/_raw`, { recursive: true })
function run(sql, tag) {
  const s = `${OUT}/_raw/${tag}.sql`, b = `${OUT}/_raw/${tag}.bat`, o = `${OUT}/_raw/${tag}.out`, e = `${OUT}/_raw/${tag}.err`
  writeFileSync(s, sql, 'utf8')
  writeFileSync(b, `@echo off\r\n"${MYSQL}" -h 127.0.0.1 -u root -p123456 --default-character-set=utf8mb4 -D geek_price -N -B < "${s}" > "${o}" 2> "${e}"\r\nexit /b %ERRORLEVEL%\r\n`, 'utf8')
  let ok = true
  try { execFileSync('cmd.exe', ['/c', b], { stdio: 'inherit' }) } catch { ok = false }
  return { ok, out: existsSync(o) ? readFileSync(o, 'utf8') : '', err: existsSync(e) ? readFileSync(e, 'utf8') : '' }
}
const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")

// ===== DDL：幂等加列 =====
console.log('=== 1. DDL ===')
const cols = run(`SELECT GROUP_CONCAT(column_name) FROM information_schema.columns WHERE table_schema='geek_price' AND table_name='product_specs';`, 'cols').out
if (!cols.includes('source_url')) {
  const r = run(`
ALTER TABLE product_specs ADD COLUMN source_url VARCHAR(500) NULL COMMENT '参数来源URL',
  ADD COLUMN source_type VARCHAR(32) NULL COMMENT '来源类型: official/reference_db/internal_knowledge',
  ADD COLUMN verify_status VARCHAR(32) NOT NULL DEFAULT 'template' COMMENT '核验状态: verified/reference/template';`, 'ddl')
  console.log('加列:', r.ok ? 'OK' : r.err.slice(0, 200))
} else { console.log('加列: 已存在，跳过') }

// ===== 现有规格全部标记 template =====
console.log('=== 2. 现有规格标记 template ===')
const r2 = run(`UPDATE product_specs SET verify_status='template', source_type=COALESCE(source_type,'internal_knowledge') WHERE verify_status IS NULL OR verify_status='unverified' OR verify_status='';`, 'mark')
console.log(r2.ok ? 'OK' : r2.err.slice(0, 200))

// ===== 删除手机品类 + 苹果错配商品的模板规格 =====
console.log('=== 3. 删除模板/错配规格 ===')
const r3 = run(`
DELETE s FROM product_specs s JOIN products p ON p.id=s.product_id JOIN categories c ON c.id=p.category_id WHERE c.name='手机';
DELETE FROM product_specs WHERE product_id IN (23,24,45497,45501);
SELECT CONCAT('剩余规格=', (SELECT COUNT(*) FROM product_specs));`, 'clean')
console.log(r3.out.trim())

// ===== 型号级参考资料（reference：真实型号对应参数，本环境无法联网复核） =====
console.log('=== 4. 写入型号级参考资料 ===')
// [productId, [[key,label,value],...]]
const PHONE_SPECS = {
  1: [ // iPhone 16 Pro
    ['os','操作系统','iOS 18'], ['release','上市时间','2024-09'], ['chip','处理器','Apple A18 Pro'],
    ['screen_size','屏幕尺寸','6.3英寸'], ['resolution','分辨率','2622×1206'], ['refresh','刷新率','120Hz'], ['panel','面板类型','OLED (Super Retina XDR)'],
    ['ram','运行内存','8GB'], ['storage','机身存储','128GB/256GB/512GB/1TB'],
    ['camera_rear','后置摄像头','48MP主摄+48MP超广角+12MP 5倍长焦'], ['camera_front','前置摄像头','12MP'],
    ['weight','重量','199g']
    // 电池容量：Apple 未官方公布，不填写（暂无可靠数据）
  ],
  2: [ // iPhone 15
    ['os','操作系统','iOS 17'], ['release','上市时间','2023-09'], ['chip','处理器','Apple A16 Bionic'],
    ['screen_size','屏幕尺寸','6.1英寸'], ['resolution','分辨率','2556×1179'], ['refresh','刷新率','60Hz'], ['panel','面板类型','OLED (Super Retina XDR)'],
    ['ram','运行内存','6GB'], ['storage','机身存储','128GB/256GB/512GB'],
    ['camera_rear','后置摄像头','48MP主摄+12MP超广角'], ['camera_front','前置摄像头','12MP'],
    ['weight','重量','171g']
  ],
  3: [ // 华为 Mate 60 Pro
    ['os','操作系统','HarmonyOS 4'], ['release','上市时间','2023-08'], ['chip','处理器','麒麟9000S'],
    ['screen_size','屏幕尺寸','6.82英寸'], ['resolution','分辨率','2720×1260'], ['refresh','刷新率','120Hz'], ['panel','面板类型','OLED'],
    ['ram','运行内存','12GB'], ['storage','机身存储','512GB'],
    ['camera_rear','后置摄像头','50MP可变光圈主摄+48MP超广角+12MP长焦'], ['camera_front','前置摄像头','13MP+3D深感'],
    ['battery','电池容量','5000mAh'], ['wired_charging','充电','88W有线+50W无线'],
    ['weight','重量','225g']
  ],
  4: [ // 华为 Pura 70 Pro
    ['os','操作系统','HarmonyOS 4.2'], ['release','上市时间','2024-04'], ['chip','处理器','麒麟9010'],
    ['screen_size','屏幕尺寸','6.8英寸'], ['resolution','分辨率','2844×1260'], ['refresh','刷新率','120Hz'], ['panel','面板类型','OLED'],
    ['ram','运行内存','12GB'], ['storage','机身存储','256GB/512GB/1TB'],
    ['camera_rear','后置摄像头','50MP可变光圈主摄+12.5MP超广角+48MP超聚光微距长焦'], ['camera_front','前置摄像头','13MP'],
    ['battery','电池容量','5050mAh'], ['wired_charging','充电','100W有线+80W无线'],
    ['weight','重量','220g']
  ],
  6: [ // 小米 14
    ['os','操作系统','Xiaomi HyperOS（澎湃OS）'], ['release','上市时间','2023-10'], ['chip','处理器','骁龙8 Gen3'],
    ['screen_size','屏幕尺寸','6.36英寸'], ['resolution','分辨率','2670×1200'], ['refresh','刷新率','120Hz'], ['panel','面板类型','LTPO AMOLED'],
    ['ram','运行内存','12GB/16GB'], ['storage','机身存储','256GB/512GB'],
    ['camera_rear','后置摄像头','50MP徕卡主摄+50MP浮动长焦+50MP超广角'], ['camera_front','前置摄像头','32MP'],
    ['battery','电池容量','4610mAh'], ['wired_charging','充电','90W有线+50W无线'],
    ['weight','重量','188g']
  ],
  7: [ // OPPO Find X7 Ultra
    ['os','操作系统','ColorOS 14'], ['release','上市时间','2024-01'], ['chip','处理器','骁龙8 Gen3'],
    ['screen_size','屏幕尺寸','6.82英寸'], ['resolution','分辨率','3168×1440'], ['refresh','刷新率','120Hz'], ['panel','面板类型','LTPO AMOLED'],
    ['ram','运行内存','16GB'], ['storage','机身存储','256GB/512GB'],
    ['camera_rear','后置摄像头','哈苏四摄：50MP主摄+50MP超广角+50MP 3倍长焦+50MP 6倍潜望'], ['camera_front','前置摄像头','32MP'],
    ['battery','电池容量','5000mAh'], ['wired_charging','充电','100W有线+50W无线'],
    ['weight','重量','221g']
  ],
  10: [ // 荣耀 Magic 6 Pro
    ['os','操作系统','MagicOS 8.0'], ['release','上市时间','2024-01'], ['chip','处理器','骁龙8 Gen3'],
    ['screen_size','屏幕尺寸','6.8英寸'], ['resolution','分辨率','2800×1280'], ['refresh','刷新率','120Hz'], ['panel','面板类型','LTPO OLED'],
    ['ram','运行内存','16GB'], ['storage','机身存储','256GB/512GB'],
    ['camera_rear','后置摄像头','50MP主摄+1.8亿像素潜望长焦+3D深感'], ['camera_front','前置摄像头','12MP+3D深感'],
    ['battery','电池容量','5600mAh'], ['wired_charging','充电','80W有线+66W无线'],
    ['weight','重量','229g']
  ],
  11: [ // 三星 Galaxy S24（国行）
    ['os','操作系统','One UI 6.1（Android 14）'], ['release','上市时间','2024-01'], ['chip','处理器','骁龙8 Gen3（国行）'],
    ['screen_size','屏幕尺寸','6.2英寸'], ['resolution','分辨率','2340×1080'], ['refresh','刷新率','120Hz'], ['panel','面板类型','Dynamic AMOLED 2X'],
    ['ram','运行内存','12GB（国行）'], ['storage','机身存储','256GB'],
    ['camera_rear','后置摄像头','50MP主摄+12MP超广角+10MP 3倍长焦'], ['camera_front','前置摄像头','12MP'],
    ['battery','电池容量','4000mAh'], ['wired_charging','充电','25W有线+15W无线'],
    ['weight','重量','167g']
  ],
  45493: [ // Samsung Galaxy S23（国行）
    ['os','操作系统','One UI 6（Android 14）'], ['release','上市时间','2023-02'], ['chip','处理器','骁龙8 Gen2 for Galaxy'],
    ['screen_size','屏幕尺寸','6.1英寸'], ['resolution','分辨率','2340×1080'], ['refresh','刷新率','120Hz'], ['panel','面板类型','Dynamic AMOLED 2X'],
    ['ram','运行内存','8GB'], ['storage','机身存储','128GB/256GB/512GB'],
    ['camera_rear','后置摄像头','50MP主摄+12MP超广角+10MP 3倍长焦'], ['camera_front','前置摄像头','12MP'],
    ['battery','电池容量','3900mAh'], ['wired_charging','充电','25W有线+15W无线'],
    ['weight','重量','168g']
  ],
  45494: [ // Samsung Galaxy S22 Ultra（国行）
    ['os','操作系统','One UI 5（Android 13）'], ['release','上市时间','2022-02'], ['chip','处理器','骁龙8 Gen1（国行）'],
    ['screen_size','屏幕尺寸','6.8英寸'], ['resolution','分辨率','3088×1440'], ['refresh','刷新率','120Hz'], ['panel','面板类型','Dynamic AMOLED 2X'],
    ['ram','运行内存','12GB'], ['storage','机身存储','128GB/256GB/512GB/1TB'],
    ['camera_rear','后置摄像头','108MP主摄+12MP超广角+10MP 3倍+10MP 10倍长焦'], ['camera_front','前置摄像头','40MP'],
    ['battery','电池容量','5000mAh'], ['wired_charging','充电','45W有线+15W无线'],
    ['weight','重量','228g（含S Pen）']
  ],
  45495: [ // iPhone SE (3rd generation)
    ['os','操作系统','iOS 15.4'], ['release','上市时间','2022-03'], ['chip','处理器','Apple A15 Bionic'],
    ['screen_size','屏幕尺寸','4.7英寸'], ['resolution','分辨率','1334×750'], ['refresh','刷新率','60Hz'], ['panel','面板类型','LCD (Retina HD)'],
    ['ram','运行内存','4GB'], ['storage','机身存储','64GB/128GB/256GB'],
    ['camera_rear','后置摄像头','12MP'], ['camera_front','前置摄像头','7MP'],
    ['weight','重量','144g']
  ],
  45532: [ // iPhone X
    ['os','操作系统','iOS 11'], ['release','上市时间','2017-09'], ['chip','处理器','Apple A11 Bionic'],
    ['screen_size','屏幕尺寸','5.8英寸'], ['resolution','分辨率','2436×1125'], ['refresh','刷新率','60Hz'], ['panel','面板类型','OLED (Super Retina HD)'],
    ['ram','运行内存','3GB'], ['storage','机身存储','64GB/256GB'],
    ['camera_rear','后置摄像头','12MP双摄（广角+长焦）'], ['camera_front','前置摄像头','7MP'],
    ['weight','重量','174g']
  ],
  45534: [ // iPhone 11
    ['os','操作系统','iOS 13'], ['release','上市时间','2019-09'], ['chip','处理器','Apple A13 Bionic'],
    ['screen_size','屏幕尺寸','6.1英寸'], ['resolution','分辨率','1792×828'], ['refresh','刷新率','60Hz'], ['panel','面板类型','LCD (Liquid Retina HD)'],
    ['ram','运行内存','4GB'], ['storage','机身存储','64GB/128GB/256GB'],
    ['camera_rear','后置摄像头','12MP双摄（广角+超广角）'], ['camera_front','前置摄像头','12MP'],
    ['weight','重量','194g']
  ],
  45535: [ // Samsung Galaxy S8
    ['os','操作系统','Android 7.0（可升级至 Android 9）'], ['release','上市时间','2017-04'], ['chip','处理器','Exynos 8895（国行骁龙835）'],
    ['screen_size','屏幕尺寸','5.8英寸'], ['resolution','分辨率','2960×1440'], ['refresh','刷新率','60Hz'], ['panel','面板类型','Super AMOLED'],
    ['ram','运行内存','4GB'], ['storage','机身存储','64GB+microSD'],
    ['camera_rear','后置摄像头','12MP'], ['camera_front','前置摄像头','8MP'],
    ['battery','电池容量','3000mAh'], ['wired_charging','充电','15W有线'],
    ['weight','重量','155g']
  ],
  45536: [ // Samsung Galaxy S9
    ['os','操作系统','Android 8.0（可升级至 Android 10）'], ['release','上市时间','2018-03'], ['chip','处理器','Exynos 9810（国行骁龙845）'],
    ['screen_size','屏幕尺寸','5.8英寸'], ['resolution','分辨率','2960×1440'], ['refresh','刷新率','60Hz'], ['panel','面板类型','Super AMOLED'],
    ['ram','运行内存','4GB'], ['storage','机身存储','64GB+microSD'],
    ['camera_rear','后置摄像头','12MP可变光圈（f/1.5-f/2.4）'], ['camera_front','前置摄像头','8MP'],
    ['battery','电池容量','3000mAh'], ['wired_charging','充电','15W有线'],
    ['weight','重量','163g']
  ],
  45537: [ // Samsung Galaxy S10+
    ['os','操作系统','Android 9（可升级至 Android 12）'], ['release','上市时间','2019-02'], ['chip','处理器','Exynos 9820（国行骁龙855）'],
    ['screen_size','屏幕尺寸','6.4英寸'], ['resolution','分辨率','3040×1440'], ['refresh','刷新率','60Hz'], ['panel','面板类型','Dynamic AMOLED'],
    ['ram','运行内存','8GB'], ['storage','机身存储','128GB+microSD'],
    ['camera_rear','后置摄像头','12MP主摄+12MP长焦+16MP超广角'], ['camera_front','前置摄像头','10MP+8MP'],
    ['battery','电池容量','4100mAh'], ['wired_charging','充电','15W有线+无线充电'],
    ['weight','重量','175g']
  ],
  // 苹果手表（修正 Wear OS 错配）
  45497: [ // Apple Watch SE (2nd generation)
    ['os','操作系统','watchOS 10'], ['release','上市时间','2022-09'],
    ['screen','屏幕','40/44mm Retina LTPO OLED'], ['water','防水','50米防水（5ATM）']
  ],
  45501: [ // Apple Watch SE
    ['os','操作系统','watchOS 7（可升级）'], ['release','上市时间','2020-09'],
    ['screen','屏幕','40/44mm Retina LTPO OLED'], ['water','防水','50米防水（5ATM）']
  ],
  // MacBook（修正 i9/RTX 错配）
  23: [ // MacBook Air M3
    ['chip','处理器','Apple M3（8核CPU/10核GPU）'], ['ram','运行内存','8GB统一内存（可选16GB/24GB）'],
    ['storage','机身存储','256GB/512GB/1TB/2TB SSD'],
    ['screen','屏幕','13.6英寸 Liquid Retina 2560×1664 60Hz'], ['battery','续航','最长18小时（官方标称）'],
    ['weight','重量','1.24kg']
  ],
  24: [ // MacBook Pro 14（M3）
    ['chip','处理器','Apple M3（8核CPU/10核GPU）'], ['ram','运行内存','8GB统一内存（可选16GB/24GB）'],
    ['storage','机身存储','512GB/1TB/2TB SSD'],
    ['screen','屏幕','14.2英寸 Liquid Retina XDR 3024×1964 120Hz ProMotion'], ['battery','续航','最长22小时（官方标称）'],
    ['weight','重量','1.55kg']
  ]
}
const stmt = []
for (const [pid, specs] of Object.entries(PHONE_SPECS)) {
  specs.forEach(([k, label, v], i) => {
    stmt.push(`INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_url, source_type, verify_status)
  SELECT ${pid}, '${esc(k)}', '${esc(label)}', '${esc(v)}', ${i + 1}, NULL, 'internal_knowledge', 'reference'
  FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id=${pid} AND spec_key='${esc(k)}');`)
  })
}
const r4 = run(stmt.join('\n'), 'insert_ref')
console.log('写入参考规格:', r4.ok ? `OK（${stmt.length} 行）` : r4.err.slice(0, 300))

// ===== 评分治理：清空伪造分数 =====
console.log('=== 5. 清空伪造评分 ===')
const r5 = run(`UPDATE products SET performance_score=NULL, value_score=NULL; SELECT CONCAT('已清空评分的商品=', ROW_COUNT());`, 'score')
console.log(r5.out.trim())
console.log('\n完成。剩余规格统计：')
const r6 = run(`SELECT CONCAT('total=', COUNT(*), ' reference=', SUM(verify_status='reference'), ' template=', SUM(verify_status='template'), ' verified=', SUM(verify_status='verified'));`, 'stat')
console.log(r6.out.trim())
