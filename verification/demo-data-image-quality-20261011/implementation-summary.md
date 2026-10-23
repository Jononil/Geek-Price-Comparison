# 演示数据防污染 + 图片展示质量优化 · 实施总结

> 执行时间：2026-10-11｜模式：直接实施 + 测试

---

## 1. 修改的关键文件与实际行为

### 演示环境防污染
| 文件 | 改动 |
|---|---|
| `config/ProductSyncProperties.java` | 新增 `mockEnabled` 开关（默认 true） |
| `service/impl/ProductDataSyncServiceImpl.java` | `syncAll()` / `syncPlatform()` 入口增加 `guardMockSyncAllowed()` 守卫，拦截时抛 `BusinessException(403)` |
| `config/ProductSyncScheduler.java` | 定时任务增加 `mockEnabled` 检查，演示环境直接跳过并记录日志 |
| `application-demo.yml` | `mock-enabled: false`（默认关闭，可显式改为 true 解锁） |

**实际行为**：demo Profile 下，定时同步跳过、手动全平台/单平台同步接口返回 `code=403` + 明确提示"演示环境已禁用 Mock 数据同步"，不伪装成功。开发环境（无 profile）不受影响。

### 图片展示门控加固
| 文件 | 改动 |
|---|---|
| `service/impl/ProductImageLicenseServiceImpl.java` | `qualifiedAttributions()` 增加两个过滤条件：①风险标记未解除（`risk_notes` 非空）不下发；②CC BY/BY-SA 许可缺作者或署名文本不下发 |

**实际行为**：用户端只展示「审核通过 + 风险已解除 + 署名满足许可要求」的图片；CC0/PD 无署名义务不受影响。

### 前端空态改造
| 文件 | 改动 |
|---|---|
| `components/ProductImage.vue` | 移除类别 SVG 兜底，改为中性空态（通用图片缺失图标 + "暂无实拍图"文案）；不再声明 `category` 属性 |
| `utils/categoryGlyph.ts` | **删除**（死代码，不再被引用） |
| `ProductCard.vue` / `RankingView.vue` / `CompareView.vue` / `ProductDetailView.vue` | 移除 `:category` 传递 |

**实际行为**：无合格真实图片时显示中性空态（浅灰底 + 通用图标 + "暂无实拍图"），不再显示可能被误认为商品实拍的类别插图。

### 管理端中文界面
| 文件 | 改动 |
|---|---|
| `admin/src/main.ts` | 引入 `element-plus/es/locale/lang/zh-cn`，全局配置 `locale: zhCn` |

**实际行为**：管理端分页显示"共 47 条 / 10条/页"（原英文 Total），空状态、日期、组件提示等均为中文。

---

## 2. demo 与开发环境同步保护验证结果

| 验证项 | 环境 | 结果 |
|---|---|---|
| 定时同步跳过 | demo | ✅ 日志"演示环境策略：product.sync.mock-enabled=false，跳过本次定时 Mock 同步" |
| 全平台同步拦截 | demo | ✅ HTTP 200, code=403, msg="演示环境已禁用 Mock 数据同步（product.sync.mock-enabled=false），未执行任何数据写入" |
| 单平台同步拦截 | demo | ✅ 同上 |
| 拦截后无数据写入 | demo | ✅ 商品数不变（42 可展示） |
| 单平台同步正常 | dev | ✅ code=200, 正常执行 |

---

## 3. 图片展示规则及覆盖入口

**后端统一门控**：`ProductImageLicenseService.qualifiedAttributions()` 作为唯一裁决点，所有用户端出口共用：

| 入口 | 门控方式 | 覆盖状态 |
|---|---|---|
| 商品列表 | `ProductServiceImpl.list()` 加 `inSql` 子查询 | ✅ 已覆盖 |
| 商品详情 | `fillProductForDetail()` 调用 `qualifiedAttributions()` | ✅ 已覆盖 |
| 比价 | `compare()` 调用 `fillProductForDetail()` | ✅ 已覆盖 |
| 推荐 | `RecommendationServiceImpl` 候选集加 `inSql`，`firstImage()` 改为 `qualifiedFirstImageUrl()` | ✅ 已覆盖 |
| 收藏 | `FavoriteServiceImpl.firstImage()` 改为 `qualifiedFirstImageUrl()` | ✅ 已覆盖 |
| 浏览历史 | `BrowseHistoryServiceImpl.firstImage()` 改为 `qualifiedFirstImageUrl()` | ✅ 已覆盖 |

**前端空态**：无合格真实图片时显示中性空态（非类别 SVG），所有入口统一。

---

## 4. 风险图片拦截验证结果

| 验证项 | 结果 |
|---|---|
| #24（License review needed）审核通过被拒 | ✅ code=400, msg="无法通过审核：存在未解除的风险标记【Commons 分类含 License review needed：授权未经平台复核...】" |
| #105/#106 同上 | ✅ 同 #24 |
| #95/#97（对比截图）审核通过被拒 | ✅ 同上 |
| #85 加风险标记后图片消失 | ✅ images 1→0 |
| #85 清除风险后图片恢复 | ✅ images 0→1 |
| #24 详情页 images=0 | ✅ |
| #95 详情页 images=0 | ✅ |
| 风险标记无法通过编辑绕过 | ✅ 编辑后重置为待审核，需重新审核通过 |

---

## 5. 中文界面优化结果

| 验证项 | 结果 |
|---|---|
| 管理端分页"共 47 条" | ✅ |
| 分页"10条/页" | ✅ |
| 空状态中文 | ✅ |
| 无英文 Total 残留 | ✅ |
| 图片授权页面布局正常 | ✅ |

---

## 6. 实际执行的测试命令和通过/失败数量

| 测试 | 命令 | 结果 |
|---|---|---|
| 后端全量测试 | `mvn test -DargLine=-Djdk.attach.allowAttachSelf=true` | **109/109 通过，BUILD SUCCESS** |
| 新增演示环境保护测试 | `mvn test -Dtest=DemoSyncGuardTest` | **3/3 通过** |
| 扩展授权门控测试 | `mvn test -Dtest=ProductImageLicenseGateTest` | **10/10 通过** |
| 用户端类型检查 | `npx vue-tsc -b --force` | exit 0 |
| 用户端构建 | `npm run build` | ✓ built in 10.41s |
| 管理端类型检查 | `npx vue-tsc -b --force` | exit 0 |
| 管理端构建 | `npm run build` | ✓ built in 9.98s |
| API 验证（dev 同步/门控/风险） | 浏览器 Fetch + node | 全部通过 |
| API 验证（demo 拦截） | 浏览器 Fetch | 全部通过 |
| 浏览器验收（中文/空态/真实图） | headless Chrome | **5/5 通过** |

---

## 7. 尚未解决的问题

1. **`mvn test` 中的 `ProductSyncSchedulerTest` 会触发 Mock 同步写入**（测试事务回滚未覆盖 `ProductSyncWriter` 的独立事务）。每次运行全量测试后需手动回滚污染数据（本轮已回滚，恢复至 132/179/47/47/0）。根因：`ProductSyncWriter.syncOneProduct()` 使用 `@Transactional(rollbackFor = Exception.class)` 默认 REQUIRED 传播，但在 `ReentrantLock` 保护下可能与测试事务边界不一致。修复方案：将 `ProductSyncSchedulerTest` 的 `scheduledSync()` 调用改为 mock 或将 `ProductSyncWriter` 的传播改为 `MANDATORY`（要求必须在已有事务内执行），本轮未修改测试代码。
2. **管理端图片授权页面无独立测试类**（前端 UI 通过浏览器验收，后端 API 已有测试覆盖）。
3. **收藏/历史/比价入口的浏览器级空态验收未单独执行**（API 级已验证，前端空态组件在详情页已实测；收藏/历史需登录态+特定数据，未在浏览器中逐一验证，但代码路径与详情页共用同一组件）。
4. **8 个受同步影响的商品报价/历史价格保留现状**（无快照，按规则不擅自恢复）。
5. **开发环境定时同步仍为 enabled=true**（按规则保留开发能力，演示时使用 demo profile）。
