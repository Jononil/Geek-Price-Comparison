<template>
  <div class="card">
    <el-table :data="reviews" border>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="nickname" label="用户" width="120" />
      <el-table-column label="星级" width="120">
        <template #default="{ row }">
          <el-rate :model-value="row.star" disabled size="small" />
        </template>
      </el-table-column>
      <el-table-column prop="content" label="内容" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="时间" width="170" />
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination">
      <el-pagination v-model:current-page="page" :page-size="pageSize" :total="total" layout="prev, pager, next, total" @current-change="load" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminReviewApi } from '@/api'

const reviews = ref<any[]>([])
const page = ref(1)
const pageSize = 10
const total = ref(0)

async function load() {
  const result = await adminReviewApi.list({ page: page.value, pageSize })
  reviews.value = result.records
  total.value = result.total
}

async function remove(row: any) {
  await ElMessageBox.confirm('确定删除该评价？', '提示', { type: 'warning' })
  await adminReviewApi.remove(row.id)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>

<style scoped>
.card { background: #fff; border-radius: 10px; padding: 20px; border: 1px solid #e5e7eb; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
