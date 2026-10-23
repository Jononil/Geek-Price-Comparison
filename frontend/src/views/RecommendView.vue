<template>
  <div class="page-container">
    <h1 class="section-title">为你推荐</h1>
    <p class="subtitle">根据你的浏览、收藏、价格偏好和产品兴趣，为你推荐更适合的产品</p>
    <el-empty v-if="recommendations.length === 0" description="暂无推荐" />
    <div v-else class="grid">
      <div v-for="r in recommendations" :key="r.productId" class="rec-card" @click="$router.push(`/products/${r.productId}`)">
        <div class="match">
          <span>匹配度 {{ r.score }}%</span>
        </div>
        <ProductImage :src="r.image" :product-id="r.productId" :alt="r.name" class="rec-img" />
        <div class="name">{{ r.name }}</div>
        <div class="reason">{{ r.reason }}</div>
        <div class="footer">
          <span class="price">¥{{ r.price }}</span>
          <span class="value">性价比 {{ r.valueScore }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { recommendApi } from '@/api'
import type { Recommendation } from '@/types'
import ProductImage from '@/components/ProductImage.vue'

const recommendations = ref<Recommendation[]>([])

onMounted(async () => {
  recommendations.value = await recommendApi.list()
})
</script>

<style scoped>
.subtitle { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.rec-card { position: relative; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; cursor: pointer; transition: box-shadow 0.2s; }
.rec-card:hover { box-shadow: 0 8px 20px rgba(37, 99, 235, 0.1); }
.match { position: absolute; top: 12px; right: 12px; background: #2563eb; color: #fff; font-size: 12px; padding: 4px 8px; border-radius: 20px; }
.rec-card .rec-img { width: 100%; height: 140px; border-radius: 6px; }
.name { font-weight: 600; font-size: 14px; margin-top: 12px; }
.reason { font-size: 12px; color: #6b7280; margin-top: 6px; line-height: 1.5; }
.footer { display: flex; justify-content: space-between; margin-top: 12px; }
.price { color: #f97316; font-weight: 700; font-size: 16px; }
.value { color: #10b981; font-size: 12px; }
</style>
