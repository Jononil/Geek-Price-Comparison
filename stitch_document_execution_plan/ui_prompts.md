# UI 原型图提示词 (UI Prompts)

本文档包含根据产品需求文档（Product-Spec.md）生成的原型图提示词，可用于 Midjourney、DALL-E、Stable Diffusion 等工具生成设计稿。

> 提示词主体使用英文（图像生成工具对英文理解更准确），界面文案（UI text）明确标注为简体中文。

---

## 设计风格与配色

**视觉风格**：Modern Minimalist（现代极简）+ 卡片式布局

**风格说明**：目标用户是「半懂参数的普通消费者」，界面必须降低认知负担——简洁留白、卡片分区、结论前置（先给最低价/性价比，再给细节）。科技蓝 + 白底浅灰符合数码产品网站调性，避免大面积渐变与花哨动画（与《总控》第 26 条一致）。

**配色方案**：
- **主色**：#2563EB（科技蓝）- 品牌主色、主按钮、链接、选中态、导航高亮
- **辅助色**：#F5F7FA（浅灰）- 页面背景、分区底、次级容器
- **强调色**：#F97316（橙）- 降价、最低价、促销、「今日降价」标签
- **强调色**：#10B981（绿）- 高性价比、评分高、正向指标
- **背景色**：#FFFFFF（白）- 卡片背景、主内容区；文字 #1F2937，次级文字 #6B7280

---

## 核心 UI 提示词

### 界面 1：首页（Home） - 版本 A

**功能描述**：极客比价首页，聚合 Hero 搜索、热门分类、高性价比推荐、今日降价、热门产品、最新测评、性价比排行榜、个性化推荐，是用户第一入口。

**提示词**：
```
A modern minimalist e-commerce homepage for a Chinese digital product price comparison website named "极客比价" (Geek Price Comparison), desktop web app, 1920x1080, 16:9.

Visual style: clean, card-based layout, whitespace, subtle shadows, rounded corners, tech-blue accents. UI text in Simplified Chinese.

Layout (top to bottom):
1. Top navigation bar: white background, logo "极客比价" on left in bold tech-blue #2563EB, center nav menu (首页 / 找产品 / 产品对比 / 测评 / 排行榜), right side a search input box and a login/user avatar.
2. Hero search section: light gray #F5F7FA background, large bold headline, centered large search bar with a blue search button, below it a row of hot search keyword chips.
3. Hot categories: a grid of category icon cards (手机 / 平板 / 笔记本 / 显示器 / 耳机 / 键盘 / 鼠标 / 相机) with small rounded icons.
4. High value-for-money recommendation: section title + a horizontal row of product cards.
5. Today's price drop: product cards with orange #F97316 "降价" badges.
6. Hot products grid + latest reviews list + value-score ranking list in a multi-column layout.
7. Personalized recommendation row at the bottom.

Product card elements: product image, name, brand, current lowest price "当前最低 ¥xxxx" in bold, comprehensive score, value-for-money score with a green #10B981 badge, tags like "高性价比 / 近期降价 / 热门 / 编辑推荐".

Color scheme: primary #2563EB, background #FFFFFF, secondary #F5F7FA, accent #F97316, success #10B981.

Interaction: card hover lifts with soft shadow, buttons darken on hover, search box highlights border on focus.

Quality: professional, polished, high-quality, clean, modern, intuitive, award-winning UI design.
```

**使用建议**：Midjourney 参数建议 `--ar 16:9 --style raw`；用于确定首页整体视觉基调，作为后续所有页面的风格基准。

---

### 界面 1：首页（Home） - 版本 B

**功能描述**：深色科技感变体，深蓝黑背景 + 霓虹蓝高亮，更适合突出「极客」气质，但偏离总控「白色为主」约束，作为备选。

**提示词**：
```
A dark-mode tech homepage for a Chinese digital product price comparison website named "极客比价", desktop web app, 1920x1080, 16:9.

Visual style: dark theme, high contrast, neon blue accents, card-based, rounded corners, moody tech atmosphere. UI text in Simplified Chinese.

Layout: dark navy background #0F172A, top navigation with glowing blue logo, centered hero search bar with neon blue glow, category icon grid, product cards on dark #1E293B cards with thin blue borders, price in bright cyan, value-score badge in green #10B981, price-drop badge in orange #F97316.

Interaction: cards glow on hover, buttons with subtle neon glow.

Color scheme: background #0F172A, card #1E293B, primary neon blue #3B82F6, accent #F97316, success #10B981, text #E5E7EB.

Quality: professional, polished, high-quality, modern, moody, tech-forward.
```

**使用建议**：仅在用户偏好深色主题时采用；与总控「白色为主」冲突，默认不选。

---

### 界面 2：产品列表 / 搜索结果页 - 版本 A

**功能描述**：搜索/筛选结果页，顶部筛选栏 + 产品卡片网格 + 分页，是「找产品」的主界面。

**提示词**：
```
A product listing / search result page for a Chinese digital product price comparison website, desktop web app, 1920x1080, 16:9.

Visual style: modern minimalist, card-based, white background, tech-blue accents, clean. UI text in Simplified Chinese.

Layout:
1. Top navigation bar (logo + nav + search + avatar).
2. Breadcrumb + result count "共 128 个产品".
3. Horizontal filter bar: category dropdown, brand dropdown, price range input, value-score range, user rating, tag multi-select, and a sort dropdown (综合排序 / 性价比最高 / 价格最低 / 价格最高 / 用户评分最高 / 热度最高 / 最新发布).
4. Product card grid: 4 columns, each card shows product image, name, brand, tags, current lowest price in bold orange, comprehensive score, value-for-money score badge.
5. Pagination at bottom center.

Color scheme: primary #2563EB, background #F5F7FA, cards #FFFFFF, accent #F97316, success #10B981.

Interaction: filter controls with dropdown states, product cards hover lift with shadow, active filter chips show blue outline.

Quality: professional, polished, high-quality, clean, intuitive, data-dense but readable.
```

**使用建议**：`--ar 16:9 --style raw`；重点验证筛选栏布局和产品卡片信息密度。

---

### 界面 2：产品列表 / 搜索结果页 - 版本 B

**功能描述**：左侧固定筛选侧栏 + 右侧卡片列表的变体，筛选条件多时更清晰。

**提示词**：
```
A product listing page for a Chinese digital price comparison website with a left sidebar filter panel, desktop web app, 1920x1080, 16:9.

Visual style: modern minimalist, card-based, white background, tech-blue accents. UI text in Simplified Chinese.

Layout:
1. Top navigation bar.
2. Left fixed filter sidebar (width ~280px): sections for 分类 / 品牌 / 价格区间 / 性价比 / 用户评分 / 标签, each with checkboxes or sliders, a blue "应用筛选" button and a "重置" button.
3. Right content area: sort dropdown on top, 3-column product card grid, pagination at bottom.

Color scheme: primary #2563EB, background #F5F7FA, sidebar #FFFFFF, accent #F97316, success #10B981.

Interaction: sidebar checkboxes with blue check marks, price slider, cards hover lift.

Quality: professional, polished, high-quality, clean, intuitive.
```

**使用建议**：筛选维度多（价格/评分/标签）时推荐此版本。

---

### 界面 3：产品详情页 - 版本 A

**功能描述**：最重要的页面，聚合产品图、参数、评分、多平台比价、历史价格曲线、测评、评价、相似推荐。

**提示词**：
```
A product detail page for a Chinese digital price comparison website, desktop web app, 1920x1080, 16:9.

Visual style: modern minimalist, card-based, white background, tech-blue accents. UI text in Simplified Chinese.

Layout:
1. Top navigation bar.
2. Product overview area (3 columns):
   - Left: large product image with thumbnail gallery.
   - Middle: product name, brand, category, tags, short intro, comprehensive score (star rating), value-for-money score with green badge, core specs table, pros list (green check icons), cons list (orange/red icons).
   - Right: sticky price card showing multi-platform price comparison table (京东 / 淘宝 / 拼多多 rows with platform name, price, shop, 自营 badge, 库存状态), highlighted "全网最低价 ¥xxx" in large orange, "相比最高价节省 ¥xx", a line chart (ECharts) of historical price trend with "当前最低价 / 历史最低价 / 历史最高价 / 近30天降价", and two buttons "收藏" (outline) and "加入对比" (filled blue).
3. Below: tabs for 专业测评 / 用户评价 / 相似产品 / 推荐产品, with review list and article cards.

Color scheme: primary #2563EB, background #F5F7FA, cards #FFFFFF, accent #F97316, success #10B981.

Interaction: price card sticky on scroll, chart hover shows tooltip, tab switching, favorite button toggles state.

Quality: professional, polished, high-quality, clean, information-rich, award-winning UI design.
```

**使用建议**：这是核心页面，建议用最高质量参数生成多张对比；重点检查右侧价格卡片的信息层级。

---

### 界面 3：产品详情页 - 版本 B

**功能描述**：单栏滚动式变体，比价和历史价格移到参数下方，强调阅读流畅性。

**提示词**：
```
A single-column scrolling product detail page for a Chinese digital price comparison website, desktop web app, 1920x1080, 16:9.

Visual style: modern minimalist, white background, tech-blue accents, generous whitespace. UI text in Simplified Chinese.

Layout (top to bottom):
1. Top navigation bar.
2. Two-column hero: left product image gallery, right title + brand + tags + score + value-for-money badge + short intro.
3. Price comparison section: a highlighted card with multi-platform price table and "全网最低价" summary.
4. Historical price trend chart (line chart) in a full-width card.
5. Core specs table, pros and cons.
6. Reviews and articles sections.
7. Similar and recommended products row.

Color scheme: primary #2563EB, background #FFFFFF, accent #F97316, success #10B981.

Interaction: smooth scroll anchors, hover tooltips on chart, tab-like section anchors.

Quality: professional, polished, high-quality, clean, readable.
```

**使用建议**：信息多、需要长页面滚动阅读时推荐；移动端适配更好。

---

### 界面 4：登录 / 注册页 - 版本 A

**功能描述**：居中卡片式登录/注册表单，含用户名/密码/昵称/邮箱字段。

**提示词**：
```
A clean login and registration page for a Chinese digital product price comparison website, desktop web app, 1920x1080, 16:9.

Visual style: modern minimalist, centered card, light gray background, tech-blue accents. UI text in Simplified Chinese.

Layout: light gray #F5F7FA full-page background, centered white card with rounded corners and soft shadow, logo "极客比价" on top, tab switch "登录 / 注册", form fields (用户名 / 密码 / 昵称 / 邮箱) with labels and input boxes, a filled blue submit button, a link "忘记密码", social or secondary hint text below.

Color scheme: primary #2563EB, background #F5F7FA, card #FFFFFF, text #1F2937, error red #EF4444.

Interaction: input focus blue border, button hover darken, password show/hide toggle, form validation error messages in red.

Quality: professional, polished, high-quality, clean, trustworthy.
```

**使用建议**：`--ar 16:9`；确认表单字段布局与登录/注册切换方式。

---

### 界面 4：登录 / 注册页 - 版本 B

**功能描述**：左品牌区 + 右表单的分屏变体，科技感更强。

**提示词**：
```
A split-screen login page for a Chinese digital product price comparison website, desktop web app, 1920x1080, 16:9.

Visual style: modern minimalist, split layout. UI text in Simplified Chinese.

Layout: left half tech-blue #2563EB gradient-lite panel with logo, product slogan, and abstract digital device illustrations; right half white panel with centered login/register form, fields, and blue submit button.

Color scheme: primary #2563EB, background #FFFFFF, accent #F97316, text #1F2937.

Interaction: input focus states, button hover, tab switch between login and register.

Quality: professional, polished, high-quality, modern, branded.
```

**使用建议**：品牌感更强，适合作为登录页主视觉备选。

---

### 界面 5：产品对比页 - 版本 A

**功能描述**：2-4 个产品并排表格对比，按品类动态展示参数。

**提示词**：
```
A product comparison page for a Chinese digital product price comparison website, desktop web app, 1920x1080, 16:9.

Visual style: modern minimalist, table-based comparison, white background, tech-blue accents. UI text in Simplified Chinese.

Layout:
1. Top navigation bar.
2. Comparison table: first column is parameter labels (产品 / 图片 / 价格 / 品牌 / 分类 / 屏幕 / CPU / GPU / 内存 / 存储 / 电池 / 重量 / 摄像头 / 性能评分 / 用户评分 / 性价比评分), next 2-4 columns each represent one product with image, name, and values. The lowest price cell highlighted in orange, highest value-score highlighted in green.
3. Each product column has a "移除" button and an "AI 总结对比" button at the top.

Color scheme: primary #2563EB, background #F5F7FA, table #FFFFFF, accent #F97316, success #10B981.

Interaction: sticky first column on horizontal scroll, highlight best value in each row, hover row highlight.

Quality: professional, polished, high-quality, clean, data-dense, readable.
```

**使用建议**：重点检查表格可读性与「最优项高亮」的视觉表现。

---

### 界面 5：产品对比页 - 版本 B

**功能描述**：卡片并排对比变体，视觉更轻量。

**提示词**：
```
A card-based product comparison page for a Chinese digital product price comparison website, desktop web app, 1920x1080, 16:9.

Visual style: modern minimalist, side-by-side cards. UI text in Simplified Chinese.

Layout: 2-4 large product cards side by side, each card contains product image, name, price, score badges, and a vertical list of key specs, best-value items marked with green check highlights, "AI 总结对比" button below.

Color scheme: primary #2563EB, background #F5F7FA, cards #FFFFFF, accent #F97316, success #10B981.

Interaction: card hover lift, compare highlight animations.

Quality: professional, polished, high-quality, clean, modern.
```

**使用建议**：产品数量少（2-3 个）时推荐；4 个产品时表格版更清晰。

---

### 界面 6：测评详情页 - 版本 A

**功能描述**：专业测评文章页，含封面、正文、评分、优缺点、点赞收藏评论。

**提示词**：
```
A professional review article detail page for a Chinese digital product comparison website, desktop web app, 1920x1080, 16:9.

Visual style: modern minimalist, article layout, white background, tech-blue accents. UI text in Simplified Chinese.

Layout:
1. Top navigation bar.
2. Article header: large cover image, bold title, author avatar + name, publish date, view count, summary.
3. Score panel: comprehensive score plus sub-scores (性能 / 外观 / 屏幕 / 续航) as rating bars or badges.
4. Rich text article body with images.
5. Pros and cons section (green pros / orange cons).
6. Like / favorite / share buttons.
7. Comment section below.

Color scheme: primary #2563EB, background #FFFFFF, accent #F97316, success #10B981, text #1F2937.

Interaction: like button toggle with count, favorite toggle, comment input box.

Quality: professional, polished, high-quality, clean, editorial, readable.
```

**使用建议**：重点检查长文阅读体验与评分面板的设计。

---

### 界面 6：测评详情页 - 版本 B

**功能描述**：带右侧目录/摘要侧栏的变体，长文导航更强。

**提示词**：
```
An article detail page for a Chinese digital product review website with a right sidebar, desktop web app, 1920x1080, 16:9.

Visual style: modern minimalist, editorial layout. UI text in Simplified Chinese.

Layout: left main article (cover, title, author, body, pros/cons, comments), right sticky sidebar with score summary card, related product card, and article table of contents.

Color scheme: primary #2563EB, background #F5F7FA, cards #FFFFFF, accent #F97316, success #10B981.

Interaction: sticky sidebar, table-of-contents anchor links, like/favorite toggles.

Quality: professional, polished, high-quality, clean, editorial.
```

**使用建议**：测评文章较长时推荐。

---

### 界面 7：管理后台仪表盘 - 版本 A

**功能描述**：管理员数据看板，数据卡片 + ECharts 图表，专业数据管理平台风格。

**提示词**：
```
An admin dashboard for a Chinese digital product price comparison platform, desktop web app, 1920x1080, 16:9.

Visual style: clean professional data dashboard, light theme, tech-blue accents. UI text in Simplified Chinese.

Layout:
1. Left sidebar menu (dark or white): 仪表盘 / 用户管理 / 产品管理 / 分类管理 / 品牌管理 / 平台管理 / 价格管理 / 测评管理 / 评论管理 / 推荐管理 / 算法参数 / 系统设置, with icons.
2. Top bar: breadcrumb, admin avatar, notification bell.
3. Content area: a row of stat cards (用户总数 / 产品总数 / 测评总数 / 评论总数 / 收藏总数 / 浏览量), then a grid of ECharts charts (用户增长趋势 line chart, 产品分类统计 bar/pie chart, 热门产品排行 bar chart, 价格变化趋势 line chart, 测评浏览量排行).

Color scheme: primary #2563EB, background #F5F7FA, cards #FFFFFF, chart palette blue/green/orange.

Interaction: sidebar menu active highlight, chart hover tooltips, stat card subtle hover.

Quality: professional, polished, high-quality, clean, data-dense, modern admin UI.
```

**使用建议**：`--ar 16:9`；确定后台整体布局与图表排布。

---

### 界面 7：管理后台仪表盘 - 版本 B

**功能描述**：深色后台变体，数据看板夜间模式。

**提示词**：
```
A dark-mode admin dashboard for a Chinese digital product comparison platform, desktop web app, 1920x1080, 16:9.

Visual style: clean professional dark data dashboard. UI text in Simplified Chinese.

Layout: dark sidebar #1E293B, dark content background #0F172A, stat cards on #1E293B, ECharts charts with neon blue/green/orange palette, top bar with admin avatar.

Color scheme: background #0F172A, cards #1E293B, primary #3B82F6, accent #F97316, success #10B981.

Interaction: menu highlight, chart tooltips, hover states.

Quality: professional, polished, high-quality, modern, data-dense.
```

**使用建议**：管理后台深色模式备选。

---

## 交互流程提示词

### 流程 1：搜索 → 筛选 → 详情 → 比价 → 收藏（核心购买决策路径）

**流程描述**：用户从首页搜索产品，进入列表页筛选，点击进入详情页查看多平台比价和历史价格，最后收藏或加入对比。

**关键界面**：
- 界面 1：首页 Hero 搜索区（输入关键词）
- 界面 2：产品列表/搜索结果页（筛选 + 排序）
- 界面 3：产品详情页（多平台比价 + 历史价格 + 收藏按钮）

**提示词**：
```
A 3-step user flow storyboard for a Chinese digital product price comparison website, desktop web app, three panels side by side showing: (1) home hero search bar with keyword input, (2) product listing with filter bar and product cards, (3) product detail page with multi-platform price table, historical price line chart, and a favorite button. Modern minimalist style, tech-blue #2563EB accents, white background, orange #F97316 price highlights. Show the flow with numbered steps and a highlighted path. UI text in Simplified Chinese. Professional, polished, clean.
```

---

### 流程 2：注册 → 登录 → 评价/收藏 → 个人中心（用户身份与留存路径）

**流程描述**：新用户注册登录后，评价产品或收藏，最后在个人中心查看自己的收藏与评价记录。

**关键界面**：
- 界面 1：注册页（填写用户名/密码/昵称/邮箱）
- 界面 2：产品详情页（发表评价、点收藏）
- 界面 3：个人中心（我的收藏 / 我的评价 / 浏览历史）

**提示词**：
```
A 3-step user flow storyboard for a Chinese digital product price comparison website showing: (1) register form with username/password/nickname/email, (2) product detail page with a review input box and favorite button, (3) personal center page with tabs for favorites, reviews, and browse history. Modern minimalist style, tech-blue #2563EB accents, white background, green #10B981 success states. Numbered steps with highlighted path. UI text in Simplified Chinese. Professional, polished, clean.
```

---

### 流程 3：加入对比 → 对比页 → AI 总结对比（对比决策路径）

**流程描述**：用户在多个产品详情页点「加入对比」，进入对比页查看参数表格，最后点「AI 总结对比」获得结论。

**关键界面**：
- 界面 1：产品详情页（加入对比按钮）
- 界面 2：产品对比页（参数对比表格）
- 界面 3：AI 总结对比结果（弹窗或卡片）

**提示词**：
```
A 3-step user flow storyboard for a Chinese digital product price comparison website showing: (1) product detail page with "加入对比" button, (2) comparison table page with 2-4 product columns and parameter rows, (3) an AI summary panel showing a conversational comparison conclusion. Modern minimalist style, tech-blue #2563EB accents, white background, green #10B981 for best-value highlights, orange #F97316 for lowest price. Numbered steps with highlighted path. UI text in Simplified Chinese. Professional, polished, clean.
```

---

## AI 交互界面提示词

### AI 功能 1：AI 产品摘要生成

**AI 交互特点**：管理员在后台编辑产品时点击「AI 生成摘要」，AI 把专业参数翻译成通俗短摘要；产品详情页顶部展示已生成的摘要，带「AI 生成」标识与降级态（无服务时隐藏）。

**提示词**：
```
An AI-assisted product summary feature UI for a Chinese digital product comparison website admin panel: a product edit form with a button "AI 生成摘要" next to the summary field, showing a loading spinner while generating, then a generated 2-3 sentence plain-language summary in a highlighted card with an "AI 生成" badge, plus a regenerate button. Also show a product detail page top area with the same AI summary displayed under the product title. Include loading state, success state, and a grayed-out disabled state when AI is unavailable. Modern minimalist, tech-blue #2563EB, white background. UI text in Simplified Chinese. Professional, polished, clean.
```

---

### AI 功能 2：AI 推荐理由解释

**AI 交互特点**：个性化推荐列表中的每个产品卡片附带一句「为什么推荐给你」，鼠标悬停或小字展示，可点击展开完整理由。

**提示词**：
```
An AI recommendation explanation UI for a Chinese digital product price comparison website: a personalized recommendation section where each product card shows a small speech-bubble or tooltip with a one-line reason like "因为你最近常看 3000 元以下的手机，这款性价比评分 92", with an expandable detail. Show loading skeleton, generated reason text, and a subtle "AI 推荐" badge. Modern minimalist, tech-blue #2563EB, white background, green #10B981 value badges. UI text in Simplified Chinese. Professional, polished, clean.
```

---

### AI 功能 3：AI 对比总结

**AI 交互特点**：对比页点击「AI 总结对比」，AI 生成一段口语化对比结论，突出各产品适用人群和一句话推荐。

**提示词**：
```
An AI comparison summary UI for a Chinese digital product price comparison website: a comparison page with a prominent "AI 总结对比" button that opens a panel or card showing a generated conversational conclusion like "A 性能最强但最贵，适合重度游戏；B 续航最好且便宜，适合日常通勤；综合性价比选 B", with a loading state and a disabled state when AI is unavailable. Modern minimalist, tech-blue #2563EB, white background, green #10B981 highlights. UI text in Simplified Chinese. Professional, polished, clean.
```

---

## 设计建议

### 布局建议
- 首页与列表页统一用「顶部导航 + 内容区」结构，避免左侧大导航抢占产品浏览宽度
- 产品详情页右侧价格卡片采用 sticky 定位，滚动时保持比价信息可见
- 卡片间距统一 16px，圆角统一 8px，保持全站一致性

### 交互建议
- 产品卡片 hover 抬升阴影 + 轻微上移，给明确的可点击反馈
- 收藏按钮点击后状态反转（空心→实心），并给 toast 提示「收藏成功」
- 价格与性价比数字用强调色突出，结论（最低价/最高性价比）前置

### 动效建议
- 仅用微动画（150-250ms 的 hover/过渡），避免花哨动画
- 历史价格曲线 hover 显示 tooltip，展示具体价格与日期
- 筛选条件变化时列表用轻量淡入过渡，不整页刷新闪烁

### 响应式设计
- 桌面端：1280 / 1440 / 1920 分辨率下卡片列数自适应（4 列 / 4 列 / 5 列）
- 平板端：卡片降为 2-3 列，筛选栏折叠为抽屉
- 移动端：基础兼容，不专门开发 App，保证可读不崩版即可

---

## 使用指南

### 生成设计稿的步骤

1. **选择提示词版本**：默认选版本 A（经典蓝白），需要备选再试版本 B
2. **复制提示词**：将提示词完整复制到图像生成工具
3. **调整参数**：Midjourney 建议 `--ar 16:9 --style raw`，DALL-E 选择 16:9 横版
4. **生成多个版本**：每个界面生成 2-3 张对比
5. **选择最佳方案**：优先选与「白色 + 蓝色科技感 + 卡片式」一致的方案
6. **反馈调整**：不满意就调整配色或布局关键词重新生成

### 推荐的图像生成工具

- **Midjourney**：`--ar 16:9 --style raw --v 6`，适合高质量网页视觉稿
- **DALL-E**：16:9 横版，理解中文布局较好
- **Stable Diffusion**：可配合 LoRA 控制 UI 风格一致性
- **Leonardo AI**：适合快速出多张对比稿

### 常见问题

**Q：生成的图片不符合预期怎么办？**
A：调整提示词中的布局结构或配色描述，或换版本 B。

**Q：如何保持多个界面风格一致？**
A：每个提示词都复用同一套配色（#2563EB / #F5F7FA / #F97316 / #10B981）和「Modern Minimalist」风格关键词。

**Q：生成的图片可以作为开发参考吗？**
A：可以，但最终开发用 Vue 3 + Element Plus 实现，设计稿只作视觉方向参考，细节以代码实现为准。

---

## 版本历史

- 1.0.0 - 2026-09-10：根据 Product-Spec.md 1.0.0 生成
  - 新增：首页、产品列表、产品详情、登录注册、产品对比、测评详情、管理后台仪表盘共 7 个界面的提示词（各 2 个版本）
  - 新增：3 条交互流程提示词、3 个 AI 交互界面提示词
  - 新增：设计风格与配色方案（Modern Minimalist + 蓝色科技感）

---

**文档版本**：1.0.0

**最后更新**：2026-09-10

**对应的产品文档**：Product-Spec.md 1.0.0

**下次更新计划**：产品需求变更或设计稿确定后更新
