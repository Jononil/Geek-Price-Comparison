<template>
  <div class="card">
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="搜索用户名/昵称" clearable style="width: 240px" @keyup.enter="load" />
      <el-button type="primary" @click="load">搜索</el-button>
    </div>
    <el-table :data="users" border>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="nickname" label="昵称" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column label="角色">
        <template #default="{ row }">{{ (row.roles || []).join(', ') }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '正常' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button size="small" :type="row.status === 1 ? 'danger' : 'success'" @click="toggleStatus(row)">
            {{ row.status === 1 ? '禁用' : '启用' }}
          </el-button>
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
import { ElMessage } from 'element-plus'
import { adminUserApi } from '@/api'

const users = ref<any[]>([])
const keyword = ref('')
const page = ref(1)
const pageSize = 10
const total = ref(0)

async function load() {
  const result = await adminUserApi.list({ page: page.value, pageSize, keyword: keyword.value || undefined })
  users.value = result.records
  total.value = result.total
}

async function toggleStatus(row: any) {
  const newStatus = row.status === 1 ? 0 : 1
  await adminUserApi.updateStatus(row.id, newStatus)
  ElMessage.success('操作成功')
  load()
}

onMounted(load)
</script>

<style scoped>
.card { background: #fff; border-radius: 10px; padding: 20px; border: 1px solid #e5e7eb; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
