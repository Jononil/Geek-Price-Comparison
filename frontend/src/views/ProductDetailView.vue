<template>
  <div class="page-container">
    <div v-if="loading" class="loading"><el-skeleton :rows="10" animated /></div>
    <template v-else-if="product">
      <div class="detail-top">
        <div class="images">
          <ProductImage
            :images="product.images"
            :product-id="product.id"
            :alt="product.name"
          />
          <ImageAttributionInfo :attribution="currentAttribution" detailed />
        </div>

        <div class="info">
          <h1 class="name">{{ product.name }}</h1>
          <div class="meta">
            <el-tag size="small">{{ product.brandName }}</el-tag>
            <el-tag size="small" type="info">{{ product.categoryName }}</el-tag>
            <el-tag v-for="t in product.tags" :key="t" size="small" type="success">{{ t }}</el-tag>
          </div>
          <p class="desc">{{ product.description }}</p>

          <div class="scores">
            <div class="score-box value">
              <div class="score-num">{{ product.valueScore }}</div>
              <div class="score-label">性价比评分</div>
            </div>
            <div class="score-box">
              <div class="score-num">{{ product.userRating }}</div>
              <div class="score-label">用户评分</div>
            </div>
            <div class="score-box">
              <div class="score-num">{{ product.score }}</div>
              <div class="score-label">综合评分</div>
            </div>
          </div>

          <div class="specs">
            <div v-for="s in product.specs" :key="s.id" class="spec-row">
              <span class="spec-label">{{ s.specLabel }}</span>
              <span class="spec-value">
                {{ s.specValue }}
                <span v-if="s.verifyStatus === 'verified'" class="vs-tag ok" title="已联网核验">已核验</span>
                <span v-else-if="s.verifyStatus === 'reference'" class="vs-tag ref" title="型号级参考资料，未联网复核">参考</span>
                <span v-else class="vs-tag tpl" title="系统模板数据，非官方规格">模板</span>
                <a v-if="s.sourceUrl" :href="s.sourceUrl" target="_blank" rel="noopener noreferrer" class="vs-src">来源</a>
              </span>
            </div>
            <div class="data-hint">{{ specTrustHint }}</div>
          </div>
        </div>

        <div class="price-card">
          <div class="pc-header">
            <span>多平台比价</span>
            <el-tag v-if="compare.lowestPrice > 0" type="warning" size="small">
              全网最低 {{ compare.lowestPlatformName }}
            </el-tag>
          </div>
          <div class="data-hint">模拟报价，非实时电商价格</div>
          <div v-if="compare.prices.length === 0" class="no-price">暂无价格信息</div>
          <table v-else class="price-table">
            <thead>
              <tr><th>平台</th><th>价格</th><th>店铺</th></tr>
            </thead>
            <tbody>
              <tr v-for="p in compare.prices" :key="p.id" :class="{ lowest: p.price === compare.lowestPrice }">
                <td>{{ p.platformName }}</td>
                <td class="price-cell">¥{{ p.price }}</td>
                <td>{{ p.shopName || '—' }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="compare.saveAmount > 0" class="save">
            相比最高价节省 ¥{{ compare.saveAmount }}
          </div>

          <div class="history-stats">
            <div><span>当前最低</span><b>¥{{ history.currentLowest }}</b></div>
            <div><span>历史最低</span><b>¥{{ history.historyLowest }}</b></div>
            <div><span>历史最高</span><b>¥{{ history.historyHighest }}</b></div>
            <div v-if="history.recentDrop > 0"><span>近期降价</span><b class="drop">¥{{ history.recentDrop }}</b></div>
          </div>
          <div ref="chartRef" class="chart"></div>
          <div class="data-hint">模拟历史价格，仅用于系统功能演示</div>

          <div class="pc-actions">
            <el-button @click="toggleFavorite">{{ favorited ? '已收藏' : '收藏' }}</el-button>
            <el-button type="primary" @click="addCompare">加入对比</el-button>
          </div>
        </div>
      </div>

      <div class="reviews-section">
        <h2 class="section-title">用户评价</h2>
        <div class="review-form" v-if="userStore.token">
          <el-rate v-model="reviewForm.star" />
          <el-input v-model="reviewForm.content" placeholder="说说你的使用体验..." />
          <el-button type="primary" @click="submitReview">发表评价</el-button>
        </div>
        <div v-else class="login-tip">
          <el-button text type="primary" @click="$router.push('/login')">登录后发表评价</el-button>
        </div>
        <el-empty v-if="reviews.length === 0" description="暂无评价" />
        <div v-for="r in reviews" :key="r.id" class="review-item">
          <div class="review-head">
            <span class="review-user">{{ r.nickname || '匿名用户' }}</span>
            <el-rate :model-value="r.star" disabled size="small" />
            <span class="review-time">{{ r.createdAt }}</span>
          </div>
          <p class="review-content">{{ r.content }}</p>
        </div>
      </div>
    </template>
    <el-empty v-else description="产品不存在或已下架" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { productApi, priceApi, reviewApi, favoriteApi } from '@/api'
import { useUserStore } from '@/store/user'
import { useCompareStore } from '@/store/compare'
import ProductImage from '@/components/ProductImage.vue'
import ImageAttributionInfo from '@/components/ImageAttributionInfo.vue'
import { pickProductImage } from '@/utils/image'
import type { PriceCompare, PriceHistory, Product, Review } from '@/types'

const route = useRoute()
const userStore = useUserStore()
const compareStore = useCompareStore()

const loading = ref(true)
const product = ref<Product | null>(null)
const compare = ref<PriceCompare>({ prices: [], lowestPrice: 0, lowestPlatformName: '', highestPrice: 0, priceDiff: 0, saveAmount: 0 })
const history = ref<PriceHistory>({ history: [], currentLowest: 0, historyLowest: 0, historyHighest: 0, averagePrice: 0, recentDrop: 0, recentDropRate: 0 })
const reviews = ref<Review[]>([])
const favorited = ref(false)
const reviewForm = ref({ star: 5, content: '' })
const chartRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

// 优先展示真实图片：数据库里占位图（sort 较小）常排在真实图之前，不能固定取 images[0]
// 图片展示已统一交给 ProductImage 组件（真实图优先，缺失/失败时显示类别 SVG）
// 当前展示图对应的署名信息（详情页署名面板用）
const currentAttribution = computed(() => {
  const list = product.value?.imagesAttribution
  if (!list || list.length === 0) return null
  const url = pickProductImage(product.value?.images)
  return list.find((a) => a.url === url) ?? list[0] ?? null
})

/** 规格可信度提示（verified/reference/template 统计） */
const specTrustHint = computed(() => {
  const specs = (product.value?.specs ?? []) as any[]
  const v = specs.filter((s) => s.verifyStatus === 'verified').length
  const r = specs.filter((s) => s.verifyStatus === 'reference').length
  const t = specs.filter((s) => !s.verifyStatus || s.verifyStatus === 'template').length
  const parts: string[] = []
  if (v) parts.push(`已核验 ${v} 项`)
  if (r) parts.push(`参考资料 ${r} 项（未联网复核）`)
  if (t) parts.push(`模板数据 ${t} 项（非官方规格，仅供参考）`)
  return parts.length ? `参数可信度：${parts.join(' · ')}` : '暂无参数数据'
})

async function load() {
  loading.value = true
  try {
    const id = Number(route.params.id)
    const [p, c, h, r] = await Promise.all([
      productApi.detail(id),
      priceApi.compare(id),
      priceApi.history(id),
      reviewApi.listByProduct(id)
    ])
    product.value = p
    compare.value = c
    history.value = h
    reviews.value = r.records
    // 记录浏览历史
    if (userStore.token) {
      import('@/api').then(({ historyApi }) => historyApi.record(id)).catch(() => {})
    }
  } finally {
    loading.value = false
  }
  // 图表容器在 loading 结束后才渲染，必须等 DOM 更新后再初始化，否则容器不存在导致图表永远空白
  await nextTick()
  renderChart(history.value)
}

function renderChart(h: PriceHistory) {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)
  const dates = h.history.map((x) => x.recordDate)
  const prices = h.history.map((x) => x.price)
  chart.setOption({
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', scale: true },
    tooltip: { trigger: 'axis' },
    series: [{
      type: 'line',
      data: prices,
      smooth: true,
      areaStyle: { color: 'rgba(37,99,235,0.1)' },
      lineStyle: { color: '#2563eb' },
      itemStyle: { color: '#2563eb' }
    }]
  })
}

async function toggleFavorite() {
  if (!userStore.token) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    if (favorited.value) {
      await favoriteApi.remove(1, product.value!.id)
      favorited.value = false
      ElMessage.success('已取消收藏')
    } else {
      await favoriteApi.add(1, product.value!.id)
      favorited.value = true
      ElMessage.success('收藏成功')
    }
  } catch {
    // 错误已在拦截器提示
  }
}

function addCompare() {
  if (product.value) {
    const ok = compareStore.addProduct(product.value)
    if (ok) {
      ElMessage.success('已加入对比')
    }
    // 失败时由 store 内部 ElMessage 提示具体原因
  }
}

async function submitReview() {
  if (!reviewForm.value.content.trim()) {
    ElMessage.warning('评价内容不能为空')
    return
  }
  try {
    await reviewApi.create({
      productId: product.value!.id,
      star: reviewForm.value.star,
      content: reviewForm.value.content
    })
    ElMessage.success('评价成功')
    reviewForm.value.content = ''
    const r = await reviewApi.listByProduct(product.value!.id)
    reviews.value = r.records
  } catch {
    // 错误已在拦截器提示
  }
}

onMounted(load)
onBeforeUnmount(() => {
  if (chart) {
    chart.dispose()
    chart = null
  }
})
</script>

<style scoped>
.loading { padding: 24px; }
.detail-top {
  display: grid;
  grid-template-columns: 320px 1fr 360px;
  gap: 24px;
}
.images :deep(.product-image) {
  width: 100%;
  height: 320px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}
.info { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 24px; }
.name { font-size: 22px; font-weight: 700; }
.meta { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.desc { color: #6b7280; font-size: 14px; margin-top: 12px; line-height: 1.6; }
.scores { display: flex; gap: 16px; margin-top: 20px; }
.score-box { flex: 1; text-align: center; background: #f8fafc; border-radius: 10px; padding: 16px; }
.score-box.value { background: #ecfdf5; }
.score-num { font-size: 28px; font-weight: 700; color: #1f2937; }
.score-box.value .score-num { color: #10b981; }
.score-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
.specs { margin-top: 20px; }
.spec-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
.spec-label { color: #6b7280; width: 90px; flex-shrink: 0; }
.spec-value { color: #1f2937; }
.price-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; }
.pc-header { display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
.no-price { color: #9ca3af; text-align: center; padding: 20px; }
.data-hint { color: #9ca3af; font-size: 11px; margin: 6px 0; text-align: right; letter-spacing: 0.3px; }
.vs-tag { font-size: 10px; padding: 1px 5px; border-radius: 4px; margin-left: 6px; }
.vs-tag.ok { background: #d1fae5; color: #065f46; }
.vs-tag.ref { background: #e0e7ff; color: #4338ca; }
.vs-tag.tpl { background: #f3f4f6; color: #6b7280; }
.vs-src { font-size: 10px; color: #3b82f6; margin-left: 6px; text-decoration: none; }
.price-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
.price-table th, .price-table td { padding: 8px; text-align: left; border-bottom: 1px solid #f1f5f9; }
.price-table th { color: #6b7280; font-weight: 500; }
.price-cell { color: #1f2937; font-weight: 600; }
tr.lowest td { color: #f97316; font-weight: 700; }
.save { color: #f97316; font-size: 13px; margin-top: 12px; font-weight: 600; }
.history-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 16px; }
.history-stats div { background: #f8fafc; border-radius: 8px; padding: 8px; text-align: center; }
.history-stats span { display: block; font-size: 11px; color: #6b7280; }
.history-stats b { font-size: 14px; color: #1f2937; }
.history-stats b.drop { color: #f97316; }
.chart { height: 180px; margin-top: 16px; }
.pc-actions { display: flex; gap: 12px; margin-top: 16px; }
.pc-actions .el-button { flex: 1; }
.reviews-section { margin-top: 32px; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 24px; }
.review-form { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; }
.review-form .el-input { flex: 1; }
.login-tip { margin-bottom: 16px; }
.review-item { padding: 16px 0; border-bottom: 1px solid #f1f5f9; }
.review-head { display: flex; align-items: center; gap: 12px; }
.review-user { font-weight: 600; font-size: 14px; }
.review-time { color: #9ca3af; font-size: 12px; margin-left: auto; }
.review-content { margin-top: 8px; font-size: 14px; color: #4b5563; line-height: 1.6; }
</style>
