/**
 * 统一类型定义（与 backend 实际响应结构逐字段对齐，来源：阶段一审计 + 阶段二真实接口验证）
 */

/** 后端统一响应结构 { code, message, data } */
export interface Result<T> {
  code: number
  message: string
  data: T
}

/** 后端统一分页结构 { records, total, page, pageSize } */
export interface PageResult<T> {
  records: T[]
  total: number
  page: number
  pageSize: number
}

export interface User {
  id: number
  username: string
  nickname: string
  email: string
  phone: string
  avatar: string
  roles: string[]
  createdAt: string
}

/** POST /auth/login、/auth/register 返回（已实测字段） */
export interface LoginVO {
  token: string
  user: User
}

export interface Category {
  id: number
  name: string
  icon: string
  parentId: number
  sort: number
  status: number
}

export interface Brand {
  id: number
  name: string
  logo: string
  description: string
  status: number
}

export interface Tag {
  id: number
  name: string
  type: string
  createdAt?: string
}

/**
 * 商品参数可信度三态（业务红线，不得改写语义）：
 * - verified   已联网核验
 * - reference  型号级参考资料·未联网复核
 * - template   模板数据·非官方规格（缺失 verifyStatus 时按 template 处理）
 */
export type SpecVerifyStatus = 'verified' | 'reference' | 'template'

export interface ProductSpec {
  id: number
  specKey: string
  specLabel: string
  specValue: string
  sort: number
  sourceUrl?: string | null
  sourceType?: string | null
  verifyStatus?: SpecVerifyStatus | null
}

/** 图片署名信息（与 images 按 url 对应；后端只下发审核通过的图片） */
export interface ImageAttribution {
  url: string
  author?: string | null
  license?: string | null
  licenseUrl?: string | null
  sourcePageUrl?: string | null
  attributionText?: string | null
  modifications?: string | null
  matchType?: string | null
  source?: string | null
}

export interface Product {
  id: number
  name: string
  brandId: number
  categoryId: number
  description: string
  officialPrice: number
  currentPrice: number
  score: number
  /** 性价比评分；可信参数不足时为 null（数据不足，暂不评分）——已实测 id=13 返回 null */
  valueScore: number | null
  /** 性能分；无核验录入时为 null——已实测 id=1/13 返回 null */
  performanceScore: number | null
  userRating: number
  sales: number
  heat: number
  launchDate: string
  status: number
  brandName?: string
  categoryName?: string
  tags?: string[]
  specs?: ProductSpec[]
  images?: string[]
  imagesAttribution?: ImageAttribution[]
  reviews?: Review[]
  articles?: ReviewArticle[]
}

export interface ProductPrice {
  id: number
  productId?: number
  platformId: number
  platformName?: string
  title: string
  url: string
  price: number
  originalPrice: number
  discount: number
  shopName: string
  isOfficial: number
  stockStatus: number
  /** 报价更新时间（已实测返回 ISO 形式 "2026-09-25T17:34:04"） */
  updatedAt?: string
}

/** GET /prices/compare/{id}（已实测：prices 为空时各项为 0） */
export interface PriceCompare {
  prices: ProductPrice[]
  lowestPrice: number
  lowestPlatformId?: number
  lowestPlatformName: string
  highestPrice: number
  priceDiff: number
  saveAmount: number
}

export interface PriceHistoryPoint {
  id?: number
  price: number
  recordDate: string
  platformId?: number
  platformName?: string
  source?: string
}

/** GET /prices/history/{id}（history 为空数组时统计项全为 0，需前端做空状态） */
export interface PriceHistory {
  history: PriceHistoryPoint[]
  currentLowest: number
  historyLowest: number
  historyHighest: number
  averagePrice: number
  recentDrop: number
  recentDropRate: number
}

export interface Review {
  id: number
  productId: number
  userId?: number
  star: number
  content: string
  likeCount: number
  createdAt: string
  username?: string
  nickname?: string
  avatar?: string
}

export interface ReviewArticle {
  id: number
  title: string
  cover: string
  productId: number
  productName?: string
  author: string
  summary: string
  content: string
  score: number
  performanceScore: number
  appearanceScore: number
  screenScore: number
  batteryScore: number
  experience?: string
  pros: string
  cons: string
  views: number
  likes: number
  status?: number
  publishTime: string
}

/** GET /recommendations（已实测 type 实际取值：value / hot / hybrid） */
export interface Recommendation {
  productId: number
  name: string
  image: string | null
  price: number
  valueScore: number | null
  score: number
  reason: string
  type: string
}

/** GET /favorites（targetType：1=产品 2=测评） */
export interface FavoriteItem {
  id: number
  targetType: number
  targetId: number
  createdAt: string
  name: string
  image: string | null
  price: number | null
  valueScore: number | null
}

/** GET /history */
export interface BrowseHistoryItem {
  id: number
  productId: number
  viewedAt: string
  productName: string
  image: string | null
  price: number | null
  valueScore: number | null
}

/** 商品查询参数（与后端 ProductQueryDTO 对齐；sort 合法值见 SORT_OPTIONS） */
export interface ProductQuery {
  keyword?: string
  categoryId?: number
  brandId?: number
  tagId?: number
  minPrice?: number
  maxPrice?: number
  minValueScore?: number
  minRating?: number
  /** 传 null/undefined 表示默认排序（valueScore DESC, heat DESC） */
  sort?: string
  page?: number
  pageSize?: number
}

/** 后端 sort 合法值（源码 applySort 校验；非法值回落默认排序） */
export const SORT_OPTIONS = [
  { value: '', label: '综合排序' },
  { value: 'valueScore', label: '性价比最高' },
  { value: 'priceAsc', label: '价格最低' },
  { value: 'priceDesc', label: '价格最高' },
  { value: 'rating', label: '评分最高' },
  { value: 'heat', label: '热度最高' },
  { value: 'newest', label: '最新发布' },
] as const
