<template>
  <div class="page-container">
    <div class="gp-sec-head">
      <div>
        <div class="gp-kicker">Rankings</div>
        <h2>排行榜</h2>
      </div>
      <span class="gp-sub">按不同维度重排全站产品</span>
    </div>
    <el-tabs v-model="activeTab" @tab-change="load">
      <el-tab-pane label="性价比榜" name="valueScore" />
      <el-tab-pane label="热门榜" name="heat" />
      <el-tab-pane label="评分榜" name="rating" />
      <el-tab-pane label="最新榜" name="newest" />
      <el-tab-pane label="价格最低" name="priceAsc" />
    </el-tabs>

    <el-skeleton v-if="loading" :rows="6" animated />
    <div v-else class="rank-list">
      <div v-for="(p, index) in products" :key="p.id" class="rank-item" @click="$router.push(`/products/${p.id}`)">
        <span class="rank-num" :class="'rank-' + (index + 1)">{{ index + 1 }}</span>
        <div class="rank-img-wrap">
          <ProductImage
            :images="p.images"
            :product-id="p.id"
            :alt="p.name"
            class="rank-img"
          />
          <el-popover placement="top-end" width="260" trigger="click" popper-class="img-info-popover">
            <template #reference>
              <button class="img-info-btn" title="图片来源与许可" @click.stop>ⓘ</button>
            </template>
            <ImageAttributionInfo :attribution="attrOf(p)" />
          </el-popover>
        </div>
        <div class="rank-info">
          <div class="name">{{ p.name }}</div>
          <div class="brand">{{ p.brandName }} · {{ p.categoryName }}</div>
        </div>
        <div class="rank-value">性价比 {{ p.valueScore }}</div>
        <div class="rank-price">¥{{ p.currentPrice }} <span class="data-hint">(模拟)</span></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { productApi } from '@/api'
import type { Product } from '@/types'
import ProductImage from '@/components/ProductImage.vue'
import ImageAttributionInfo from '@/components/ImageAttributionInfo.vue'
import { pickProductImage } from '@/utils/image'

const activeTab = ref('valueScore')
const products = ref<Product[]>([])
const loading = ref(false)

/** 当前展示图对应的署名信息 */
const attrOf = (p: Product) => {
  const list = p.imagesAttribution
  if (!list || list.length === 0) return null
  const url = pickProductImage(p.images)
  return list.find((a) => a.url === url) ?? null
}

async function load() {
  loading.value = true
  try {
    const result = await productApi.list({ sort: activeTab.value, page: 1, pageSize: 10 })
    products.value = result.records
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.rank-list {
  background: var(--gp-card);
  border: 1px solid var(--gp-line);
  border-radius: var(--gp-radius);
  box-shadow: var(--gp-shadow);
  overflow: hidden;
}
.rank-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background 0.15s;
}
.rank-item:last-child { border-bottom: none; }
.rank-item:hover { background: #f8fafc; }
.rank-num {
  width: 30px; height: 30px; border-radius: 9px;
  background: #eef1f6; color: #64748b;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 13px; flex: none;
}
.rank-1 { background: linear-gradient(135deg, #4f46e5, #0891b2); color: #fff; }
.rank-2 { background: #64748b; color: #fff; }
.rank-3 { background: #94a3b8; color: #fff; }
.rank-img-wrap {
  position: relative;
  width: 64px;
  height: 64px;
  flex: none;
  border-radius: 10px;
  overflow: hidden;
  background: linear-gradient(150deg, #fbfcfe, #e9eef6);
}
.rank-item .rank-img { width: 64px; height: 64px; }
.rank-item:hover .rank-img-wrap :deep(.pi-img) { transform: scale(1.06); }
.img-info-btn {
  position: absolute;
  right: -4px;
  bottom: -4px;
  z-index: 3;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: #64748b;
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}
.img-info-btn:hover { color: var(--gp-brand); }
.rank-info { flex: 1; min-width: 0; }
.name { font-weight: 700; font-size: 14.5px; }
.brand { color: #9ca3af; font-size: 12px; margin-top: 4px; }
.rank-value {
  color: var(--gp-ok);
  background: var(--gp-ok-soft);
  border: 1px solid #bbf7d0;
  border-radius: 7px;
  padding: 3px 10px;
  font-size: 12.5px;
  font-weight: 800;
  white-space: nowrap;
}
.rank-price { color: #111827; font-weight: 800; min-width: 110px; text-align: right; font-size: 15px; }
.data-hint { font-size: 10px; color: #cbd5e1; font-weight: normal; }
</style>
