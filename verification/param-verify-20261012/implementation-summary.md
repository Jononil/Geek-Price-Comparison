# 型号级参数来源核验与数据可信度提升 · 实施总结

> 执行时间：2026-10-12｜基于"参数真实性治理"轮次继续实施

---

## 一、网络核验结果：全部阻塞（已停止升级核验状态）

本轮实际尝试的核验来源及结果（证据已记录在 `verification/param-verify-20261012/pending-verification.md`）：

| 来源 | 结果 |
|---|---|
| GSMArena（Galaxy S23 规格页） | Turnstile 人机验证拦截，无参数内容 |
| Apple 官方规格页（iphone-16-pro/specs） | 重定向至销售页，旧型号规格页已归档下线 |
| Samsung 美国/中国官网（S23 规格页） | 重定向至 S 系列枢纽页，旧型号规格页已下线 |
| Wikipedia（en/zh REST API） | DNS 解析到非公网地址（环境限制） |
| 联网搜索 API | fetch failed，搜索服务不可用 |

**结论**：本运行环境无法获取任何可引用的在线规格页面。按治理规则（"来源无法访问时保留 reference，不得猜测；不得将内部知识当作已联网验证"），**本轮未将任何参数升级为 verified**，verified 数量保持 0。

---

## 二、待核验清单（已交付）

`verification/param-verify-20261012/pending-verification.md`：
- 20 款商品 / 234 项 reference 参数的逐商品清单（ID、品类、参数数、建议核验证据 URL）
- 每款商品的核验注意事项（三星国行/国际版芯片差异、Apple Watch SE 1/2 代、MacBook Pro 14 的 M3/M4 版本等）
- 逐项核验要求：来源须明确支持该参数与版本，通过后写 `verify_status='verified'` + `source_url` + `source_type='official'`；不符者修正或删除

**数据模型检查**：`product_specs` 已具备参数级追溯字段（`source_url`/`source_type`/`verify_status`），无需扩展。

---

## 三、可证明错误模板值清理（最小化删除）

| 操作 | 数量 | 依据 |
|---|---|---|
| 删除 `socket='AM5/LGA1700'` 模板行 | 8 行 | 单颗 CPU 不可能同时兼容两个插槽，自证错误 |
| 删除 `arch='Zen4/Alder Lake'` 模板行 | 8 行 | 单颗 CPU 不可能同属两种架构，自证错误 |

- dev 库：1042 → **1026** 行规格
- test 库（`geek_price_test`）同步清理：773 → **757** 行
- 其余模板值（如笔记本 "Intel Core i7"、显卡 "285W" 等）**无法证明错误也无来源可核** → 保留 `template` 状态，前端已明确标识"模板数据，非官方规格"

**其他品类治理决策**：因网络阻塞无法取得任何可靠来源，按规则**不批量生成 reference 记录**（"不为了提高可信参数数量而批量生成"）。笔记本/显卡/CPU/显示器的型号级治理待可联网环境按待核验清单执行。

---

## 四、评分与对比体验

| 修改 | 说明 |
|---|---|
| 对比页价格模块新增评分说明框 | "性价比参考评分 = 可信参数丰富度 + 用户评分 + 模拟价格优势 + 热度的加权综合（基于模拟报价），**非硬件性能跑分**；可信参数不足 3 项的商品不参与评分" |
| 行标签"性价比分数"→"性价比参考分 (非跑分)" | 明确区分参考评分与性能基准 |
| 后端 `ValueScoreService` javadoc | 已在上轮明确评分含义与降级规则，本轮未改动算法 |

未重新引入任何默认性能分/默认用户评分；可信参数 <3 项仍返回 null（前端显示"数据不足，暂不评分"）。同品类校验、跨平台比价、图片授权门控、模拟报价标识均未改动。

---

## 五、数据状态统计（开发库）

| 状态 | 数量 | 说明 |
|---|---|---|
| verified（已联网核验） | **0** | 环境无法联网，无参数达标 |
| reference（型号级参考资料） | **234** | 20 款商品，待核验清单已交付 |
| template（模板数据） | **792** | 本轮删除 16 行自证错误值后 |
| 缺失（如实留空） | — | 如 iPhone 全系电池容量（Apple 未官方公布） |

**关键参数错配复核**：
- 苹果系统：iPhone 全系 iOS（18/17/15.4/13/11），Apple Watch 系 watchOS，无 Android/Wear OS 错配 ✅
- MacBook 芯片：Apple M3，无 i9/RTX 错配 ✅
- CPU 插槽/架构：无 AM5/LGA1700、Zen4/Alder Lake 双值 ✅
- 显卡/内存/屏幕：无已知系统性错配（显卡规格为随机但非跨类错配，维持 template 标识）✅

---

## 六、测试结果

| 测试 | 命令 | 结果 |
|---|---|---|
| 后端定向测试（连接 geek_price_test，执行前已核实 JDBC URL 隔离机制不变） | `mvn test -Dtest=ProductSpecTruthTest,ValueScoreRecommendationTest,ProductCompareCategoryTest` | ✅ **27/27 通过，BUILD SUCCESS** |
| 新增测试 `provablyWrongTemplateValuesRemoved` | 同上 | ✅ 通过（垃圾模板值不复活） |
| 前端 TypeScript 检查 | `npx vue-tsc -b --force` | ✅ exit 0 |
| 前端生产构建 | `npm run build` | ✅ ✓ built in 30.07s |
| API/页面验证 | node + 浏览器 | ✅ 3/3（对比页可访问、iPhone 16 Pro 无垃圾值、CPU 商品无垃圾值） |

> 未运行全量后端测试（本轮后端仅新增 1 个测试方法 + 无生产代码改动；27 个相关测试已覆盖评分降级、同品类校验、参数真实性）。

---

## 七、剩余问题

1. **联网核验阻塞**：234 项 reference 参数无法升级为 verified，待核验清单与所需证据已交付（`pending-verification.md`），需可联网环境逐项核对。
2. **其他品类无可靠来源**：笔记本/显卡/CPU/显示器的 792 项 template 参数维持未核验标识；仅删除了 16 行自证错误值。批量治理需先解决来源访问问题。
3. **未运行全量后端测试**：如需可另行执行 `mvn test` 全量回归。
