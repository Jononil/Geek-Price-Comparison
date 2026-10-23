<template>
  <header class="navbar">
    <div class="navbar-inner">
      <div class="logo" @click="$router.push('/')">
        <span class="logo-dot">比</span>
        <span class="logo-text">极客比价</span>
      </div>

      <nav class="nav">
        <router-link to="/">首页</router-link>
        <router-link to="/products">找产品</router-link>
        <router-link to="/compare">产品对比</router-link>
        <router-link to="/articles">测评</router-link>
        <router-link to="/rankings">排行榜</router-link>
        <router-link to="/value-lab">性价比实验室</router-link>
      </nav>

      <div class="search">
        <el-input
          v-model="keyword"
          placeholder="搜索数码产品..."
          clearable
          @keyup.enter="doSearch"
        >
          <template #append>
            <el-button @click="doSearch">搜索</el-button>
          </template>
        </el-input>
      </div>

      <div class="actions">
        <el-badge :value="compareStore.products.length" :hidden="compareStore.products.length === 0">
          <el-button @click="$router.push('/compare')">对比</el-button>
        </el-badge>

        <template v-if="userStore.token">
          <el-dropdown>
            <span class="user-name">
              <el-avatar :size="30" :src="userStore.user?.avatar">{{ userStore.user?.nickname?.slice(0, 1) }}</el-avatar>
              {{ userStore.user?.nickname }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="$router.push('/profile')">个人中心</el-dropdown-item>
                <el-dropdown-item @click="$router.push('/profile/favorites')">我的收藏</el-dropdown-item>
                <el-dropdown-item @click="$router.push('/profile/history')">浏览历史</el-dropdown-item>
                <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <el-button text @click="$router.push('/login')">登录</el-button>
          <el-button type="primary" @click="$router.push('/register')">注册</el-button>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { useCompareStore } from '@/store/compare'
import { userApi } from '@/api'

const router = useRouter()
const userStore = useUserStore()
const compareStore = useCompareStore()
const keyword = ref('')

function doSearch() {
  router.push({ path: '/products', query: { keyword: keyword.value } })
}

function logout() {
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/')
}

onMounted(async () => {
  if (userStore.token && !userStore.user) {
    try {
      const user = await userApi.info()
      userStore.setUser(user)
    } catch {
      // token 失效，清除登录态
      userStore.logout()
    }
  }
})
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}
.navbar-inner {
  max-width: 1400px;
  margin: 0 auto;
  height: 60px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 24px;
}
.logo {
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 9px;
}
.logo-dot {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  background: linear-gradient(135deg, #4f46e5, #0891b2);
  box-shadow: 0 4px 10px -4px rgba(79, 70, 229, 0.8);
}
.logo-text {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--gp-ink);
}
.nav {
  display: flex;
  gap: 4px;
}
.nav a {
  padding: 7px 12px;
  color: #4b5563;
  text-decoration: none;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 500;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}
.nav a:hover {
  background: var(--gp-brand-soft);
  color: var(--gp-brand);
}
.nav a.router-link-exact-active {
  background: var(--gp-brand-soft);
  color: var(--gp-brand);
  font-weight: 700;
}
.search {
  flex: 1;
  max-width: 380px;
}
.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-name {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #1f2937;
}
</style>
