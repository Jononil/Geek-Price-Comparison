<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="logo">极客比价 · 后台</div>
      <el-menu :default-active="$route.path" router class="menu">
        <el-menu-item index="/dashboard">📊 数据概览</el-menu-item>
        <el-menu-item index="/users">👥 用户管理</el-menu-item>
        <el-menu-item index="/products">📦 产品管理</el-menu-item>
        <el-menu-item index="/categories">🏷️ 分类管理</el-menu-item>
        <el-menu-item index="/brands">🏢 品牌管理</el-menu-item>
        <el-menu-item index="/platforms">🛒 平台管理</el-menu-item>
        <el-menu-item index="/prices">💰 价格管理</el-menu-item>
        <el-menu-item index="/articles">📝 测评管理</el-menu-item>
        <el-menu-item index="/reviews">💬 评论管理</el-menu-item>
        <el-menu-item index="/algorithm">⚙️ 算法参数</el-menu-item>
        <el-menu-item index="/image-licenses">🧾 图片授权</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <span class="welcome">欢迎，{{ nickname }}</span>
        <el-button size="small" @click="logout">退出登录</el-button>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { userApi } from '@/api/user'

const router = useRouter()
const nickname = ref('')

function logout() {
  localStorage.removeItem('admin_token')
  router.push('/login')
}

onMounted(async () => {
  try {
    const user = await userApi.info()
    nickname.value = user.nickname
  } catch {
    // 未登录
  }
})
</script>

<style scoped>
.layout { height: 100vh; }
.aside { background: #1f2937; }
.logo { color: #fff; font-size: 18px; font-weight: 700; padding: 20px; text-align: center; }
.menu { border-right: none; background: #1f2937; }
.menu :deep(.el-menu-item) { color: #cbd5e1; }
.menu :deep(.el-menu-item.is-active) { background: #2563eb; color: #fff; }
.header { background: #fff; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; }
.welcome { font-size: 14px; color: #4b5563; }
.main { background: #f5f7fa; }
</style>
