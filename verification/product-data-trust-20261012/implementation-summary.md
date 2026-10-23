# 商品数据可信度与分类完整性优化 · 实施总结

> 执行时间：2026-10-12｜模式：最小改动 + 根因修复 + 分类补充

---

## 1. 模拟数据标识

### 数据来源核实（非猜测）
- `price_history.source` 取值分布：`mock`(11880) / 中文`(2136)` / `当前`(24) / `SIMULATED`(6030)——**全部为模拟来源**，无真实电商源。
- `product_prices` 无来源标识列，全部报价来自 Mock 同步或系统模拟——**全部为模拟**。
- `product_specs` 为模板生成的系统参考值——**全部为模拟**。

### 修改位置与文案
| 文件 | 修改 |
|---|---|
| `ProductDetailView.vue` | 规格区加"参数为系统模拟参考值，非官方规格"；报价区加"模拟报价，非实时电商价格"；图表下加"模拟历史价格，仅用于系统功能演示" |
| `CompareView.vue` | 价格行加"(模拟报价)"标签 |
| `ProductCard.vue` | 价格区加"(模拟)"小标签 |
| `RankingView.vue` | 价格区加"(模拟)"小标签 |
| `admin/PriceManageView.vue` | 加"报价为系统模拟数据，非实时电商价格；录入的价格将同时生成模拟历史记录" |
| `admin/ProductManageView.vue` | 加"报价为系统模拟数据，非实时电商价格；规格参数为系统模拟参考值，非官方规格" |

**原则**：依据后端 `source` 字段与数据模型核实全部报价/历史/规格均为模拟，全局标注，不通过 ID 或名称猜测。

---

## 2. qualified=107 与 API total=108 的根因

### 根因
`QUALIFIED_PRODUCT_IDS_SQL`（列表 SQL 门控）与 `qualifiedAttributions`（Java 侧下发过滤）**规则不一致**：
- SQL 门控：只检查 `audit_status IN ('APPROVED','APPROVED_WITH_ATTRIBUTION')`，**未检查 `risk_notes`**。
- Java 侧：额外检查 `risk_notes IS NULL` 和 CC BY 署名完整性。

商品 #85（佳明 Forerunner 265）的 `risk_notes` 为**空字符串**（此前动态验收测试清除风险时写入 `''` 而非 `NULL`）。Java 侧按 blank 判定为"已解除"→ 正常展示；SQL 门控不检查 risk_notes → 也展示。但我的验证 SQL 用 `risk_notes IS NULL` → 排除 #85，导致 qualified=107。

### 修复
1. `AdminImageLicenseServiceImpl.update()`：空串风险标记存为 `NULL`（`trimmed.isEmpty() ? null : trimmed`）。
2. `QUALIFIED_PRODUCT_IDS_SQL` 补齐与 Java 规则一致的条件：
   ```sql
   AND (pil.risk_notes IS NULL OR pil.risk_notes = '')
   AND (LOWER(pil.license) NOT LIKE 'cc by%'
        OR (pil.author IS NOT NULL AND pil.author <> ''
            AND pil.attribution_text IS NOT NULL AND pil.attribution_text <> ''))
   ```
3. 数据卫生：`UPDATE product_image_license SET risk_notes=NULL WHERE risk_notes=''`（#85 空串归一化为 NULL）。

### 验证
| 检查项 | 修复前 | 修复后 |
|---|---|---|
| qualified（Java 口径） | 107 | **109**（含 EliteDesk 新增） |
| SQL 门控 | 108 | **109** |
| API total | 108 | **109** |
| 两者差异 | 1 | **0** |

### 针对性测试
`ProductImageLicenseGateTest` 新增 2 个测试：
- `sqlGateExcludesProductsWithUnresolvedRisk`：验证有风险标记的商品不进入列表 SQL 门控结果；风险解除后两侧同时放行。
- `sqlGateExcludesCcByImagesWithoutAttribution`：验证 CC BY 缺署名的商品不进入列表；补齐署名后两侧同时放行。

---

## 3. 显示器与台式电脑分类扩充

### 现状核实
- 显示器：8 个商品，全部为中国特供型号（LG 27GP95RP、三星玄龙骑士 G7、泰坦军团 P27A6V 等），Commons 上无对应产品照片。
- 台式电脑：6 个商品，全部为中国特供型号（联想拯救者刃 9000K、微星海皇戟、华硕玩家国度等），Commons 上无对应产品照片。

### 搜索结果
通过 Commons API 检索 18 个国际通用型号（显示器 10 个 + 台式 8 个），**严格核验通过 0 个**。检索到的"通过"项经人工复核均为误匹配：
- "Apple MacBook Pro 16" M2 Max" → 匹配到 MacBook Pro（笔记本，非台式）
- "Timeline of the product Apple iMac.svg" → Timeline 图，非产品照片
- "HP EliteDesk 800 35 W G2 mini" → 型号 G2，非 G7

### 实际新增
| 分类 | 新增 | 说明 |
|---|---|---|
| 台式电脑 | **1 个** | HP EliteDesk 800 G2 Mini（CC BY-SA 4.0，作者 Miguel Durán, Museo8bits，Commons 原图链接已验证 HTTP 200） |
| 显示器 | **0 个** | 无通过核验的候选图片 |

**显示器分类可展示商品数仍为 0**：Commons 上无该分类现有商品型号（中国特供型号）或已检索国际型号的合格产品照片。已尝试型号包括 Dell U2415/U2723QE/P2419H、LG 27UK850/27GP850、Samsung Odyssey G7、BenQ EW3270U、ASUS ProArt PA279CV/TUF VG27AQ、AOC 24G2，候选池为空或无通过核验。

---

## 4. 扩容前后数量

| 指标 | 本轮前 | 本轮后 | 增量 |
|---|---|---|---|
| products（deleted=0） | 200 | **201** | +1 |
| product_images | 247 | **248** | +1 |
| product_image_license | 116 | **117** | +1 |
| **可展示商品（qualified）** | **107** | **109** | **+2** |
| product_source | 0 | 0 | 0（未触发同步） |

> 可展示商品从 107 → 109：修复 qualified 定义差异（+1，#85 空串风险标记归一化）+ 新增 HP EliteDesk G2 Mini（+1）。

### 按分类可展示数量（最终）
| 分类 | 可展示 | 分类 | 可展示 |
|---|---|---|---|
| 相机 | 21 | 键盘 | 5 |
| 手机 | 16 | 平板电脑 | 5 |
| 笔记本电脑 | 12 | 路由器 | 5 |
| CPU | 9 | 固态硬盘 | 3 |
| 智能手表 | 8 | 显卡 | 2 |
| 鼠标 | 8 | 内存 | 1 |
| 游戏机 | 6 | **台式电脑** | **1** |
| 耳机 | 6 | 显示器 | 0 |

---

## 5. 测试结果

| 测试 | 结果 |
|---|---|
| 后端 `mvn test`（112 个测试，连接 `geek_price_test`） | ✅ **112/112 通过，BUILD SUCCESS** |
| 用户端 `vue-tsc` + `npm run build` | ✅ exit 0 / ✓ built in 9.68s |
| 管理端 `vue-tsc` + `npm run build` | ✅ exit 0 / ✓ built in 9.98s |
| API 验收（8 项） | ✅ **8/8 通过** |

### API 验收明细
| 验证项 | 结果 |
|---|---|
| 列表 total | ✅ total=109 |
| 台式电脑分类商品数 | ✅ count=1 |
| 显示器分类商品数 | ✅ count=0（如实报告） |
| EliteDesk 详情（images+attr） | ✅ images=1 attr=1 |
| EliteDesk 比价 | ✅ 平台数=3 |
| 前端可访问 | ✅ HTTP 200 |
| 搜索 ThinkPad | ✅ count=2 |
| 推荐 | ✅ count=10 |

---

## 6. 未解决的问题

1. **显示器分类可展示商品数为 0**：Commons 上无该分类现有商品型号或已检索国际型号的合格产品照片。若需覆盖，需扩展到其他开放图片源或使用本地拍摄图片。

2. **部分商品无通过候选（89 项）**：第二波扩容中 89 项检索后无通过核验的候选图片，主要为中国特供型号（Commons 覆盖滞后）或候选池中主体不符（拆机图/对比图/截图/配件图等）。

3. **模拟数据标识为全局标注**：所有报价/历史/规格均为模拟数据，因此全局标注而非按商品区分。若后续接入真实数据源，需改为按 `source` 字段动态标注。

4. **8 个受同步影响商品的报价/历史/规格保留现状**（无快照，按规则不擅自恢复）。
