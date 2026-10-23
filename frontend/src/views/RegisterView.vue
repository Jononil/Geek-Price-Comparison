<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>注册账号</h2>
      <el-form @submit.prevent>
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名（4-20 字符）" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.nickname" placeholder="昵称" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.email" placeholder="邮箱" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码（至少 6 位）" size="large" show-password />
        </el-form-item>
        <el-button type="primary" size="large" class="submit" :loading="loading" @click="register">注册</el-button>
      </el-form>
      <div class="switch">已有账号？<router-link to="/login">去登录</router-link></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api'
import { useUserStore } from '@/store/user'
import type { User } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const form = ref({ username: '', password: '', nickname: '', email: '' })

async function register() {
  if (!form.value.username || !form.value.password || !form.value.nickname) {
    ElMessage.warning('请填写完整信息')
    return
  }
  loading.value = true
  try {
    const data = await authApi.register(form.value) as { token: string; user: User }
    userStore.setToken(data.token)
    userStore.setUser(data.user)
    ElMessage.success('注册成功')
    router.push('/')
  } catch {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
.auth-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; width: 400px; }
.auth-card h2 { text-align: center; font-size: 20px; }
.submit { width: 100%; margin-top: 8px; }
.switch { text-align: center; margin-top: 16px; font-size: 14px; color: #6b7280; }
.switch a { color: #2563eb; }
</style>
