<template>
  <div class="page-container">
    <div class="gp-sec-head">
      <div>
        <div class="gp-kicker">Explore</div>
        <h2>找产品</h2>
      </div>
      <span class="gp-sub">共 <b class="gp-num">{{ total }}</b> 款在售</span>
    </div>

    <div class="filter-bar">
      <el-select v-model="query.categoryId" placeholder="全部分类" clearable style="width: 140px">
        <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
      <el-select v-model="query.brandId" placeholder="全部品牌" clearable style="width: 140px">
        <el-option v-for="b in brands" :key="b.id" :label="b.name" :value="b.id" />
      </el-select>
      <el-input-number v-model="query.minPrice" placeholder="最低价" :min="0" :controls="false" style="width: 120px" />
      <span class="sep">-</span>
      <el-input-number v-model="query.maxPrice" placeholder="最高价" :min="0" :controls="false" style="width: 120px" />
      <el-select v-model="query.sort" placeholder="综合排序" style="width: 140px">
        <el-option label="综合排序" value="default" />
        <el-option label="性价比最高" value="valueScore" />
        <el-option label="价格最低" value="priceAsc" />
        <el-option label="价格最高" value="priceDesc" />
        <el-option label="评分最高" value="rating" />
        <el-option label="热度最高" value="heat" />
        <el-option label="最新发布" value="newest" />
      </el-select>
      <el-button type="primary" @click="search">筛选</el-button>
    </div>

    <div class="result-info" v-if="query.keyword">
      关键词「{{ query.keyword }}」共找到 <b>{{ total }}</b> 款产品
    </div>

    <el-skeleton v-if="loading" :rows="8" animated />
    <el-empty v-else-if="products.length === 0" description="没有找到相关产品" />
    <div v-else class="grid">
      <ProductCard v-for="p in products" :key="p.id" :product="p" />
    </div>

    <div class="pagination">
      <el-pagination
        v-model:current-page="query.page"
        :page-size="query.pageSize"
        :total="total"
        layout="prev, pager, next, total"
        @current-change="load"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import ProductCard from '@/components/ProductCard.vue'
import { categoryApi, brandApi, productApi } from '@/api'
import type { Brand, Category, Product } from '@/types'

const route = useRoute()
const categories = ref<Category[]>([])
const brands = ref<Brand[]>([])
const products = ref<Product[]>([])
const total = ref(0)
const loading = ref(false)

const query = reactive<Record<string, any>>({
  keyword: '',
  categoryId: undefined,
  brandId: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  sort: 'default',
  page: 1,
  pageSize: 12
})

async function load() {
  loading.value = true
  try {
    const params: Record<string, any> = { ...query }
    if (!params.keyword) delete params.keyword
    if (!params.categoryId) delete params.categoryId
    if (!params.brandId) delete params.brandId
    if (!params.minPrice) delete params.minPrice
    if (!params.maxPrice) delete params.maxPrice
    if (params.sort === 'default') delete params.sort
    const result = await productApi.list(params)
    products.value = result.records
    total.value = result.total
  } finally {
    loading.value = false
  }
}

function search() {
  query.page = 1
  load()
}

function applyQueryFromRoute() {
  query.keyword = (route.query.keyword as string) || ''
  query.categoryId = route.query.categoryId ? Number(route.query.categoryId) : undefined
  query.brandId = route.query.brandId ? Number(route.query.brandId) : undefined
  query.minPrice = route.query.minPrice ? Number(route.query.minPrice) : undefined
  query.maxPrice = route.query.maxPrice ? Number(route.query.maxPrice) : undefined
  query.sort = (route.query.sort as string) || 'default'
  query.page = 1
}

onMounted(async () => {
  applyQueryFromRoute()
  const [cats, brandsList] = await Promise.all([categoryApi.list(), brandApi.list()])
  categories.value = cats
  brands.value = brandsList
  load()
})

// 同一路由下 query 变化（顶部搜索框、首页分类跳转）时重新载入，否则页面不刷新
watch(
  () => route.query,
  () => {
    applyQueryFromRoute()
    load()
  }
)
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  background: var(--gp-card);
  padding: 16px;
  border-radius: var(--gp-radius);
  border: 1px solid var(--gp-line);
  box-shadow: var(--gp-shadow);
  margin-bottom: 18px;
}
.sep {
  color: #9ca3af;
}
.result-info {
  color: var(--gp-muted);
  font-size: 13.5px;
  margin-bottom: 16px;
}
.result-info b {
  color: var(--gp-brand);
}
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.pagination {
  margin-top: 26px;
  display: flex;
  justify-content: center;
}

@media (max-width: 1200px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 900px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 560px) {
  .grid { grid-template-columns: 1fr; }
}
</style>
