import request from './request'
import type {
  Brand, BrowseHistoryItem, Category, FavoriteItem, PageResult, PriceCompare,
  PriceHistory, Product, Recommendation, Review, ReviewArticle, User
} from '@/types'

// ---------- 认证 ----------
export const authApi = {
  login: (data: { username: string; password: string }) =>
    request.post('/auth/login', data),
  register: (data: { username: string; password: string; nickname: string; email: string }) =>
    request.post('/auth/register', data)
}

export const userApi = {
  info: () => request.get('/user/info'),
  updatePassword: (data: { oldPassword: string; newPassword: string }) =>
    request.put('/user/password', data)
}

// ---------- 分类 / 品牌 / 标签 ----------
export const categoryApi = {
  list: (): Promise<Category[]> => request.get('/categories')
}

export const brandApi = {
  list: (): Promise<Brand[]> => request.get('/brands')
}

// ---------- 产品 ----------
export const productApi = {
  list: (params: Record<string, any>): Promise<PageResult<Product>> =>
    request.get('/products', { params }),
  detail: (id: number): Promise<Product> => request.get(`/products/${id}`)
}

// ---------- 价格 ----------
export const priceApi = {
  compare: (productId: number): Promise<PriceCompare> =>
    request.get(`/prices/compare/${productId}`),
  history: (productId: number, platformId?: number): Promise<PriceHistory> =>
    request.get(`/prices/history/${productId}`, { params: { platformId } })
}

// ---------- 测评 ----------
// 测评列表页已下线：文章只出现在产品详情页的「相关测评 / 同品类测评」区块
export const articleApi = {
  detail: (id: number): Promise<ReviewArticle> => request.get(`/articles/${id}`),
  like: (id: number) => request.post(`/articles/${id}/like`)
}

// ---------- 评价 ----------
export const reviewApi = {
  listByProduct: (productId: number, page = 1, pageSize = 10): Promise<PageResult<Review>> =>
    request.get(`/reviews/product/${productId}`, { params: { page, pageSize } }),
  create: (data: { productId: number; star: number; content: string }) =>
    request.post('/reviews', data),
  delete: (id: number) => request.delete(`/reviews/${id}`),
  like: (id: number) => request.post(`/reviews/${id}/like`)
}

// ---------- 收藏 / 浏览历史 ----------
export const favoriteApi = {
  add: (targetType: number, targetId: number) =>
    request.post(`/favorites/${targetType}/${targetId}`),
  remove: (targetType: number, targetId: number) =>
    request.delete(`/favorites/${targetType}/${targetId}`),
  list: (page = 1, pageSize = 10): Promise<PageResult<FavoriteItem>> =>
    request.get('/favorites', { params: { page, pageSize } })
}

export const historyApi = {
  record: (productId: number) => request.post(`/history/${productId}`),
  list: (limit = 20): Promise<BrowseHistoryItem[]> =>
    request.get('/history', { params: { limit } }),
  clear: () => request.delete('/history')
}

// ---------- 推荐 ----------
export const recommendApi = {
  list: (): Promise<Recommendation[]> => request.get('/recommendations')
}

export type { User }
