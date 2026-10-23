<template>
  <!-- 详细模式：详情页图片下方的署名面板 -->
  <div v-if="detailed" class="attr-panel">
    <template v-if="attribution">
      <div class="attr-row"><span class="attr-label">作者</span><span>{{ attribution.author || '未标注' }}</span></div>
      <div class="attr-row">
        <span class="attr-label">许可</span>
        <a v-if="attribution.licenseUrl" :href="attribution.licenseUrl" target="_blank" rel="noopener noreferrer">{{ attribution.license || '未知许可' }}</a>
        <span v-else>{{ attribution.license || '未知许可' }}</span>
      </div>
      <div class="attr-row">
        <span class="attr-label">来源</span>
        <a v-if="attribution.sourcePageUrl" :href="attribution.sourcePageUrl" target="_blank" rel="noopener noreferrer">{{ sourceLabel(attribution) }} 原始页面</a>
        <span v-else>未知来源</span>
      </div>
      <div v-if="attribution.modifications" class="attr-row"><span class="attr-label">说明</span><span>{{ attribution.modifications }}</span></div>
    </template>
    <!-- 无署名信息时不伪装合规，如实说明 -->
    <div v-else class="attr-row attr-missing">该图片暂无授权署名信息</div>
  </div>

  <!-- 紧凑模式：卡片/列表中的 popover 内容 -->
  <div v-else class="attr-compact">
    <template v-if="attribution">
      <div class="attr-compact-title">图片来源与许可</div>
      <div class="attr-compact-row">作者：{{ attribution.author || '未标注' }}</div>
      <div class="attr-compact-row">
        许可：
        <a v-if="attribution.licenseUrl" :href="attribution.licenseUrl" target="_blank" rel="noopener noreferrer">{{ attribution.license || '未知许可' }}</a>
        <span v-else>{{ attribution.license || '未知许可' }}</span>
      </div>
      <div class="attr-compact-row">
        来源：
        <a v-if="attribution.sourcePageUrl" :href="attribution.sourcePageUrl" target="_blank" rel="noopener noreferrer">{{ sourceLabel(attribution) }}</a>
        <span v-else>未知来源</span>
      </div>
      <div v-if="attribution.modifications" class="attr-compact-row">说明：{{ attribution.modifications }}</div>
      <div v-if="attribution.matchType === 'SERIES_LEVEL'" class="attr-compact-warn">⚠ 该图为系列参考图，非精确型号实拍</div>
    </template>
    <div v-else class="attr-compact-missing">该图片暂无授权署名信息</div>
  </div>
</template>

<script setup lang="ts">
import type { ImageAttribution } from '@/types'

/**
 * 图片署名展示（唯一实现，卡片/排行/对比/详情共用）。
 * - detailed=true：详情页完整面板
 * - detailed=false：卡片等场景的紧凑气泡内容
 * 无署名信息时如实显示「暂无授权署名信息」，不用默认文字伪装合规。
 */
defineProps<{
  attribution?: ImageAttribution | null
  detailed?: boolean
}>()

/** 按数据里的 source 字段显示真实图源，不写死 */
function sourceLabel(a: ImageAttribution): string {
  const map: Record<string, string> = {
    pexels: 'Pexels',
    wikimedia_commons: 'Wikimedia Commons',
    unsplash: 'Unsplash',
    pixabay: 'Pixabay'
  }
  return map[(a.source || '').toLowerCase()] ?? '原始'
}
</script>

<style scoped>
.attr-panel {
  margin-top: 10px;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.9;
}
.attr-row .attr-label {
  display: inline-block;
  width: 42px;
  color: #9ca3af;
}
.attr-panel a {
  color: #2563eb;
  text-decoration: none;
  word-break: break-all;
}
.attr-panel a:hover { text-decoration: underline; }
.attr-missing { color: #9ca3af; }

.attr-compact { font-size: 12px; color: #6b7280; line-height: 1.8; }
.attr-compact-title { font-weight: 600; color: #374151; margin-bottom: 4px; }
.attr-compact-row a { color: #2563eb; text-decoration: none; }
.attr-compact-row a:hover { text-decoration: underline; }
.attr-compact-warn { margin-top: 4px; color: #c2410c; font-weight: 600; }
.attr-compact-missing { color: #9ca3af; }
</style>
