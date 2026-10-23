/**
 * 认证接口（依据后端 AuthController 实测字段）
 * 说明：后端无微信登录实现（阶段一 grep 确认 0 命中），仅支持账号密码。
 */
import { http } from './request'
import type {
  Brand,
  BrowseHistoryItem,
  Category,
  FavoriteItem,
  LoginVO,
  PageResult,
  PriceCompare,
  PriceHistory,
  Product,
  ProductQuery,
  Recommendation,
  Review,
  ReviewArticle,
} from '../types'

export const authApi = {
  /** POST /api/auth/login → { token, user } */
  login: (data: { username: string; password: string }) =>
    http.post<LoginVO>('/api/auth/login', data),

  /** POST /api/auth/register → { token, user } */
  register: (data: { username: string; password: string; nickname: string; email: string }) =>
    http.post<LoginVO>('/api/auth/register', data),
}

export const userApi = {
  /** GET /api/user/info（需登录；未登录时后端返回 HTTP 403） */
  info: () => http.get('/api/user/info'),

  /** PUT /api/user/password（需登录；oldPassword + newPassword 6-20） */
  updatePassword: (data: { oldPassword: string; newPassword: string }) =>
    http.put<void>('/api/user/password', data as unknown as Record<string, unknown>),
}

export const categoryApi = {
  /** GET /api/categories → Category[]（仅 status=1，已实测 16 条） */
  list: () => http.get<Category[]>('/api/categories'),
}

export const brandApi = {
  /** GET /api/brands → Brand[]（仅 status=1，已实测 60 条） */
  list: () => http.get<Brand[]>('/api/brands'),
}

export const productApi = {
  /**
   * GET /api/products → PageResult<Product>
   * 注意：列表项的 specs/reviews/articles 恒为 null（仅详情接口填充）；
   * pageSize 服务端上限 50；sort 空值走默认排序（valueScore DESC, heat DESC）。
   */
  list: (params: ProductQuery) => {
    // 空 sort 一律剔除（传空串也会走默认，剔除更干净）
    const query: Record<string, string | number | undefined> = { ...params }
    if (!query.sort) delete query.sort
    return http.get<PageResult<Product>>('/api/products', query)
  },

  /** GET /api/products/{id} → Product（含 specs/images/attribution/reviews/articles） */
  detail: (id: number) => http.get<Product>(`/api/products/${id}`),

  /**
   * GET /api/products/compare?ids=1,2 → Product[]（同品类对比，含 specs 全量）
   * 服务端强制品类一致：跨品类返回 code=400（已实测），前端以此为兜底校验。
   */
  compare: (ids: number[]) =>
    http.get<Product[]>(`/api/products/compare?ids=${ids.join(',')}`),
}

export const priceApi = {
  /** GET /api/prices/compare/{productId} → PriceCompare（各平台报价，模拟数据） */
  compare: (productId: number) => http.get<PriceCompare>(`/api/prices/compare/${productId}`),

  /** GET /api/prices/history/{productId} → PriceHistory（历史价格，模拟数据；history 可为空数组） */
  history: (productId: number) => http.get<PriceHistory>(`/api/prices/history/${productId}`),
}

export const recommendApi = {
  /** GET /api/recommendations → Recommendation[]（匿名=冷启动，登录=个性化；TOP 10） */
  list: () => http.get<Recommendation[]>('/api/recommendations'),
}

export const articleApi = {
  /**
   * GET /api/articles → PageResult<ReviewArticle>（仅 status=1，publishTime 降序）
   * 注意：productId 可为 null（当前库 32 篇全部为 null），cover 也可为 null。
   */
  list: (page = 1, pageSize = 10) =>
    http.get<PageResult<ReviewArticle>>('/api/articles', { page, pageSize }),

  /** GET /api/articles/{id}（副作用：views+1） */
  detail: (id: number) => http.get<ReviewArticle>(`/api/articles/${id}`),

  /**
   * POST /api/articles/{id}/like → null（likes+1）
   * 已实测：后端无登录校验、无去重、无回显"我是否已赞"（接口缺口，见报告），
   * 前端做乐观 +1（与 PC 端 ArticleDetailView 行为一致）。
   */
  like: (id: number) => http.post<void>(`/api/articles/${id}/like`),
}

export const reviewApi = {
  /**
   * GET /api/reviews/product/{productId} → PageResult<Review>
   * 含 username/nickname/avatar；无"我是否已赞"字段（缺口，不做点赞 UI）。
   */
  listByProduct: (productId: number, page = 1, pageSize = 10) =>
    http.get<PageResult<Review>>(`/api/reviews/product/${productId}`, { page, pageSize }),

  /** POST /api/reviews → null（需登录；star 1-5；未登录=HTTP403 或 code=401） */
  create: (data: { productId: number; star: number; content: string }) =>
    http.post<void>('/api/reviews', data as unknown as Record<string, unknown>),
}

export const favoriteApi = {
  /** POST /api/favorites/{targetType}/{targetId} → null（需登录；重复收藏幂等） */
  add: (targetType: number, targetId: number) =>
    http.post<void>(`/api/favorites/${targetType}/${targetId}`),

  /** DELETE /api/favorites/{targetType}/{targetId} → null（需登录） */
  remove: (targetType: number, targetId: number) =>
    http.delete<void>(`/api/favorites/${targetType}/${targetId}`),

  /** GET /api/favorites → PageResult<FavoriteItem>（需登录） */
  list: (page = 1, pageSize = 10) =>
    http.get<PageResult<FavoriteItem>>('/api/favorites', { page, pageSize }),
}

export const historyApi = {
  /** GET /api/history?limit=20 → BrowseHistoryItem[]（需登录；limit 上限 50） */
  list: (limit = 20) => http.get<BrowseHistoryItem[]>('/api/history', { limit }),

  /** DELETE /api/history → null（需登录；清空全部） */
  clear: () => http.delete<void>('/api/history'),

  /** POST /api/history/{productId} → null（需登录；同商品先删后插，静默调用） */
  record: (productId: number) => http.post<void>(`/api/history/${productId}`, undefined, true),
}
