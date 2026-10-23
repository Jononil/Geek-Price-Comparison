# 商品核心参数真实性治理与专业对比优化 · 实施总结

> 执行时间：2026-10-12｜模式：数据修复 + 后端治理 + 前端展示升级

---

## 1. 数据来源定位（根因）

| 来源 | 问题 |
|---|---|
| **种子数据（`03-product-data.sql`）** | 按品类随机套用模板值：iPhone 15 显示"天玑9300+"（联发科芯片出现在苹果手机上）、"2亿像素主摄" |
| **扩容脚本 `SPEC_BY_CAT`** | 按品类套用模板：所有手机 `os=Android / iOS`、`chip=八核`、`battery=4500mAh`；所有 MacBook 套用 `CPU=i9-14900HX`、`GPU=RTX 4070`（Intel/NVIDIA 芯片出现在 Apple Silicon 电脑上） |
| **MockProductProvider** | 生成 Mock 商品时不写入规格（规格问题不在同步链路） |
| **ValueScoreService** | `performanceScore` 缺失时默认 60，`userScore` 缺失时默认 4.0×20=80——**用默认值填补伪造性能分** |

**实际数据库确认**：`products` 表无 `model` 字段；`product_specs` 表原有 6 列（id/product_id/spec_key/spec_label/spec_value/sort），无来源/核验字段。

---

## 2. 数据治理（迁移 + 修复）

### 2.1 最小数据库迁移（`database/06-product-spec-source.sql`，幂等）
```sql
ALTER TABLE product_specs
  ADD COLUMN source_url VARCHAR(500) NULL,
  ADD COLUMN source_type VARCHAR(32) NULL,
  ADD COLUMN verify_status VARCHAR(32) NOT NULL DEFAULT 'template';
```
- 向后兼容：新列可空/有默认值，不影响现有查询
- 测试库 `geek_price_test` 同步执行相同 DDL

### 2.2 错配数据清理
| 操作 | 数量 |
|---|---|
| 删除手机品类全部模板规格（含 iPhone 显示 Android） | ~100 行 |
| 删除苹果手表 Wear OS 错配（45497/45501） | 8 行 |
| 删除 MacBook i9/RTX 错配（23/24） | 12 行 |
| 现有规格标记 `verify_status='template'` | 808 行 |
| 清空伪造评分 `performance_score=NULL, value_score=NULL` | 201 个商品 |

### 2.3 型号级参考资料（`verify_status='reference'`）
**16 款手机**逐一写入型号对应参数（`source_type='internal_knowledge'`，`source_url=NULL`）：

| 参数键 | 示例值（iPhone 16 Pro） |
|---|---|
| `os` | iOS 18 |
| `chip` | Apple A18 Pro |
| `screen_size` / `resolution` / `refresh` / `panel` | 6.3英寸 / 2622×1206 / 120Hz / OLED (Super Retina XDR) |
| `ram` / `storage` | 8GB / 128GB/256GB/512GB/1TB |
| `camera_rear` / `camera_front` | 48MP主摄+48MP超广角+12MP 5倍长焦 / 12MP |
| `battery` / `wired_charging` | **不填写**（Apple 未官方公布，不伪造） |
| `weight` | 199g |

覆盖：iPhone 16 Pro/15/SE3/X/11、三星 S8/S9/S10+/S22 Ultra/S23/S24、华为 Mate 60 Pro/Pura 70 Pro、小米 14、OPPO Find X7 Ultra、荣耀 Magic 6 Pro、Apple Watch SE ×2、MacBook Air M3/Pro 14。**共 234 行 reference 规格**。

---

## 3. 后端治理

### 3.1 实体扩展（`ProductSpec.java`）
新增 `sourceUrl`、`sourceType`、`verifyStatus` 字段，序列化到前端。

### 3.2 评分服务治理（`ValueScoreService` + `ValueScoreServiceImpl`）
| 改动 | 说明 |
|---|---|
| 接口签名 `int calculate` → `Integer calculate` | 数据不足时返回 null |
| **可信参数门槛** | `verified + reference` 规格 <3 项 → 返回 null（"数据不足，暂不评分"） |
| **剔除伪造默认值** | `performanceScore` null 时剔除该维度（不再默认 60）；`userRating` null 时剔除（不再默认 4.0）；权重按剩余维度重新归一 |
| **功能分仅计可信参数** | `calcFunctionScore` 只统计 `verified/reference` 条数，模板参数不参与 |
| **重算强制写 NULL** | `recalculateAll` 使用 `LambdaUpdateWrapper.set` 确保数据不足商品 `value_score=NULL`（`updateById` 会跳过 null 字段） |

### 3.3 测试更新
- `ValueScoreRecommendationTest`：tests 1-3 更新为"可信参数充足 → 评分在 0-100；参数不足 → null"
- **新增 `ProductSpecTruthTest`（5 个测试）**：
  1. 苹果手机不显示 Android
  2. 不同手机型号处理器互不相同（模板复制特征检测）
  3. 未知参数不被伪造（iPhone 无 battery 行）
  4. 核验状态正确落库
  5. 仅含模板参数的商品评分返回 null

---

## 4. 前端展示升级

### 4.1 对比页（`CompareView.vue`）
- **信任分级分组**：verified/reference 参数进品类组（组标签显示"参考资料·未联网复核"）；template 参数统一归入"未核验参数（模板数据，非官方规格）"组（红色警示标签）
- **来源链接**：有 `source_url` 的参数显示"来源"链接（本轮全部为 NULL，故不显示）
- **暂无可靠数据**：缺失参数显示"暂无可靠数据"（不再显示"—"）
- **可信度汇总**：表格底部显示"已核验 X 项 · 参考资料 Y 项（未联网复核）· 模板数据 Z 项（非官方规格）"
- **评分空值**：`valueScore=null` 时显示"数据不足，暂不评分"；`performanceScore=null` 时显示"暂无可靠数据"
- **参数完整度**：改为"可信/全部"格式（如"12 / 12 项"）

### 4.2 详情页（`ProductDetailView.vue`）
- 每条参数显示核验状态标签：已核验（绿）/ 参考（蓝）/ 模板（灰）
- 有来源 URL 时显示"来源"链接
- 底部显示"参数可信度"统计

### 4.3 类型定义（`types/index.ts`）
`ProductSpec` 新增 `sourceUrl/sourceType/verifyStatus`；`Product.valueScore/performanceScore` 改为 `number | null`。

---

## 5. 数据更新与安全

| 措施 | 结果 |
|---|---|
| 不清空/重建数据库 | ✅ 仅定向删除错配模板规格 |
| 不删除 200 个商品 | ✅ products 表 201 行不变 |
| 不改图片授权审批 | ✅ product_image_license 117 行不变 |
| 不触发 Mock 同步 | ✅ product_source 0 行 |
| 测试库隔离 | ✅ geek_price_test 同步 DDL + 手机规格，129/129 通过 |

---

## 6. 测试结果

| 测试 | 命令 | 结果 |
|---|---|---|
| 后端全量 | `mvn test -DargLine=-Djdk.attach.allowAttachSelf=true` | ✅ **129/129 通过，BUILD SUCCESS** |
| 新增参数真实性测试 | `mvn test -Dtest=ProductSpecTruthTest` | ✅ **5/5 通过** |
| 评分治理测试 | `mvn test -Dtest=ValueScoreRecommendationTest` | ✅ **9/9 通过** |
| 前端 TS + 构建 | `npx vue-tsc -b --force && npm run build` | ✅ exit 0 / ✓ built in 10.40s |
| API 验收（7 项） | headless Chrome | ✅ **7/7 通过** |
| 浏览器验收（12 项） | CDP | ✅ **12/12 通过** |

---

## 7. 核验状态与数据缺口

### 实际完成的核验
- **联网核验：0 项**——官方规格页已归档（Apple/Samsung 重定向）、GSMArena 拦截（Turnstile）、Wikipedia 被环境 DNS 限制（`resolves to a non-public IP`）。本环境无法进行真实联网核验。

### 有来源但未联网复核的数据
- **234 项 `reference` 参数**（16 款手机 + 2 Apple Watch + 2 MacBook）：基于型号级参考资料，标记 `verify_status='reference'`、`source_type='internal_knowledge'`、`source_url=NULL`。这些参数匹配具体型号和版本，**非模板生成**，但未经实时联网复核。

### 模板数据
- **808 项 `template` 参数**（笔记本/显卡/CPU/显示器等 14 个品类）：来自种子数据或扩容脚本，**非官方规格**，前端归入"未核验参数"组并明确标注。

### 评分状态
- **20 个商品有评分**（可信参数 ≥3 项）：主要是手机、Apple Watch、MacBook（有 reference 参数的商品）
- **181 个商品无评分**（`value_score=NULL`）：可信参数不足，前端显示"数据不足，暂不评分"

---

## 8. 未解决的问题

1. **联网核验受限**：本环境无法访问 Apple/Samsung/GSMArena/Wikipedia 官方规格页，全部 reference 参数未联网复核。如需升级为 `verified` 状态，需在可联网环境重新核验并更新 `verify_status` 和 `source_url`。

2. **非手机品类参数仍为模板**：笔记本/显卡/CPU/显示器等 14 个品类的 808 项参数仍为模板数据，未进行型号级治理。如需治理，可复用本次手机品类的方案（识别品牌/型号 → 写入 reference 参数 → 标记 template）。

3. **评分可解释性有限**：手机评分主要基于"可信参数数量 + 用户评分 + 模拟价格优势 + 热度"，未使用实际跑分或基准测试数据。`performance_score` 列全为 NULL（不再伪造），未参与评分计算。

4. **对比页 DIR 方向高亮**：仅对电池/刷新率/内存/存储/重量等方向明确参数标注"更优值"，屏幕尺寸/分辨率等标注为"因用途而异"不做高亮。
