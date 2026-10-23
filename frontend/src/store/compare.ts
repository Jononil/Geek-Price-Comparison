import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { Product } from '@/types'

const STORAGE_KEY = 'gp:compare:products'

/** 从本地恢复对比列表；解析失败按空列表处理，不让脏数据卡住页面 */
function loadSaved(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export const useCompareStore = defineStore('compare', () => {
  // 存的是加入时的快照；价格变动后对比页展示的仍是当时的报价
  const products = ref<Product[]>(loadSaved())

  watch(
    products,
    (val) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
      } catch {
        // 隐私模式或超出配额：忽略持久化，不影响当前会话使用
      }
    },
    { deep: true }
  )

  function addProduct(product: Product): boolean {
    if (products.value.length >= 4) {
      ElMessage.warning('最多对比 4 个产品')
      return false
    }
    if (products.value.some((p) => p.id === product.id)) {
      ElMessage.warning('该产品已在对比列表中')
      return false
    }
    // 跨品类校验：同一具体分类才能对比
    if (products.value.length > 0) {
      const first = products.value[0]
      if (first.categoryId && product.categoryId && first.categoryId !== product.categoryId) {
        ElMessage.error('请选择相同品类的商品进行对比')
        return false
      }
    }
    products.value.push(product)
    return true
  }

  function removeProduct(id: number) {
    products.value = products.value.filter((p) => p.id !== id)
  }

  function clear() {
    products.value = []
  }

  return { products, addProduct, removeProduct, clear }
})
