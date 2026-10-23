/**
 * 匹配评分模块（验证专项共用）
 * ------------------------------------------------------------------
 * 由 verify-product-images.mjs 与 lib/scoring-selftest.mjs 共用，保证
 * 「报告使用的规则」与「被测试验证的规则」永远一致。
 *
 * 本模块是纯函数：不发起网络请求、不读写数据库、不依赖任何生产 Java 代码。
 *
 * 经过实测修正的四类假阳性（详见 scoring-selftest.mjs）：
 *   1. 相机署名：Wikimedia 上大量图片的分类是 "Taken with Vivo X200 Pro"，
 *      描述是 "This Picture taken by a smartphone only (vivo x200 pro)"。
 *      这是「用该手机拍摄」而非「拍摄该手机」，必须剔除后再做型号匹配。
 *   2. 日期噪声：分类 "photographs taken on 2015-04-10" 会带来孤立数字 10，
 *      可能被误当成型号数字（Watch Series 10）。
 *   3. 文件扩展名：标题 "Apple Watch Series 10.png" 若不做处理会被切成
 *      token "10.png"，导致真正的型号匹配失败。
 *   4. 配件/概念图：case / cover / wallpaper / vector 等必须重罚。
 */

// ============================================================
// 通用工具
// ============================================================

export function norm(s) {
  return String(s ?? '').toLowerCase().normalize('NFKC')
}

/** 剥离 HTML 标签与多余空白 */
export function stripHtml(s) {
  return String(s ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 文件名扩展名：Wikimedia 标题都是 "File:xxx.jpg" 形式，扩展名不属于型号 */
const FILE_EXT_RE = /\.(jpe?g|png|gif|svg|webp|tiff?|bmp|pdf|djvu|ogv|ogg|webm|mp4|wav|mp3|stl|zip)\b/gi

/**
 * 照片序号后缀： "DJI Osmo Pocket - 3.jpg" 里的 "- 3" 是「第 3 张」，
 * 不是型号的一部分。不剥掉它会把「Osmo Pocket」误判成「Osmo Pocket 3」、
 * 把「Apple Watch Ultra」误判成「Apple Watch Ultra 2」。
 * 只剥「位于标题末尾、短横线/长破折号 + 数字」的形式。
 */
const TRAILING_INDEX_RE = /\s*[-–—]\s*\d+\s*$/

/** 清洗文本：去 HTML、去 File: 前缀、去扩展名、去照片序号后缀 */
export function cleanText(s) {
  return stripHtml(s)
    .replace(/^\s*file:/i, ' ')
    .replace(FILE_EXT_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(TRAILING_INDEX_RE, '')
    .trim()
}

/**
 * 相机署名片段：命中即整段丢弃。
 * 覆盖 "Taken with X" / "shot on X" / "Camera: X" / "Self-published work" 等
 * Wikimedia 常见的「拍摄器材」标注。
 */
const CAMERA_CREDIT_SEG_RE = new RegExp([
  '\\btaken\\s+(with|by|using|on)\\b',
  '\\bshot\\s+(with|on|by|using)\\b',
  '\\bphotographed\\s+(with|by)\\b',
  '\\bphoto(graph|graphs)?\\s+(by|with)\\b',
  '\\bcamera\\b',
  '\\bexif\\b',
  '\\blens\\b',
  '\\bself-published\\s+work\\b',
  '\\buploaded\\s+with\\b',
  '\\bphotographs?\\s+taken\\s+on\\b'
].join('|'), 'i')

/** 剔除相机署名片段（按 | ; 切段） */
export function stripCameraCredit(text) {
  return String(text ?? '')
    .split(/[|;]/)
    .filter((seg) => !CAMERA_CREDIT_SEG_RE.test(seg))
    .join(' | ')
}

/** 日期噪声：YYYY-MM-DD 之类，避免其数字被当成型号数字 */
const DATE_RE = /\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g

export function stripDates(text) {
  return String(text ?? '').replace(DATE_RE, ' ')
}

/** 分词：保留字母、数字、CJK、+、. */
export function tokenize(s) {
  return norm(s)
    .replace(/[^a-z0-9\u4e00-\u9fff+.]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

export function uniq(arr) {
  return [...new Set(arr)]
}

// ============================================================
// 型号信号提取
// ============================================================

const CAPACITY_RE = /\b\d+\s?(?:gb|tb|g|t)\b/gi

/**
 * 型号尾缀/变体关键字。
 * 单字母变体（k/f）仅用于识别，不参与冲突比较：它们会在标题里大量偶然出现
 * （如 i7-14700K 的 k、of 的 f），造成误扣分。
 */
export const VARIANT_TOKENS = [
  'pro', 'max', 'plus', 'ultra', 'mini', 'ti', 'super', 'xt', 'xtx', 'x3d',
  'kf', 'k', 'f', 'oled', 'nc', 'shield', 'air', 'se', 'lite', 'classic'
]

/**
 * 「升档」SKU 后缀：出现在标题里即代表这是同系列的另一个（更强的）型号，
 * 例如 RTX 5070 Ti 之于 RTX 5070、iPhone 17 Pro 之于 iPhone 17。
 */
export const SKU_SUFFIXES = ['ti', 'super', 'pro', 'max', 'ultra', 'plus', 'xt', 'xtx', 'oled', 'mini', 'classic']

/**
 * 小型型号别名表（**显式枚举**，绝不做模糊匹配）。
 *
 * 键：产品型号核心的归一化写法（小写、空格分隔、已去容量后缀）。
 * 值：经真实 API 核查、确认在 Wikimedia Commons 上真实使用的官方命名差异写法。
 *
 * 收录标准（三条同时满足才收录）：
 *   1. 该写法在 Commons 上真实存在对应图片（已实测，见 summary 第六之三节）；
 *   2. 与产品是同一型号，而不是同系列的其他型号；
 *   3. 匹配时按「连续短语」整段命中，因此 A7 IV 不会命中 A7R IV、Pro 不会命中 Pro+。
 *
 * 明确不收录的（属于不同型号，不是别名）：
 *   - RTX 5070 ≠ RTX 5070 Ti；iPhone 17 ≠ iPhone 17 Pro；Mate 70 Pro ≠ Mate 70 Pro+
 *   - MacBook Pro 14 M4 ≠ MacBook Pro 16-inch M4 Pro（尺寸与芯片都不同）
 *   - Bose QC Ultra（头戴）≠ Bose QuietComfort Ultra Earbuds（入耳）：Commons 上只有后者，故不收录
 *   - 联想 Xiaoxin Pro 16 → IdeaPad Pro 16 属区域命名差异，但 Commons 上查无实机图，无法核实，故不收录
 */
export const MODEL_ALIASES = {
  // Sony 官方在机身与资料中写作 "A7 IV" / "a7IV" / "Alpha 7 IV" / "Alpha 7 Mark IV"
  'sony a7m4': ['sony a7 iv', 'sony a7iv', 'sony alpha 7 iv', 'sony alpha 7 mark iv'],
  // iPad Pro 11 M4：Commons 写作 "iPad Pro 11-inch (M4)" / "iPad Pro M4 11-inch"
  'ipad pro 11 m4': ['ipad pro m4', 'ipad pro m4 11-inch', 'ipad pro 11-inch m4']
}

/** 判断 tokens 中是否**连续**出现 phrase（整段短语命中，不做模糊匹配） */
export function containsPhrase(tokens, phrase) {
  if (!phrase || phrase.length === 0) return false
  if (phrase.length > tokens.length) return false
  for (let i = 0; i + phrase.length <= tokens.length; i++) {
    let hit = true
    for (let j = 0; j < phrase.length; j++) {
      if (tokens[i + j] !== phrase[j]) { hit = false; break }
    }
    if (hit) return true
  }
  return false
}

/** 品牌中文名 -> 英文搜索词 */
export const BRAND_SEARCH = {
  '苹果': 'Apple', '华为': 'Huawei', '小米': 'Xiaomi', '三星': 'Samsung', '荣耀': 'Honor',
  '联想': 'Lenovo', '戴尔': 'Dell', '惠普': 'HP', '索尼': 'Sony', '罗技': 'Logitech',
  '雷蛇': 'Razer', '佳能': 'Canon', '闪迪': 'SanDisk', '任天堂': 'Nintendo',
  '华硕': 'ASUS', '英伟达': 'NVIDIA', '大疆': 'DJI', 'OPPO': 'OPPO', 'vivo': 'Vivo'
}

/** 分类 -> 图片标题中可能出现的英文关键词（用于 +10 分类一致） */
export const CATEGORY_KEYWORDS = {
  '手机': ['phone', 'smartphone', 'iphone', 'mobile', '手机'],
  '平板': ['tablet', 'ipad', '平板'],
  '笔记本电脑': ['laptop', 'notebook', 'macbook', '笔记本电脑', '笔记本'],
  'CPU': ['cpu', 'processor', '处理器'],
  '显卡': ['graphics card', 'gpu', 'geforce', 'radeon', '显卡'],
  '显示器': ['monitor', 'display', '显示器'],
  '耳机': ['headphone', 'earphone', 'earbud', 'headset', '耳机'],
  '键盘': ['keyboard', '键盘'],
  '鼠标': ['mouse', '鼠标'],
  '相机': ['camera', 'mirrorless', '相机'],
  '智能手表': ['watch', 'smartwatch', '手表'],
  '移动硬盘': ['ssd', 'drive', '硬盘'],
  '路由器': ['router', '路由器'],
  '游戏设备': ['console', 'playstation', 'switch', 'game', '游戏']
}

/**
 * 已知品牌词（中文名 + 英文名 + 少量常见补充）。
 * 用途：把「品牌 + 型号」形式的产品名切成「型号」，属纯格式处理，不涉及型号推断。
 * 注意：必须定义在 BRAND_SEARCH 之后（模块初始化顺序）。
 */
export const BRAND_WORDS = (() => {
  const set = new Set()
  for (const [zh, en] of Object.entries(BRAND_SEARCH)) {
    tokenize(zh).forEach((t) => set.add(t))
    tokenize(en).forEach((t) => set.add(t))
  }
  for (const w of ['amd', 'intel', 'nvidia', '锐龙', '英特尔']) set.add(w)
  return set
})()

/**
 * 去掉产品名开头连续出现的品牌词（纯格式归一化，不做模糊匹配）。
 * 例：「罗技 MX Master 3S」->「mx master 3s」；「任天堂 Switch OLED」->「switch oled」。
 */
export function stripLeadingBrand(name) {
  const t = tokenize(name)
  let i = 0
  while (i < t.length && BRAND_WORDS.has(t[i])) i++
  return t.slice(i).join(' ')
}

/** 从产品中提取用于匹配的型号信号 */
export function buildSignals(product, options = {}) {
  const useAliases = options.useAliases !== false
  const rawModel = String(product.model ?? '')
  const brand = String(product.brand ?? '')
  const brandSearch = BRAND_SEARCH[brand] ?? brand

  // 去掉容量，得到「型号核心」，如 "iPhone 17 Pro 256GB" -> "iPhone 17 Pro"
  const coreModel = rawModel.replace(CAPACITY_RE, ' ').replace(/\s+/g, ' ').trim()
  const coreTokens = tokenize(coreModel)

  // 型号里显式写出的容量（2TB / 256GB / 32GB…）。容量是独立 SKU 维度：
  // 「990 Pro 2TB」与「990 Pro 4TB」是不同商品，标题明确写了别的容量时必须判为不匹配。
  const capacityTokens = uniq(
    (rawModel.match(CAPACITY_RE) ?? []).flatMap((m) => tokenize(m))
  )

  const brandTokens = tokenize(brandSearch)
  // 型号核心中属于品牌本身的 token（如 vivo X200 的 vivo、Bose QC Ultra 的 bose）
  const modelBrandTokens = coreTokens.filter((t) => brandTokens.includes(t))
  const identityTokens = coreTokens.filter((t) => !brandTokens.includes(t))

  // 数字类 token：型号的强区分信号（17 / 4070 / 7800x3d / i7-14700k）
  const digitTokens = identityTokens.filter((t) => /\d/.test(t))
  // 字母类 token：系列名（iphone / galaxy / rtx / macbook / oled）
  const alphaTokens = identityTokens.filter((t) => !/\d/.test(t))
  const variantTokens = alphaTokens.filter((t) => VARIANT_TOKENS.includes(t))
  // 系列头：第一个字母 token；没有则退回第一个 token
  const familyToken = alphaTokens[0] ?? digitTokens[0] ?? identityTokens[0] ?? ''

  const requiredDigitTokens = digitTokens
  // 有数字的型号：数字为主信号，字母 token 作为辅助（系列头可略）。
  // 无数字的型号（Switch OLED / MX Mechanical）：必须命中全部字母 token，
  // 否则 "OLED 电视" 这类无关图片会被误判成 Switch OLED。
  const requiredAlphaTokens = digitTokens.length > 0
    ? alphaTokens.filter((t) => t !== familyToken || alphaTokens.length === 1)
    : alphaTokens

  // ---- 型号别名（显式表，可按开关关闭以测「别名前」基线）----
  // 先在「品牌+型号」键上查表（兼容 {"sony a7m4": [...]} 这种写法），
  // 查不到再退回「纯型号」键（如 "ipad pro 11 m4"）。
  const brandDuplicated = brandTokens.some((t) => coreTokens.includes(t))
  const aliasKey = norm(brandDuplicated ? coreModel : `${brandSearch} ${coreModel}`)
    .replace(/\s+/g, ' ').trim()
  const aliasKeyModel = norm(coreModel).replace(/\s+/g, ' ').trim()
  const aliasTexts = (useAliases && (MODEL_ALIASES[aliasKey] ?? MODEL_ALIASES[aliasKeyModel])) || []
  const aliasForms = aliasTexts.map((text) => {
    const tokens = tokenize(text)
    // 匹配时去掉与品牌重复的前导 token（品牌另有 +30 计分）
    const phrase = tokens.filter((t, i) => !(i === 0 && brandTokens.includes(t)))
    return { text, tokens, phrase }
  })

  return {
    brand,
    brandSearch,
    brandTokens,
    rawModel,
    coreModel,
    coreTokens,
    capacityTokens,
    modelBrandTokens,
    identityTokens,
    digitTokens,
    alphaTokens,
    variantTokens,
    familyToken,
    requiredDigitTokens,
    requiredAlphaTokens,
    aliasKey,
    aliasKeyModel,
    aliasForms,
    useAliases,
    category: String(product.category ?? ''),
    categoryKeywords: CATEGORY_KEYWORDS[product.category] ?? []
  }
}

/** 搜索词构造 */
export function buildQueries(sig, maxQueries = 2) {
  const list = []
  const b = sig.brandSearch
  const m = sig.coreModel
  const cat = sig.categoryKeywords[0] ?? ''

  // 型号核心已含品牌（vivo X200 / Bose QC Ultra / JBL Tune 770NC）时不再重复拼接
  const brandDuplicated = sig.brandTokens.some((t) => sig.coreTokens.includes(t))
  const primary = brandDuplicated ? m : `${b} ${m}`

  // 三档搜索词（任务书要求）：
  //   1) brand + model
  //   2) model（去掉品牌；品牌已含在型号里时退化为 model + 分类词）
  //   3) brand + model + category
  // 若命中别名表，则把别名写法插在第 1 档之后优先检索（它们才是 Commons 上的真实写法）。
  list.push(primary)
  for (const f of sig.aliasForms ?? []) list.push(f.text)
  list.push(m !== primary ? m : `${m} ${cat}`.trim())
  list.push(`${primary} ${cat}`.trim())

  return uniq(list.filter(Boolean)).slice(0, maxQueries)
}

/** 板卡/整机厂商名（记录用：如 RTX 5070 ASUS 需标明厂商） */
const VENDOR_NAMES = [
  'asus', 'msi', 'gigabyte', 'zotac', 'colorful', 'galax', 'palit', 'sapphire', 'powercolor',
  'xfx', 'evga', 'inno3d', 'pny', 'leadtek', 'yeston', 'maxsun', 'biostar', 'asrock'
]

// ============================================================
// matchScore 匹配评分
// ============================================================

const RE_CASE = /\b(case|cases|cover|covers|sleeve|sleeves|protector|bumper|holster|pouch|tempered|screen guard|skin|skins)\b/i
const RE_CONCEPT = /\bconcept\b/i
const RE_WALLPAPER = /\b(wallpaper|logo|icon|clipart|vector|mockup|drawing)\b/i
const RE_ACCESSORY = /\b(accessor(y|ies)|charger|cable|adapter|stand|mount|strap|dock|holder)\b/i

/** 许可是否属于推荐保留的开放许可（排除 -NC / -ND 等限制性变体） */
export function isGoodLicense(lic) {
  if (!lic) return false
  const s = String(lic).trim()
  if (/^cc0/i.test(s)) return true
  if (/public domain|^pd\b|^pdm\b/i.test(s)) return true
  // 允许 "CC BY 3.0" / "CC BY-SA 4.0" / "BY-SA 4.0" / "BY 3.0" 等形式
  if (/^(cc[ -]?)?by(-sa)?([ -]?\d+(\.\d+)?)?$/i.test(s)) return true
  return false
}

/** 型号命中要求的「数字 token 与字母 token 的最大间隔」 */
const MODEL_PROXIMITY = 5

/**
 * 是否允许「自动采用」（HIGH 自动落库的准入许可）。
 *
 * 只接受可确认的宽松许可：CC0 / Public Domain / CC BY / CC BY-SA。
 * 任何带 NC（禁商用）或 ND（禁演绎）的变体一律拒绝；
 * 许可缺失、为空、无法识别（如 GFDL、Attribution）也一律拒绝。
 */
export function isAutoAdoptLicense(lic) {
  if (lic == null) return false
  const s = String(lic).trim().toLowerCase().replace(/\s+/g, ' ')
  if (!s) return false
  // 先排除限制性变体：BY-NC-SA / BY-NC-ND / CC BY-NC 等
  if (/(^|[^a-z])nc([^a-z]|$)/.test(s)) return false
  if (/(^|[^a-z])nd([^a-z]|$)/.test(s)) return false
  if (/^cc0/.test(s)) return true
  if (/public domain|^pdm?\b/.test(s)) return true
  // CC BY / CC BY-SA / BY / BY-SA（版本号可有可无，可含小数点）
  if (/^(cc[ -]?)?by(-sa)?([ -]?\d+(\.\d+)?)?$/.test(s)) return true
  return false
}

/** 自动采用：必须同时满足 matchStatus === 'HIGH' 且许可可确认 */
export function isAutoAdopt(matchStatus, license) {
  return matchStatus === 'HIGH' && isAutoAdoptLicense(license)
}

/**
 * 判断 token 序列中是否命中产品型号。
 * 数字 token 必须全部出现；字母 token 必须出现且与某个数字 token 邻近
 * （避免日期、尺寸等远处数字凑出假命中）。
 */
function modelHitInTokens(tokens, sig) {
  const needed = [...sig.requiredDigitTokens, ...sig.requiredAlphaTokens]
  if (needed.length === 0) return false

  const pos = []
  for (const t of needed) {
    const i = tokens.indexOf(t)
    if (i === -1) return false
    pos.push(i)
  }

  // 数字与系列词必须邻近（避免日期、尺寸等远处数字凑出假命中）
  if (sig.requiredDigitTokens.length > 0 && sig.requiredAlphaTokens.length > 0) {
    const digitPos = sig.requiredDigitTokens.map((t) => tokens.indexOf(t))
    for (const a of sig.requiredAlphaTokens) {
      const ai = tokens.indexOf(a)
      if (!digitPos.some((di) => Math.abs(di - ai) <= MODEL_PROXIMITY)) return false
    }
  }

  // 命中跨度内不得夹入「非型号」token。
  // 这一条专门拦下面这类跨型号误配（本轮实测遇到的真实缺陷）：
  //   product "A7 IV"        << title "sony A7 R IV"        （夹了 R）
  //   product "MateBook 14"  << title "MateBook D 14"       （夹了 D）
  //   product "i9-14900K"    << 对比视频标题里同时出现 14600K/12900HX
  // 同时不影响「型号 token 顺序不同但都在跨度内」的正确匹配：
  //   product "iPad Air M2"  << title "M2 iPad Air front Camera" ✓
  const lo = Math.min(...pos)
  const hi = Math.max(...pos)
  const modelSet = new Set(sig.identityTokens)
  for (let k = lo; k <= hi; k++) {
    if (!modelSet.has(tokens[k])) return false
  }

  // 容量/SKU 冲突：型号带容量时，若标题明确写了另一个容量，则不是同一 SKU。
  //   product "990 Pro 2TB" << title "SAMSUNG ... 990 PRO 4TB" -> 不匹配
  // 标题完全没写容量时不拦（图可能只是通用图），避免为覆盖率放宽或误杀。
  const caps = sig.capacityTokens ?? []
  if (caps.length > 0) {
    const capInText = tokens.filter((t) => /^\d+(gb|tb)$/.test(t))
    if (capInText.length > 0 && !capInText.some((c) => caps.includes(c))) return false
  }

  return true
}

/**
 * 型号命中（含别名）：主型号命中，或任一别名写法「连续整段」命中。
 * 别名走连续短语匹配，因此 A7 IV 不会命中 A7R IV。
 */
function modelHitWithAlias(tokens, sig) {
  if (modelHitInTokens(tokens, sig)) return 'primary'
  for (const f of sig.aliasForms ?? []) {
    if (containsPhrase(tokens, f.phrase)) return `alias:${f.text}`
  }
  return null
}

/**
 * 计算候选图片与产品的匹配分。
 * 原则：宁可漏判，不可误判——型号匹配一律整词命中，且数字与系列词需邻近。
 */
export function scoreCandidate(sig, cand) {
  // 标题同样要先去日期噪声：否则 "Xiaomi flagship store ... (2024-12-14)" 里的 14
  // 会被当成「小米 14」的型号数字（本轮实测遇到的真实误配）。
  const title = stripDates(cleanText(cand.title ?? ''))

  // 描述文本：先剔除相机署名与日期噪声，再做型号匹配
  const rawDescription = [cand.description, cand.categories, cand.tags, cand.objectName].filter(Boolean).join(' | ')
  const description = stripDates(stripCameraCredit(rawDescription))

  const titleN = norm(title)
  const descN = norm(description)
  const titleTokens = tokenize(title)
  const descTokens = tokenize(description)

  const reasons = []
  let score = 0

  // ---- 型号命中（主型号优先，其次显式别名）----
  const titleHit = modelHitWithAlias(titleTokens, sig)
  const descHit = titleHit ? null : modelHitWithAlias(descTokens, sig)
  const modelFullInTitle = titleHit !== null
  const modelFullInDesc = !modelFullInTitle && descHit !== null
  const matchedVia = titleHit ?? descHit

  // ---- 厂商识别（仅记录，不影响分数）----
  const vendor = VENDOR_NAMES.find((v) => titleTokens.includes(v)) ?? null

  // ---- 变体冲突 ----
  // 只在「标题」上判定变体冲突：标题才是对型号身份的声明。
  // 描述/分类里出现别的变体词（例如同组照片的描述顺带写了 iPhone Air，
  // 或英文散文里的 open air）不应把一张正确的 iPhone 17 照片降级。
  const multiCharVariants = VARIANT_TOKENS.filter((v) => v.length > 1)
  const variantConflict = (() => {
    if (!modelFullInTitle && !modelFullInDesc) return { extra: [], missing: [] }
    const titleVariants = new Set(titleTokens.filter((t) => multiCharVariants.includes(t)))
    const productVariants = sig.variantTokens.filter((v) => v.length > 1)
    const extra = [...titleVariants].filter((v) => !productVariants.includes(v))
    const missing = productVariants.filter((v) => !titleVariants.has(v) && !descTokens.includes(v))
    return { extra, missing }
  })()

  // ---- 「Pro+」这类加号升档 SKU ----
  const plusUpgrade = (() => {
    if (String(sig.coreModel).includes('+')) return []
    if (!modelFullInTitle && !modelFullInDesc) return []
    return uniq([...titleTokens, ...descTokens]
      .filter((t) => t.length > 1 && t.endsWith('+'))
      .map((t) => t.slice(0, -1))
      .filter((base) => VARIANT_TOKENS.includes(base) || sig.identityTokens.includes(base)))
  })()

  // ---- 其他型号：系列头命中但型号数字不一致（RTX 4070 命中到 RTX 4080）----
  const familyHitTitle = sig.familyToken ? titleTokens.includes(sig.familyToken) : false
  const otherModel = (() => {
    if (sig.requiredDigitTokens.length === 0 || !sig.familyToken) return false
    if (!familyHitTitle) return false
    if (sig.requiredDigitTokens.every((t) => titleTokens.includes(t))) return false
    const titleDigits = titleTokens.filter((t) => /\d/.test(t))
    if (titleDigits.length === 0) return false
    return titleDigits.some((t) => !sig.requiredDigitTokens.includes(t))
  })()

  // ---- 加分 ----
  if (modelFullInTitle) {
    score += 50
    reasons.push('+50 标题包含完整型号')
  }
  const brandHit = sig.brandTokens.some((t) => titleTokens.includes(t)) || sig.modelBrandTokens.some((t) => titleTokens.includes(t))
  const brandHitDesc = sig.brandTokens.some((t) => descTokens.includes(t)) || sig.modelBrandTokens.some((t) => descTokens.includes(t))
  if (brandHit || brandHitDesc) {
    score += 30
    reasons.push('+30 标题/描述包含品牌')
  }
  if (modelFullInDesc) {
    score += 20
    reasons.push('+20 描述/标签包含完整型号')
  }
  const catHit = sig.categoryKeywords.some((k) => titleN.includes(k) || descN.includes(k))
  if (catHit) {
    score += 10
    reasons.push('+10 分类一致')
  }
  if (cand.source === 'wikimedia') {
    score += 10
    reasons.push('+10 来源为 Wikimedia Commons')
  }
  if (isGoodLicense(cand.license)) {
    score += 10
    reasons.push('+10 开放许可（CC0/CC BY/CC BY-SA/PD）')
  }

  // ---- 扣分 ----
  if (RE_CASE.test(titleN)) {
    score -= 50
    reasons.push('-50 标题含 case/cover/sleeve/protector')
  }
  if (RE_CONCEPT.test(titleN)) {
    score -= 40
    reasons.push('-40 标题含 concept')
  }
  if (RE_WALLPAPER.test(titleN)) {
    score -= 40
    reasons.push('-40 标题含 wallpaper/logo/vector/mockup 等非实物图')
  }
  if (RE_ACCESSORY.test(titleN)) {
    score -= 30
    reasons.push('-30 标题含 accessory/charger/cable 等配件词')
  }
  if (otherModel) {
    score -= 30
    reasons.push('-30 疑似其他型号（同系列数字不一致）')
  }
  if (variantConflict.extra.length > 0 && (familyHitTitle || modelFullInTitle)) {
    score -= 30
    reasons.push(`-30 变体冲突（标题多出 ${variantConflict.extra.join('/')}）`)
    // 标题出现产品本体没有的升档 SKU 后缀（Ti/Super/Pro/Max/Ultra/XT/OLED…）时，
    // 它是「同系列的另一个型号」而不是本产品本体：RTX 5070 Ti ≠ RTX 5070。
    const skuUpgrade = variantConflict.extra.filter((v) => SKU_SUFFIXES.includes(v))
    if (skuUpgrade.length > 0 && modelFullInTitle) {
      score -= 30
      reasons.push(`-30 明显是其他型号（同系列不同 SKU：${skuUpgrade.join('/')}）`)
    }
  }
  if (plusUpgrade.length > 0) {
    score -= 30
    reasons.push(`-30 明显是其他型号（加号升档 SKU：${plusUpgrade.join('/')}+）`)
  }
  if (variantConflict.missing.length > 0 && modelFullInTitle) {
    score -= 15
    reasons.push(`-15 型号描述不完整（缺少 ${variantConflict.missing.join('/')}）`)
  }

  const onlyBrand = !modelFullInTitle && !modelFullInDesc && (brandHit || brandHitDesc)
  if (onlyBrand) {
    score -= 20
    reasons.push('-20 只有品牌、没有型号')
  }

  // ---- HIGH 必须有标题级证据 ----
  // 型号只出现在描述/标签时，无法从标题确证是「该型号本体」，因此封顶为 MEDIUM。
  if (!modelFullInTitle && score > 79) {
    score = 79
    reasons.push('→ 型号未出现在标题，封顶 79（不得判为 HIGH）')
  }

  // ---- 配件/非实物图一票封顶 ----
  // 「iPhone 17 硅胶保护壳」无论型号写得多准，都不是手机本体；同理概念图、
  // 壁纸、logo 也不能作为产品图。这类候选最高只能到 LOW，避免进入人工复核队列。
  const hardDisqualify = RE_CASE.test(titleN) || RE_CONCEPT.test(titleN)
    || RE_WALLPAPER.test(titleN) || RE_ACCESSORY.test(titleN)
  if (hardDisqualify && score > 59) {
    score = 59
    reasons.push('→ 命中配件/非实物图规则，封顶 59（不得判为 MEDIUM/HIGH）')
  }

  score = Math.max(0, Math.min(100, score))
  const matchStatus = score >= 80 ? 'HIGH' : score >= 60 ? 'MEDIUM' : score >= 40 ? 'LOW' : 'REJECT'

  // ---- 自动采用准入：HIGH + 可确认的宽松许可 ----
  const licenseOk = isAutoAdoptLicense(cand.license)
  const autoAdopt = matchStatus === 'HIGH' && licenseOk
  if (matchStatus === 'HIGH') {
    reasons.push(licenseOk
      ? '→ autoAdopt=true（HIGH 且许可为 CC0/PD/CC BY/CC BY-SA）'
      : `→ autoAdopt=false（许可不可自动采用：${cand.license ?? '未标注'}）`)
  }

  const viaAlias = typeof matchedVia === 'string' && matchedVia.startsWith('alias:')

  return {
    matchScore: score,
    matchStatus,
    matchReasons: reasons,
    modelFullInTitle,
    modelFullInDesc,
    matchedVia,
    viaAlias,
    autoAdopt,
    licenseAutoAdoptable: licenseOk,
    vendor,
    flags: {
      caseLike: RE_CASE.test(titleN),
      concept: RE_CONCEPT.test(titleN),
      wallpaperLike: RE_WALLPAPER.test(titleN),
      accessory: RE_ACCESSORY.test(titleN),
      otherModel,
      variantExtra: variantConflict.extra,
      variantMissing: variantConflict.missing,
      plusUpgrade,
      onlyBrand,
      hardDisqualify,
      viaAlias,
      titleModelHit: modelFullInTitle,
      descModelHit: modelFullInDesc
    }
  }
}
