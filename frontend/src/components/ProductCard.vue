<template>
  <div class="product-card" @click="$router.push(`/products/${product.id}`)">
    <div class="image-wrap">
      <ProductImage
        :images="product.images"
        :product-id="product.id"
        :alt="product.name"
      />
      <!-- 图片信息入口（点击查看署名） -->
      <el-popover placement="top-end" width="260" trigger="click" popper-class="img-info-popover">
        <template #reference>
          <button class="img-info-btn" title="图片来源与许可" @click.stop>ⓘ</button>
        </template>
        <ImageAttributionInfo :attribution="imageAttribution" />
      </el-popover>
      <div class="tags">
        <span v-if="(product.valueScore ?? 0) >= 90" class="tag value">高性价比</span>
        <span v-if="product.tags?.includes('降价')" class="tag discount">降价</span>
      </div>
    </div>

    <div class="info">
      <h3 class="name">{{ product.name }}</h3>
      <div class="brand">{{ product.brandName }} · {{ product.categoryName }}</div>

      <div class="score-row">
        <span class="score-pill" :class="{ empty: product.valueScore == null }">
          性价比 {{ product.valueScore ?? '—' }}
        </span>
        <span class="rating">评分 {{ product.userRating ?? '—' }}</span>
      </div>
      <div class="score-bar">
        <i :style="{ width: barWidth }"></i>
      </div>

      <div class="price">
        <span class="label">当前最低 <span class="data-hint">(模拟)</span></span>
        <span class="current gp-num">¥{{ product.currentPrice }}</span>
      </div>
    </div>

    <div class="actions" @click.stop>
      <el-button size="small" @click="addCompare">加入对比</el-button>
      <el-button size="small" type="primary" @click="$router.push(`/products/${product.id}`)">查看详情</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { Product } from '@/types'
import { useCompareStore } from '@/store/compare'
import ProductImage from '@/components/ProductImage.vue'
import ImageAttributionInfo from '@/components/ImageAttributionInfo.vue'
import { pickProductImage } from '@/utils/image'

const props = defineProps<{ product: Product }>()
const compareStore = useCompareStore()

// 当前展示图对应的署名信息
const imageAttribution = computed(() => {
  const list = props.product.imagesAttribution
  if (!list || list.length === 0) return null
  const url = pickProductImage(props.product.images)
  return list.find((a) => a.url === url) ?? null
})

// 评分条：无评分时显示为 0，不伪造数值
const barWidth = computed(() => {
  const v = props.product.valueScore
  if (v == null) return '0%'
  return `${Math.max(0, Math.min(100, v))}%`
})

function addCompare() {
  const ok = compareStore.addProduct(props.product)
  if (ok) {
    ElMessage.success('已加入对比')
  }
  // 失败时由 store 内部 ElMessage 提示具体原因
}
</script>

<style scoped>
.product-card {
  background: var(--gp-card);
  border: 1px solid var(--gp-line);
  border-radius: var(--gp-radius);
  overflow: hidden;
  cursor: pointer;
  box-shadow: var(--gp-shadow);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-3px);
  border-color: #c7d2fe;
  box-shadow: 0 18px 40px -22px rgba(30, 41, 59, 0.4);
}

.image-wrap {
  position: relative;
  aspect-ratio: 4 / 3;
  background: linear-gradient(150deg, #fbfcfe, #e9eef6);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-bottom: 1px solid #f1f5f9;
}

/* 统一图池的交互：悬停轻微推近，保持各卡片节奏一致 */
.product-card:hover .image-wrap :deep(.pi-img) {
  transform: scale(1.045);
}

.img-info-btn {
  position: absolute;
  right: 6px;
  bottom: 6px;
  z-index: 3;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: #64748b;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transition: color 0.15s;
}

.img-info-btn:hover {
  color: var(--gp-brand);
}

.image-wrap img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.tags {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 4px;
}

.tag {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  backdrop-filter: blur(4px);
}

.tag.value {
  background: var(--gp-ok-soft);
  color: var(--gp-ok);
  border: 1px solid #bbf7d0;
}

.tag.discount {
  background: var(--gp-warn-soft);
  color: var(--gp-warn);
  border: 1px solid #fde68a;
}

.info {
  padding: 14px 14px 10px;
  flex: 1;
}

.name {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--gp-ink);
  line-height: 1.4;
  height: 40px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.brand {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.score-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.score-pill {
  font-size: 12px;
  font-weight: 800;
  color: var(--gp-ok);
  background: var(--gp-ok-soft);
  border: 1px solid #bbf7d0;
  border-radius: 7px;
  padding: 2px 8px;
}

.score-pill.empty {
  color: var(--gp-muted);
  background: #f1f5f9;
  border-color: var(--gp-line);
}

.rating {
  font-size: 12px;
  color: var(--gp-muted);
}

.score-bar {
  height: 4px;
  border-radius: 99px;
  background: var(--gp-brand-soft);
  overflow: hidden;
  margin-top: 8px;
}

.score-bar i {
  display: block;
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, var(--gp-brand), var(--gp-cyan));
  transition: width 0.4s ease;
}

.price {
  margin-top: 10px;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.label {
  font-size: 12px;
  color: #9ca3af;
}

.data-hint {
  font-size: 10px;
  color: #cbd5e1;
}

.current {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #111827;
}

.actions {
  padding: 0 14px 14px;
  display: flex;
  gap: 8px;
}

.actions .el-button {
  flex: 1;
}
</style>
