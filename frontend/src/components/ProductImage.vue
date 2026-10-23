<template>
  <div class="product-image">
    <!-- 真实图片：加载失败时自动切到空态，且不再重复触发错误 -->
    <img
      v-if="!showFallback && resolvedSrc"
      :src="resolvedSrc"
      :alt="alt"
      class="pi-img"
      @error="onError"
      @load="onLoad"
    />

    <!-- 空态：无合格真实图片时明确为空（不画任何可能被误认为商品实拍的图案） -->
    <div v-else class="pi-empty" role="img" aria-label="暂无实拍图">
      <svg viewBox="0 0 48 48" class="pi-empty-icon" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <!-- 通用"图片缺失"图标：相框 + 斜杠，与任何商品类别无关 -->
        <rect x="6" y="10" width="36" height="28" rx="3" fill="none" stroke="currentColor" stroke-width="2.5" />
        <circle cx="17" cy="20" r="3.5" fill="none" stroke="currentColor" stroke-width="2.5" />
        <path d="M10 34 L20 24 L27 31 L33 25 L40 32" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        <line x1="8" y1="40" x2="40" y2="8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      </svg>
      <span class="pi-empty-text">暂无实拍图</span>
    </div>

    <!-- 真实图片 + 系列参考图标识 -->
    <span v-if="!showFallback && resolvedSrc && seriesTag" class="pi-badge pi-badge--series">系列参考图</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { pickProductImage, isPlaceholderImage } from '@/utils/image'
import { isSeriesReferenceImage } from '@/utils/seriesReference'

/**
 * 统一的产品图片展示组件
 * ---------------------------------------------------------------
 * 展示规则（与后端 ProductImageLicenseService 统一门控一致）：
 *   1. 只展示后端下发的真实图片（后端已过滤未授权/待审核/拒绝/有风险的图片）；
 *   2. 无合格真实图片 或 图片加载失败 → 显示明确空态（"暂无实拍图"），
 *      不使用类别 SVG/占位图等可能被误认为商品实拍的兜底图；
 *   3. 图片加载失败后切换空态且不再重复触发 error。
 *
 * 另外：命中「系列参考图」映射时，在图片上叠加轻量标识。
 */
const props = withDefaults(
  defineProps<{
    /** 产品图片 URL 数组（后端 images 字段） */
    images?: string[] | null
    /** 直接指定单个 URL（推荐位/收藏等场景可能已给出单张图） */
    src?: string | null
    /** 产品 id，用于系列参考图精确匹配 */
    productId?: number | null
    alt?: string
  }>(),
  { images: null, src: null, productId: null, alt: '' }
)

// 加载失败后永久切到空态，避免反复报错
const failed = ref(false)

/** 候选真实图：优先 src，其次 images 中的非占位图 */
const candidate = computed(() => {
  if (props.src && !isPlaceholderImage(props.src)) return props.src
  return pickProductImage(props.images)
})

const resolvedSrc = computed(() => {
  const c = candidate.value
  return c && !isPlaceholderImage(c) ? c : ''
})

const showFallback = computed(() => failed.value || !resolvedSrc.value)

// 父级切换产品时重置失败态
watch(
  () => [props.src, props.images] as const,
  () => { failed.value = false }
)

function onError() { failed.value = true }
function onLoad() { failed.value = false }

/** 系列参考图标识：仅当命中 productId + 完整 URL 映射时显示 */
const seriesTag = computed(() =>
  !showFallback.value && props.productId != null
    ? isSeriesReferenceImage(props.productId, resolvedSrc.value)
    : false
)
</script>

<style scoped>
/* 统一图池：所有商品图共用同一套画布语言
   - 固定浅灰渐变底，抵消各图源背景差异
   - 图片与容器同尺寸（cover），由父容器控制比例
   - 悬停缩放交给父组件，这里只提供过渡 */
.product-image {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(150deg, #fbfcfe 0%, #f1f4f9 52%, #e9eef6 100%);
  overflow: hidden;
}
.pi-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1), filter 0.3s ease;
}
/* 轻微统一色调：各图源白平衡不一致时拉回同一观感 */
.pi-img {
  filter: saturate(1.04) contrast(1.02);
}
/* 中性空态：浅灰底 + 通用图片缺失图标 + 明确文案，不与任何商品混淆 */
.pi-empty {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #f8fafc;
  color: #cbd5e1;
}
.pi-empty-icon {
  width: 40%;
  max-width: 56px;
  min-width: 28px;
  height: auto;
  opacity: 0.85;
}
.pi-empty-text {
  font-size: 12px;
  color: #9ca3af;
  letter-spacing: 1px;
}
.pi-badge {
  position: absolute;
  right: 6px;
  top: 6px;
  z-index: 2;
  font-size: 10px;
  line-height: 1;
  padding: 4px 7px;
  border-radius: 5px;
  white-space: nowrap;
  letter-spacing: 0.2px;
  backdrop-filter: blur(2px);
}
.pi-badge--series {
  background: rgba(255, 247, 237, 0.94);
  color: #c2410c;
  border: 1px solid #fed7aa;
  font-weight: 600;
}
</style>
