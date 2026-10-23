<template>
  <div class="page-container">
    <h1 class="section-title">专业测评</h1>
    <el-skeleton v-if="loading" :rows="6" animated />
    <el-empty v-else-if="articles.length === 0" description="暂无测评" />
    <div v-else class="grid">
      <div v-for="a in articles" :key="a.id" class="article-card" @click="$router.push(`/articles/${a.id}`)">
        <img :src="a.cover || placeholder" :alt="a.title" />
        <div class="article-info">
          <h3>{{ a.title }}</h3>
          <p class="summary">{{ a.summary }}</p>
          <div class="meta">
            <span>👤 {{ a.author }}</span>
            <span v-if="a.views">👁 {{ a.views }} 阅读</span>
            <span v-if="a.score > 0" class="score">评分 {{ a.score }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="pagination">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next, total"
        @current-change="load"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { articleApi } from '@/api'
import type { ReviewArticle } from '@/types'

const articles = ref<ReviewArticle[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = 9
const total = ref(0)
const placeholder = 'https://placehold.co/400x220/e5e7eb/9ca3af?text=GeekPrice'

async function load() {
  loading.value = true
  try {
    const result = await articleApi.list({ page: page.value, pageSize })
    articles.value = result.records
    total.value = result.total
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.article-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.article-card:hover { box-shadow: 0 8px 20px rgba(37, 99, 235, 0.1); }
.article-card img { width: 100%; height: 160px; object-fit: cover; }
.article-info { padding: 16px; }
.article-info h3 { font-size: 15px; font-weight: 600; }
.summary { color: #6b7280; font-size: 13px; margin-top: 8px; height: 40px; overflow: hidden; }
.meta { display: flex; gap: 12px; color: #9ca3af; font-size: 12px; margin-top: 12px; }
.meta .score { color: #2563eb; margin-left: auto; }
.pagination { margin-top: 24px; display: flex; justify-content: center; }
</style>
