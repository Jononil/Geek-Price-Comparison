# 产品图片视觉完善与占位图替换 · 实施报告

> 执行时间：2026-10-10
> 本轮完成：① 回滚 3 张易误导图片；② 实现类别 SVG 占位图组件；③ 标识 6 张系列参考图
> 未改数据库结构、未改搜索/推荐/比价/评分算法、未新增图片 API

---

## 一、修改的文件

### 新增（4 个）

| 文件 | 作用 |
|---|---|
| `frontend/src/components/ProductImage.vue` | **统一产品图片组件**：真实图优先 → 缺失/失败时显示类别 SVG + 「暂无实拍图」→ 命中映射时叠加「系列参考图」 |
| `frontend/src/utils/categoryGlyph.ts` | 16 类类别 SVG 图案库（自绘几何图形，无品牌标识、无外部 URL） |
| `frontend/src/utils/seriesReference.ts` | 系列参考图前端映射（productId + 完整 URL 双重精确匹配） |
| `verification/rollback-3-images.mjs` | 回滚脚本（事务 + 逐条核验，可复现） |

### 修改 — 前端（8 个图片入口 + 1 处样式）

| 文件 | 改动 |
|---|---|
| `frontend/src/components/ProductCard.vue` | `<img>` → `<ProductImage>`（覆盖**首页**与**产品列表**） |
| `frontend/src/views/ProductDetailView.vue` | `<img>` → `<ProductImage>`；移除已无用的 `mainImage`/`computed`；`.images img` 样式改 `:deep(.product-image)` |
| `frontend/src/views/RankingView.vue` | `<img>` → `<ProductImage>`；移除 `imageOf`/`placeholder` |
| `frontend/src/views/CompareView.vue` | `<img>` → `<ProductImage>`；移除 `imageOf`/`placeholder` |
| `frontend/src/views/RecommendView.vue` | `<img>` → `<ProductImage>`；移除硬编码 `placeholder` |
| `frontend/src/views/HomeView.vue` | 推荐卡片 `<img>` → `<ProductImage>`；移除硬编码 `placeholder` |
| `frontend/src/views/FavoritesView.vue` | 产品收藏走 `<ProductImage>`（测评收藏保留原 `<img>`，因其为文章封面） |
| `frontend/src/views/HistoryView.vue` | `<img>` → `<ProductImage>`；移除硬编码 `placeholder` |

### 修改 — 后端（3 处，均为既有方法内的一行逻辑修复）

| 文件 | 改动 |
|---|---|
| `RecommendationServiceImpl.java` | `firstImage()` 改为优先返回非 `placehold.co` 的真实图 |
| `FavoriteServiceImpl.java` | 同上 |
| `BrowseHistoryServiceImpl.java` | 同上 |

> **为何改这 3 处**：原实现是 `images.get(0).getUrl()`，而 `sort=0` 恒为占位图 → 这三页**即使有真实图也永远显示灰图**。这是本轮发现的既有缺陷，修复仅涉及方法内部取值顺序，**未改接口签名、未改 DTO、未改数据库**。

---

## 二、回滚图片核验结果

删除前**逐条核验** `id / product_id / sort / url` 四项全部匹配，且确认产品仍有占位图（不会失去所有图片）：

| id | product_id | 产品 | sort | URL 关键片段 | 核验 |
|---|---|---|---|---|---|
| 43065 | 5 | 小米 14 Ultra | 1 | `Xiaomi_14_%28July_10%2C_2026%29.jpg` | ✅ |
| 43066 | 8 | vivo X100 Ultra | 1 | `Vivo_X100_pic2.jpg` | ✅ |
| 43068 | 45 | 明基 PD2705U | 1 | `BENQ_MONITOR` | ✅ |

- 事务执行，事务内**守卫校验 7 项**（数量、记录已消失、products 不变、真实图数量、表数量、占位图保留等）
- 删除后三产品各保留 1 条占位图 ✅
- 未扩大删除范围，未触碰其他任何记录

---

## 三、SVG 分类覆盖情况

**16 / 16 全覆盖**（严格按数据库 `categories` 表真实名称映射）：

| 分类 | 结果 | 分类 | 结果 |
|---|---|---|---|
| 手机 | ✅ | 显卡 | ✅ |
| 平板电脑 | ✅ | CPU | ✅ |
| 笔记本电脑 | ✅ | 固态硬盘 | ✅ |
| 台式电脑 | ✅ | 内存 | ✅ |
| 显示器 | ✅ | 智能硬盘 | ✅ |
| 耳机 | ✅ | 智能手表 | ✅ |
| 键盘 | ✅ | 游戏机 | ✅ |
| 鼠标 | ✅ | 相机 | ✅ |
| | | 路由器 | ✅ |

图案库共定义 **32 个键**（含别名，如「笔记本」→「笔记本电脑」、「SSD」→「固态硬盘」），未识别分类回退到通用「数码产品」图案。

**视觉设计**：白色底 + 蓝色渐变（`#eff6ff`→`#dbeafe`→`#e0e7ff`）、线条稿 + 半透明装饰圆 + 细网格背景，与现有 Element Plus 页面风格一致；每类图案形状有区分度（手机/平板/笔记本/台式/显示器/CPU/显卡/内存/SSD/耳机/键盘/鼠标/相机/手表/游戏机/路由器）。

---

## 四、修改前后页面展示情况

| 页面 | 修改前 | 修改后 |
|---|---|---|
| 首页 | 16 张灰色 placehold.co | 真实图 8 张 + 类别 SVG 10 个（含「暂无实拍图」） |
| 产品列表 | 9 张灰图 | 真实图 4 张 + 类别 SVG 8 个 |
| 排行榜 | 8 张灰图 | 真实图 3 张 + 类别 SVG 7 个 |
| 产品详情 | 灰图为主 | 真实图优先；无图时 SVG + 「暂无实拍图」 |
| 对比页 | 灰图 | 同统一组件 |
| 推荐页 | 灰图（且**有真实图也显示灰图**） | 真实图优先（后端已修复）+ SVG 兜底 |
| 收藏/历史 | 灰图（同上有缺陷） | 真实图优先（后端已修复）+ SVG 兜底 |

**浏览器实测（headless Chrome，8 个页面）**：

```
首页           产品图组件 18 个：真实图 8（破损 0）、类别SVG 10；「暂无实拍图」10
产品列表       产品图组件 12 个：真实图 4（破损 0）、类别SVG 8；「暂无实拍图」8
排行榜         产品图组件 10 个：真实图 3（破损 0）、类别SVG 7；「暂无实拍图」7
详情 #1        真实图 1、SVG 0
详情 #9        真实图 0、SVG 1；「暂无实拍图」1
全页面控制台：无 error、无图片加载失败
```

**破损图片自动回退实测**（主动拦截 `*thumb.wikimedia.org*` 与 `*upload.wikimedia.org*` 模拟加载失败）：

```
产品图组件 12 个
仍用 <img> 的 = 0（其中破图 = 0）
已回退到类别 SVG 的 = 12
「暂无实拍图」标识 = 12
✅ 加载失败时自动回退，且无破图图标
```

且 `@error` 后置 `failed=true`，**不会反复触发加载错误**（父级切换产品时才重置）。

---

## 五、系列参考图标识是否正确

映射以**实际导入数据**为准（从数据库读取真实 URL，非编造），采用 `productId + URL 路径` 双重精确匹配（忽略会变化的 `utm_*` 查询参数）：

| productId | 产品 | 标识 | 核验 |
|---|---|---|---|
| 23 | MacBook Air M3 | 「系列参考图」 | ✅ 浏览器实测命中 |
| 48 | Bose QC Ultra | 「系列参考图」 | ✅ |
| 83 | 小米 Watch S3 | 「系列参考图」 | ✅ |
| 129 | TP-Link XDR6080 | 「系列参考图」 | ✅ |
| 130 | 华为 AX3 Pro | 「系列参考图」 | ✅ 浏览器实测命中 |
| 131 | 中兴 AX5400 Pro | 「系列参考图」 | ✅ |
| **122** | **金士顿骇客神条 32GB（EXACT）** | **无标识** | ✅ 浏览器实测为 `[""]` |

- 映射自测：**6/6 精确命中**，`#122` 确认不在映射内
- 未命中映射的图片按默认逻辑展示，**不会**被自动标成系列参考图
- 标识为图片左下角小角标（橙色 `#c2410c` + 浅橙底），不破坏现有布局

---

## 六、数据库验证结果

| 检查项 | 期望 | 实际 | 结果 |
|---|---|---|---|
| products | 132 | **132** | ✅ |
| product_images | 179 | **179** | ✅ |
| 真实图片 | 47 | **47** | ✅ |
| 数据库表数量 | 25 | **25** | ✅ |
| 本轮删除 | 3 | **3** | ✅ |
| 保留的本阶段图片 | 14（7 历史 + 6 系列 + 1 EXACT） | **14** | ✅ |
| product_images 结构 | id/product_id/url/sort | **未变** | ✅ |
| 其他历史数据 | 不变 | **未变**（逐行 id+pid+url+sort 比对 0 变更） | ✅ |

---

## 七、前端构建及测试结果

| 项目 | 结果 |
|---|---|
| `npx vue-tsc -b --force`（含 `--force` 强制全量类型检查） | ✅ **exit 0，无错误** |
| `npm run build`（`vue-tsc -b && vite build`） | ✅ **✓ built in 23.48s**，产物含 `ProductImage-DE6_VLlo.js` |
| 后端 `mvn -DskipTests compile` | ✅ exit 0 |
| 浏览器验收（8 页面 + 破损回退场景） | ✅ **全部通过** |
| 映射自测（16 类覆盖 + 6 系列映射 + DB 统计） | ✅ **全部通过** |

> 说明：本轮**未修改** `ProductImagePriceSyncTest` 所覆盖的同步逻辑，故按你"只运行与修改直接相关的测试"的要求未重复运行；该测试已于上一轮验证通过（9/9）。

---

## 八、尚未解决的问题

1. **品类信息在 3 个页面缺失** —— `RecommendationVO` / `FavoriteVO` / `BrowseHistoryVO` **均不含** `categoryName` 字段，因此推荐页、收藏页、历史页的 SVG 只能显示**通用「数码产品」图案**，无法显示具体类别图案。
   - 按你的要求"不为此大规模修改接口"，**未改 DTO**。
   - 如需精确类别：只需给 3 个 VO 各加一个 `categoryName` 字段并在 Service 中填充（约 6 行改动），属小范围接口变更 —— **等你确认后再做**。

2. **真实图片覆盖率仍为 47/132 ≈ 35.6%** —— 本轮目标是"视觉完善 + 真实准确"，未提升真实图片数量。类别 SVG 解决的是**观感**问题，剩余 85 个产品仍是示意图而非实拍。

3. **超大原图导致的加载延迟** —— 部分 Wikimedia 图仍为原图（如 6120×8160），首页实测需约 15 秒才能全部解码完成（期间显示为未加载态，但不会破图）。根治方式是把 `product_images.url` 换成 500px 缩略图版本 —— **涉及数据变更，未擅自执行**。

4. **排行榜/对比页/收藏页的 SVG 角标在小尺寸下较紧凑** —— 已尽量缩小字号（10px），但在 60×60 尺寸下仍偏小；如需可改为 hover 显示 tooltip。

---

## 九、本轮未做的事（自查）

- 未改数据库结构（`product_images` 仍 4 列，已核验）
- 未改 `products`、未改搜索/推荐/比价/评分算法
- 未新增图片 API、未重新扫描 Wikimedia、未访问 Openverse
- 未删除任何其他真实图片
- 未引入任何新依赖（SVG 全部自绘，使用项目已有 Vue 3 + Element Plus）
- 未访问外部图片 URL 作为类别示意图
- 未用其他品牌产品照片冒充类别示意图
- 未添加与本任务无关的功能
