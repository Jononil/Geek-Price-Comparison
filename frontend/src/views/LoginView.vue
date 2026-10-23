<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>登录极客比价</h2>
      <p class="hint">测试账号：admin / 123456（管理员），user / 123456（普通用户）</p>
      <el-form @submit.prevent>
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" size="large" show-password @keyup.enter="login" />
        </el-form-item>
        <el-button type="primary" size="large" class="submit" :loading="loading" @click="login">登录</el-button>
      </el-form>
      <div class="switch">没有账号？<router-link to="/register">立即注册</router-link></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api'
import { useUserStore } from '@/store/user'
import type { User } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const form = ref({ username: '', password: '' })

async function login() {
  if (!form.value.username || !form.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    const data = await authApi.login(form.value) as { token: string; user: User }
    userStore.setToken(data.token)
    userStore.setUser(data.user)
    ElMessage.success('登录成功')
    // 支持路由守卫带来的回跳地址（仅站内相对路径，防开放重定向）
    const redirect = route.query.redirect as string
    router.push(redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/')
  } catch {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}
.auth-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 40px;
  width: 400px;
}
.auth-card h2 { text-align: center; font-size: 20px; }
.hint { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 8px; }
.submit { width: 100%; margin-top: 8px; }
.switch { text-align: center; margin-top: 16px; font-size: 14px; color: #6b7280; }
.switch a { color: #2563eb; }
</style>
