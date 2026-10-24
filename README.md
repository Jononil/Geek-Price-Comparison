# 极客比价 —— 高性价比数码产品测评聚合与比价系统

面向普通消费者的数码产品信息聚合平台，聚合专业测评、用户评价、多平台价格与历史价格，通过**性价比评分算法**与**混合推荐算法**帮助用户买到高性价比数码产品。

本科毕业设计项目，全栈完整联调，含用户端、管理后台、后端 API、MySQL 数据库。

---

## 一、功能简介

**用户端**
- 首页：Hero 搜索、热门分类、高性价比严选、个性化推荐
- 产品浏览与搜索：关键词、分类、品牌、价格区间、评分、多排序方式
- 产品详情：核心参数、多平台比价、历史价格曲线（ECharts）、相关测评、评价
- 产品对比：最多 4 个产品并排对比
- 测评：只在产品详情页展示——有专属测评显示「相关测评」，没有则按同品类兜底并明确标注；点击进入文章页可看摘要与原文链接、点赞
- 用户评价：星级评价、点赞、评论/回复
- 收藏、浏览历史、个人中心、修改密码
- 排行榜：性价比榜、热门榜、评分榜、最新榜、价格榜
- 性价比实验室：可调权重的性价比试算，综合得分榜 / 每千元得分榜双榜对比
- 个性化推荐（混合推荐 + 冷启动）

**管理后台**
- 数据看板（统计卡片 + ECharts 图表）
- 用户管理、产品管理、分类管理、品牌管理、平台管理
- 价格管理（录入价格自动生成历史记录）
- 测评管理、评论管理
- 算法参数配置（权重可调，可重新计算全站性价比评分）

---

## 二、技术栈

| 层 | 技术 |
|---|---|
| 后端 | Java 21、Spring Boot 3.4、MyBatis-Plus 3.5.9、MySQL 8.4、Redis（可降级）、JWT、Spring Security、Lombok、Hibernate Validator、Swagger |
| 用户端 | Vue 3、TypeScript、Vite、Element Plus、Pinia、Vue Router、Axios、ECharts |
| 管理后台 | Vue 3、TypeScript、Vite、Element Plus、Pinia、Vue Router、Axios、ECharts |
| 构建 | Maven（后端）、npm + Vite（前端） |

---

## 三、系统架构

```
用户浏览器 → Vue 3 用户端/管理后台 → Axios → Spring Boot REST API
                                              → Service（业务 + 算法）
                                              → MyBatis-Plus → MySQL
                                              → Redis（缓存，可降级）
```

后端采用单体分层架构：`controller / service / service.impl / mapper / entity / dto / vo / config / security / exception / common`。

---

## 四、项目目录

```
Geek Price Comparison/
├── backend/          # Spring Boot 后端
├── frontend/         # 用户端 Vue 项目
├── admin/            # 管理后台 Vue 项目
├── database/         # 数据库脚本
│   ├── 01-schema.sql          # 表结构（24 张表）
│   ├── 02-base-data.sql       # 基础数据（角色/分类/品牌/平台/标签/算法配置）
│   ├── generate-data.js       # 初始化数据生成脚本
│   └── 03-product-data.sql    # 生成的产品/价格/历史/测评/评价数据
├── Product-Spec.md   # 产品需求文档
├── UI-Prompts.md     # UI 原型图提示词
└── 文档/             # 需求 Prompt
```

---

## 五、环境要求

- JDK 17+（本项目使用 21）
- Maven 3.9+
- Node.js 18+（本项目使用 22）
- MySQL 8.x
- Redis（可选，未启动时核心功能仍可运行）

---

## 六、数据库配置

1. 启动 MySQL，执行建库与数据脚本：

```bash
mysql -u root -p < database/01-schema.sql
mysql -u root -p < database/02-base-data.sql
mysql -u root -p < database/03-product-data.sql
```

> 默认连接信息：`localhost:3306`，账号 `root`，密码 `123456`。可在 `backend/src/main/resources/application.yml` 中修改。

### 图片资源

- 商品图为 **Pexels** 图片（Pexels License：可免费用于商业项目、无需署名），已统一裁切为 4:3（900×675）并本地化到 `frontend/public/products/`，页面不再依赖外部 CDN。
- 每张图的作者、原始页面、许可与修改说明写入 `product_image_license`，详情页与卡片角标可查看。
- 迁移脚本：`scripts\import-pexels-images.ps1`（首批 42 张）、`scripts\import-pexels-images-batch2.ps1`（补齐空缺品类 59 张）、`scripts\fill-and-add-products.ps1`（补完剩余品类 30 张 + 新增 12 款手机），各自生成 `docs\*.sql` 用于切库。
- 当前商品图覆盖 **143 款 / 16 个品类**，每个品类 5~24 款；仍被图片门控隐藏的只剩 1 款（内存「光威 32GB」），补图后自动上架。

2. 初始化数据包含：132 个产品、396 条平台价格、11880 条历史价格、32 篇测评、396 条评价。在此基础上补充了 **12 款 2026 年手机**（华为 Mate 70 Pro / Pura 80 Ultra、小米 15 / 15 Pro、vivo X200 Pro、OPPO Find X8 Pro、荣耀 Magic 7 Pro、一加 13、iQOO 13、Redmi K80 Pro、真我 GT7 Pro、三星 S25 Ultra），每款带 6 项参数、3 平台报价与 90 天价格曲线，当前库共 **144 款产品**。

3. 测评模块已由内置假数据替换为 **16 篇真实来源文章**（知乎 / B站 / IT之家）：只存标题、摘要与原文链接，正文不转载，详情页提供「原文链接」跳转。生成脚本 `scripts\import-real-reviews.ps1`，SQL `docs\real-review-articles.sql`。

> **本地没有 3306 可用时**：本项目提供 `dev` profile，指向独立的 MySQL 8.4 实例（端口 **3307**，数据目录 `%LOCALAPPDATA%\GeekPrice\mysql-data`），不影响本机原有的 3306 实例。

---

## 六·五、一键启动（推荐）

**双击项目根目录的 `启动极客比价.lnk`** 即可：自动拉起 MySQL → 后端 → 用户端 → 管理后台，
完成后自动用默认浏览器打开 http://localhost:5173。

停止：**双击 `停止极客比价.lnk`**（MySQL 走 `mysqladmin shutdown` 正常关闭，不产生崩溃恢复）。

命令行等价方式：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\dev-start.ps1 -Open   # 启动并开浏览器
powershell -ExecutionPolicy Bypass -File scripts\dev-stop.ps1          # 停止
```

按顺序拉起并自动跳过已在运行的端口：

| 服务 | 端口 | 地址 |
|---|---|---|
| MySQL 8.4（dev profile） | 3307 | — |
| 后端（`--spring.profiles.active=dev`） | 8080 | http://localhost:8080/api |
| 用户端 | 5173 | http://localhost:5173 |
| 管理后台 | 5174 | http://localhost:5174 |

停止：`powershell -ExecutionPolicy Bypass -File scripts\dev-stop.ps1`，日志在 `logs\*.log`。

> 说明：本机无 Maven 时，脚本会用 `target/classes` + 本地 `.m2` 依赖直接启动后端（`backend/cp.args` 为自动生成的 classpath）；**修改 Java 代码后需重新编译**，否则运行的仍是旧 class。

---

## 七、Redis 配置

Redis 为可选依赖。`application.yml` 中默认配置 `localhost:6379`。**未启动 Redis 时，核心 CRUD 功能正常**（Redis 仅用于缓存加速，代码中已做降级处理）。

Windows 下可安装 Memurai（Redis 兼容），或使用 WSL/Docker 运行 Redis。

---

## 八、启动方式

### 1. 后端

```bash
cd backend
mvn spring-boot:run
# 或打包后运行
mvn package -DskipTests
java -jar target/geek-price-backend-1.0.0.jar
```

后端启动于 `http://localhost:8080`，首次启动自动创建默认账号。

### 2. 用户端

```bash
cd frontend
npm install
npm run dev
```

访问 `http://localhost:5173`。

### 3. 管理后台

```bash
cd admin
npm install
npm run dev
```

访问 `http://localhost:5174`。

---

## 九、测试账号

| 角色 | 用户名 | 密码 |
|---|---|---|
| 管理员 | admin | 123456 |
| 编辑 | editor | 123456 |
| 普通用户 | user | 123456 |

> 默认账号由后端 `DataInitializer` 在首次启动时用 BCrypt 自动创建。

---

## 十、API 文档

启动后端后访问 Swagger UI：`http://localhost:8080/swagger-ui.html`

主要接口：

```
POST   /api/auth/register          注册
POST   /api/auth/login             登录
GET    /api/products               产品列表（搜索/筛选/排序/分页）
GET    /api/products/{id}          产品详情
GET    /api/prices/compare/{id}    多平台比价
GET    /api/prices/history/{id}    历史价格
GET    /api/articles               测评列表
GET    /api/reviews/product/{id}   产品评价
POST   /api/reviews                发表评价
GET    /api/recommendations        个性化推荐
GET    /api/categories             分类列表
GET    /api/brands                 品牌列表
POST   /api/favorites/...          收藏
GET    /api/history                浏览历史
/api/admin/**                      管理后台接口（需 ADMIN 角色）
```

统一响应结构：`{ code, message, data }`；分页结构：`{ records, total, page, pageSize }`。

---

## 十一、性价比评分算法

综合「性能、功能、用户评分、价格优势、热度」五个维度，全部归一化到 0-100 后加权求和：

```
ValueScore = 性能得分 × w1 + 功能得分 × w2 + 用户评分 × w3 + 价格优势 × w4 + 热度 × w5
```

- **性能得分**：产品性能指标（0-100）
- **功能得分**：产品参数条数映射（每 12 个参数满分）
- **用户评分**：用户评价星级 × 20（0-5 → 0-100）
- **价格优势**：基准 50 分，越接近历史最低价、低于同类均价则加分
- **权重**：由管理后台「算法参数」配置，默认 性能 30% + 功能 20% + 用户评分 20% + 价格 30%

**为什么不简单用「性能/价格」？** 单一比值忽略用户口碑、功能丰富度与价格是否处于历史低位，多维加权能解释每个维度的贡献，具备可解释性。

代码位置：`backend/src/main/java/com/geekprice/service/impl/ValueScoreServiceImpl.java`

---

## 十二、推荐算法

基于「用户行为 + 产品标签 + 价格区间 + 产品分类 + 性价比 + 热度 + 新鲜度」的混合推荐：

```
推荐分数 = 分类匹配度 × 25 + 标签匹配度 × 20 + 价格匹配度 × 15
         + 性价比 × 20 + 热度 × 10 + 新鲜度 × 10
```

- **分类/标签匹配度**：候选产品与用户偏好分类/标签的匹配（Jaccard 相似度）
- **价格匹配度**：候选价格与用户偏好均价的接近程度
- **冷启动**：无行为用户返回高性价比、热门产品

**为什么混合多因素？** 单一策略（如只看热度）导致推荐千篇一律、无法个性化；混合多因素并归一化，兼顾个性化与多样性。

代码位置：`backend/src/main/java/com/geekprice/service/impl/RecommendationServiceImpl.java`

---

## 十三、部署说明

生产部署：

1. 后端打包 `mvn package -DskipTests`，将 jar 上传服务器，用 `nohup java -jar geek-price-backend-1.0.0.jar &` 运行
2. 前端 `npm run build`，将 `dist/` 部署到 Nginx
3. 配置 Nginx 将 `/api` 反向代理到后端 8080 端口
4. 数据库使用服务器 MySQL，修改 `application-prod.yml` 中的连接信息

---

## 十四、常见问题

**Q：启动后端报数据库连接失败？**
A：确认 MySQL 已启动、数据库 `geek_price` 已创建、`application.yml` 中账号密码正确。

**Q：Redis 没装会报错吗？**
A：不会，Redis 可降级，核心功能正常，仅缓存功能缺失。

**Q：前端接口 401？**
A：该接口需要登录，请先在用户端登录，或携带 `Authorization: Bearer <token>` 请求头。

**Q：如何修改性价比算法权重？**
A：登录管理后台 → 算法参数，修改权重并保存，点击「重新计算全站性价比评分」。
