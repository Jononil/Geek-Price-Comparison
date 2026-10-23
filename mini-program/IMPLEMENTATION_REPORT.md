# 极客比价微信小程序 · 最终实施报告

> 项目：《数码产品测评与比价系统设计与实现》微信小程序移动端
> 目录：`mini-program/`（原生微信小程序：WXML + WXSS + TypeScript）
> 报告日期：2026-10-20
> 阶段：一（审计）→ 二（基础工程+联调）→ 三（核心业务）→ 四（其余功能）→ 五（视觉体验）→ 六（测试验收）

---

## 1. 新建和修改的文件清单

**边界声明：本次仅新建 `mini-program/` 目录；`backend/`、`frontend/`、`admin/`、`database/` 及数据库数据零修改（每阶段均经文件时间戳核实）。**

### 新建文件（102 个，排除 node_modules）

```
mini-program/
├── project.config.json / app.json / app.ts / app.wxss / sitemap.json
├── package.json / tsconfig.json
├── config/env.ts                    # API Base URL 单点（dev=8080 / prod=HTTPS占位）
├── api/
│   ├── request.ts                   # 统一请求层（Bearer 注入、双重错误判断、401/403 处理）
│   └── index.ts                     # 全部 API 封装（10 组）
├── types/index.ts                   # 类型定义（与真实响应逐字段对齐）
├── store/user.ts / compare.ts       # 登录态 / 对比列表（Storage 持久化）
├── utils/format.ts / image.ts / auth.ts / seriesReference.ts / specGroups.ts
├── components/
│   ├── gp-loading/  gp-empty/  gp-error/          # 通用三态
│   ├── gp-no-image/                               # 统一"暂无实拍图"空态（收敛 8 处重复）
│   └── gp-product-card/                           # 商品卡（首页/列表共用）
├── pages/（15 个页面，每页 4 件套）
│   ├── index/           首页（tab）
│   ├── category/        分类导航（tab）
│   ├── compare/         商品对比（tab）
│   ├── article-list/    测评中心（tab）
│   ├── mine/            我的（tab）
│   ├── product-list/    商品列表/搜索/筛选
│   ├── product-detail/  商品详情（含 Canvas 价格图）
│   ├── article-detail/  测评详情
│   ├── reviews/         商品评价（分页+发表）
│   ├── recommend/       个性化推荐
│   ├── rankings/        排行榜
│   ├── favorites/       我的收藏
│   ├── history/         浏览历史
│   ├── login/  register/  登录/注册
└── scripts/
    ├── smoke-test.mjs               # 接口冒烟回归（51 项断言）
    └── static-check.mjs             # 静态交叉校验（9 项）
```

---

## 2. 已实现页面和业务功能清单（15 页）

| 页面 | 类型 | 核心功能 |
|---|---|---|
| 首页 | tab | 搜索、分类入口、对比入口、高性价比严选（8）、为你推荐、下拉刷新 |
| 分类 | tab | 16 个真实分类导航、全部商品入口 |
| 对比 | tab | 横滑概览卡、只看差异、价格评分表、规格分组表（可信/未核验独立分组）、移除/清空 |
| 测评中心 | tab | 32 篇测评列表、触底分页、下拉刷新 |
| 我的 | tab | 资料展示、修改密码、收藏/历史入口、退出登录 |
| 商品列表 | 普通 | 分页、筛选面板（分类/品牌/价格）、7 种排序、触底加载+去重、下拉刷新 |
| 商品详情 | 普通 | 图片+授权署名、三评分（null→数据不足）、多平台比价、节省金额、**Canvas 2D 触摸交互价格图**、规格三态标签、收藏/对比/浏览上报 |
| 测评详情 | 普通 | rich-text 富文本、评分面板、优缺点、点赞（乐观+1） |
| 商品评价 | 普通 | 分页列表、发表评价（5 星）、登录引导 |
| 推荐 | 普通 | 推荐列表（登录态感知）、匹配度/类型标签 |
| 排行榜 | 普通 | 5 tab（后端真实 sort 值）、Top10 |
| 收藏 | 普通 | 真实 API 分页、取消收藏、产品/测评双类型跳转 |
| 浏览历史 | 普通 | 列表、清空、下拉刷新 |
| 登录/注册 | 普通 | 账号密码、redirect 回跳（tab 页分流）、注册即登录 |

---

## 3. 各页面对应的后端 API（全部真实，未新增/未编造）

| API | 方法 | 页面 | 阶段二实测 |
|---|---|---|---|
| `/api/categories` | GET | 首页/分类/列表筛选 | 16 条 ✅ |
| `/api/brands` | GET | 列表筛选 | 60 条 ✅ |
| `/api/products` | GET | 首页/列表/排行 | total=109（可见性过滤后）✅ |
| `/api/products/{id}` | GET | 详情 | valueScore=null、template 参数 ✅ |
| `/api/products/compare?ids=` | GET | 对比页 | 同品类 200 / **跨品类 400** ✅ |
| `/api/prices/compare/{id}` | GET | 详情 | 3 平台报价+updatedAt ✅ |
| `/api/prices/history/{id}` | GET | 详情 | 90 点 / 空态 [] ✅ |
| `/api/recommendations` | GET | 首页/推荐 | 10 条（value+hot）✅ |
| `/api/articles` + `/{id}` + `/{id}/like` | GET/POST | 测评列表/详情 | 32 篇、cover/productId 全 null ✅ |
| `/api/reviews/product/{id}` + `POST /api/reviews` | GET/POST | 评价页 | nickname、401 拦截 ✅ |
| `/api/favorites` CRUD | GET/POST/DELETE | 收藏/详情 | 需登录、幂等 ✅ |
| `/api/history` CRUD | GET/POST/DELETE | 历史/详情 | limit≤50、403 拦截 ✅ |
| `/api/auth/login` + `/register` | POST | 登录/注册 | token+user、401/400 ✅ |
| `/api/user/info` + `/password` | GET/PUT | 我的 | 403/400 ✅ |

---

## 4. 登录、令牌、图片授权与商品可见性处理

- **登录**：仅账号密码（后端无微信登录实现——阶段一 grep 证实 0 命中，**未伪造 wx.login**）；注册即登录。
- **令牌**：`wx.setStorageSync` 存储；请求层自动注入 `Authorization: Bearer`；**HTTP 401/403（Security 层，默认 JSON）与 body code=401（业务层，Result 结构）双重判断**→ 清 token → 跳登录（带 redirect、防循环、tab 页分流）；有效期 24h（后端配置）；退出=清本地（后端无登出接口，与 PC 端一致）。
- **图片授权**：**只展示后端 `images`/`imagesAttribution` 下发的审核通过图片**（后端 `ProductImageLicenseService` 已过滤未授权/待审核/拒绝/有风险/CC BY 缺署名的图）；无合格图或加载失败 → `gp-no-image` 通用空态（相框+斜杠+"暂无实拍图"），**不用灰图/类别图/占位图冒充实物图**；ⓘ 弹窗展示作者/许可/改动说明/系列参考图警告；系列参考图 6 条硬编码映射与 PC 端逐条对齐。
- **可见性**：复刻后端不对称行为——列表/推荐被过滤（total=109），详情按 id 可直访但 images 为空（前端空态）；**不绕过后端过滤**。
- **参数三态**：`verified`（已核验绿）/`reference`（参考蓝）/`template`（模板灰，缺失按 template 处理）；可信度统计摘要；对比页模板参数独立分组"未核验参数（模板数据，非官方规格）"。
- **模拟价格**：详情/对比/首页/排行/推荐/历史处均标注"系统模拟报价/模拟数据"（与 PC 端一致的静态标注策略；后端无 Mock 字段——缺口已记录）。

---

## 5. 实际执行的测试命令、结果及未覆盖项

| 命令 | 结果 |
|---|---|
| `npx tsc --noEmit`（6 阶段累计 12+ 轮） | **exit 0**（累计修复 5 处类型错误） |
| `node scripts/smoke-test.mjs`（51 项断言） | **PASS 51 / FAIL 0**（含 401/403/400/404 全部拦截形态） |
| `node scripts/static-check.mjs`（9 项） | **PASS 9 / FAIL 0**（事件↔方法、跳转↔注册、组件↔文件、JSON、WXML 表达式） |
| JSON 合法性（26 文件，UTF-8） | 0 非法 |
| 下拉刷新配置 vs 实现 | 8 = 8 |
| 改动边界（每阶段文件时间戳核实） | backend/frontend/admin/database **零触碰** |

**未覆盖项（如实声明）**：
1. **微信端运行时行为全部未实测**（本机无微信开发者工具）：WXML/WXSS 渲染、Canvas 触摸坐标、tabBar 纯文字样式、lazy-load 触发、键盘避让、真机安全区——逻辑经静态校验但**不得视为"已通过运行时测试"**；
2. 后端自动化测试（mvn test）本阶段未重跑（后端源码零改动，surefire 历史报告显示 20 类全绿）；
3. 端到端 UI 自动化（miniprogram-automator）未实施。

---

## 6. 尚未完成的功能及真实原因

| 功能 | 原因 |
|---|---|
| 微信登录（wx.login/openid） | **后端无实现**（阶段一确认）；不伪造 |
| 我的测评/我的评论 | **后端无接口**（用户不能发布专业测评，PC 端亦无） |
| 收藏状态回显 | **后端无"是否已收藏"查询接口**（与 PC 端一致的限制；乐观切换+幂等） |
| 评价点赞 | **后端无"我是否已赞"字段**（不做假按钮） |
| 个人资料修改 | **后端仅支持改密码** |
| 数据级 Mock 价格标识 | 后端价格表无 Mock 字段（静态标注替代） |
| tabBar 图标 | 无设计素材；纯文字为官方合法形态 |
| 正式发布 | 无微信 AppID（当前 touristappid 游客模式）、无备案 HTTPS 域名 |

---

## 7. 微信开发者工具导入和运行步骤

1. 安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)（稳定版即可）；
2. 导入项目 → 目录选择 `E:\第三学期\Geek Price Comparison\mini-program`；
3. AppID 使用默认 `touristappid`（游客模式）或替换为真实 AppID；
4. 工具菜单 → 详情 → 本地设置 → 勾选 **「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」**（开发联调必需）；
5. 编译后即可在模拟器操作全部 15 个页面；测试账号：`user / 123456`（管理员 `admin / 123456`）。

---

## 8. 本地后端联调与正式环境配置

**本地联调**（当前环境已就绪）：
```powershell
# 1. MySQL 8.4（数据目录 C:\Users\mingmu\tools\mysql-data，含 geek_price 库）
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --datadir="C:\Users\mingmu\tools\mysql-data" --console
# 2. 后端（Maven 3.9.16 在 C:\Users\mingmu\tools\apache-maven-3.9.16）
$env:MAVEN_HOME="C:\Users\mingmu\tools\apache-maven-3.9.16"
& "$env:MAVEN_HOME\bin\mvn.cmd" spring-boot:run    # 监听 8080
# 3. 回归验证
node mini-program/scripts/smoke-test.mjs
```

**正式环境要求**（发布前必办）：
1. `config/env.ts` 中 `prod` 替换为**已备案的 HTTPS 域名**（如 `https://api.geekprice.example.com`）；
2. 微信公众平台 → 开发管理 → 服务器域名 → 配置 `request` 合法域名（同上 HTTPS 域名）；
3. 商品图片域名（`upload.wikimedia.org`）如在真机受限，需配置 `downloadFile` 合法域名或经后端代理；
4. 替换真实 AppID；后端 `jwt.secret`、数据库密码按生产规范调整（当前为开发值，**未硬编码进小程序**）。

---

## 9. 下一阶段建议

1. **微信开发者工具真机走查**（最高优先）：重点验证 Canvas 触摸交互、tabBar、登录回跳、键盘避让；
2. 接口缺口推动后端最小补充（按需）：收藏状态查询、"我的评价"列表、微信登录、价格 Mock 字段；
3. `database/*.sql` 建库漂移修复（`product_specs` 三列 DDL 固化，另开任务）；
4. 如需 tabBar 图标，提供 PNG 素材后接入；
5. 发布流程：AppID + HTTPS 域名 + 代码审核。

---

*本报告仅包含实际执行并验证过的内容；未执行的测试（微信端运行时）已在 §5 明确声明为未覆盖。*
