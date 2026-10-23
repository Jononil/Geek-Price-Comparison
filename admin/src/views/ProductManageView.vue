<template>
  <div class="card">
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="搜索产品名称" clearable style="width: 200px" @keyup.enter="load" />
      <el-button type="primary" @click="load">搜索</el-button>
      <el-button type="primary" plain @click="openCreate">新增产品</el-button>
    </div>
    <div style="color:#909399;font-size:12px;margin-bottom:12px">报价为系统模拟数据，非实时电商价格；规格参数为系统模拟参考值，非官方规格</div>
    <el-table :data="list" border>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="名称" show-overflow-tooltip />
      <el-table-column prop="brandName" label="品牌" width="100" />
      <el-table-column prop="categoryName" label="分类" width="90" />
      <el-table-column prop="currentPrice" label="价格" width="90" />
      <el-table-column prop="valueScore" label="性价比" width="80" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '上架' : '下架' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="210">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" :type="row.status === 1 ? 'warning' : 'success'" @click="toggleStatus(row)">
            {{ row.status === 1 ? '下架' : '上架' }}
          </el-button>
          <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination">
      <el-pagination v-model:current-page="page" :page-size="pageSize" :total="total" layout="prev, pager, next, total" @current-change="load" />
    </div>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑产品' : '新增产品'" width="560px">
      <el-form label-width="80px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="品牌">
          <el-select v-model="form.brandId" filterable>
            <el-option v-for="b in brands" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.categoryId" filterable>
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="当前价"><el-input-number v-model="form.currentPrice" :min="0" /></el-form-item>
        <el-form-item label="官方价"><el-input-number v-model="form.officialPrice" :min="0" /></el-form-item>
        <el-form-item label="性价比"><el-input-number v-model="form.valueScore" :min="0" :max="100" /></el-form-item>
        <el-form-item label="性能分"><el-input-number v-model="form.performanceScore" :min="0" :max="100" /></el-form-item>
        <el-form-item label="用户评分"><el-input-number v-model="form.userRating" :min="0" :max="5" :step="0.1" /></el-form-item>
        <el-form-item label="热度"><el-input-number v-model="form.heat" :min="0" /></el-form-item>
        <el-form-item label="简介"><el-input v-model="form.description" type="textarea" /></el-form-item>
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
import { adminProductApi, adminCategoryApi, adminBrandApi } from '@/api'

const list = ref<any[]>([])
const brands = ref<any[]>([])
const categories = ref<any[]>([])
const keyword = ref('')
const page = ref(1)
const pageSize = 10
const total = ref(0)
const dialogVisible = ref(false)
const editing = ref(false)
const form = ref<any>({})

async function load() {
  const result = await adminProductApi.list({ page: page.value, pageSize, keyword: keyword.value || undefined })
  list.value = result.records
  total.value = result.total
}

function openCreate() {
  editing.value = false
  form.value = { status: 1 }
  dialogVisible.value = true
}

function openEdit(row: any) {
  editing.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

async function save() {
  if (editing.value) {
    await adminProductApi.update(form.value.id, form.value)
  } else {
    await adminProductApi.create(form.value)
  }
  ElMessage.success('保存成功')
  dialogVisible.value = false
  load()
}

async function toggleStatus(row: any) {
  await adminProductApi.updateStatus(row.id, row.status === 1 ? 0 : 1)
  ElMessage.success('操作成功')
  load()
}

async function remove(row: any) {
  await ElMessageBox.confirm('确定删除该产品？', '提示', { type: 'warning' })
  await adminProductApi.remove(row.id)
  ElMessage.success('已删除')
  load()
}

onMounted(async () => {
  load()
  brands.value = await adminBrandApi.list()
  categories.value = await adminCategoryApi.list()
})
</script>

<style scoped>
.card { background: #fff; border-radius: 10px; padding: 20px; border: 1px solid #e5e7eb; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
