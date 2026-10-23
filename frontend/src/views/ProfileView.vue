<template>
  <div class="page-container">
    <h1 class="section-title">个人中心</h1>
    <div class="profile-layout">
      <div class="card">
        <el-avatar :size="80" :src="user?.avatar">{{ user?.nickname?.slice(0, 1) }}</el-avatar>
        <h2 class="nickname">{{ user?.nickname }}</h2>
        <div class="field"><span>用户名</span>{{ user?.username }}</div>
        <div class="field"><span>邮箱</span>{{ user?.email || '—' }}</div>
        <div class="field"><span>手机号</span>{{ user?.phone || '—' }}</div>
        <div class="field"><span>注册时间</span>{{ user?.createdAt }}</div>
        <div class="field"><span>角色</span>{{ (user?.roles || []).join(', ') }}</div>
      </div>

      <div class="card">
        <h3 class="card-title">修改密码</h3>
        <el-form>
          <el-form-item>
            <el-input v-model="pwd.oldPassword" type="password" placeholder="旧密码" show-password />
          </el-form-item>
          <el-form-item>
            <el-input v-model="pwd.newPassword" type="password" placeholder="新密码（至少 6 位）" show-password />
          </el-form-item>
          <el-button type="primary" @click="changePassword">确认修改</el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { userApi } from '@/api'
import { useUserStore } from '@/store/user'
import type { User } from '@/types'

const userStore = useUserStore()
const user = ref<User | null>(null)
const pwd = ref({ oldPassword: '', newPassword: '' })

async function changePassword() {
  if (!pwd.value.oldPassword || !pwd.value.newPassword) {
    ElMessage.warning('请填写完整')
    return
  }
  try {
    await userApi.updatePassword(pwd.value)
    ElMessage.success('密码修改成功')
    pwd.value = { oldPassword: '', newPassword: '' }
  } catch {
    // 拦截器已提示
  }
}

onMounted(async () => {
  const u = await userApi.info()
  user.value = u
  if (u) userStore.setUser(u)
})
</script>

<style scoped>
.profile-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 24px; }
.nickname { font-size: 20px; font-weight: 700; margin: 12px 0; }
.field { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
.field span { color: #9ca3af; }
.card-title { font-size: 16px; margin-bottom: 16px; }
</style>
