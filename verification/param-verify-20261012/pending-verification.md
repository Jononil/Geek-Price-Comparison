# 参数待核验清单（型号级参数来源核验）

> 生成时间：2026-10-12｜执行环境网络受限，自动核验已停止

## 一、网络核验阻塞证据（本轮实际尝试）

| 来源 | URL | 结果 |
|---|---|---|
| GSMArena | gsmarena.com/samsung_galaxy_s23-12082.php | HTTP 200 但返回 Turnstile 人机验证页，无参数内容 |
| Apple 官方规格页 | apple.com/iphone-16-pro/specs/ | 重定向至 iphone 销售页，旧型号规格页已归档下线 |
| Samsung 美国官网 | samsung.com/us/smartphones/galaxy-s23/specs/ | 重定向至 S 系列产品枢纽页，S23 规格页已归档 |
| Samsung 中国官网 | samsung.com.cn/smartphones/galaxy-s23/ | 重定向至 S 系列枢纽页，旧型号下线 |
| Wikipedia (en/zh) | en.wikipedia.org / zh.wikipedia.org | DNS 解析到非公网地址（环境限制），无法访问 |
| 联网搜索 | web_search API | fetch failed（搜索服务在本环境不可用） |

**结论**：本运行环境无法获取任何可引用的在线规格页面。按治理规则：**停止将 reference 升级为 verified**，不将内部知识标注为"已联网核验"。

## 二、待核验商品与参数清单（reference 状态，共 20 款商品 / 234 项参数）

| 商品 ID | 商品 | 品类 | reference 参数数 | 建议核验证据（需可访问后逐项核对） |
|---|---|---|---|---|
| 1 | iPhone 16 Pro | 手机 | 12 | apple.com/iphone-16-pro/specs（含电池：Apple 未公布，核验时仍应留空） |
| 2 | iPhone 15 | 手机 | 11 | apple.com/iphone-15/specs |
| 3 | 华为 Mate 60 Pro | 手机 | 15 | consumer.huawei.com/cn/phones/mate60-pro/specs |
| 4 | 华为 Pura 70 Pro | 手机 | 15 | consumer.huawei.com/cn/phones/pura70-pro/specs |
| 6 | 小米 14 | 手机 | 15 | mi.com/product/xiaomi-14/specs |
| 7 | OPPO Find X7 Ultra | 手机 | 15 | oppo.com/cn/smartphones/series-find-x/find-x7-ultra/specs |
| 10 | 荣耀 Magic6 Pro | 手机 | 15 | honor.com/cn/phones/honor-magic6-pro/specs |
| 11 | 三星 Galaxy S24 | 手机 | 15 | samsung.com.cn Galaxy S24 规格页（国行骁龙版需与国际版区分） |
| 45493 | Samsung Galaxy S23 | 手机 | 15 | 同上（需确认国行/国际版芯片差异） |
| 45494 | Samsung Galaxy S22 Ultra | 手机 | 15 | 同上（含 S Pen 重量口径） |
| 45495 | iPhone SE (3rd generation) | 手机 | 11 | apple.com/iphone-se/specs |
| 45532 | iPhone X | 手机 | 11 | Apple 支持文档/存档规格页 |
| 45534 | iPhone 11 | 手机 | 11 | Apple 支持文档/存档规格页 |
| 45535 | Samsung Galaxy S8 | 手机 | 15 | 存档规格页（2017 型号，官方已下线） |
| 45536 | Samsung Galaxy S9 | 手机 | 15 | 存档规格页（2018 型号，官方已下线） |
| 45537 | Samsung Galaxy S10+ | 手机 | 15 | 存档规格页（2019 型号，官方已下线） |
| 45497 | Apple Watch SE (2nd generation) | 智能手表 | 4 | apple.com/watch/specs（watchOS/尺寸/防水） |
| 45501 | Apple Watch SE | 智能手表 | 4 | 同上（需确认 1 代与 2 代版本差异） |
| 23 | MacBook Air M3 | 笔记本电脑 | 6 | apple.com/macbook-air/specs（M3 版） |
| 24 | MacBook Pro 14 | 笔记本电脑 | 6 | apple.com/macbook-pro/specs（M3 版 14 英寸） |

**核验要求**（逐项，不可整批批准）：
1. 每项参数须由来源页面上的明确条目支持（型号、版本一致）；
2. 三星"国行/国际版"芯片差异（骁龙 for Galaxy vs Exynos）须与来源版本一致；
3. Apple Watch SE 1 代 vs 2 代、MacBook Pro 14 的 M3/M4 版本须区分；
4. 核验通过后：`verify_status='verified'` + `source_url=<具体页面>` + `source_type='official'`；
5. 与来源不符的参数：修正或删除，不得保留。

## 三、本轮已完成的数据修正

| 操作 | 数量 | 说明 |
|---|---|---|
| 删除可证明错误的模板值 | 16 行 | `socket='AM5/LGA1700'`（单颗 CPU 不可能双接口）、`arch='Zen4/Alder Lake'`（不可能双架构），dev 与 test 库同步清理 |

## 四、verified / reference / template / 缺失 统计（开发库）

| 状态 | 数量 | 含义 |
|---|---|---|
| verified（已联网核验） | **0** | 本环境无法联网，无任何参数达到此标准 |
| reference（型号级参考资料） | **234** | 上表 20 款商品，未联网复核 |
| template（模板数据） | **792** | 808 - 16（本轮删除），非官方规格，前端已明确标识 |
| 缺失（如实留空） | — | 如 iPhone 全系电池容量（Apple 未官方公布）不填写 |
