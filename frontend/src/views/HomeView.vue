<template>
  <div class="home">
    <!-- ===== Hero ===== -->
    <section class="gp-hero">
      <div class="gp-hero__inner">
        <div class="hero-grid">
          <div class="hero-left">
            <div class="gp-eyebrow">高性价比数码 · 测评聚合与比价</div>
            <h1>先算清真实价格，<br>再谈性价比</h1>
            <p class="gp-lede">
              聚合专业测评、多平台报价与真实用户评价，用五维加权评分给出可解释的性价比结论，
              让「值不值」不再是感觉，而是能对齐的数据。
            </p>

            <div class="hero-search">
              <el-input
                v-model="keyword"
                size="large"
                placeholder="搜索手机、耳机、显卡、笔记本……"
                clearable
                class="hero-input"
                @keyup.enter="search"
              />
              <el-button type="primary" size="large" class="hero-btn" @click="search">智能比价</el-button>
            </div>

            <div class="gp-caps">
              <span class="gp-cap"><i></i>五维加权评分</span>
              <span class="gp-cap"><i></i>多平台比价</span>
              <span class="gp-cap"><i></i>历史价格曲线</span>
              <span class="gp-cap"><i></i>专业测评聚合</span>
            </div>
          </div>

          <aside class="hero-card">
            <div class="hcard-title">
              <span>性价比评分 · 维度权重</span>
              <router-link to="/value-lab" class="hcard-link">去调权重 →</router-link>
            </div>
            <div v-for="d in algoWeights" :key="d.name" class="hcard-row">
              <span class="hcard-name">{{ d.name }}</span>
              <div class="hcard-bar"><i :style="{ width: (d.weight / maxWeight) * 100 + '%' }"></i></div>
              <b class="gp-num">{{ Math.round(d.weight * 100) }}%</b>
            </div>
            <div class="hcard-foot">全局默认配置，后台可按分类单独调整后再全站重算</div>
          </aside>
        </div>
      </div>
    </section>

    <!-- ===== 分类 ===== -->
    <section class="page-container">
      <div class="gp-sec-head">
        <div>
          <div class="gp-kicker">Browse</div>
          <h2>热门分类</h2>
        </div>
        <span class="gp-sub">点击进入分类比价</span>
      </div>
      <div class="gp-chips">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="gp-chip"
          @click="goCategory(cat.id)"
        >
          {{ cat.name }}
        </button>
        <span v-if="loading" class="gp-chip is-on">加载中…</span>
        <span v-else-if="categories.length === 0" class="gp-chip">暂无分类</span>
      </div>
    </section>

    <!-- ===== 严选 ===== -->
    <section class="page-container">
      <div class="gp-sec-head">
        <div>
          <div class="gp-kicker">Value Picks</div>
          <h2>高性价比严选</h2>
        </div>
        <el-button text type="primary" @click="$router.push({ path: '/products', query: { sort: 'valueScore' } })">
          查看全部 →
        </el-button>
      </div>
      <div class="grid">
        <ProductCard v-for="p in valueProducts" :key="p.id" :product="p" />
      </div>
      <el-empty v-if="!loading && valueProducts.length === 0" description="暂无评分数据" />
    </section>

    <!-- ===== 推荐 ===== -->
    <section class="page-container">
      <div class="gp-sec-head">
        <div>
          <div class="gp-kicker">For You</div>
          <h2>为你推荐</h2>
        </div>
        <el-button text type="primary" @click="$router.push('/recommend')">换一组 →</el-button>
      </div>
      <el-empty v-if="recommendations.length === 0" description="暂无推荐" />
      <div v-else class="rec-grid">
        <div
          v-for="r in recommendations"
          :key="r.productId"
          class="rec-card"
          @click="$router.push(`/products/${r.productId}`)"
        >
          <div class="rec-img-wrap">
            <ProductImage :src="r.image" :product-id="r.productId" :alt="r.name" class="rec-img" />
          </div>
          <div class="rec-body">
            <div class="rec-name">{{ r.name }}</div>
            <div class="rec-reason">{{ r.reason }}</div>
            <div class="rec-footer">
              <span class="rec-price gp-num">¥{{ r.price }}</span>
              <span class="rec-score">性价比 {{ r.valueScore }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ProductCard from '@/components/ProductCard.vue'
import ProductImage from '@/components/ProductImage.vue'
import { categoryApi, productApi, recommendApi } from '@/api'
import type { Category, Product, Recommendation } from '@/types'

const router = useRouter()
const keyword = ref('')
const categories = ref<Category[]>([])
const valueProducts = ref<Product[]>([])
const recommendations = ref<Recommendation[]>([])
const loading = ref(true)

/** 后端全局默认权重（database/02-base-data.sql · algorithm_configs category_id=0） */
const algoWeights = [
  { name: '性能', weight: 0.3 },
  { name: '功能', weight: 0.2 },
  { name: '口碑', weight: 0.2 },
  { name: '价格优势', weight: 0.3 },
  { name: '热度', weight: 0 }
]
const maxWeight = 0.3

function search() {
  router.push({ path: '/products', query: { keyword: keyword.value } })
}

function goCategory(id: number) {
  router.push({ path: '/products', query: { categoryId: String(id) } })
}

onMounted(async () => {
  try {
    const [cats, value, recs] = await Promise.all([
      categoryApi.list(),
      productApi.list({ sort: 'valueScore', page: 1, pageSize: 8 }),
      recommendApi.list()
    ])
    categories.value = cats
    valueProducts.value = value.records
    recommendations.value = recs
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.hero-search {
  max-width: 640px;
  margin: 30px 0 0;
  display: flex;
  gap: 10px;
}

/* Hero 两栏：左文案 + 右权重卡 */
.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 366px;
  gap: 48px;
  align-items: center;
}

.hero-left {
  min-width: 0;
}

.hero-card {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 16px;
  padding: 18px 20px;
  backdrop-filter: blur(8px);
}

.hcard-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 12.5px;
  font-weight: 700;
  color: #c7d2fe;
  letter-spacing: 0.03em;
  margin-bottom: 15px;
}

.hcard-link {
  font-size: 11.5px;
  font-weight: 600;
  color: #93c5fd;
  white-space: nowrap;
}

.hcard-link:hover {
  color: #fff;
}

.hcard-row {
  display: grid;
  grid-template-columns: 62px 1fr 42px;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 12.5px;
  color: #cdd8ea;
}

.hcard-bar {
  height: 6px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.hcard-bar i {
  display: block;
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, #818cf8, #67e8f9);
}

.hcard-row b {
  text-align: right;
  color: #fff;
  font-weight: 800;
}

.hcard-foot {
  margin-top: 13px;
  padding-top: 11px;
  border-top: 1px solid rgba(255, 255, 255, 0.09);
  font-size: 11px;
  line-height: 1.6;
  color: #8b9ab4;
}

.hero-input :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.94);
  border-radius: 12px;
  box-shadow: none;
  padding: 4px 14px;
}

.hero-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 3px rgba(165, 180, 252, 0.35);
}

.hero-btn {
  border-radius: 12px;
  font-weight: 700;
  padding: 0 26px;
  background: linear-gradient(135deg, #6366f1, #0891b2);
  border: none;
  box-shadow: 0 10px 24px -12px rgba(99, 102, 241, 0.9);
}

.hero-btn:hover {
  background: linear-gradient(135deg, #4f46e5, #0e7490);
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.rec-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.rec-card {
  background: #fff;
  border: 1px solid var(--gp-line);
  border-radius: var(--gp-radius);
  overflow: hidden;
  cursor: pointer;
  box-shadow: var(--gp-shadow);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s;
  display: flex;
  flex-direction: column;
}

.rec-card:hover {
  transform: translateY(-3px);
  border-color: #c7d2fe;
  box-shadow: 0 18px 40px -22px rgba(30, 41, 59, 0.4);
}

.rec-img-wrap {
  aspect-ratio: 16 / 10;
  background: linear-gradient(150deg, #fbfcfe, #e9eef6);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.rec-card:hover .rec-img-wrap :deep(.pi-img) {
  transform: scale(1.045);
}

.rec-card .rec-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.rec-body {
  padding: 14px 16px 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.rec-name {
  font-weight: 700;
  font-size: 14.5px;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.rec-reason {
  font-size: 12.5px;
  color: var(--gp-muted);
  margin-top: 8px;
  line-height: 1.55;
  border-left: 3px solid #e0e7ff;
  padding-left: 9px;
  flex: 1;
}

.rec-footer {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

.rec-price {
  color: #111827;
  font-weight: 800;
  font-size: 19px;
  letter-spacing: -0.02em;
}

.rec-score {
  color: var(--gp-ok);
  background: var(--gp-ok-soft);
  border: 1px solid #bbf7d0;
  padding: 2px 9px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 700;
}

@media (max-width: 1200px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 1000px) {
  .hero-grid { grid-template-columns: 1fr; gap: 28px; }
  .hero-card { max-width: 420px; }
}

@media (max-width: 900px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
  .rec-grid { grid-template-columns: 1fr; }
}

@media (max-width: 560px) {
  .grid { grid-template-columns: 1fr; }
  .hero-search { flex-direction: column; }
}
</style>
