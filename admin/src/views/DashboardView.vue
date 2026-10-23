<template>
  <div>
    <div class="stat-cards">
      <div v-for="s in statCards" :key="s.label" class="stat-card">
        <div class="stat-value">{{ s.value }}</div>
        <div class="stat-label">{{ s.label }}</div>
      </div>
    </div>

    <div class="charts">
      <div class="chart-card">
        <h3>产品分类统计</h3>
        <div ref="categoryChartRef" class="chart"></div>
      </div>
      <div class="chart-card">
        <h3>热门产品 TOP 10</h3>
        <el-table :data="hotProducts" size="small" height="360">
          <el-table-column type="index" label="#" width="50" />
          <el-table-column prop="name" label="产品名称" show-overflow-tooltip />
          <el-table-column prop="heat" label="热度" width="90" />
          <el-table-column prop="valueScore" label="性价比" width="80" />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { dashboardApi } from '@/api'

const statCards = ref<{ label: string; value: number }[]>([])
const hotProducts = ref<any[]>([])
const categoryChartRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

onMounted(async () => {
  const [stats, categoryStats, hot] = await Promise.all([
    dashboardApi.stats(),
    dashboardApi.categoryStats(),
    dashboardApi.hotProducts()
  ])
  statCards.value = [
    { label: '用户总数', value: stats.userCount },
    { label: '产品总数', value: stats.productCount },
    { label: '测评总数', value: stats.articleCount },
    { label: '评论总数', value: stats.reviewCount },
    { label: '收藏总数', value: stats.favoriteCount },
    { label: '浏览量', value: stats.browseCount }
  ]
  hotProducts.value = hot

  if (categoryChartRef.value) {
    chart = echarts.init(categoryChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'item' },
      xAxis: { type: 'category', data: categoryStats.map((c: any) => c.name), axisLabel: { rotate: 45, fontSize: 10 } },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: categoryStats.map((c: any) => c.count), itemStyle: { color: '#2563eb' }, barMaxWidth: 24 }],
      grid: { left: 40, right: 20, top: 20, bottom: 60 }
    })
  }
})

onBeforeUnmount(() => {
  if (chart) { chart.dispose(); chart = null }
})
</script>

<style scoped>
.stat-cards { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-card { background: #fff; border-radius: 10px; padding: 20px; text-align: center; border: 1px solid #e5e7eb; }
.stat-value { font-size: 28px; font-weight: 700; color: #2563eb; }
.stat-label { color: #6b7280; font-size: 13px; margin-top: 8px; }
.charts { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.chart-card { background: #fff; border-radius: 10px; padding: 20px; border: 1px solid #e5e7eb; }
.chart-card h3 { font-size: 15px; margin-bottom: 16px; }
.chart { height: 360px; }
</style>
