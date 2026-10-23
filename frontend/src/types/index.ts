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

export interface ProductSpec {
  id: number
  specKey: string
  specLabel: string
  specValue: string
  sort: number
  /** 参数来源 URL（仅核验/参考资料可有；模板参数不得填写） */
  sourceUrl?: string | null
  /** 来源类型：official / reference_db / internal_knowledge */
  sourceType?: string | null
  /** 核验状态：verified（已联网核验）/ reference（型号级参考资料·未复核）/ template（模板数据·非真实参数） */
  verifyStatus?: string | null
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
  /** 性价比评分；可信参数不足时为 null（数据不足，暂不评分） */
  valueScore: number | null
  /** 性能分；无核验录入时为 null（暂无可靠数据） */
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
  /** 图片署名信息（与 images 按 url 对应；后端只下发审核通过的图片） */
  imagesAttribution?: ImageAttribution[]
  /** 该产品的专属测评（详情接口下发，最多 5 篇） */
  articles?: ReviewArticle[]
  /** 同品类兜底测评：仅当没有专属测评时下发（最多 3 篇），展示时须标注为同品类 */
  relatedArticles?: ReviewArticle[]
}

/** 图片署名信息（用于展示作者/许可/来源） */
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

export interface ProductPrice {
  id: number
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
}

export interface PriceCompare {
  prices: ProductPrice[]
  lowestPrice: number
  lowestPlatformName: string
  highestPrice: number
  priceDiff: number
  saveAmount: number
}

export interface PriceHistoryPoint {
  id: number
  price: number
  recordDate: string
  platformName: string
}

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
  userId: number
  star: number
  content: string
  likeCount: number
  createdAt: string
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
  pros: string
  cons: string
  views: number
  likes: number
  /** 原文发布时间；外部收录的文章可能为空 */
  publishTime: string | null
}

export interface Recommendation {
  productId: number
  name: string
  image: string
  price: number
  valueScore: number
  score: number
  reason: string
  type: string
}

export interface FavoriteItem {
  id: number
  targetType: number
  targetId: number
  createdAt: string
  name: string
  image: string
  price: number
  valueScore: number
}

export interface BrowseHistoryItem {
  id: number
  productId: number
  viewedAt: string
  productName: string
  image: string
  price: number
  valueScore: number
}

export interface PageResult<T> {
  records: T[]
  total: number
  page: number
  pageSize: number
}
