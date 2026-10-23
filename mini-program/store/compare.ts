/**
 * 商品对比 store（本地）
 * ---------------------------------------------------------------
 * 业务规则（与 PC 端 store/compare.ts 一致）：
 * - 最多 4 个商品；
 * - 同一商品不允许重复添加；
 * - 必须同一 categoryId（跨品类禁止伪装成同类参数对比）。
 * 持久化：Storage（PC 端刷新即丢，小程序用 Storage 更符合移动端习惯，
 * 不改变任何后端业务语义）。
 */
import type { Product } from '../types'

const STORAGE_KEY = 'gp_compare'
const MAX_COMPARE = 4

export interface CompareStore {
  products: Product[]
  add(product: Product): { ok: boolean; message: string }
  remove(id: number): void
  clear(): void
  has(id: number): boolean
  count(): number
  load(): void
}

function readStorage(): Product[] {
  try {
    const list = wx.getStorageSync(STORAGE_KEY) as Product[] | string
    if (Array.isArray(list)) return list.filter((p) => p && typeof p.id === 'number')
    return []
  } catch {
    return []
  }
}

function writeStorage(products: Product[]): void {
  try {
    wx.setStorageSync(STORAGE_KEY, products)
  } catch {
    // Storage 满/异常不阻断业务（对比列表退化为内存态）
  }
}

export const compareStore: CompareStore = {
  products: readStorage(),

  add(product: Product) {
    if (compareStore.products.length >= MAX_COMPARE) {
      return { ok: false, message: `最多对比 ${MAX_COMPARE} 个商品` }
    }
    if (compareStore.has(product.id)) {
      return { ok: false, message: '该商品已在对比列表中' }
    }
    // 跨品类校验：与列表中第一个商品的分类一致才允许
    const first = compareStore.products[0]
    if (
      first &&
      first.categoryId &&
      product.categoryId &&
      first.categoryId !== product.categoryId
    ) {
      return { ok: false, message: '请选择相同品类的商品进行对比' }
    }
    // 对比页进入时会按需重新拉详情（含 specs），此处只持久化轻量字段，避免 Storage 超限
    const light = {
      id: product.id,
      name: product.name,
      brandId: product.brandId,
      categoryId: product.categoryId,
      brandName: product.brandName,
      categoryName: product.categoryName,
      currentPrice: product.currentPrice,
      officialPrice: product.officialPrice,
      score: product.score,
      valueScore: product.valueScore,
      performanceScore: product.performanceScore,
      userRating: product.userRating,
      images: product.images,
      imagesAttribution: product.imagesAttribution,
    } as Product
    compareStore.products.push(light)
    writeStorage(compareStore.products)
    return { ok: true, message: '已加入对比' }
  },

  remove(id: number) {
    compareStore.products = compareStore.products.filter((p) => p.id !== id)
    writeStorage(compareStore.products)
  },

  clear() {
    compareStore.products = []
    writeStorage([])
  },

  has(id: number) {
    return compareStore.products.some((p) => p.id === id)
  },

  count() {
    return compareStore.products.length
  },

  load() {
    compareStore.products = readStorage()
  },
}
