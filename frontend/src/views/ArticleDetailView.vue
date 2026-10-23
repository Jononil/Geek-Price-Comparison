<template>
  <div class="page-container">
    <div v-if="loading" class="loading"><el-skeleton :rows="8" animated /></div>
    <article v-else-if="article" class="article">
      <h1 class="title">{{ article.title }}</h1>
      <div class="meta">
        <span>👤 {{ article.author }}</span>
        <span>📅 {{ article.publishTime || '时间未标注' }}</span>
        <span v-if="article.views">👁 站内浏览 {{ article.views }}</span>
        <el-button size="small" type="primary" plain @click="like">👍 {{ article.likes }}</el-button>
      </div>
      <img v-if="article.cover" :src="article.cover" class="cover" />

      <div v-if="article.score > 0" class="score-panel">
        <div class="score-main">{{ article.score }}<span class="unit">综合评分</span></div>
        <div class="score-sub">
          <span>性能 {{ article.performanceScore }}</span>
          <span>外观 {{ article.appearanceScore }}</span>
          <span>屏幕 {{ article.screenScore }}</span>
          <span>续航 {{ article.batteryScore }}</span>
        </div>
      </div>

      <div v-if="article.pros" class="pros-cons">
        <div class="pros"><b>优点</b><p>{{ article.pros }}</p></div>
        <div class="cons"><b>缺点</b><p>{{ article.cons }}</p></div>
      </div>

      <div class="content" v-html="article.content || article.summary"></div>
    </article>
    <el-empty v-else description="测评不存在或已下架" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { articleApi } from '@/api'
import type { ReviewArticle } from '@/types'

const route = useRoute()
const article = ref<ReviewArticle | null>(null)
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    article.value = await articleApi.detail(Number(route.params.id))
  } finally {
    loading.value = false
  }
}

async function like() {
  try {
    await articleApi.like(article.value!.id)
    article.value!.likes += 1
    ElMessage.success('点赞成功')
  } catch {
    // 拦截器已提示
  }
}

onMounted(load)
</script>

<style scoped>
.loading { padding: 24px; }
.article { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 32px; max-width: 900px; margin: 0 auto; }
.title { font-size: 26px; font-weight: 700; }
.meta { display: flex; gap: 16px; align-items: center; color: #9ca3af; font-size: 13px; margin-top: 16px; }
.cover { width: 100%; max-height: 360px; object-fit: cover; border-radius: 10px; margin-top: 20px; }
.score-panel { display: flex; gap: 24px; align-items: center; background: #f8fafc; border-radius: 10px; padding: 20px; margin-top: 20px; }
.score-main { font-size: 40px; font-weight: 700; color: #2563eb; }
.score-main .unit { font-size: 13px; color: #6b7280; margin-left: 8px; }
.score-sub { display: flex; gap: 16px; color: #6b7280; font-size: 13px; }
.pros-cons { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }
.pros, .cons { padding: 16px; border-radius: 10px; }
.pros { background: #ecfdf5; }
.cons { background: #fff7ed; }
.pros b { color: #10b981; }
.cons b { color: #f97316; }
.pros p, .cons p { margin-top: 8px; font-size: 13px; color: #4b5563; line-height: 1.6; }
.content { margin-top: 24px; font-size: 15px; line-height: 1.8; color: #374151; }
</style>
