<template>
  <div class="card">
    <div class="toolbar">
      <el-input-number v-model="productId" :min="1" placeholder="产品ID" style="width: 140px" />
      <el-button type="primary" @click="load">查询价格</el-button>
      <el-button type="primary" plain @click="openCreate">录入价格</el-button>
    </div>
    <div style="color:#909399;font-size:12px;margin-bottom:12px">报价为系统模拟数据，非实时电商价格；录入的价格将同时生成模拟历史记录</div>
    <el-table :data="list" border>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="platformName" label="平台" width="120" />
      <el-table-column prop="price" label="价格" width="100" />
      <el-table-column prop="originalPrice" label="原价" width="100" />
      <el-table-column prop="shopName" label="店铺" />
      <el-table-column label="自营" width="80">
        <template #default="{ row }">{{ row.isOfficial === 1 ? '是' : '否' }}</template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="录入价格" width="440px">
      <el-form label-width="80px">
        <el-form-item label="产品ID"><el-input-number v-model="form.productId" :min="1" /></el-form-item>
        <el-form-item label="平台">
          <el-select v-model="form.platformId">
            <el-option v-for="p in platforms" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格"><el-input-number v-model="form.price" :min="0" /></el-form-item>
        <el-form-item label="原价"><el-input-number v-model="form.originalPrice" :min="0" /></el-form-item>
        <el-form-item label="店铺"><el-input v-model="form.shopName" /></el-form-item>
        <el-form-item label="自营">
          <el-switch v-model="form.isOfficial" :active-value="1" :inactive-value="0" />
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
import { ElMessage } from 'element-plus'
import { adminPriceApi, adminPlatformApi } from '@/api'

const list = ref<any[]>([])
const platforms = ref<any[]>([])
const productId = ref<number>()
const dialogVisible = ref(false)
const form = ref<any>({ isOfficial: 0 })

async function load() {
  if (!productId.value) return
  list.value = await adminPriceApi.list(productId.value)
}

function openCreate() {
  form.value = { productId: productId.value, isOfficial: 0 }
  dialogVisible.value = true
}

async function save() {
  await adminPriceApi.create(form.value)
  ElMessage.success('价格已录入，并生成历史记录')
  dialogVisible.value = false
  load()
}

onMounted(async () => {
  platforms.value = await adminPlatformApi.list()
})
</script>

<style scoped>
.card { background: #fff; border-radius: 10px; padding: 20px; border: 1px solid #e5e7eb; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
</style>
