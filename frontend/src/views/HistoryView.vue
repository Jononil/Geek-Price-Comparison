<template>
  <div class="page-container">
    <div class="head">
      <h1 class="section-title">浏览历史</h1>
      <el-button v-if="history.length > 0" size="small" type="danger" text @click="clear">清除全部</el-button>
    </div>
    <el-empty v-if="history.length === 0" description="暂无浏览记录" />
    <div v-else class="list">
      <div v-for="h in history" :key="h.id" class="item" @click="$router.push(`/products/${h.productId}`)">
        <ProductImage :src="h.image" :product-id="h.productId" :alt="h.productName" :badge="false" class="his-img" />
        <div class="info">
          <div class="name">{{ h.productName }}</div>
          <div class="time">{{ h.viewedAt }}</div>
        </div>
        <div class="value">性价比 {{ h.valueScore }}</div>
        <div class="price">¥{{ h.price }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { historyApi } from '@/api'
import type { BrowseHistoryItem } from '@/types'
import ProductImage from '@/components/ProductImage.vue'

const history = ref<BrowseHistoryItem[]>([])

async function load() {
  history.value = await historyApi.list(20)
}

async function clear() {
  await ElMessageBox.confirm('确定清除全部浏览历史？', '提示', { type: 'warning' })
  await historyApi.clear()
  ElMessage.success('已清除')
  history.value = []
}

onMounted(load)
</script>

<style scoped>
.head { display: flex; align-items: center; justify-content: space-between; }
.list { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; }
.item { display: flex; align-items: center; gap: 16px; padding: 16px; border-bottom: 1px solid #f1f5f9; cursor: pointer; }
.item:hover { background: #f8fafc; }
.item .his-img { width: 60px; height: 60px; border-radius: 6px; flex: none; }
.info { flex: 1; }
.name { font-weight: 600; font-size: 14px; }
.time { color: #9ca3af; font-size: 12px; margin-top: 4px; }
.value { color: #10b981; font-size: 13px; }
.price { color: #f97316; font-weight: 700; }
</style>
