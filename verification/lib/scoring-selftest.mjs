#!/usr/bin/env node
/**
 * matchScore 评分自测（验证专项专用，非生产代码）
 * ------------------------------------------------------------------
 * 用构造用例验证任务书中明确点名的负例规则，确保「有搜索结果 ≠ 匹配成功」：
 *   - "iPhone 17 case" 不得匹配为 iPhone 17 本体
 *   - "MacBook Pro case" 不得匹配为 MacBook Pro
 *   - "RTX 5070 Ti" 不得匹配为 RTX 5070
 *   - "RTX 5070 ASUS" 可作为 RTX 5070 候选（但需记录厂商）
 *
 * 运行：node verification/lib/scoring-selftest.mjs
 */

import {
  buildSignals, scoreCandidate, isAutoAdopt, isAutoAdoptLicense,
  MODEL_ALIASES, containsPhrase, tokenize
} from './matching.mjs'

let pass = 0
let fail = 0
const failures = []

function check(name, cond, detail) {
  if (cond) {
    pass++
    console.log(`  PASS  ${name}`)
  } else {
    fail++
    failures.push(name)
    console.log(`  FAIL  ${name}${detail ? ' -> ' + detail : ''}`)
  }
}

const cand = (title, extra = {}) => ({
  title,
  source: 'wikimedia',
  license: 'CC BY-SA 4.0',
  ...extra
})

const s = (product) => buildSignals(product)

console.log('\n=== 1. 配件/case 负例（应被扣分，不得进入 HIGH/MEDIUM） ===')
{
  const iphone17 = s({ brand: 'Apple', model: 'iPhone 17 256GB', category: '手机' })
  const rCase = scoreCandidate(iphone17, cand('IPhone 17 clear case transparent cover'))
  const rBody = scoreCandidate(iphone17, cand('IPhone 17 front and back'))
  // 真实数据回归：Wikimedia 上确实存在 "Apple iPhone 17 Silicone Case (Black).jpg"
  const rRealCase = scoreCandidate(iphone17, cand('Apple iPhone 17 Silicone Case (Black) unboxing'))
  console.log(`    case  -> ${rCase.matchScore} ${rCase.matchStatus} | ${rCase.matchReasons.join('; ')}`)
  console.log(`    真实壳照 -> ${rRealCase.matchScore} ${rRealCase.matchStatus}`)
  console.log(`    body  -> ${rBody.matchScore} ${rBody.matchStatus}`)
  check('iPhone 17 case 不高于 LOW', rCase.matchScore < 60, `got ${rCase.matchScore}`)
  check('真实 iPhone 17 保护壳被一票封顶（非 MEDIUM/HIGH）', rRealCase.matchScore < 60, `got ${rRealCase.matchScore}`)
  check('iPhone 17 case 触发 caseLike 标记', rCase.flags.caseLike === true)
  check('iPhone 17 本体图可达 HIGH', rBody.matchScore >= 80, `got ${rBody.matchScore}`)
}
{
  const mbp = s({ brand: 'Apple', model: 'MacBook Pro 14 M4', category: '笔记本电脑' })
  const rCase = scoreCandidate(mbp, cand('MacBook Pro 14 M4 leather sleeve case'))
  console.log(`    case  -> ${rCase.matchScore} ${rCase.matchStatus} | ${rCase.matchReasons.join('; ')}`)
  check('MacBook Pro case 不高于 LOW', rCase.matchScore < 60, `got ${rCase.matchScore}`)
}

console.log('\n=== 2. 型号数字冲突（RTX 5070 Ti / RTX 5070 ASUS vs RTX 5070） ===')
{
  const rtx5070 = s({ brand: 'NVIDIA', model: 'RTX 5070', category: '显卡' })
  const rTi = scoreCandidate(rtx5070, cand('NVIDIA GeForce RTX 5070 Ti graphics card'))
  const rAsus = scoreCandidate(rtx5070, cand('ASUS RTX 5070 graphics card'))
  const r4080 = scoreCandidate(rtx5070, cand('NVIDIA GeForce RTX 4080 Super'))
  console.log(`    5070 Ti -> ${rTi.matchScore} ${rTi.matchStatus} | ${rTi.matchReasons.join('; ')}`)
  console.log(`    5070 ASUS -> ${rAsus.matchScore} ${rAsus.matchStatus} | ${rAsus.matchReasons.join('; ')}`)
  console.log(`    4080 -> ${r4080.matchScore} ${r4080.matchStatus} | ${r4080.matchReasons.join('; ')}`)
  check('RTX 5070 Ti 不判为 RTX 5070 的 HIGH', rTi.matchScore < 80, `got ${rTi.matchScore}`)
  check('RTX 5070 Ti 判为「其他型号」而非本体', rTi.matchScore < 60, `got ${rTi.matchScore}`)
  check('RTX 5070 Ti 扣了变体冲突/不完整分',
    rTi.flags.variantExtra.includes('ti') || rTi.flags.variantMissing.length > 0)
  check('RTX 5070 ASUS 可作为候选（>= MEDIUM）', rAsus.matchScore >= 60, `got ${rAsus.matchScore}`)
  check('RTX 4080 不判为 RTX 5070 的 HIGH', r4080.matchScore < 80, `got ${r4080.matchScore}`)
}

console.log('\n=== 3. 变体冲突（同系列不同型号） ===')
{
  const gt5 = s({ brand: '华为', model: 'Watch GT 5', category: '智能手表' })
  const rPro = scoreCandidate(gt5, cand('Huawei Watch GT 5 Pro smartwatch'))
  const rPlain = scoreCandidate(gt5, cand('Huawei Watch GT 5 smartwatch'))
  console.log(`    GT 5 Pro -> ${rPro.matchScore} ${rPro.matchStatus} | ${rPro.matchReasons.join('; ')}`)
  console.log(`    GT 5     -> ${rPlain.matchScore} ${rPlain.matchStatus}`)
  check('GT 5 Pro 分数低于 GT 5 本体', rPro.matchScore < rPlain.matchScore,
    `${rPro.matchScore} vs ${rPlain.matchScore}`)
}
{
  const p17 = s({ brand: 'Apple', model: 'iPhone 17 256GB', category: '手机' })
  const rPro = scoreCandidate(p17, cand('IPhone 17 Pro Max'))
  console.log(`    iPhone 17 Pro Max -> ${rPro.matchScore} ${rPro.matchStatus} | ${rPro.matchReasons.join('; ')}`)
  check('iPhone 17 不会被 17 Pro Max 拿到 HIGH', rPro.matchScore < 80, `got ${rPro.matchScore}`)
}

console.log('\n=== 4. 非实物图 / 概念图负例 ===')
{
  const mbp = s({ brand: 'Apple', model: 'MacBook Pro 14 M4', category: '笔记本电脑' })
  const rWall = scoreCandidate(mbp, cand('MacBook Pro 14 M4 concept wallpaper render'))
  const rVec = scoreCandidate(mbp, cand('Apple M4 laptop vector icon logo'))
  console.log(`    wallpaper/concept -> ${rWall.matchScore} ${rWall.matchStatus}`)
  console.log(`    vector/logo      -> ${rVec.matchScore} ${rVec.matchStatus}`)
  check('concept/wallpaper 被重罚', rWall.matchScore < 60, `got ${rWall.matchScore}`)
  check('vector/logo 被重罚', rVec.matchScore < 60, `got ${rVec.matchScore}`)
}

console.log('\n=== 5. 只有品牌、没有型号 ===')
{
  const iphone17 = s({ brand: 'Apple', model: 'iPhone 17 256GB', category: '手机' })
  const r = scoreCandidate(iphone17, cand('Apple Store interior in Shanghai'))
  console.log(`    only brand -> ${r.matchScore} ${r.matchStatus} | ${r.matchReasons.join('; ')}`)
  check('只有品牌判为 REJECT', r.matchStatus === 'REJECT', `got ${r.matchScore}`)
  check('触发 onlyBrand 标记', r.flags.onlyBrand === true)
}

console.log('\n=== 6. 无数字型号（退化路径） ===')
{
  const sw = s({ brand: '任天堂', model: 'Switch OLED', category: '游戏设备' })
  const r = scoreCandidate(sw, cand('Nintendo Switch OLED model (white)'))
  console.log(`    Switch OLED -> ${r.matchScore} ${r.matchStatus} | ${r.matchReasons.join('; ')}`)
  check('无数字型号可命中（>= MEDIUM）', r.matchScore >= 60, `got ${r.matchScore}`)
}
{
  const mx = s({ brand: '罗技', model: 'MX Mechanical', category: '键盘' })
  const r = scoreCandidate(mx, cand('Logitech MX Mechanical keyboard'))
  console.log(`    MX Mechanical -> ${r.matchScore} ${r.matchStatus}`)
  check('MX Mechanical 可命中（>= HIGH）', r.matchScore >= 80, `got ${r.matchScore}`)
}

console.log('\n=== 7. 单字母 token 不得造成误扣分（回归用例） ===')
{
  // 曾经的 bug：i7-14700K 的 'k'/'f' 会在 "of"/"Karten" 等词里子串命中，产生 -30 变体冲突
  const cpu = s({ brand: 'Intel', model: 'Core i7-14700K', category: 'CPU' })
  const r = scoreCandidate(cpu, cand('Intel Core i7-14700K (INVADERPC)'))
  const conflict = r.matchReasons.find((x) => x.includes('变体冲突'))
  console.log(`    14700K -> ${r.matchScore} ${r.matchStatus} | ${r.matchReasons.join('; ')}`)
  check('正确匹配不出现「变体冲突」误扣分', !conflict, conflict ?? '')
  check('正确匹配应为 HIGH', r.matchStatus === 'HIGH', `got ${r.matchScore}`)
}

console.log('\n=== 8. 许可证判定 ===')
{
  const { isGoodLicense } = await import('./matching.mjs')
  const cases = [
    ['CC0', true], ['CC BY 3.0', true], ['CC BY-SA 4.0', true], ['Public domain', true],
    ['BY-SA 4.0', true], ['BY-NC-SA 2.0', false], ['BY-NC-ND 2.0', false], ['GFDL', false], [null, false]
  ]
  for (const [lic, want] of cases) {
    check(`许可 ${lic} -> ${want}`, isGoodLicense(lic) === want)
  }
}

// ============================================================
// 实测中发现的假阳性回归用例
// ============================================================

console.log('\n=== 9. 相机署名（"用该机型拍摄" ≠ "拍摄该机型"） ===')
{
  // 实测来源：Wikimedia 分类 "Taken with Vivo X200 Pro"
  // 描述 "This Picture taken by a smartphone only (vivo x200 pro)"
  const vivo = s({ brand: 'vivo', model: 'vivo X200 256GB', category: '手机' })
  const rPlant = scoreCandidate(vivo, {
    title: 'Putri Malu (Mimosa pudica L.)',
    source: 'wikimedia',
    license: 'CC0',
    description: 'This Picture taken by a smartphone only (vivo x200 pro)',
    categories: 'CC-Zero|Self-published work|Mimosa pudica (flowers)|Taken with Vivo X200 Pro'
  })
  console.log(`    植物照(相机署名) -> ${rPlant.matchScore} ${rPlant.matchStatus} | ${rPlant.matchReasons.join('; ')}`)
  check('相机署名不得让植物照命中手机', rPlant.matchStatus === 'REJECT', `got ${rPlant.matchScore}`)
  check('相机署名未被当作型号命中', rPlant.modelFullInDesc === false)
}
{
  // 实测来源：#3 Mate 70 Pro 的候选里混入 "Taken with Xiaomi 15 Pro"
  const mate70 = s({ brand: '华为', model: 'Mate 70 Pro 512GB', category: '手机' })
  const r = scoreCandidate(mate70, {
    title: 'Some unrelated photo',
    source: 'wikimedia',
    license: 'CC BY-SA 4.0',
    description: 'taken with Xiaomi 15 Pro',
    categories: 'Taken with Xiaomi 15 Pro|Self-published work'
  })
  console.log(`    他机型署名 -> ${r.matchScore} ${r.matchStatus}`)
  check('他机型相机署名不得命中', r.matchStatus === 'REJECT', `got ${r.matchScore}`)
}

console.log('\n=== 10. 日期噪声不得充当型号数字 ===')
{
  // 实测来源：分类 "Germany photographs taken on 2015-04-10" 提供了孤立数字 10
  const watch = s({ brand: 'Apple', model: 'Watch Series 10', category: '智能手表' })
  const rOld = scoreCandidate(watch, {
    title: 'Apple Watch Sport',
    source: 'wikimedia',
    license: 'CC BY 4.0',
    description: 'The 2015 introductional model of the Apple Watch Sport',
    categories: 'Germany photographs taken on 2015-04-10|Apple Stores in Germany|Apple Watch Series 0'
  })
  console.log(`    Series 0 + 日期噪声 -> ${rOld.matchScore} ${rOld.matchStatus} | ${rOld.matchReasons.join('; ')}`)
  check('旧款 Apple Watch 不得因日期数字判为 Series 10', rOld.matchStatus !== 'HIGH', `got ${rOld.matchScore}`)
  check('日期未提供型号数字命中', rOld.modelFullInDesc === false)
}

console.log('\n=== 11. 文件扩展名不得破坏型号匹配 ===')
{
  // 实测来源：标题 "Apple Watch Series 10.png" 曾被切成 token "10.png"
  const watch = s({ brand: 'Apple', model: 'Watch Series 10', category: '智能手表' })
  const r = scoreCandidate(watch, cand('Apple Watch Series 10.png'))
  console.log(`    xxx.png -> ${r.matchScore} ${r.matchStatus} | ${r.matchReasons.join('; ')}`)
  check('扩展名去除后标题可正常命中型号', r.modelFullInTitle === true)
  check('该候选应为 HIGH', r.matchStatus === 'HIGH', `got ${r.matchScore}`)
}

console.log('\n=== 12. 加号升档 SKU（Pro+ ≠ Pro） ===')
{
  // 实测来源：产品 "Mate 70 Pro"，候选标题 "HUAWEI Mate 70 Pro+"
  const mate70 = s({ brand: '华为', model: 'Mate 70 Pro 512GB', category: '手机' })
  const rPlus = scoreCandidate(mate70, cand('HUAWEI Mate 70 Pro+ 001.jpg'))
  const rPlain = scoreCandidate(mate70, cand('HUAWEI Mate 70 Pro 001.jpg'))
  console.log(`    Pro+ -> ${rPlus.matchScore} ${rPlus.matchStatus} | ${rPlus.matchReasons.join('; ')}`)
  console.log(`    Pro  -> ${rPlain.matchScore} ${rPlain.matchStatus}`)
  check('Pro+ 不得判为 Pro 的 HIGH', rPlus.matchStatus !== 'HIGH', `got ${rPlus.matchScore}`)
  check('Pro 本体仍应判为 HIGH', rPlain.matchStatus === 'HIGH', `got ${rPlain.matchScore}`)
}

console.log('\n=== 13. 无数字型号不得被通用词误命中 ===')
{
  const sw = s({ brand: '任天堂', model: 'Switch OLED', category: '游戏设备' })
  const rOledTv = scoreCandidate(sw, cand('LG OLED television 55 inch'))
  const rSwitch = scoreCandidate(sw, cand('Nintendo Switch OLED model'))
  console.log(`    OLED 电视 -> ${rOledTv.matchScore} ${rOledTv.matchStatus} | ${rOledTv.matchReasons.join('; ')}`)
  console.log(`    Switch OLED -> ${rSwitch.matchScore} ${rSwitch.matchStatus}`)
  check('OLED 电视不得命中 Switch OLED', rOledTv.matchScore < 60, `got ${rOledTv.matchScore}`)
  check('Switch OLED 本体仍应命中', rSwitch.matchScore >= 80, `got ${rSwitch.matchScore}`)
}

console.log('\n=== 14. HIGH 必须有标题级证据（描述命中封顶 MEDIUM） ===')
{
  const vivo = s({ brand: 'vivo', model: 'vivo X200 256GB', category: '手机' })
  const rDescOnly = scoreCandidate(vivo, {
    title: 'Some street scene',
    source: 'wikimedia',
    license: 'CC BY 4.0',
    description: 'photo of a vivo X200 smartphone on a desk'
  })
  console.log(`    仅描述命中 -> ${rDescOnly.matchScore} ${rDescOnly.matchStatus} | ${rDescOnly.matchReasons.join('; ')}`)
  check('仅描述命中不得判为 HIGH', rDescOnly.matchStatus !== 'HIGH', `got ${rDescOnly.matchScore}`)
  check('仅描述命中记为 MEDIUM', rDescOnly.matchStatus === 'MEDIUM', `got ${rDescOnly.matchScore}`)
}

console.log('\n=== 15. 描述里的无关变体词不得降级正确匹配 ===')
{
  // 实测来源：一组 "IPhone 17 launch at Apple TRX Malaysia" 照片，
  // 描述/分类中顺带出现 "iPhone Air"，导致正确的 iPhone 17 照片被误扣 -30。
  const iphone17 = s({ brand: 'Apple', model: 'iPhone 17 256GB', category: '手机' })
  const r = scoreCandidate(iphone17, {
    title: 'IPhone 17 launch at Apple TRX Malaysia 13.jpg',
    source: 'wikimedia',
    license: 'CC0',
    description: 'Apple iPhone 17 and iPhone Air on display',
    categories: 'IPhone 17|IPhone Air|CC-Zero'
  })
  console.log(`    描述含 Air -> ${r.matchScore} ${r.matchStatus} | ${r.matchReasons.join('; ')}`)
  check('描述里的 Air 不得扣分', !r.matchReasons.some((x) => x.includes('变体冲突')), JSON.stringify(r.matchReasons))
  check('该照片仍为 HIGH', r.matchStatus === 'HIGH', `got ${r.matchScore}`)
}
{
  // 但标题里真的写了别的变体时，仍然必须扣分
  const iphone17 = s({ brand: 'Apple', model: 'iPhone 17 256GB', category: '手机' })
  const r = scoreCandidate(iphone17, { title: 'IPhone 17 Air', source: 'wikimedia', license: 'CC0' })
  console.log(`    标题含 Air -> ${r.matchScore} ${r.matchStatus} | ${r.matchReasons.join('; ')}`)
  check('标题里的升档 SKU 仍要扣分', r.matchScore < 80, `got ${r.matchScore}`)
}

console.log('\n=== 16. 型号别名表：行为正确性 ===')
{
  check('别名表是显式映射（对象）', typeof MODEL_ALIASES === 'object' && !Array.isArray(MODEL_ALIASES))
  check('别名表包含 sony a7m4', Array.isArray(MODEL_ALIASES['sony a7m4']))
  const ph = (s) => tokenize(s)
  check('连续短语命中：a7 iv 命中 "sony a7 iv x"', containsPhrase(ph('sony a7 iv x'), ph('a7 iv')) === true)
  check('连续短语不命中："a7 r iv" 不含 "a7 iv"', containsPhrase(ph('sony a7 r iv'), ph('a7 iv')) === false)
}
{
  // Sony A7M4 ↔ A7 IV：使用 Commons 上真实存在的标题
  const a7m4 = buildSignals({ brand: 'Sony', model: 'A7M4', category: '相机' })
  console.log(`    aliasKey=${a7m4.aliasKey} aliasForms=${JSON.stringify(a7m4.aliasForms.map((f) => f.phrase))}`)
  const REAL_A7IV = [
    'Sony A7 IV (ILCE-7M4) - by Henry Söderlund (51739988735).jpg',
    'Sony a7 IV 33MP Mirrorless Digital Camera.jpg',
    'Man using DJI RS2 and Sony a7IV 20240922180042.jpg'
  ]
  for (const t of REAL_A7IV) {
    const r = scoreCandidate(a7m4, cand(t))
    console.log(`    [${r.matchScore} ${r.matchStatus}] ${t.slice(0, 60)} | via=${r.matchedVia}`)
    check(`A7M4 经别名命中: ${t.slice(0, 30)}`, r.matchStatus === 'HIGH', `got ${r.matchScore}`)
    check(`标记为 viaAlias: ${t.slice(0, 22)}`, r.viaAlias === true)
  }
}
{
  // A7R IV / A7S IV 是不同型号，绝不能因别名被命中
  const a7m4 = buildSignals({ brand: 'Sony', model: 'A7M4', category: '相机' })
  const NOT_A7IV = [
    'Sony a7R IV, 400mm f2.8, 2x Teleconverter.jpg',
    'Sony Alpha 7R IV front view with exposed sensor.jpg',
    'Sony Alpha 7R II, III and IV with Sony lenses (51250202508).jpg'
  ]
  for (const t of NOT_A7IV) {
    const r = scoreCandidate(a7m4, cand(t))
    console.log(`    [${r.matchScore} ${r.matchStatus}] ${t.slice(0, 60)}`)
    check(`A7R IV 不得被当成 A7 IV: ${t.slice(0, 26)}`, r.matchStatus !== 'HIGH', `got ${r.matchScore}`)
  }
}
{
  // 关闭别名时必须退回原来的行为（用于「别名前」基线）
  const off = buildSignals({ brand: 'Sony', model: 'A7M4', category: '相机' }, { useAliases: false })
  const r = scoreCandidate(off, cand('Sony A7 IV (ILCE-7M4) - by Henry Söderlund.jpg'))
  console.log(`    别名关闭 -> ${r.matchScore} ${r.matchStatus}`)
  check('关闭别名后 A7 IV 无法命中', r.matchStatus !== 'HIGH', `got ${r.matchScore}`)
}
{
  // iPad Pro 11 M4 ↔ Commons 的 "11-inch (M4)" / "iPad Pro M4 11-inch" 写法
  const ipad = buildSignals({ brand: 'Apple', model: 'iPad Pro 11 M4 256GB', category: '平板' })
  const REAL_IPAD = [
    'About iPad Pro 11-inch (M4).jpg',
    'IPad Pro M4 11-inch.jpeg',
    'M4 iPad Pro series - 1.jpg'
  ]
  for (const t of REAL_IPAD) {
    const r = scoreCandidate(ipad, cand(t))
    console.log(`    [${r.matchScore} ${r.matchStatus}] ${t.slice(0, 50)} | via=${r.matchedVia}`)
  }
  check('iPad Pro 11-inch (M4) 命中',
    scoreCandidate(ipad, cand('About iPad Pro 11-inch (M4).jpg')).matchStatus === 'HIGH')
  check('iPad Pro M4 11-inch 命中',
    scoreCandidate(ipad, cand('IPad Pro M4 11-inch.jpeg')).matchStatus === 'HIGH')
}

console.log('\n=== 17. 别名不得把不同型号混为一谈 ===')
{
  const cases = [
    ['NVIDIA RTX 5070', 'NVIDIA GeForce RTX 5070 Ti graphics card', 'RTX 5070 Ti ≠ RTX 5070'],
    ['Apple iPhone 17 256GB', 'Apple iPhone 17 Pro Max', 'iPhone 17 Pro Max ≠ iPhone 17'],
    ['华为 Mate 70 Pro 512GB', 'HUAWEI Mate 70 Pro+ 001.jpg', 'Mate 70 Pro+ ≠ Mate 70 Pro'],
    ['Apple MacBook Pro 14 M4', 'MacBook Pro (16-inch, M4 Pro, Silver).jpg', '16-inch M4 Pro ≠ 14-inch M4'],
    ['Apple MacBook Pro 14 M4', 'MacBook Air (13-inch, M4, Silver).jpg', 'MacBook Air ≠ MacBook Pro'],
    ['Apple MacBook Pro 14 M4', 'Apple Macbook Pro 14" 2021 - Keyboard.png', '2021 款 ≠ M4 款']
  ]
  for (const [model, title, label] of cases) {
    const brand = model.startsWith('NVIDIA') ? 'NVIDIA'
      : model.startsWith('Apple') ? 'Apple'
        : model.startsWith('华为') ? '华为' : 'Apple'
    const sig = buildSignals({ brand, model, category: '其他' })
    const r = scoreCandidate(sig, cand(title))
    console.log(`    [${r.matchScore} ${r.matchStatus}] ${label}`)
    check(`${label} 不得判为 HIGH`, r.matchStatus !== 'HIGH', `got ${r.matchScore}`)
  }
}

console.log('\n=== 18. 别名表不得包含未核实的条目 ===')
{
  const keys = Object.keys(MODEL_ALIASES)
  console.log(`    别名表条目：${JSON.stringify(keys)}`)
  check('别名表规模很小（只收录已核实项）', keys.length <= 5, `got ${keys.length}`)
  // 明确不收录的高风险项
  const forbidden = ['bose qc ultra', 'lenovo xiaoxin pro 16', 'sony wh-1000xm6', 'amd rx 7800 xt']
  for (const f of forbidden) {
    check(`未收录未核实条目: ${f}`, !(f in MODEL_ALIASES))
  }
  // 每个别名都必须与产品同型号（不含升档 SKU 后缀）
  for (const [key, list] of Object.entries(MODEL_ALIASES)) {
    for (const a of list) {
      const bad = [' ti', ' pro+', ' max', ' ultra', ' super'].filter((s) => a.includes(s) && !key.includes(s.trim()))
      check(`别名 "${a}" 未引入升档 SKU`, bad.length === 0, JSON.stringify(bad))
    }
  }
}

console.log('\n=== 20. 真实数据库验证中发现的跨型号误配（回归用例） ===')
{
  // 全部来自「真实数据库产品 × Wikimedia 真实标题」，修前均为 100 HIGH autoAdopt=true
  const cases = [
    // 命中跨度内夹入非型号字母
    [{ brand: '索尼', model: 'A7 IV', category: '相机' },
      'Francisco sierra photography sony A7 R IV launch.png', 'A7R IV 不得当成 A7 IV'],
    [{ brand: '华为', model: 'MateBook 14', category: '笔记本电脑' },
      'Huawei MateBook D 14.jpg', 'MateBook D 14 不得当成 MateBook 14'],
    [{ brand: '华为', model: 'MateBook 14', category: '笔记本电脑' },
      'Huawei MateBook GT 14 (Oct 1, 2025).jpg', 'MateBook GT 14 不得当成 MateBook 14'],
    // 容量/SKU 冲突
    [{ brand: '三星', model: '990 Pro 2TB', category: '移动硬盘' },
      'SAMSUNG M.2 NVMe SSD 990 PRO 4TB.jpg', '990 PRO 4TB 不得当成 2TB'],
    [{ brand: '金士顿', model: '骇客神条 32GB', category: '内存' },
      'Kingston HyperX Fury 16GB DDR4.jpg', '16GB 不得当成 32GB'],
    // 标题末尾照片序号被当成型号数字
    [{ brand: '大疆', model: 'Pocket 3', category: '相机' },
      'DJI Osmo Pocket - 3.jpg', 'Osmo Pocket 的照片序号 -3 不得当成 Pocket 3'],
    [{ brand: '苹果', model: 'Watch Ultra 2', category: '智能手表' },
      'Apple Watch Ultra - 2.jpg', 'Watch Ultra 的照片序号 -2 不得当成 Ultra 2'],
    // 日期数字被当成型号
    [{ brand: '小米', model: '14', category: '手机' },
      'Xiaomi flagship store at SM Seaside City (2024-12-14).jpg', '日期里的 14 不得当成小米 14'],
    // 同系列不同型号（跨度内夹入其它数字）
    [{ brand: 'Intel', model: 'i9-14900K', category: 'CPU' },
      'Дешёвый Core i9 Мутант 12900HX против 14600K и 14900K (1440p).png', '对比视频标题不得命中 14900K'],
    [{ brand: '三星', model: 'Galaxy Watch 6', category: '智能手表' },
      'SAMSUNG Galaxy Tab S9, SAMSUNG W24, (FROM SAMSUNG Galaxy Z Fold 5).jpg', 'Galaxy Tab 标题不得命中 Galaxy Watch 6']
  ]
  for (const [prod, title, label] of cases) {
    const r = scoreCandidate(buildSignals(prod), cand(title))
    console.log(`    [${r.matchScore} ${r.matchStatus}] ${label}`)
    check(`${label}`, r.matchStatus !== 'HIGH', `got ${r.matchScore}`)
    check(`${label}（不得 autoAdopt）`, r.autoAdopt !== true, `got ${r.autoAdopt}`)
  }
}
{
  // 但「型号 token 顺序不同、且都在跨度内」的正确匹配必须保留
  const keep = [
    [{ brand: '苹果', model: 'iPad Air M2', category: '平板' },
      'M2 iPad Air front Camera and Apple Pencil.jpg', 'M2 iPad Air 应命中 iPad Air M2'],
    [{ brand: '罗技', model: 'G Pro X Superlight 2', category: '鼠标' },
      'Logitech Pro X Superlight 2 sample 20231216.jpg', 'Logitech Pro X Superlight 2 应命中'],
    [{ brand: '三星', model: 'Galaxy S24', category: '手机' },
      'Samsung Galaxy S24 (webtekno) 008.png', 'Galaxy S24 应命中'],
    [{ brand: '华为', model: 'MateBook 14', category: '笔记本电脑' },
      'Huawei MateBook 14 (2023), February 4, 2024.jpg', 'MateBook 14 (2023) 应命中'],
    [{ brand: '索尼', model: 'A7 IV', category: '相机' },
      'Sony A7 IV (ILCE-7M4) - by Henry Söderlund (51739988735).jpg', 'Sony A7 IV 应命中'],
    [{ brand: '三星', model: '990 Pro 2TB', category: '移动硬盘' },
      'SAMSUNG M.2 NVMe SSD 990 PRO 2TB.jpg', '990 PRO 2TB 应命中'],
    [{ brand: '大疆', model: 'Pocket 3', category: '相机' },
      'DJI Osmo Pocket 3 - 1.jpg', 'Osmo Pocket 3 应命中'],
    [{ brand: '苹果', model: 'Watch Ultra 2', category: '智能手表' },
      'Apple Watch Ultra 2.jpg', 'Watch Ultra 2 应命中']
  ]
  for (const [prod, title, label] of keep) {
    const r = scoreCandidate(buildSignals(prod), cand(title))
    console.log(`    [${r.matchScore} ${r.matchStatus}] ${label}`)
    check(`${label}`, r.matchStatus === 'HIGH', `got ${r.matchScore}`)
  }
}

console.log('\n=== 19. autoAdopt 准入规则 ===')
{
  const licCases = [
    ['CC0', true], ['Public domain', true], ['CC BY 3.0', true], ['CC BY-SA 4.0', true],
    ['BY-SA 4.0', true], ['CC BY 4.0', true],
    ['BY-NC-SA 2.0', false], ['BY-NC-ND 2.0', false], ['CC BY-NC 4.0', false],
    ['GFDL', false], ['Attribution', false], ['', false], [null, false], [undefined, false]
  ]
  const { isGoodLicense } = await import('./matching.mjs')
  void isGoodLicense
  for (const [lic, want] of licCases) {
    check(`许可可自动采用 ${String(lic)} -> ${want}`, isAutoAdoptLicense(lic) === want)
  }
  check('HIGH + CC0 可自动采用', isAutoAdopt('HIGH', 'CC0') === true)
  check('HIGH + CC BY-SA 可自动采用', isAutoAdopt('HIGH', 'CC BY-SA 4.0') === true)
  check('HIGH + BY-NC-SA 不可自动采用', isAutoAdopt('HIGH', 'BY-NC-SA 2.0') === false)
  check('HIGH + 未知许可不可自动采用', isAutoAdopt('HIGH', null) === false)
  check('MEDIUM + CC0 不可自动采用', isAutoAdopt('MEDIUM', 'CC0') === false)
  check('LOW + CC0 不可自动采用', isAutoAdopt('LOW', 'CC0') === false)
  check('REJECT + CC0 不可自动采用', isAutoAdopt('REJECT', 'CC0') === false)
}

console.log(`\n================ 结果：${pass} 通过 / ${fail} 失败 ================`)
if (fail > 0) {
  console.log('失败用例：\n  - ' + failures.join('\n  - '))
  process.exit(1)
}
console.log('全部评分规则自测通过。')
