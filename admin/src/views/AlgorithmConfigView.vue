<template>
  <div class="card">
    <div class="toolbar">
      <h3>性价比算法权重配置</h3>
      <el-button type="warning" @click="recalculate">重新计算全站性价比评分</el-button>
    </div>
    <el-alert type="info" :closable="false" style="margin-bottom: 16px">
      五个维度权重之和应为 100%。修改后点击保存，再点击「重新计算」使评分生效。
    </el-alert>
    <el-table :data="configs" border>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="分类" width="100">
        <template #default="{ row }">{{ row.categoryId === 0 ? '全局默认' : '分类 ' + row.categoryId }}</template>
      </el-table-column>
      <el-table-column label="性能权重">
        <template #default="{ row }"><el-input-number v-model="row.performanceWeight" :min="0" :max="100" :step="5" size="small" /></template>
      </el-table-column>
      <el-table-column label="功能权重">
        <template #default="{ row }"><el-input-number v-model="row.functionWeight" :min="0" :max="100" :step="5" size="small" /></template>
      </el-table-column>
      <el-table-column label="用户评分权重">
        <template #default="{ row }"><el-input-number v-model="row.userRatingWeight" :min="0" :max="100" :step="5" size="small" /></template>
      </el-table-column>
      <el-table-column label="价格权重">
        <template #default="{ row }"><el-input-number v-model="row.priceWeight" :min="0" :max="100" :step="5" size="small" /></template>
      </el-table-column>
      <el-table-column label="热度权重">
        <template #default="{ row }"><el-input-number v-model="row.heatWeight" :min="0" :max="100" :step="5" size="small" /></template>
      </el-table-column>
      <el-table-column label="操作" width="80">
        <template #default="{ row }"><el-button size="small" type="primary" @click="save(row)">保存</el-button></template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminAlgorithmApi } from '@/api'

const configs = ref<any[]>([])

async function load() {
  configs.value = await adminAlgorithmApi.list()
}

async function save(row: any) {
  const sum = Number(row.performanceWeight) + Number(row.functionWeight) + Number(row.userRatingWeight) + Number(row.priceWeight) + Number(row.heatWeight)
  if (Math.abs(sum - 100) > 0.01) {
    ElMessage.warning(`权重之和为 ${sum}%，需等于 100%`)
    return
  }
  await adminAlgorithmApi.update(row.id, row)
  ElMessage.success('保存成功')
}

async function recalculate() {
  await adminAlgorithmApi.recalculate()
  ElMessage.success('已重新计算全站性价比评分')
}

onMounted(load)
</script>

<style scoped>
.card { background: #fff; border-radius: 10px; padding: 20px; border: 1px solid #e5e7eb; }
.toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
</style>
