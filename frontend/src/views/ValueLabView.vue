<template>
  <div class="lab">
    <!-- ===== 顶部条 ===== -->
    <section class="gp-hero">
      <div class="gp-hero__inner lab-hero">
        <div>
          <div class="gp-eyebrow">Value Lab · 个性化权重</div>
          <h1>同一批产品，<br>换个权重就是另一份榜单</h1>
          <p class="gp-lede">
            性价比从来不是一个固定排名。拖动滑块改变你看重的维度，看「综合得分」与「性价比指数」
            两块榜单各自怎么动——这正是后端五维加权算法的可解释之处。
          </p>
        </div>
        <div class="lab-hero__meta">
          <div class="lab-meta-item">
            <span class="k">样本</span>
            <b class="gp-num">{{ products.length }} 款</b>
          </div>
          <div class="lab-meta-item">
            <span class="k">维度</span>
            <b>{{ currentDims.length }} 维试算</b>
          </div>
          <div class="lab-meta-item">
            <span class="k">权重和</span>
            <b class="gp-num">{{ weightSum }}%</b>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 筛选 ===== -->
    <section class="page-container lab-filter">
      <div class="gp-chips">
        <button class="gp-chip" :class="{ 'is-on': categoryId === 0 }" @click="pickCategory(0)">全部</button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="gp-chip"
          :class="{ 'is-on': categoryId === cat.id }"
          @click="pickCategory(cat.id)"
        >
          {{ cat.name }}
        </button>
      </div>
      <span class="lab-hint" v-if="!loading">{{ products.length }} 款在售产品参与试算</span>
      <span class="lab-warn" v-if="categoryId === 0">
        跨品类对比仅供参考：不同品类的价格区间差异会让「每千元得分」失真，建议选单一品类。
      </span>
    </section>

    <!-- ===== 主体 ===== -->
    <section class="page-container lab-body">
      <!-- 左：权重 -->
      <div class="gp-panel weights">
        <h3>权重配置</h3>
        <p class="sub">总和不要求为 100，系统自动归一化</p>

        <div class="slider" v-for="d in currentDims" :key="d.key">
          <div class="row">
            <span>{{ d.name }}<em v-if="d.hint">{{ d.hint }}</em></span>
            <b class="gp-num">{{ weights[d.key] }}%</b>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            step="1"
            :value="weights[d.key]"
            :aria-label="d.name + '权重'"
            @input="onSlide(d.key, $event)"
          />
        </div>

        <div class="presets">
          <button
            v-for="p in currentPresets"
            :key="p.key"
            class="preset"
            :class="{ 'is-on': activePreset === p.key }"
            @click="applyPreset(p.key)"
          >
            {{ p.name }}
          </button>
        </div>

        <div class="caliber">
          <b>口径说明 · {{ currentCategoryName || '通用' }}</b>
          <ul>
            <li>维度按品类定义（当前品类 <b>{{ currentDims.length }}</b> 个）：手机看影像/屏幕/续航，耳机看音质/降噪/佩戴，显卡看散热/能效……</li>
            <li>「性能」取后端 <code>performanceScore</code>（真实字段）；该类目缺该字段时自动剔除并重新归一。</li>
            <li>其余维度后端没有对应字段，按「价格档位 + 用户评分 + 稳定随机」生成相对分，<b>仅用于演示加权逻辑</b>，不代表真实评测结论。</li>
            <li>同一产品同一维度的模拟分固定不变（用 productId + 维度 key 作哈希种子），刷新不会乱跳。</li>
          </ul>
        </div>
      </div>

      <!-- 右：榜单 -->
      <div class="board">
        <div class="board-head">
          <span class="board-lab">排序依据</span>
          <div class="seg">
            <button class="seg-btn" :class="{ 'is-on': sortBy === 'score' }" @click="sortBy = 'score'">综合得分</button>
            <button class="seg-btn" :class="{ 'is-on': sortBy === 'value' }" @click="sortBy = 'value'">每千元得分</button>
          </div>
          <span class="board-hint" v-if="rows.length">
            {{ sortBy === 'score' ? '综合第一' : '每千元第一' }}：{{ rows[0].p.name }}
          </span>
        </div>

        <el-skeleton v-if="loading" :rows="6" animated />

        <el-empty v-else-if="rows.length === 0" description="没有可试算的产品（或后端未启动）">
          <el-button size="small" @click="loadProducts">重新加载</el-button>
        </el-empty>

        <div v-else class="rank">
          <div
            v-for="(r, i) in rows"
            :key="r.p.id"
            class="rrow"
            :class="{ top: i === 0 }"
            @click="$router.push(`/products/${r.p.id}`)"
          >
            <div class="rrow-head">
              <span class="rank-n">{{ i + 1 }}</span>
              <span class="name">{{ r.p.name }}</span>
              <span class="price gp-num">¥{{ r.p.currentPrice }}</span>
            </div>
            <div class="rrow-nums">
              <span>综合 <b class="gp-num">{{ r.score.toFixed(1) }}</b></span>
              <span>每千元 <b class="gp-num">{{ r.value.toFixed(1) }}</b> 分</span>
              <span class="official">正式分 {{ r.p.valueScore ?? '—' }}</span>
              <div class="mbar">
                <i :style="{ width: (sortBy === 'score' ? r.score / maxScore : r.value / maxValue) * 100 + '%' }"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="insight" v-if="rows.length >= 2">
          <b>当前权重下：</b>
          综合得分第一是 <b>{{ byScore[0].p.name }}</b>（{{ byScore[0].score.toFixed(1) }} 分），
          每千元得分第一是 <b>{{ byValue[0].p.name }}</b>（¥{{ byValue[0].p.currentPrice }}，每千元 {{ byValue[0].value.toFixed(1) }} 分）。
          <template v-if="byScore[0].p.id !== byValue[0].p.id">
            两者不一致：<b>{{ byScore[0].p.name }}</b> 更强但更贵，价格作为分母把它拉了下来。
          </template>
          <template v-else>当前权重下两者重合，说明「更强」与「更值」暂时同向。</template>
          <br />
          <span class="insight-sub">
            提示：切换上方预设，观察哪一款的排名变化最大——这就是「权重决定结论」的直接证据。
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { categoryApi, productApi } from '@/api'
import {
  DIMENSION_SETS,
  FALLBACK_DIMS,
  PRESETS_BY_CATEGORY,
  defaultPresets,
  scoreDim,
  type Dim,
  type Preset
} from '@/utils/valueDimensions'
import type { Category, Product } from '@/types'

/* ---------------- 状态 ---------------- */
const route = useRoute()
const router = useRouter()
const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)
const categoryId = ref(0)

/** 权重：key 为维度 key，值 0-40，由当前品类的维度集合决定 */
const weights = ref<Record<string, number>>({})
const activePreset = ref<string>('')
const sortBy = ref<'score' | 'value'>('score')

/* ---------------- 按品类切换维度 ---------------- */
const currentCategoryName = computed(
  () => categories.value.find((c) => c.id === categoryId.value)?.name ?? ''
)

/** 当前品类的维度集合；未收录品类走通用维度 */
const currentDims = computed<Dim[]>(() => DIMENSION_SETS[currentCategoryName.value] ?? FALLBACK_DIMS)

/** 当前品类的预设；没有专门定义时用「均衡 + 主维度优先」 */
const currentPresets = computed<Preset[]>(
  () => PRESETS_BY_CATEGORY[currentCategoryName.value] ?? defaultPresets(currentDims.value)
)

const weightSum = computed(() =>
  currentDims.value.reduce((sum, d) => sum + (weights.value[d.key] || 0), 0)
)

/** 切品类后把权重重置为该品类第一个预设 */
function resetWeights() {
  const first = currentPresets.value[0]
  weights.value = { ...(first?.w ?? {}) }
  activePreset.value = first?.key ?? ''
}

// 品类变化 / 品类表加载完成时都要重置（首次渲染时 categories 还没到）
watch([categoryId, () => categories.value.length], () => resetWeights(), { immediate: true })

/* ---------------- 工具 ---------------- */
/** 价格档位：当前品类内 0（最便宜）→ 1（最贵），用于生成模拟维度的基础分 */
const priceTiers = computed<Record<number, number>>(() => {
  const prices = products.value.map((p) => Number(p.currentPrice) || 0).filter((v) => v > 0)
  const map: Record<number, number> = {}
  if (!prices.length) return map
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  for (const p of products.value) {
    const v = Number(p.currentPrice) || 0
    map[p.id] = max === min ? 0.5 : (v - min) / (max - min)
  }
  return map
})

/** 按当前品类的维度集合打分；real 维度缺数据返回 null */
function dimsOf(p: Product): Record<string, number | null> {
  const tier = priceTiers.value[p.id] ?? 0.5
  const out: Record<string, number | null> = {}
  for (const dim of currentDims.value) {
    out[dim.key] = scoreDim(p, dim, tier)
  }
  return out
}

function computeRow(p: Product) {
  const dims = dimsOf(p)

  // 只在「有数据的维度」上归一化，缺失维度剔除而不是按 0 计
  let weighted = 0
  let usedWeight = 0
  let used = 0

  currentDims.value.forEach((d) => {
    const v = dims[d.key]
    if (v == null) return
    const w = weights.value[d.key] || 0
    weighted += w * v
    usedWeight += w
    used++
  })

  const score = usedWeight > 0 ? weighted / usedWeight : 0
  const priceThousand = Number(p.currentPrice) > 0 ? Number(p.currentPrice) / 1000 : 0
  const value = priceThousand > 0 ? score / priceThousand : 0

  return { p, dims, score, value, used }
}

/* ---------------- 计算 ---------------- */
const allRows = computed(() => products.value.map(computeRow))

const byScore = computed(() => [...allRows.value].sort((a, b) => b.score - a.score))
const byValue = computed(() => [...allRows.value].sort((a, b) => b.value - a.value))

const rows = computed(() => (sortBy.value === 'score' ? byScore.value : byValue.value))

const maxScore = computed(() => Math.max(1, ...allRows.value.map((r) => r.score)))
const maxValue = computed(() => Math.max(1, ...allRows.value.map((r) => r.value)))

/* ---------------- 交互 ---------------- */
function onSlide(key: string, e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  weights.value = { ...weights.value, [key]: val }
  activePreset.value = ''
}

function applyPreset(key: string) {
  const preset = currentPresets.value.find((p) => p.key === key)
  if (!preset) return
  weights.value = { ...preset.w }
  activePreset.value = key
}

function pickCategory(id: number) {
  if (categoryId.value === id) return
  categoryId.value = id
  // 同步到 URL，便于分享/刷新后停在同一个品类
  router.replace({ query: { ...route.query, categoryId: String(id) } })
  loadProducts()
}

/* ---------------- 数据 ---------------- */
async function loadProducts() {
  loading.value = true
  try {
    // 后端单页最多 50 条；取满以便整类参与试算（手机类已有 24 款）
    const params: Record<string, unknown> = { page: 1, pageSize: 50, sort: 'valueScore' }
    if (categoryId.value) params.categoryId = categoryId.value
    const res = await productApi.list(params)
    products.value = res.records ?? []
  } catch {
    products.value = []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    categories.value = await categoryApi.list()
  } catch {
    categories.value = []
  }
  // 支持 ?categoryId=6 直接进来；否则落到第一个品类（跨品类比价没有意义）
  const fromUrl = Number(route.query.categoryId)
  const valid = categories.value.some((c) => c.id === fromUrl)
  if (valid) {
    categoryId.value = fromUrl
  } else if (categories.value.length > 0 && categoryId.value === 0) {
    categoryId.value = categories.value[0].id
  }
  await loadProducts()
})
</script>

<style scoped>
.lab-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
}

.lab-hero__meta {
  display: flex;
  gap: 10px;
  flex: none;
}

.lab-meta-item {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 12px 16px;
  min-width: 92px;
  backdrop-filter: blur(6px);
}

.lab-meta-item .k {
  display: block;
  font-size: 11px;
  color: #93a3bd;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}

.lab-meta-item b {
  font-size: 17px;
  color: #fff;
  font-weight: 800;
}

.lab-filter {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding-top: 22px;
  padding-bottom: 0;
}

.lab-hint {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--gp-muted);
}

.lab-warn {
  flex-basis: 100%;
  font-size: 12px;
  color: var(--gp-warn);
  background: var(--gp-warn-soft);
  border: 1px solid #fde68a;
  border-radius: 9px;
  padding: 8px 12px;
}

.lab-body {
  display: grid;
  grid-template-columns: 350px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  padding-top: 18px;
}

/* 左栏 */
.weights h3 {
  font-size: 15px;
  margin-bottom: 4px;
}

.weights .sub {
  font-size: 12px;
  color: var(--gp-muted);
  margin-bottom: 18px;
}

.slider {
  margin-bottom: 15px;
}

.slider .row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 13px;
  margin-bottom: 6px;
  color: #374151;
  font-weight: 600;
}

.slider .row em {
  font-style: normal;
  font-size: 11px;
  color: #9ca3af;
  font-weight: 500;
  margin-left: 4px;
}

.slider .row b {
  color: var(--gp-brand);
  font-weight: 800;
}

input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 5px;
  border-radius: 99px;
  background: #e8ecf3;
  outline: none;
  cursor: pointer;
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--gp-brand);
  border: 2.5px solid #fff;
  box-shadow: 0 1px 4px rgba(79, 70, 229, 0.5);
}

input[type='range']::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--gp-brand);
  border: 2.5px solid #fff;
}

.presets {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 18px;
}

.preset {
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  padding: 7px 13px;
  border-radius: 9px;
  border: 1px solid var(--gp-line);
  background: #fafbfd;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.15s;
}

.preset:hover {
  border-color: #c7d2fe;
  color: var(--gp-brand);
}

.preset.is-on {
  background: var(--gp-brand-soft);
  border-color: #c7d2fe;
  color: var(--gp-brand);
}

.caliber {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed var(--gp-line);
  font-size: 12px;
  color: var(--gp-muted);
  line-height: 1.65;
}

.caliber b {
  display: block;
  color: #374151;
  font-size: 12.5px;
  margin-bottom: 6px;
}

.caliber ul {
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.caliber code {
  background: #f1f5f9;
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 11px;
}

/* 右栏 */
.board {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.board-head {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.board-lab {
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gp-muted);
}

.seg {
  display: inline-flex;
  background: #eef1f6;
  border-radius: 9px;
  padding: 3px;
  gap: 2px;
}

.seg-btn {
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 700;
  padding: 6px 14px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--gp-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.seg-btn.is-on {
  background: #fff;
  color: var(--gp-ink);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.14);
}

.board-hint {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--gp-muted);
}

.rank {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rrow {
  background: var(--gp-card);
  border: 1px solid var(--gp-line);
  border-radius: 12px;
  padding: 13px 16px;
  box-shadow: var(--gp-shadow);
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s;
}

.rrow:hover {
  transform: translateX(2px);
  border-color: #c7d2fe;
}

.rrow.top {
  border-color: #c7d2fe;
  background: linear-gradient(180deg, #fbfcff, #ffffff);
}

.rrow-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.rank-n {
  font-size: 11px;
  font-weight: 800;
  color: #fff;
  background: #94a3b8;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  flex: none;
  align-self: center;
}

.rrow.top .rank-n {
  background: var(--gp-brand);
}

.rrow-head .name {
  font-weight: 700;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rrow-head .price {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--gp-muted);
  font-weight: 700;
}

.rrow-nums {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 9px;
  font-size: 12px;
  color: var(--gp-muted);
}

.rrow-nums b {
  color: var(--gp-ink);
  font-weight: 800;
}

.official {
  color: #94a3b8;
  font-size: 11.5px;
}

.mbar {
  flex: 1;
  height: 8px;
  background: #eef1f6;
  border-radius: 99px;
  overflow: hidden;
  min-width: 70px;
}

.mbar i {
  display: block;
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, var(--gp-brand), var(--gp-cyan));
  transition: width 0.45s ease;
}

.insight {
  background: var(--gp-warn-soft);
  border: 1px solid #fde68a;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 12.8px;
  color: #7c4a03;
  line-height: 1.7;
}

.insight b {
  color: #92400e;
}

.insight-sub {
  color: #a16207;
  font-size: 12.2px;
}

@media (max-width: 980px) {
  .lab-body {
    grid-template-columns: 1fr;
  }

  .lab-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
