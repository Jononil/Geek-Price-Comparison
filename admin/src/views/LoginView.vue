<template>
  <div class="login-page">
    <div class="card">
      <h2>极客比价 · 管理后台</h2>
      <el-form @submit.prevent>
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" size="large" show-password @keyup.enter="login" />
        </el-form-item>
        <el-button type="primary" size="large" class="submit" :loading="loading" @click="login">登录</el-button>
      </el-form>
      <p class="hint">默认管理员：admin / 123456</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api'

const router = useRouter()
const loading = ref(false)
const form = ref({ username: '', password: '' })

async function login() {
  if (!form.value.username || !form.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    const data = await authApi.login(form.value)
    if (!data.user.roles.includes('ADMIN')) {
      ElMessage.error('该账号无管理员权限')
      return
    }
    localStorage.setItem('admin_token', data.token)
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch {
    // 拦截器已提示
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page { height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f7fa; }
.card { background: #fff; border-radius: 12px; padding: 40px; width: 380px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
.card h2 { text-align: center; margin-bottom: 24px; }
.submit { width: 100%; }
.hint { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px; }
</style>
