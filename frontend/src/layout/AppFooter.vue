<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="brand">
        <span class="logo-text">极客比价</span>
        <p>面向数码消费者的智能比价与测评聚合平台，提供多平台价格对比、历史价格分析、性价比评分与个性化推荐。</p>
      </div>
      <div class="col">
        <h4>热门分类</h4>
        <a>手机</a><a>笔记本</a><a>平板</a><a>耳机</a><a>显卡</a>
      </div>
      <div class="col">
        <h4>功能</h4>
        <a>产品对比</a><a>排行榜</a><a>专业测评</a><a>智能推荐</a>
      </div>
    </div>
    <div class="copyright">© 2026 极客比价 GeekPrice · 毕业设计项目</div>
  </footer>
</template>

<script setup lang="ts">
</script>

<style scoped>
.footer {
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
  margin-top: 48px;
}
.footer-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 24px;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 40px;
}
.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #2563eb;
}
.brand p {
  color: #6b7280;
  font-size: 13px;
  line-height: 1.6;
  margin-top: 8px;
  max-width: 420px;
}
.col h4 {
  font-size: 14px;
  margin-bottom: 12px;
  color: #1f2937;
}
.col a {
  display: block;
  color: #6b7280;
  font-size: 13px;
  margin-bottom: 8px;
  cursor: pointer;
}
.copyright {
  text-align: center;
  padding: 16px;
  color: #9ca3af;
  font-size: 12px;
  border-top: 1px solid #e5e7eb;
}
</style>
