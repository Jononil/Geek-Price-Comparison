/**
 * 性价比实验室 · 分类维度体系
 * ------------------------------------------------------------------
 * 不同品类该看的东西不一样：手机看影像/屏幕/续航，耳机看音质/降噪/佩戴，
 * 显卡看散热/能效。因此维度按品类定义，而不是全站一套。
 *
 * 数据来源分两类：
 *   - real：直接取后端字段（目前只有「性能」= products.performance_score）
 *   - sim ：该品类特有维度，后端没有对应字段，按「价格档位 + 用户评分 + 稳定随机」
 *           生成 0-100 的相对分，仅用于演示加权逻辑，不代表真实评测结论
 *
 * 之所以不用 Math.random()：同一产品每次刷新分数要一样，否则排行榜会乱跳。
 * 这里用 productId + 维度 key 做 FNV-1a 哈希作种子，保证确定性。
 */

export type DimMode = 'real' | 'sim'

export interface Dim {
  key: string
  name: string
  mode: DimMode
  hint?: string
}

export interface Preset {
  key: string
  name: string
  w: Record<string, number>
}

const d = (key: string, name: string, mode: DimMode = 'sim', hint?: string): Dim => ({ key, name, mode, hint })

const perf = (hint = '（后端真实分）') => d('perf', '性能', 'real', hint)

/** 按品类名（与 categories.name 一致）定义的维度表 */
export const DIMENSION_SETS: Record<string, Dim[]> = {
  手机: [perf(), d('cam', '影像'), d('screen', '屏幕'), d('batt', '续航'), d('os', '系统')],
  平板电脑: [d('screen', '屏幕'), perf(), d('batt', '续航'), d('port', '便携'), d('os', '系统')],
  笔记本电脑: [perf(), d('screen', '屏幕'), d('batt', '续航'), d('port', '便携'), d('cool', '散热')],
  台式电脑: [perf(), d('cool', '散热'), d('expand', '扩展性'), d('noise', '噪音控制'), d('build', '做工')],
  显示器: [d('color', '色彩'), d('refresh', '刷新率'), d('res', '分辨率'), d('port', '接口'), d('build', '做工')],
  耳机: [d('sound', '音质'), d('anc', '降噪'), d('batt', '续航'), d('wear', '佩戴'), d('build', '做工')],
  键盘: [d('feel', '手感'), d('sound', '声音'), d('layout', '配列'), d('wireless', '无线'), d('build', '做工')],
  鼠标: [d('sensor', '传感器'), d('weight', '重量'), d('grip', '握持'), d('batt', '续航')],
  相机: [d('iq', '画质'), d('af', '对焦'), d('ibis', '防抖'), d('video', '视频'), d('ctrl', '操控')],
  智能手表: [d('batt', '续航'), d('health', '健康监测'), d('screen', '屏幕'), d('os', '系统'), d('build', '做工')],
  游戏机: [perf(), d('games', '游戏阵容'), d('pad', '手柄体验'), d('port', '便携')],
  显卡: [perf(), d('power', '能效'), d('cool', '散热'), d('noise', '噪音'), d('vram', '显存')],
  CPU: [perf(), d('power', '能效'), d('temp', '温度'), d('plat', '平台寿命')],
  固态硬盘: [d('seq', '顺序速度'), d('cache', '缓外性能'), d('life', '寿命'), d('temp', '温度')],
  内存: [d('freq', '频率'), d('timing', '时序'), d('oc', '超频空间'), d('cap', '容量')],
  路由器: [d('speed', '无线速率'), d('cover', '覆盖'), d('stable', '稳定性'), d('feature', '功能')]
}

/** 未收录品类时的通用维度 */
export const FALLBACK_DIMS: Dim[] = [perf(), d('build', '做工'), d('exp', '体验')]

/* ---------------- 预设（按品类） ---------------- */

const equal = (dims: Dim[]): Record<string, number> =>
  Object.fromEntries(dims.map((x) => [x.key, Math.round(100 / dims.length)]))

function p(key: string, name: string, w: Record<string, number>): Preset {
  return { key, name, w }
}

export const PRESETS_BY_CATEGORY: Record<string, Preset[]> = {
  手机: [
    p('balanced', '均衡', { perf: 25, cam: 20, screen: 15, batt: 20, os: 20 }),
    p('gamer', '游戏党', { perf: 40, cam: 5, screen: 20, batt: 25, os: 10 }),
    p('photo', '摄影党', { perf: 15, cam: 40, screen: 20, batt: 10, os: 15 }),
    p('student', '学生党', { perf: 20, cam: 10, screen: 10, batt: 25, os: 35 })
  ],
  耳机: [
    p('balanced', '均衡', { sound: 30, anc: 25, batt: 15, wear: 20, build: 10 }),
    p('commute', '通勤降噪', { sound: 20, anc: 45, batt: 15, wear: 15, build: 5 }),
    p('audiophile', '音质党', { sound: 50, anc: 15, batt: 10, wear: 15, build: 10 }),
    p('light', '轻佩戴', { sound: 20, anc: 20, batt: 15, wear: 40, build: 5 })
  ],
  笔记本电脑: [
    p('balanced', '均衡', { perf: 25, screen: 20, batt: 20, port: 20, cool: 15 }),
    p('office', '办公党', { perf: 20, screen: 20, batt: 30, port: 20, cool: 10 }),
    p('mobile', '便携党', { perf: 15, screen: 15, batt: 25, port: 40, cool: 5 }),
    p('power', '性能党', { perf: 45, screen: 15, batt: 10, port: 10, cool: 20 })
  ],
  显示器: [
    p('balanced', '均衡', { color: 25, refresh: 25, res: 25, port: 15, build: 10 }),
    p('esports', '电竞', { color: 15, refresh: 45, res: 20, port: 10, build: 10 }),
    p('design', '设计', { color: 45, refresh: 10, res: 25, port: 10, build: 10 })
  ],
  相机: [
    p('balanced', '均衡', { iq: 30, af: 25, ibis: 15, video: 20, ctrl: 10 }),
    p('video', '视频党', { iq: 20, af: 25, ibis: 10, video: 40, ctrl: 5 }),
    p('still', '静态摄影', { iq: 45, af: 20, ibis: 15, video: 10, ctrl: 10 })
  ]
}

/** 没有专门预设的品类：均衡 + 主维度优先 */
export function defaultPresets(dims: Dim[]): Preset[] {
  const balanced = equal(dims)
  const focus: Record<string, number> = {}
  dims.forEach((x, i) => {
    focus[x.key] = i === 0 ? 40 : Math.round(60 / (dims.length - 1))
  })
  return [p('balanced', '均衡', balanced), p('focus', '主维度优先', focus)]
}

/* ---------------- 打分 ---------------- */

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))

/** FNV-1a，稳定哈希：同一产品 + 同一维度永远得到同一个数 */
export function hashSeed(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export interface ScoreInput {
  id: number
  performanceScore?: number | null
  userRating?: number | null
}

/**
 * 单维度得分。
 * @param priceTier 该产品在当前品类内的价格档位（0 = 最便宜，1 = 最贵）
 * @returns 0-100；real 维度缺数据时返回 null（由调用方剔除并按权重重新归一）
 */
export function scoreDim(p: ScoreInput, dim: Dim, priceTier: number): number | null {
  if (dim.mode === 'real') {
    return p.performanceScore == null ? null : clamp(Number(p.performanceScore))
  }
  const rnd = (hashSeed(`${p.id}:${dim.key}`) % 1000) / 1000
  const rating = Number(p.userRating) || 4.3
  // 价格档位越高、口碑越好，模拟分略高；再叠一段稳定随机拉开差异
  const raw = 56 + priceTier * 20 + rnd * 16 + (rating - 4.3) * 8
  return Math.round(clamp(raw, 35, 99))
}
