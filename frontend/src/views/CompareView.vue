<template>
  <div class="page-container">
    <h1 class="section-title">产品对比 <span class="sub">极客横向评测与购买决策</span></h1>

    <!-- 工具栏 -->
    <div v-if="compareStore.products.length > 0" class="toolbar">
      <el-switch v-model="diffOnly" active-text="只看差异" />
      <el-button size="small" @click="$router.push('/products')">更换商品</el-button>
      <el-button size="small" type="danger" plain @click="compareStore.clear()">清空对比</el-button>
      <span class="toolbar-hint">仅支持同一品类的商品对比（{{ categoryName || '未选择' }}）</span>
    </div>

    <el-empty v-if="compareStore.products.length === 0" description="还没有添加对比产品，去产品列表选择吧">
      <el-button type="primary" @click="$router.push('/products')">去挑选产品</el-button>
    </el-empty>

    <template v-else>
      <!-- ===== 1. 对比概览区 ===== -->
      <section class="ov-grid">
        <div v-for="p in compareStore.products" :key="p.id" class="ov-card">
          <div class="ov-img">
            <ProductImage :images="enrichOf(p.id)?.detail?.images ?? p.images" :product-id="p.id" :alt="p.name" />
          </div>
          <div class="ov-name">{{ p.name }}</div>
          <div class="ov-meta">{{ p.brandName || '—' }} · {{ p.categoryName || '—' }}</div>
          <div class="ov-price">
            ¥{{ p.currentPrice }} <span class="data-hint">模拟报价</span>
          </div>
          <div class="ov-badges">
            <el-tag v-if="p.valueScore != null" size="small" :type="valueLevel(p.valueScore).t">
              性价比 {{ p.valueScore }} · {{ valueLevel(p.valueScore).lv }}
            </el-tag>
            <el-tag v-if="p.userRating != null" size="small" type="info">评分 {{ p.userRating }}</el-tag>
          </div>
          <div class="ov-summary">{{ summaryOf(p) }}</div>
          <div class="ov-diff" v-if="priceDiffOf(p) !== null">
            比最低价{{ priceDiffOf(p)! > 0 ? '高 ¥' + priceDiffOf(p)!.toFixed(0) + '（+' + pctOf(p) + '%）' : '（最低价）' }}
          </div>
          <div class="ov-adv">
            <el-tag v-for="a in advantagesOf(p.id)" :key="a" size="small" effect="plain" class="adv-tag">{{ a }}</el-tag>
          </div>
          <div class="ov-attr">
            <template v-if="attrOf(p)">
              <span class="attr-text">{{ attrOf(p)?.author || '未标注作者' }} · {{ attrOf(p)?.license || '未知许可' }}</span>
              <a v-if="attrOf(p)?.sourcePageUrl" :href="attrOf(p)?.sourcePageUrl ?? undefined" target="_blank" rel="noopener noreferrer">来源</a>
              <a v-if="attrOf(p)?.licenseUrl" :href="attrOf(p)?.licenseUrl ?? undefined" target="_blank" rel="noopener noreferrer">许可</a>
            </template>
            <span v-else class="attr-text dim">暂无授权署名信息</span>
          </div>
          <div class="ov-actions">
            <el-button size="small" text type="primary" @click="$router.push('/products/' + p.id)">商品详情</el-button>
            <el-button size="small" text type="danger" @click="compareStore.removeProduct(p.id)">移除</el-button>
          </div>
        </div>
      </section>

      <!-- ===== 2. 核心差异分析 ===== -->
      <section class="block">
        <h2 class="block-title">核心差异分析</h2>
        <div v-if="analysis.bullets.length === 0" class="empty-hint">数据不足，暂无法给出可靠对比结论（该分类暂无共有的关键参数数据）</div>
        <ul v-else class="analysis-list">
          <li v-for="(b, i) in analysis.bullets" :key="i">{{ b }}</li>
        </ul>
        <div v-if="analysis.missing.length" class="missing-note">
          以下参数存在缺失，结论仅供参考：{{ analysis.missing.join('、') }}
        </div>
      </section>

      <!-- ===== 3. 核心规格横向对比 ===== -->
      <section class="block">
        <h2 class="block-title">核心规格对比
          <span class="sub-hint">（{{ categoryName }}参数组 · {{ diffOnly ? '只看差异' : '显示全部' }}）</span>
        </h2>
        <div class="compare-table">
          <table>
            <thead>
              <tr>
                <th class="param-col">参数</th>
                <th v-for="p in compareStore.products" :key="p.id">{{ shortName(p.name) }}</th>
              </tr>
            </thead>
            <tbody v-for="g in visibleGroups" :key="g.name">
              <tr class="group-row" :class="{ 'group-warn': g.trust === 'template' }">
                <td :colspan="compareStore.products.length + 1">
                  {{ g.name }}
                  <span v-if="g.trust === 'template'" class="trust-tag warn">模板数据·未核验，仅供参考</span>
                  <span v-else-if="g.trust === 'reference'" class="trust-tag">参考资料·未联网复核</span>
                  <span v-else-if="g.trust === 'verified'" class="trust-tag ok">已核验</span>
                </td>
              </tr>
              <tr v-for="row in g.rows" :key="row.key" :class="{ 'row-template': g.trust === 'template' }">
                <td class="param-col">
                  {{ row.label }}
                  <a v-if="row.sourceUrl" :href="row.sourceUrl" target="_blank" rel="noopener noreferrer" class="src-link" title="参数来源">来源</a>
                </td>
                <td v-for="p in compareStore.products" :key="p.id"
                    :class="{ best: row.bestIds.includes(p.id), dim: !valueOf(p, row.key) }">
                  {{ valueOf(p, row.key) || '暂无可靠数据' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="legend">
          <span v-if="hasBest">■ 深色 = 该参数方向上的更优值（仅对可量化且方向明确的参数标注）</span>
          <span>· 空值显示「暂无可靠数据」，不以 0 或默认值参与比较</span>
        </div>
        <div class="legend">数据可信度：{{ trustSummary }}</div>
      </section>

      <!-- ===== 4. 价格与性价比分析 ===== -->
      <section class="block">
        <h2 class="block-title">价格与性价比分析 <span class="sim-badge">模拟数据，非实时电商价格</span></h2>
        <div class="score-note">性价比参考评分 = 可信参数丰富度 + 用户评分 + 模拟价格优势 + 热度的加权综合（基于模拟报价），<b>非硬件性能跑分</b>；可信参数不足 3 项的商品不参与评分。</div>
        <div class="compare-table">
          <table>
            <thead>
              <tr>
                <th class="param-col">项目</th>
                <th v-for="p in compareStore.products" :key="p.id">{{ shortName(p.name) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="param-col">当前价格</td>
                <td v-for="p in compareStore.products" :key="p.id" :class="{ best: isLowestPrice(p) }">¥{{ p.currentPrice }}</td>
              </tr>
              <tr>
                <td class="param-col">与最低价差额</td>
                <td v-for="p in compareStore.products" :key="p.id">
                  {{ priceDiffOf(p) === null ? '—' : (priceDiffOf(p)! > 0 ? '+¥' + priceDiffOf(p)!.toFixed(0) + '（+' + pctOf(p) + '%）' : '最低价') }}
                </td>
              </tr>
              <tr>
                <td class="param-col">性价比参考分 <span class="data-hint">(非跑分)</span></td>
                <td v-for="p in compareStore.products" :key="p.id" :class="{ best: isHighestValue(p) }">
                  <template v-if="p.valueScore != null">{{ p.valueScore }}（{{ valueLevel(p.valueScore).lv }}）</template>
                  <span v-else class="dim">数据不足，暂不评分</span>
                </td>
              </tr>
              <tr>
                <td class="param-col">性能分数</td>
                <td v-for="p in compareStore.products" :key="p.id">
                  <template v-if="p.performanceScore != null">{{ p.performanceScore }}</template>
                  <span v-else class="dim">暂无可靠数据</span>
                </td>
              </tr>
              <tr>
                <td class="param-col">用户评分</td>
                <td v-for="p in compareStore.products" :key="p.id">{{ p.userRating ?? '—' }}</td>
              </tr>
              <tr>
                <td class="param-col">参数完整度（可信/全部）</td>
                <td v-for="p in compareStore.products" :key="p.id">{{ trustedSpecCount(p.id) }} / {{ specCount(p.id) }} 项</td>
              </tr>
              <tr>
                <td class="param-col">多平台最低报价</td>
                <td v-for="p in compareStore.products" :key="p.id">
                  <template v-if="enrichOf(p.id)?.quotes">
                    ¥{{ enrichOf(p.id)!.quotes!.lowestPrice ?? '—' }}
                    <span class="data-hint">{{ enrichOf(p.id)!.quotes!.lowestPlatformName || '' }}</span>
                  </template>
                  <span v-else class="dim">加载中…</span>
                </td>
              </tr>
              <tr>
                <td class="param-col">模拟历史最低 / 最高</td>
                <td v-for="p in compareStore.products" :key="p.id">
                  <template v-if="enrichOf(p.id)?.hist">
                    ¥{{ enrichOf(p.id)!.hist!.historyLowest ?? '—' }} / ¥{{ enrichOf(p.id)!.hist!.historyHighest ?? '—' }}
                  </template>
                  <span v-else class="dim">加载中…</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="data-hint block-hint">以上平台报价与历史价格均为系统模拟数据，仅用于功能演示，不代表任何平台的真实成交价。</div>

        <!-- 价格走势 -->
        <div class="chart-box">
          <div class="chart-title">价格走势对比（近 90 天 · 模拟数据）</div>
          <div ref="chartRef" class="chart"></div>
        </div>

        <!-- 多花的钱换来什么 -->
        <div v-if="extraValueItems.length" class="extra-value">
          <div class="ev-title">多花的钱能换来什么</div>
          <ul>
            <li v-for="(e, i) in extraValueItems" :key="i">{{ e }}</li>
          </ul>
        </div>
      </section>

      <!-- ===== 5. 怎么选 ===== -->
      <section class="block">
        <h2 class="block-title">怎么选</h2>
        <div class="pick-grid">
          <div v-for="pick in picks" :key="pick.title" class="pick-card">
            <div class="pick-title">{{ pick.title }}</div>
            <template v-if="pick.product">
              <div class="pick-name">{{ pick.product.name }}</div>
              <div class="pick-reason">{{ pick.reason }}</div>
              <div class="pick-tradeoff">牺牲/不足：{{ pick.tradeoff }}</div>
              <div class="pick-for">适合：{{ pick.forWho }}</div>
              <div class="pick-conf">结论可信度：{{ pick.confidence }}</div>
            </template>
            <div v-else class="pick-none">{{ pick.reason }}</div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, nextTick, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { useCompareStore } from '@/store/compare'
import { productApi, priceApi } from '@/api'
import ProductImage from '@/components/ProductImage.vue'
import { pickProductImage } from '@/utils/image'
import type { Product, ImageAttribution } from '@/types'

const compareStore = useCompareStore()
const diffOnly = ref(false)
const chartRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

// ===== 数据补全：详情（含规格）+ 多平台报价 + 历史价格 =====
interface Enrich { detail?: Product; quotes?: any; hist?: any; loaded?: boolean }
const enrich = reactive<Record<number, Enrich>>({})
const enrichOf = (id: number) => enrich[id]

async function loadAll() {
  for (const p of compareStore.products) {
    if (enrich[p.id]?.loaded) continue
    enrich[p.id] = enrich[p.id] || {}
    try {
      const [detail, quotes, hist] = await Promise.all([
        productApi.detail(p.id),
        priceApi.compare(p.id).catch(() => null),
        priceApi.history(p.id).catch(() => null)
      ])
      enrich[p.id] = { detail, quotes, hist, loaded: true }
    } catch {
      enrich[p.id] = { loaded: true }
    }
  }
  drawChart()
}
watch(() => compareStore.products.map((p) => p.id).join(','), () => { loadAll() }, { immediate: true })

// ===== 署名 =====
const attrOf = (p: Product): ImageAttribution | null => {
  const list = (p as any)?.imagesAttribution
  if (!list || list.length === 0) return null
  const url = pickProductImage((p as any)?.images)
  return list.find((a: ImageAttribution) => a.url === url) ?? null
}

// ===== 参数分组（基于真实 product_specs 键，中英文键并存） =====
type GroupDef = { name: string; keys: string[] }
const SPEC_GROUPS: Record<number, GroupDef[]> = {
  1: [ // 手机（型号级参数：os/chip/screen_size/resolution/refresh/panel/ram/storage/camera_*/battery/wired_charging/weight/release）
    { name: '基本信息', keys: ['os', 'release'] },
    { name: '性能', keys: ['chip', '处理器'] },
    { name: '屏幕', keys: ['screen_size', 'resolution', 'refresh', 'panel', 'screen', '屏幕'] },
    { name: '存储', keys: ['ram', 'storage', '运行内存', '存储'] },
    { name: '影像', keys: ['camera_rear', 'camera_front', '摄像头'] },
    { name: '续航', keys: ['battery', 'wired_charging', '电池'] },
    { name: '机身', keys: ['weight', '重量'] },
    { name: '其他', keys: ['5g'] }
  ],
  2: [ // 平板
    { name: '性能', keys: ['处理器'] }, { name: '屏幕', keys: ['屏幕'] },
    { name: '续航', keys: ['电池'] }, { name: '存储', keys: ['内存', '存储'] }
  ],
  3: [ // 笔记本
    { name: '性能', keys: ['chip', 'CPU', 'GPU'] }, { name: '屏幕', keys: ['screen', '屏幕'] },
    { name: '存储', keys: ['ram', 'storage', 'ssd', '内存', '硬盘'] },
    { name: '续航', keys: ['battery'] }, { name: '机身', keys: ['weight', '重量'] }
  ],
  4: [ // 台式
    { name: '性能', keys: ['CPU', 'GPU'] }, { name: '存储', keys: ['ram', 'ssd', '内存', '硬盘'] },
    { name: '其他', keys: ['form', 'warranty'] }
  ],
  5: [{ name: '屏幕', keys: ['尺寸', '分辨率', '面板', '刷新率'] }], // 显示器
  6: [ // 耳机
    { name: '基础', keys: ['type', '类型'] }, { name: '降噪', keys: ['anc', '降噪'] },
    { name: '连接', keys: ['bt', '蓝牙', '连接'] }, { name: '续航', keys: ['battery', '续航'] },
    { name: '音质', keys: ['driver', '驱动单元'] }, { name: '机身', keys: ['重量'] }
  ],
  7: [ // 键盘
    { name: '结构', keys: ['switch', '轴体', '结构'] }, { name: '配列', keys: ['layout', '配列'] },
    { name: '背光', keys: ['backlight'] }, { name: '连接', keys: ['conn', '连接'] },
    { name: '其他', keys: ['type'] }
  ],
  8: [ // 鼠标
    { name: '传感器', keys: ['sensor', '传感器', 'DPI'] }, { name: '连接', keys: ['conn', '连接'] },
    { name: '机身', keys: ['weight', '重量'] }, { name: '其他', keys: ['type', '按键', '续航'] }
  ],
  9: [ // 相机
    { name: '传感器', keys: ['sensor', '传感器'] },
    { name: '影像', keys: ['像素', '对焦', '连拍', '视频', 'video', 'iso', '防抖'] },
    { name: '卡口', keys: ['mount'] }, { name: '机身', keys: ['重量'] }
  ],
  10: [ // 智能手表
    { name: '屏幕', keys: ['screen', '屏幕'] }, { name: '续航', keys: ['battery', '续航'] },
    { name: '系统', keys: ['os'] }, { name: '定位', keys: ['gps'] },
    { name: '防护', keys: ['water', '防水'] }, { name: '其他', keys: ['功能'] }
  ],
  11: [ // 游戏机
    { name: '基础', keys: ['type', '类型'] }, { name: '存储', keys: ['存储'] },
    { name: '显示', keys: ['分辨率'] }, { name: '其他', keys: ['特性', 'color', 'origin', 'release', 'warranty'] }
  ],
  12: [ // 显卡
    { name: '核心', keys: ['架构', '核心', '核心频率'] }, { name: '显存', keys: ['显存', '显存位宽'] },
    { name: '功耗', keys: ['功耗'] }, { name: '接口', keys: ['接口'] }
  ],
  13: [ // CPU
    { name: '核心', keys: ['cores', '核心'] }, { name: '频率', keys: ['frequency', '频率', 'base'] },
    { name: '架构', keys: ['arch', '制程'] }, { name: '缓存', keys: ['缓存'] },
    { name: '功耗', keys: ['tdp'] }, { name: '插槽', keys: ['socket'] }
  ],
  14: [ // 固态硬盘
    { name: '容量', keys: ['capacity', '容量'] }, { name: '接口', keys: ['interface', '接口'] },
    { name: '性能', keys: ['seq_read', '读取'] }, { name: '耐久', keys: ['tbw'] },
    { name: '其他', keys: ['form', '颗粒'] }
  ],
  15: [ // 内存
    { name: '容量', keys: ['容量'] }, { name: '频率', keys: ['频率'] },
    { name: '时序', keys: ['时序'] }, { name: '类型', keys: ['类型'] }
  ],
  16: [ // 路由器
    { name: '无线', keys: ['wifi', '协议', '速率', 'rate', '频段', 'band'] },
    { name: '接口', keys: ['接口', '端口', 'port'] }, { name: '天线', keys: ['天线'] },
    { name: '覆盖', keys: ['覆盖'] }, { name: '其他', keys: ['cpu', '特性'] }
  ]
}
const KEY_LABEL: Record<string, string> = {
  screen: '屏幕', cpu: '处理器', CPU: '处理器', GPU: '显卡', ram: '运行内存', ssd: '硬盘',
  battery: '电池容量', chip: '处理器', os: '操作系统', anc: '主动降噪', bt: '蓝牙版本',
  driver: '驱动单元', type: '类型', conn: '连接方式', switch: '轴体', layout: '配列',
  backlight: '背光', sensor: '传感器', DPI: 'DPI', weight: '重量', mount: '卡口',
  video: '视频规格', iso: 'ISO范围', gps: '定位', water: '防水等级', wifi: 'Wi-Fi标准',
  band: '频段', rate: '无线速率', port: '网口', capacity: '容量', interface: '接口',
  seq_read: '顺序读取', tbw: '写入总量', form: '形态', arch: '架构', cores: '核心/线程',
  base: '基础频率', tdp: 'TDP', socket: '插槽', 电池: '电池容量', 屏幕: '屏幕', 处理器: '处理器',
  摄像头: '摄像头', 内存: '内存', 存储: '存储', '5g': '5G网络', 重量: '重量', 分辨率: '分辨率',
  刷新率: '刷新率', 面板: '面板类型', 尺寸: '尺寸', 降噪: '降噪', 蓝牙: '蓝牙版本',
  连接: '连接方式', 续航: '续航', 驱动单元: '驱动单元', 轴体: '轴体', 配列: '配列',
  结构: '结构', 传感器: '传感器', 按键: '按键', 像素: '像素', 对焦: '对焦', 连拍: '连拍',
  视频: '视频规格', 防抖: '防抖', 功能: '功能', 特性: '特性', 显存: '显存容量',
  显存位宽: '显存位宽', 核心频率: '核心频率', 功耗: '功耗', 接口: '接口', 制程: '制程工艺',
  缓存: '缓存', 频率: '频率', 读取: '顺序读取', 颗粒: '颗粒', 时序: '时序', 类型: '类型',
  协议: '协议', 天线: '天线', 端口: '端口', 覆盖: '覆盖范围', 速率: '速率', warranty: '质保',
  release: '上市时间', color: '颜色', origin: '产地'
}
// 可量化且方向明确的参数：1=越大越好，-1=越小越好；其余视为「因用途而异」不做高亮
const DIR: Record<string, number> = {
  battery: 1, 电池: 1, 刷新率: 1, refresh: 1, seq_read: 1, 读取: 1, 频率: 1, cores: 1, 核心: 1,
  核心频率: 1, DPI: 1, tbw: 1, ram: 1, storage: 1, weight: -1, 重量: -1, tdp: -1, 时序: -1
}

const categoryId = computed(() => compareStore.products[0]?.categoryId ?? null)
const categoryName = computed(() => compareStore.products[0]?.categoryName ?? '')
const shortName = (n: string) => (n && n.length > 10 ? n.slice(0, 10) + '…' : n)

/** 规格键 → 规格对象（含核验状态与来源） */
function detailOf(id: number): Product | undefined { return enrich[id]?.detail }
function specOf(p: Product, key: string): any {
  const specs = detailOf(p.id)?.specs ?? (p as any).specs ?? []
  return specs.find((x: any) => x.specKey === key)
}
function valueOf(p: Product, key: string): string {
  const s = specOf(p, key)
  return s ? String(s.specValue ?? '') : ''
}
/** 行信任级别：verified > reference > template（按该键各商品状态取最高） */
function trustOfKey(key: string): 'verified' | 'reference' | 'template' {
  let t: 'verified' | 'reference' | 'template' | null = null
  for (const p of compareStore.products) {
    const s = specOf(p, key)
    if (!s) continue
    const vs = s.verifyStatus ?? 'template'
    if (vs === 'verified') return 'verified'
    if (vs === 'reference') t = t === 'template' || t === null ? 'reference' : t
    else if (!t) t = 'template'
  }
  return t ?? 'template'
}
function sourceUrlOfKey(key: string): string | null {
  for (const p of compareStore.products) {
    const s = specOf(p, key)
    if (s?.sourceUrl) return s.sourceUrl
  }
  return null
}
function labelOf(key: string): string {
  for (const p of compareStore.products) {
    const s = specOf(p, key)
    if (s?.specLabel) return s.specLabel
  }
  return KEY_LABEL[key] ?? key
}

/** 分组后的行：可信参数（verified/reference）进品类组；模板参数统一归入「未核验参数」组 */
interface Row { key: string; label: string; values: Record<number, string>; bestIds: number[]; sourceUrl: string | null }
interface Group { name: string; rows: Row[]; trust: 'verified' | 'reference' | 'template' }
const groups = computed<Group[]>(() => {
  if (categoryId.value == null) return []
  const defs = SPEC_GROUPS[categoryId.value] ?? []
  const out: Group[] = []
  const templateRows: Row[] = []
  for (const g of defs) {
    let groupTrust: 'verified' | 'reference' = 'reference'
    const rows: Row[] = []
    for (const key of g.keys) {
      const values: Record<number, string> = {}
      let any = false
      for (const p of compareStore.products) {
        const v = valueOf(p, key)
        values[p.id] = v
        if (v) any = true
      }
      if (!any) continue // 全员缺失的键不展示
      const trust = trustOfKey(key)
      const row: Row = { key, label: labelOf(key), values, bestIds: [], sourceUrl: sourceUrlOfKey(key) }
      if (trust === 'template') { templateRows.push(row); continue }
      if (trust === 'verified') groupTrust = 'verified'
      if (diffOnly.value) {
        const vals = Object.values(values)
        if (vals.every((v) => v === vals[0])) continue // 完全一致 → 跳过
      }
      // 更优值高亮（仅方向明确的可量化参数）
      const dir = DIR[key]
      if (dir) {
        const nums: { id: number; n: number }[] = []
        for (const p of compareStore.products) {
          const m = values[p.id].match(/(\d+(?:\.\d+)?)/)
          if (m) nums.push({ id: p.id, n: parseFloat(m[1]) })
        }
        if (nums.length >= 2 && nums.length === compareStore.products.length) {
          const sorted = [...nums].sort((a, b) => b.n - a.n)
          const best = dir === 1 ? sorted[0] : sorted[sorted.length - 1]
          const worst = dir === 1 ? sorted[sorted.length - 1] : sorted[0]
          if (best.n !== worst.n) row.bestIds.push(best.id)
        }
      }
      rows.push(row)
    }
    if (rows.length) out.push({ name: g.name, rows, trust: groupTrust })
  }
  if (templateRows.length) {
    const rows = diffOnly.value
      ? templateRows.filter((r) => !Object.values(r.values).every((v) => v === Object.values(r.values)[0]))
      : templateRows
    if (rows.length) out.push({ name: '未核验参数（模板数据，非官方规格）', rows, trust: 'template' })
  }
  return out
})
const visibleGroups = computed(() => groups.value)
const hasBest = computed(() => groups.value.some((g) => g.rows.some((r) => r.bestIds.length)))

/** 数据可信度汇总 */
const trustSummary = computed(() => {
  let verified = 0, reference = 0, template = 0
  for (const p of compareStore.products) {
    for (const s of (detailOf(p.id)?.specs ?? [])) {
      const vs = (s as any).verifyStatus ?? 'template'
      if (vs === 'verified') verified++
      else if (vs === 'reference') reference++
      else template++
    }
  }
  const parts: string[] = []
  if (verified) parts.push(`已核验 ${verified} 项`)
  if (reference) parts.push(`参考资料 ${reference} 项（未联网复核）`)
  if (template) parts.push(`模板数据 ${template} 项（非官方规格）`)
  return parts.length ? parts.join(' · ') : '暂无参数数据'
})

// ===== 价格 =====
const minPrice = computed(() => Math.min(...compareStore.products.map((p) => Number(p.currentPrice ?? 0))))
function priceDiffOf(p: Product): number | null {
  const v = Number(p.currentPrice ?? 0)
  if (!v) return null
  return +(v - minPrice.value).toFixed(2)
}
function pctOf(p: Product): string {
  const d = priceDiffOf(p) ?? 0
  if (!minPrice.value) return '0'
  return ((d / minPrice.value) * 100).toFixed(1)
}
const isLowestPrice = (p: Product) => Number(p.currentPrice ?? 0) === minPrice.value
const maxVal = computed(() => Math.max(...compareStore.products.map((p) => p.valueScore ?? 0)))
const isHighestValue = (p: Product) => (p.valueScore ?? 0) === maxVal.value
function valueLevel(v: number) {
  if (v >= 90) return { lv: 'S', t: 'danger' as const }
  if (v >= 80) return { lv: 'A', t: 'warning' as const }
  if (v >= 70) return { lv: 'B', t: '' as const }
  if (v >= 60) return { lv: 'C', t: 'info' as const }
  return { lv: 'D', t: 'info' as const }
}
function specCount(id: number): number { return detailOf(id)?.specs?.length ?? 0 }
/** 可信参数（verified/reference）条数 */
function trustedSpecCount(id: number): number {
  return (detailOf(id)?.specs ?? []).filter((s: any) => s.verifyStatus === 'verified' || s.verifyStatus === 'reference').length
}

// ===== 概览摘要与优势标签 =====
function summaryOf(p: Product): string {
  const specs = detailOf(p.id)?.specs ?? []
  if (!specs.length) return '参数加载中…'
  return specs.slice(0, 3).map((s: any) => `${s.specLabel}: ${s.specValue}`).join(' · ')
}
function advantagesOf(id: number): string[] {
  const out: string[] = []
  const p = compareStore.products.find((x) => x.id === id)
  if (!p) return out
  if (isLowestPrice(p) && compareStore.products.length > 1) out.push('价格最低')
  if (isHighestValue(p) && compareStore.products.length > 1) out.push('性价比最高')
  // 来自方向明确参数的优势
  for (const g of groups.value) {
    for (const r of g.rows) {
      if (r.bestIds.includes(id) && DIR[r.key] === 1) { out.push(r.label + '更强'); }
      if (r.bestIds.includes(id) && DIR[r.key] === -1) { out.push(r.label + '更轻/低'); }
    }
  }
  return [...new Set(out)].slice(0, 3)
}

// ===== 核心差异分析 =====
const analysis = computed(() => {
  const bullets: string[] = []
  const missing: string[] = []
  if (compareStore.products.length < 2) return { bullets, missing }
  // 用第一组有数据的键做关键差异
  const keyRows: Row[] = []
  for (const g of groups.value) { for (const r of g.rows) { keyRows.push(r); if (keyRows.length >= 6) break } if (keyRows.length >= 6) break }
  for (const r of keyRows) {
    const present = compareStore.products.filter((p) => r.values[p.id])
    if (present.length < compareStore.products.length) missing.push(r.label)
    if (present.length >= 2) {
      const set = new Set(present.map((p) => r.values[p.id]))
      if (set.size > 1) {
        bullets.push('【' + r.label + '】' + present.map((p) => `${shortName(p.name)}：${r.values[p.id]}`).join('；'))
      }
    }
  }
  // 价格差异
  const priced = compareStore.products.filter((p) => Number(p.currentPrice) > 0)
  if (priced.length >= 2) {
    const hi = priced.reduce((a, b) => (Number(a.currentPrice) > Number(b.currentPrice) ? a : b))
    const lo = priced.reduce((a, b) => (Number(a.currentPrice) < Number(b.currentPrice) ? a : b))
    bullets.push(`【价格】${shortName(hi.name)} 比 ${shortName(lo.name)} 贵 ¥${(Number(hi.currentPrice) - Number(lo.currentPrice)).toFixed(0)}（+${pctOf(hi)}%）`)
  }
  return { bullets, missing: [...new Set(missing)] }
})

// ===== 多花的钱换来什么 =====
const extraValueItems = computed(() => {
  const items: string[] = []
  const priced = compareStore.products.filter((p) => Number(p.currentPrice) > 0)
  if (priced.length < 2) return items
  const lo = priced.reduce((a, b) => (Number(a.currentPrice) < Number(b.currentPrice) ? a : b))
  for (const p of priced) {
    if (p.id === lo.id) continue
    const gain: string[] = []
    for (const g of groups.value) {
      for (const r of g.rows) {
        const mine = r.values[p.id], base = r.values[lo.id]
        if (mine && (!base || (DIR[r.key] && (() => {
          const mn = mine.match(/(\d+(?:\.\d+)?)/), bn = (base || '').match(/(\d+(?:\.\d+)?)/)
          if (!mn || !bn) return false
          return DIR[r.key] === 1 ? parseFloat(mn[1]) > parseFloat(bn[1]) : parseFloat(mn[1]) < parseFloat(bn[1])
        })()))) {
          gain.push(`${r.label}（${base ? mine : mine + ' vs 无数据'}）`)
        }
      }
    }
    const vsDiff = (p.valueScore ?? 0) - (lo.valueScore ?? 0)
    items.push(`${shortName(p.name)} 贵 ¥${(Number(p.currentPrice) - Number(lo.currentPrice)).toFixed(0)}：` +
      (gain.length ? `换来 ${gain.slice(0, 3).join('、')}` : '配置数据未体现明显优势（参数缺失或相同）') +
      `；性价比分${vsDiff > 0 ? '高 ' + vsDiff + ' 分' : vsDiff < 0 ? '低 ' + Math.abs(vsDiff) + ' 分' : '持平'}`)
  }
  return items
})

// ===== 怎么选 =====
const CAT_FOR: Record<number, string> = {
  1: '日常使用与拍照需求用户', 2: '影音娱乐与轻办公用户', 3: '移动办公与学习用户',
  4: '家用办公与网课用户', 5: '办公设计与电竞用户', 6: '通勤与音乐爱好者',
  7: '办公与游戏输入用户', 8: '办公与游戏用户', 9: '摄影爱好者与创作者',
  10: '运动健康与智能生活用户', 11: '主机游戏玩家', 12: '游戏玩家与创作者',
  13: '装机与升级用户', 14: '装机与存储升级用户', 15: '装机与内存升级用户',
  16: '家庭与办公网络用户'
}
interface Pick { title: string; product?: Product; reason: string; tradeoff: string; forWho: string; confidence: string }
const picks = computed<Pick[]>(() => {
  const ps = compareStore.products
  const cat = categoryId.value ?? 0
  const forWho = CAT_FOR[cat] ?? '该品类用户'
  const hasSpecs = ps.every((p) => specCount(p.id) > 0)
  const out: Pick[] = []
  if (ps.length < 2) return out
  const low = ps.reduce((a, b) => (Number(a.currentPrice) < Number(b.currentPrice) ? a : b))
  const highVal = ps.reduce((a, b) => ((a.valueScore ?? 0) >= (b.valueScore ?? 0) ? a : b))
  const highPerf = ps.reduce((a, b) => ((a.performanceScore ?? 0) >= (b.performanceScore ?? 0) ? a : b))
  const valTie = new Set(ps.map((p) => p.valueScore)).size === 1
  const perfTie = new Set(ps.map((p) => p.performanceScore)).size === 1
  const conf = (ok: boolean) => (hasSpecs && !ok ? '数据不足，暂无法给出可靠排名' : hasSpecs ? '中（基于现有模拟评分与参数，无实测跑分）' : '低（参数缺失较多）')

  out.push({
    title: '性价比优先', product: valTie ? undefined : highVal,
    reason: valTie ? '当前数据不足，暂无法给出可靠排名（各商品性价比分数相同）'
      : `性价比分数 ${highVal.valueScore}（${valueLevel(highVal.valueScore!).lv} 级）为组内最高，当前价格 ¥${highVal.currentPrice}`,
    tradeoff: (highVal.performanceScore ?? 0) < (highPerf.performanceScore ?? 0)
      ? `性能分数 ${highVal.performanceScore}，低于 ${shortName(highPerf.name)} 的 ${highPerf.performanceScore}` : '性能分数不落后',
    forWho: forWho, confidence: conf(valTie)
  })
  out.push({
    title: '性能优先', product: perfTie ? undefined : highPerf,
    reason: perfTie ? '当前数据不足，暂无法给出可靠排名（各商品性能分数相同）'
      : `性能分数 ${highPerf.performanceScore} 为组内最高（系统模拟评分）`,
    tradeoff: `当前价格 ¥${highPerf.currentPrice}${isLowestPrice(highPerf) ? '已是最低' : '，高于最低价 ¥' + priceDiffOf(highPerf)!.toFixed(0)}`,
    forWho: forWho, confidence: conf(perfTie)
  })
  out.push({
    title: '预算优先', product: low,
    reason: `当前价格 ¥${low.currentPrice} 为组内最低（模拟报价）`,
    tradeoff: (low.valueScore ?? 0) < maxVal.value ? `性价比分数 ${low.valueScore} 低于组内最高` : '核心配置数据缺失较多' ,
    forWho: '预算敏感、够用就好的用户', confidence: conf(false)
  })
  // 综合：性价比 50% + 性能 30% + 参数完整度 20%
  const norm = (arr: number[]) => { const mn = Math.min(...arr), mx = Math.max(...arr); return (v: number) => (mx === mn ? 0.5 : (v - mn) / (mx - mn)) }
  const nv = norm(ps.map((p) => p.valueScore ?? 0)); const np = norm(ps.map((p) => p.performanceScore ?? 0))
  const ns = norm(ps.map((p) => specCount(p.id)))
  const best = [...ps].sort((a, b) =>
    (nv(b.valueScore ?? 0) * 0.5 + np(b.performanceScore ?? 0) * 0.3 + ns(specCount(b.id)) * 0.2) -
    (nv(a.valueScore ?? 0) * 0.5 + np(a.performanceScore ?? 0) * 0.3 + ns(specCount(a.id)) * 0.2))[0]
  out.push({
    title: '综合推荐', product: best,
    reason: `综合得分靠前：性价比 ${best.valueScore ?? '—'} / 性能 ${best.performanceScore ?? '—'} / 参数 ${specCount(best.id)} 项（加权：性价比50%+性能30%+完整度20%）`,
    tradeoff: `当前价格 ¥${best.currentPrice}${isLowestPrice(best) ? '（最低）' : '（非最低价）'}`,
    forWho: forWho, confidence: conf(false)
  })
  return out
})

// ===== 价格走势图 =====
async function drawChart() {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)
  const series = compareStore.products.map((p) => {
    const hist = enrich[p.id]?.hist
    const pts = (hist?.history ?? []).map((h: any) => [h.recordDate, h.price])
    return { name: shortName(p.name), type: 'line' as const, smooth: true, showSymbol: false, data: pts }
  })
  chart.setOption({
    tooltip: { trigger: 'axis', valueFormatter: (v: any) => '¥' + v },
    legend: { data: series.map((s) => s.name) },
    grid: { left: 60, right: 20, top: 40, bottom: 40 },
    xAxis: { type: 'category', boundaryGap: false },
    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
    series
  }, true)
}
watch(() => compareStore.products.map((p) => enrich[p.id]?.loaded).join(','), () => nextTick(drawChart))
onMounted(() => { window.addEventListener('resize', onResize) })
onBeforeUnmount(() => { window.removeEventListener('resize', onResize); chart?.dispose() })
function onResize() { chart?.resize() }
</script>

<style scoped>
.sub { font-size: 13px; color: #9ca3af; font-weight: normal; margin-left: 8px; }
.toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.toolbar-hint { color: #9ca3af; font-size: 12px; }
.block { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; margin-bottom: 16px; }
.block-title { font-size: 16px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.sub-hint { font-size: 12px; color: #9ca3af; font-weight: normal; }
.sim-badge { font-size: 11px; color: #b45309; background: #fef3c7; border: 1px solid #fde68a; padding: 2px 8px; border-radius: 999px; font-weight: normal; }
.score-note { font-size: 12px; color: #6b7280; background: #f9fafb; border: 1px dashed #e5e7eb; border-radius: 8px; padding: 8px 12px; margin-bottom: 12px; line-height: 1.7; }
.score-note b { color: #b45309; }
.data-hint { color: #9ca3af; font-size: 11px; }
.block-hint { margin-top: 8px; }
.dim { color: #cbd5e1; }

/* 概览 */
.ov-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 12px; margin-bottom: 16px; }
.ov-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 6px; }
.ov-img { height: 140px; display: flex; align-items: center; justify-content: center; }
.ov-name { font-weight: 700; font-size: 14px; line-height: 1.35; }
.ov-meta { color: #6b7280; font-size: 12px; }
.ov-price { color: #f97316; font-weight: 800; font-size: 18px; }
.ov-badges { display: flex; gap: 6px; flex-wrap: wrap; }
.ov-summary { color: #6b7280; font-size: 12px; line-height: 1.5; min-height: 36px; }
.ov-diff { font-size: 12px; color: #b45309; }
.ov-adv { display: flex; gap: 4px; flex-wrap: wrap; min-height: 24px; }
.adv-tag { font-size: 11px; }
.ov-attr { font-size: 11px; color: #9ca3af; display: flex; gap: 6px; flex-wrap: wrap; }
.ov-attr a { color: #3b82f6; text-decoration: none; }
.ov-actions { display: flex; justify-content: space-between; margin-top: auto; }

/* 分析 */
.analysis-list { margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.9; }
.missing-note { margin-top: 8px; font-size: 12px; color: #b45309; }
.empty-hint { color: #9ca3af; font-size: 13px; }

/* 对比表 */
.compare-table { overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 10px; }
.compare-table table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 560px; }
.compare-table th, .compare-table td { padding: 10px 12px; text-align: center; border-bottom: 1px solid #f1f5f9; min-width: 130px; }
.compare-table th { background: #f8fafc; font-weight: 600; }
.param-col { text-align: left !important; color: #6b7280; min-width: 120px; background: #fafbfc; }
.group-row td { background: #eef2ff; font-weight: 700; font-size: 13px; color: #374151; text-align: left; }
.group-warn td { background: #fef3c7; }
.trust-tag { font-size: 10px; font-weight: normal; padding: 1px 6px; border-radius: 999px; margin-left: 8px; background: #e0e7ff; color: #4338ca; }
.trust-tag.warn { background: #fee2e2; color: #b91c1c; }
.trust-tag.ok { background: #d1fae5; color: #065f46; }
.src-link { font-size: 10px; color: #3b82f6; margin-left: 6px; text-decoration: none; }
.row-template td { color: #9ca3af; }
.best { font-weight: 700; color: #059669; }
.legend { margin-top: 8px; font-size: 11px; color: #9ca3af; }

/* 图表 */
.chart-box { margin-top: 16px; }
.chart-title { font-size: 13px; color: #374151; font-weight: 600; margin-bottom: 6px; }
.chart { height: 260px; width: 100%; }

/* 多花的钱 */
.extra-value { margin-top: 14px; }
.ev-title { font-weight: 700; font-size: 14px; margin-bottom: 6px; }
.extra-value ul { margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.9; }

/* 怎么选 */
.pick-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; }
.pick-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; font-size: 13px; line-height: 1.7; }
.pick-title { font-weight: 700; color: #2563eb; margin-bottom: 6px; }
.pick-name { font-weight: 700; font-size: 15px; margin-bottom: 4px; }
.pick-reason { color: #374151; }
.pick-tradeoff { color: #b45309; }
.pick-for { color: #6b7280; }
.pick-conf { color: #9ca3af; font-size: 12px; margin-top: 4px; }
.pick-none { color: #9ca3af; }

@media (max-width: 720px) {
  .ov-grid { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
  .compare-table table { min-width: 480px; }
}
</style>
