import request from './request'

// ---------- 认证 ----------
export const authApi = {
  login: (data: { username: string; password: string }) => request.post('/auth/login', data)
}

// ---------- 仪表盘 ----------
export const dashboardApi = {
  stats: () => request.get('/admin/dashboard/stats'),
  categoryStats: () => request.get('/admin/dashboard/category-stats'),
  hotProducts: () => request.get('/admin/dashboard/hot-products')
}

// ---------- 用户 ----------
export const adminUserApi = {
  list: (params: any) => request.get('/admin/users', { params }),
  updateStatus: (id: number, status: number) => request.put(`/admin/users/${id}/status`, null, { params: { status } })
}

// ---------- 产品 ----------
export const adminProductApi = {
  list: (params: any) => request.get('/admin/products', { params }),
  create: (data: any) => request.post('/admin/products', data),
  update: (id: number, data: any) => request.put(`/admin/products/${id}`, data),
  remove: (id: number) => request.delete(`/admin/products/${id}`),
  updateStatus: (id: number, status: number) => request.put(`/admin/products/${id}/status`, null, { params: { status } }),
  setRecommend: (id: number, isRecommend: number) => request.put(`/admin/products/${id}/recommend`, null, { params: { isRecommend } }),
  setHot: (id: number, isHot: number) => request.put(`/admin/products/${id}/hot`, null, { params: { isHot } })
}

// ---------- 分类 / 品牌 / 平台 ----------
export const adminCategoryApi = {
  list: () => request.get('/admin/categories'),
  create: (data: any) => request.post('/admin/categories', data),
  update: (id: number, data: any) => request.put(`/admin/categories/${id}`, data),
  remove: (id: number) => request.delete(`/admin/categories/${id}`)
}

export const adminBrandApi = {
  list: () => request.get('/admin/brands'),
  create: (data: any) => request.post('/admin/brands', data),
  update: (id: number, data: any) => request.put(`/admin/brands/${id}`, data),
  remove: (id: number) => request.delete(`/admin/brands/${id}`)
}

export const adminPlatformApi = {
  list: () => request.get('/admin/platforms'),
  create: (data: any) => request.post('/admin/platforms', data),
  update: (id: number, data: any) => request.put(`/admin/platforms/${id}`, data),
  remove: (id: number) => request.delete(`/admin/platforms/${id}`)
}

// ---------- 价格 ----------
export const adminPriceApi = {
  list: (productId: number) => request.get('/admin/prices', { params: { productId } }),
  create: (data: any) => request.post('/admin/prices', data)
}

// ---------- 测评 / 评论 ----------
export const adminArticleApi = {
  list: (params: any) => request.get('/admin/articles', { params }),
  create: (data: any) => request.post('/admin/articles', data),
  update: (id: number, data: any) => request.put(`/admin/articles/${id}`, data),
  remove: (id: number) => request.delete(`/admin/articles/${id}`),
  updateStatus: (id: number, status: number) => request.put(`/admin/articles/${id}/status`, null, { params: { status } })
}

export const adminReviewApi = {
  list: (params: any) => request.get('/admin/reviews', { params }),
  remove: (id: number) => request.delete(`/admin/reviews/${id}`)
}

// ---------- 算法参数 ----------
export const adminAlgorithmApi = {
  list: () => request.get('/admin/algorithm'),
  update: (id: number, data: any) => request.put(`/admin/algorithm/${id}`, data),
  recalculate: () => request.post('/admin/algorithm/recalculate')
}

// ---------- 图片授权管理 ----------
export const adminImageLicenseApi = {
  list: (params: any) => request.get('/admin/image-licenses', { params }),
  detail: (id: number) => request.get(`/admin/image-licenses/${id}`),
  update: (id: number, data: any) => request.put(`/admin/image-licenses/${id}`, data),
  audit: (id: number, data: { action: string; reason?: string }) => request.post(`/admin/image-licenses/${id}/audit`, data)
}
