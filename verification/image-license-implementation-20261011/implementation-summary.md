# 图片展示闭环实施总结（阶段 B-2）

> 执行时间：2026-10-11
> 范围：授权表 + 47 条回填 + 后端统一过滤 + 前端署名展示 + 测试验收
> 原则：未核实的授权信息一律不放行；个别图片资料不完整只隔离该图片，不影响其他可信数据

---

## 1. 最终核账数量（矛盾已解决）

审计报告中的"1+43+3+2=49"是**两个独立维度混加**所致（auditStatus 维度 1+43+3=47 与 frontendEligibility 维度的 REJECTED=2 被加在一起）。逐条重算后：

**落库 audit_status（单一终态维度，合计 = 47 ✅）：**

| audit_status | 数量 | 说明 |
|---|---|---|
| APPROVED | **1** | #85 佳明 Forerunner 265（CC0，无署名义务） |
| APPROVED_WITH_ATTRIBUTION | **41** | 许可允许使用，前端署名功能本轮已上线，故开放展示 |
| PENDING_EVIDENCE | **3** | #24 MacBook Pro 14、#105 i7-14700K、#106 i5-14600K（Commons 标记 License review needed，保持待审） |
| REJECTED | **2** | #95 RTX 4070 Ti Super、#97 RTX 4080 Super（对比截图，保持拒绝） |
| **合计** | **47** ✅ | |

交叉核对：43 张 APPROVED_WITH_ATTRIBUTION（许可维度）中有 2 张（#95/#97）因主体不合格被终审降为 REJECTED → 41+2=43 ✅。

## 2. 实际回填的授权记录

- 回填 **47 条**（与审计 47 张真实图一一对应，image_id 唯一）
- 幂等迁移：`WHERE NOT EXISTS (image_id)`，重复执行不覆盖已有记录
- 字段全部来自审计 JSON 的真实证据（source_page_url / original_url / license 含版本 / license_url / author / attribution_text / modifications / match_type），**无猜测值**（审计阶段作者缺失率 0）
- reviewer = `image-license-audit-20261011`，reviewed_at = 审计生成时间
- 回填后库内状态分布与上表完全一致（脚本断言 47=47 ✅）

## 3. 实际可展示的图片数、商品数及隐藏原因

| 指标 | 数值 |
|---|---|
| 可展示图片（APPROVED + APPROVED_WITH_ATTRIBUTION） | **42 张** |
| 可展示商品（API `/api/products` 实测 total） | **42 个（31.8%）** |
| 隐藏商品 | **90 个**：85 个无真实图 + #24/#105/#106（待审）+ #95/#97（拒绝） |

隐藏口径（所有用户端出口一致）：商品至少一张「非占位图 + audit_status∈{APPROVED, APPROVED_WITH_ATTRIBUTION}」的图片才可进入列表；详情接口只返回合格图片（无合格图时 images 为空数组，前端走类别 SVG 兜底 + 署名位如实显示"暂无授权署名信息"，不伪装合规）。

## 4. 修改的关键文件

### 数据库
- 新增 `database/04-product-image-license.sql`（DDL，可重复执行）
- 新增表 `product_image_license`（16 列，image_id 唯一键 + FK→product_images(id) ON DELETE CASCADE）
- 备份：`verification/image-license-implementation-20261011/backup/product_images-before-20261011.sql`（迁移前 mysqldump）

### 后端（8 个文件）
| 文件 | 改动 |
|---|---|
| `entity/ProductImageLicense.java` | 新增：授权元数据实体 |
| `mapper/ProductImageLicenseMapper.java` | 新增：BaseMapper |
| `vo/ImageAttributionVO.java` | 新增：下发前端的署名 VO |
| `service/ProductImageLicenseService.java` | 新增：**统一裁决点**（QUALIFIED_PRODUCT_IDS_SQL 常量 + 4 个方法） |
| `service/impl/ProductImageLicenseServiceImpl.java` | 新增：批量 JOIN 查询、状态过滤、占位图过滤 |
| `entity/Product.java` | 增加 `imagesAttribution`（exist=false） |
| `service/impl/ProductServiceImpl.java` | list() 加 inSql 可见性门控（分页总数/排序一致）；列表与详情的图片/署名均改由授权服务裁决 |
| `service/impl/RecommendationServiceImpl.java` | 3 处候选查询加同一门控；firstImage 改为取合格图 |
| `service/impl/FavoriteServiceImpl.java` / `BrowseHistoryServiceImpl.java` | firstImage 改为取合格图 |

**未修改**：`ProductSyncWriter`（同步只插入新图、从不删改旧图、从不触碰授权表——天然满足"同步不清授权、重复同步不重复授权、新图不自动上线、换图不继承旧授权"四条要求，实测确认后零改动）；管理端 `AdminProductController` 用自己的 `productMapper.selectPage`，不经门控，仍可查看全部商品与待审图片。

### 前端（6 个文件）
| 文件 | 改动 |
|---|---|
| `types/index.ts` | 增加 `ImageAttribution` 接口 + `Product.imagesAttribution` |
| `components/ImageAttributionInfo.vue` | **新增唯一署名组件**（detailed 面板 + 紧凑气泡两种模式；无信息时显示"该图片暂无授权署名信息"，不伪装合规） |
| `components/ProductCard.vue` | 图片右下角 ⓘ 按钮 + el-popover 署名（覆盖首页与列表） |
| `views/RankingView.vue` | 排行榜每行 ⓘ 入口 |
| `views/CompareView.vue` | 表头每列图片下独立显示 `作者 · 许可` + 来源/许可链接（每张图独立署名） |
| `views/ProductDetailView.vue` | 图片下方完整署名面板（作者/许可链接/来源页面/改动说明） |

## 5. 数据库迁移及备份情况

1. **备份先行**：迁移前 `mysqldump geek_price product_images` → `backup/product_images-before-20261011.sql`
2. **建表**：`04-product-image-license.sql` 以 `IF NOT EXISTS` 方式执行（期间因 `audit_status VARCHAR(24)` 装不下 `APPROVED_WITH_ATTRIBUTION` 报 1406，调整为 VARCHAR(32) 后通过——DDL 文件已同步修正）
3. **回填**：单事务 47 条 INSERT（幂等守卫），失败自动整体回滚；实测一次提交成功
4. **回滚方案**：`DROP TABLE product_image_license` 即完全恢复（现有表/实体零改动）；配合备份文件可恢复图片数据
5. **同步链路保护**：`ProductImagePriceSyncTest` 9 个用例全部通过（未改动同步代码）

## 6. 测试执行结果

| 测试/构建 | 结果 |
|---|---|
| 后端全量测试 `mvn test` | ✅ **Tests run: 104, Failures: 0, Errors: 0 — BUILD SUCCESS**（96 原有 + 8 新增） |
| 新增 `ProductImageLicenseGateTest`（8 用例） | ✅ 全过：唯一键拒绝重复、无授权不下发、CC0 正常展示含署名、PENDING/REJECTED 被过滤、无合格图商品不进列表（分页总数一致）、管理端直查可见、同步新图审核前不展示（审核后即展示）、真实数据列表总数与授权表按商品去重数对账（42=42） |
| 修复 `ValueScoreRecommendationTest` | ✅ 夹具 `insertProduct` 同步插入图片+APPROVED 授权记录（9/9 通过） |
| 修复 `ProductSearchCompareTest` | ✅ 分类筛选样例改为从可展示集合取样（7/7 通过） |
| 前端类型检查 `vue-tsc -b --force` | ✅ exit 0 |
| 前端构建 `npm run build` | ✅ ✓ built in 11.73s |
| **API 实测**（后端运行时） | ✅ 列表 total=**42**；42/42 条含真实图与 imagesAttribution；隐藏验证 #9/#24/#95/#97 不在列表、#85(CC0) 在列表；详情 #1 署名完整（author/license/licenseUrl/sourcePageUrl/modifications）；详情 #9/#24 images=0；推荐 `/api/recommendations` 10 条全部合格图 |
| **浏览器实测**（headless Chrome，9 项） | ✅ 全过：详情署名面板（含 2 个外链）、无合格图详情显示 SVG 且署名位如实显示"暂无授权署名信息"、首页 8 个 ⓘ 入口、ⓘ 弹窗显示作者/许可/来源、排行榜 10 个 ⓘ 入口、列表渲染 12 卡片且分页显示 Total 42、各页无控制台错误 |

## 7. 尚未解决的问题

1. **3 张待审图片**（#24/#105/#106，Commons "License review needed"）：需人工到 Commons 页面复核后更新 audit_status 才能上线。
2. **2 张拒绝图片**（#95/#97 对比截图）：需换图（走完整审核→同事务写授权记录）；其对应商品当前对用户隐藏。
3. **85 个无真实图商品**仍隐藏（前端已有类别 SVG 兜底方案，但列表入口不展示这些商品——若未来希望"无图商品也上列表但显示 SVG"，只需调整 list() 的门控策略，一行改动）。
4. **对比页运行时验收**未在浏览器中覆盖（需用户交互加入对比；实现与已验收的排行榜同一模式，类型检查通过）。
5. 后续新导入图片必须走"两表同事务"流程（建议后续改造导入脚本，本轮未改导入工具）。

## 8. 行为口径速查（本轮确立）

| 出口 | 行为 |
|---|---|
| 首页/列表/搜索/分类/排行（`GET /api/products`） | 只返回有合格图片的 42 个商品（分页总数/排序与过滤一致） |
| 详情（`GET /api/products/{id}`） | 商品信息照常返回；images 只含合格图（无则空数组→SVG）；附 imagesAttribution |
| 对比（`GET /api/products/compare`） | 商品照常返回；图片/署名同详情口径 |
| 推荐（`GET /api/recommendations`） | 候选集同列表门控；image 只取合格图 |
| 收藏/历史 | image 只取合格图（无则 null→SVG） |
| 管理端（`/api/admin/products`） | 不过滤，可见全部商品 |
