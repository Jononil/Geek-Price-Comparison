# 阶段 A · 执行日志

> 执行日期：2026-10-10｜环境：Windows / Node.js ESM / MySQL 8.4（只读 SELECT）

## 一、执行步骤

| # | 步骤 | 产物/结果 |
|---|---|---|
| 1 | 核验项目目录与 Git 状态 | **该目录不是 Git 仓库**（`fatal: not a git repository`），无版本控制保护，本轮未修改任何既有文件 |
| 2 | 核验历史产物存在性 | 13 个历史文件中 12 个存在；`verification/summary.md` **不存在**（实际对应文件为 `db-product-image-summary.md`），未伪造未重建 |
| 3 | 只读核查数据库结构 | products 20 列（无 model 字段，与任务描述一致）；product_images 仅 4 列（无 license/source/author）；25 表 |
| 4 | 只读读取商品与图片数据 | products=132（deleted=0），product_images=179（占位 132 + 真实 47），有真实图商品 47，无重复 URL |
| 5 | 核验历史导入一致性 | final-image-import-result.md 记录的 28 个商品**当前全部仍有真实图**（28/28 ✅，与 DB 一致） |
| 6 | 全部 47 张真实图 URL 存活验证 | curl 并发触发大量 429（误报失效）→ 慢速浏览器逐张验证：**47/47 全部 200**，零失效 URL |
| 7 | Openverse 可达性测试 | **不可达**（fetch failed；今日复测 status=0），按任务规则记录后停止，不重试不改 DNS 不装代理 |
| 8 | Wikimedia 严格检索（85 个缺图商品） | 3 词/商品（brand+model / model / brand+rawModel），品牌身份词+完整型号+主体+许可四重门槛，产出候选明细 259 条 |
| 9 | 人工终审（逐条看标题） | 初判 7 HIGH → 终审剔除 5（多设备/系列级/内部件/类别冲突/型号不确定），保留 2 NEW_HIGH_CONFIDENCE |
| 10 | Open Products Facts 实测 | 49 品牌 229 条有图条目，严格命中 2 条且均冗余/系列级 → **0 新增合格图** |
| 11 | 生成 7 份交付文件 | 见下节 |

## 二、检索范围与未覆盖来源

- **已实际检索**：Wikimedia Commons（全量 85 个缺图商品）、Open Products Facts（49 品牌全量扫描）、Openverse（可达性测试）
- **未覆盖/无法覆盖**：Openverse、Flickr（网络出口阻断）；Unsplash/Pexels/Pixabay（需注册 Key，且通用图库不适配精确型号）；品牌官网（版权不开放）
- **限制声明**：本审计未穷尽互联网资源；结论仅基于上述实际可达来源。

## 三、数据库读取统计

| 表 | 读取行数 | 方式 |
|---|---|---|
| products | 132 | SELECT id,name,brand_id,category_id,status,deleted WHERE deleted=0 |
| product_images | 179 | SELECT product_id,url,sort（含占位图，用于判断已有真实图） |
| brands | 60 | SELECT id,name |
| categories | 16 | SELECT id,name |
| information_schema.columns/tables | 25 表 + 结构明细 | 仅 SELECT |

**所有 SQL 均为纯只读 SELECT**，脚本内置「非 SELECT 直接抛错」断言（`_ro-audit.mjs` 等）。

## 四、异常与未完成事项

1. **MySQL 中途两次停止**（历史上已知的进程不稳定问题）→ 重启后重跑，最终数据完整；第一版统计出现 55≠85 对账错误，系状态归一遗漏（bestStatus=REJECT 未归入 NO_QUALIFIED_IMAGE），已修复并对账通过。
2. **Wikimedia 429 限流**导致并发 URL 验证大面积误报 → 改慢速逐张验证后 47/47 全 200。
3. `verification/summary.md` 缺失（任务清单与实际文件名不一致）→ 如实记录，未伪造。
4. 非 Git 仓库，无法用版本控制保护用户工作区 → 本轮以只读方式操作，未触碰任何既有文件。

## 五、敏感信息保护

- 报告文件中未出现数据库密码、令牌或 Cookie；数据库连接仅在本机脚本内部使用默认本机配置。
