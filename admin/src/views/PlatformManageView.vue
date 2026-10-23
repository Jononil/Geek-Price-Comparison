<template>
  <div class="card">
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新增平台</el-button>
    </div>
    <el-table :data="list" border>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="code" label="编码" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑平台' : '新增平台'" width="420px">
      <el-form label-width="70px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="编码"><el-input v-model="form.code" /></el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminPlatformApi } from '@/api'

const list = ref<any[]>([])
const dialogVisible = ref(false)
const editing = ref(false)
const form = ref<any>({ name: '', code: '', status: 1 })

async function load() {
  list.value = await adminPlatformApi.list()
}

function openCreate() {
  editing.value = false
  form.value = { name: '', code: '', status: 1 }
  dialogVisible.value = true
}

function openEdit(row: any) {
  editing.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

async function save() {
  if (editing.value) {
    await adminPlatformApi.update(form.value.id, form.value)
  } else {
    await adminPlatformApi.create(form.value)
  }
  ElMessage.success('保存成功')
  dialogVisible.value = false
  load()
}

async function remove(row: any) {
  await ElMessageBox.confirm('确定删除该平台？', '提示', { type: 'warning' })
  await adminPlatformApi.remove(row.id)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>

<style scoped>
.card { background: #fff; border-radius: 10px; padding: 20px; border: 1px solid #e5e7eb; }
.toolbar { margin-bottom: 16px; }
</style>
