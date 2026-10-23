<template>
  <div class="page-container">
    <h1 class="section-title">我的收藏</h1>
    <el-empty v-if="favorites.length === 0" description="还没有收藏" />
    <div v-else class="list">
      <div v-for="f in favorites" :key="f.id" class="item">
        <!-- 产品收藏：走统一图片组件（真实图优先 / 缺失或失败显示类别 SVG） -->
        <ProductImage
          v-if="f.targetType === 1"
          :src="f.image"
          :product-id="f.targetId"
          :alt="f.name"
          :badge="false"
          class="fav-img"
          @click="$router.push(`/products/${f.targetId}`)"
        />
        <!-- 测评收藏：封面图，保持原有简单展示 -->
        <img
          v-else
          :src="f.image || placeholder"
          :alt="f.name"
          class="fav-img"
          @click="$router.push(`/products/${f.targetId}`)"
        />
        <div class="info" @click="$router.push(`/products/${f.targetId}`)">
          <div class="name">{{ f.name }}</div>
          <div class="meta">{{ f.targetType === 1 ? '产品' : '测评' }} · {{ f.createdAt }}</div>
        </div>
        <div v-if="f.targetType === 1" class="price">¥{{ f.price }}</div>
        <el-button size="small" type="danger" text @click="remove(f)">取消收藏</el-button>
      </div>
    </div>
    <div class="pagination">
      <el-pagination v-model:current-page="page" :page-size="pageSize" :total="total" layout="prev, pager, next, total" @current-change="load" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { favoriteApi } from '@/api'
import type { FavoriteItem } from '@/types'
import ProductImage from '@/components/ProductImage.vue'

const favorites = ref<FavoriteItem[]>([])
const page = ref(1)
const pageSize = 10
const total = ref(0)
const placeholder = 'https://placehold.co/100x100/e5e7eb/9ca3af?text=GP'

async function load() {
  const result = await favoriteApi.list(page.value, pageSize)
  favorites.value = result.records
  total.value = result.total
}

async function remove(f: FavoriteItem) {
  try {
    await favoriteApi.remove(f.targetType, f.targetId)
    ElMessage.success('已取消收藏')
    load()
  } catch {
    // 拦截器已提示
  }
}

onMounted(load)
</script>

<style scoped>
.list { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; }
.item { display: flex; align-items: center; gap: 16px; padding: 16px; border-bottom: 1px solid #f1f5f9; }
.item img,
.item .fav-img { width: 60px; height: 60px; border-radius: 6px; cursor: pointer; flex: none; }
.info { flex: 1; cursor: pointer; }
.name { font-weight: 600; font-size: 14px; }
.meta { color: #9ca3af; font-size: 12px; margin-top: 4px; }
.price { color: #f97316; font-weight: 700; }
.pagination { margin-top: 20px; display: flex; justify-content: center; }
</style>
