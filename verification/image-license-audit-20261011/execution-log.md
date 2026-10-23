# 阶段 B-1 · 执行日志

> 执行日期：2026-10-10｜全程只读（无 INSERT/UPDATE/DELETE/ALTER）

## 一、执行步骤

| # | 步骤 | 结果 |
|---|---|---|
| 1 | 读取阶段 A 产物（7 份）+ 历史审核文件 | 全部存在并读取成功 |
| 2 | Git 状态检查 | **非 Git 仓库**（与阶段 A 一致），未初始化，仅记录事实 |
| 3 | 只读 SQL 提取 47 张真实图 | products=132、product_images=179（真实 47）、表 25；确认 product_images 无 license/author 字段 |
| 4 | URL→Commons 文件名解析 | 47/47 成功（含 14 张 thumb URL、33 张原图 URL） |
| 5 | 历史导入批次溯源 | 批次1-试点(5) + 批次2-正式导入(28) + 批次3-phase2(7) + 批次4-phase4(7) = 47；**URL 级核对全部一致**（首次正则漏配 28 条，修正表格式后重跑通过） |
| 6 | Commons API 批量核验授权元数据 | 2 批（25+22），**47/47 返回完整 extmetadata**（含一次 fetch 失败重试成功） |
| 7 | 逐张分类审计 | CC_BY_SA 30 / CC_BY 16 / CC0 1；APPROVED 1、APPROVED_WITH_ATTRIBUTION 43、PENDING 3、REJECTED 2（按前台资格） |
| 8 | 隐患扫描 | License review needed 3 张（#24/#105/#106）、GFDL 双许可 1 张（#83）、Flickr 来源 5 张 |
| 9 | 生成 7 份交付文件 | 见下节 |

## 二、核验范围与失败项

- **已核验**：47/47 张图的 LicenseShortName（含版本）、LicenseUrl、Artist、Credit、Categories，均来自 Commons API 一手数据。
- **未发生**：无任何文件在 Commons 缺失（missing=0）。
- **一次工具问题**：Commons API 返回的文件名用空格、URL 派生的用下划线，首次关联全部落空（47 条误判为"元数据缺失"），归一化后修复——此为脚本 bug，非数据问题。
- **未检索新图**：按任务要求未进行大规模图片检索；#12/#49 未导入。

## 三、数据库读取统计（全部只读 SELECT）

| 表 | 读取 |
|---|---|
| product_images | 47 行（真实图）+ 结构核验 |
| products | 132 行（id/name/brand_id/category_id） |
| brands / categories | 60 / 16 行 |
| information_schema | columns/tables 结构核验 |

脚本内置"非 SELECT 抛错"断言；连接凭据仅存于本机脚本运行环境，未写入任何报告文件。

## 四、敏感信息保护

- 所有报告文件不含数据库密码、令牌或 Cookie。
