import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
    {
      path: '/',
      component: () => import('@/layout/AdminLayout.vue'),
      redirect: '/dashboard',
      children: [
        { path: 'dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
        { path: 'users', name: 'users', component: () => import('@/views/UserManageView.vue') },
        { path: 'products', name: 'products', component: () => import('@/views/ProductManageView.vue') },
        { path: 'categories', name: 'categories', component: () => import('@/views/CategoryManageView.vue') },
        { path: 'brands', name: 'brands', component: () => import('@/views/BrandManageView.vue') },
        { path: 'platforms', name: 'platforms', component: () => import('@/views/PlatformManageView.vue') },
        { path: 'prices', name: 'prices', component: () => import('@/views/PriceManageView.vue') },
        { path: 'articles', name: 'articles', component: () => import('@/views/ArticleManageView.vue') },
        { path: 'reviews', name: 'reviews', component: () => import('@/views/ReviewManageView.vue') },
        { path: 'algorithm', name: 'algorithm', component: () => import('@/views/AlgorithmConfigView.vue') },
        { path: 'image-licenses', name: 'image-licenses', component: () => import('@/views/ImageLicenseManageView.vue') }
      ]
    }
  ]
})

router.beforeEach((to) => {
  const token = localStorage.getItem('admin_token')
  if (to.path !== '/login' && !token) {
    return '/login'
  }
  return true
})

export default router
