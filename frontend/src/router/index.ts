import { createRouter, createWebHistory } from 'vue-router'

/** 需要登录才能访问的页面（受保护路由） */
const AUTH_REQUIRED = new Set(['/profile', '/profile/favorites', '/profile/history'])

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/products', name: 'products', component: () => import('@/views/ProductListView.vue') },
    { path: '/products/:id', name: 'product-detail', component: () => import('@/views/ProductDetailView.vue') },
    { path: '/compare', name: 'compare', component: () => import('@/views/CompareView.vue') },
    { path: '/articles', name: 'articles', component: () => import('@/views/ArticleListView.vue') },
    { path: '/articles/:id', name: 'article-detail', component: () => import('@/views/ArticleDetailView.vue') },
    { path: '/rankings', name: 'rankings', component: () => import('@/views/RankingView.vue') },
    { path: '/value-lab', name: 'value-lab', component: () => import('@/views/ValueLabView.vue') },
    { path: '/recommend', name: 'recommend', component: () => import('@/views/RecommendView.vue') },
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
    { path: '/register', name: 'register', component: () => import('@/views/RegisterView.vue') },
    { path: '/profile', name: 'profile', component: () => import('@/views/ProfileView.vue') },
    { path: '/profile/favorites', name: 'favorites', component: () => import('@/views/FavoritesView.vue') },
    { path: '/profile/history', name: 'history', component: () => import('@/views/HistoryView.vue') }
  ]
})

// 路由守卫：未登录访问受保护页面时引导到登录页（登录成功后可跳回原页面）
router.beforeEach((to) => {
  if (AUTH_REQUIRED.has(to.path) && !localStorage.getItem('token')) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
