# 图片补充 · 第三阶段候选审核（EXACT_MATCH / SERIES_MATCH）

> 生成时间：2026-10-08T04:18:43.256Z
> 范围：数据库 deleted=0 产品 132 个；已有真实图 40 个（**不重复处理**）；本轮目标 **92** 个
> 本轮**只做候选收集与审核，未执行任何 INSERT / UPDATE / DELETE**；未改前后端代码。

## 一、结果统计

| 等级 | 数量 |
|---|---|
| **EXACT_MATCH**（新增候选） | **1** |
| **SERIES_MATCH** | **14** |
| **无可靠候选** | **77** |
| 合计 | 92 |

## 二、推荐导入清单

> 优先精确型号；无精确型号时才用系列级。全部为开放许可 + 500px 缩略图 + 产品主体。

| # | product_id | 产品 | 品牌 | matchType | 系列 | 许可证 | 分数 | 图片标题 | 500px 缩略图 URL | Commons 页面 |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 122 | 金士顿骇客神条 32GB | 金士顿 | **EXACT_MATCH** | Kingston FURY 系列 | CC BY-SA 4.0 | 115 | Kingston FURY Impact DDR5 SO-DIMM Laptop Memory 32GB Module  | https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8b/Kingston_FURY_Impact_DDR5_SO-DIMM_Laptop_Memory_32GB_Module_-_front_view.jpg/500px-Kingston_FURY_Impact_DDR5_SO-DIMM_Laptop_Memory_32GB_Module_-_front_view.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail | https://commons.wikimedia.org/wiki/File:Kingston%20FURY%20Impact%20DDR5%20SO-DIMM%20Laptop%20Memory%2032GB%20Module%20-%20front%20view.jpg |
| 2 | 5 | 小米 14 Ultra | 小米 | **SERIES_MATCH** | Xiaomi 14 系列 | CC BY-SA 4.0 | 75 | Xiaomi 14 (July 10, 2026).jpg | https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/Xiaomi_14_%28July_10%2C_2026%29.jpg/500px-Xiaomi_14_%28July_10%2C_2026%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail | https://commons.wikimedia.org/wiki/File:Xiaomi%2014%20(July%2010%2C%202026).jpg |
| 3 | 8 | vivo X100 Ultra | vivo | **SERIES_MATCH** | vivo X100 系列 | CC BY-SA 4.0 | 75 | Vivo X100 pic2.jpg | https://thumb.wikimedia.org/wikipedia/commons/thumb/3/33/Vivo_X100_pic2.jpg/500px-Vivo_X100_pic2.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail | https://commons.wikimedia.org/wiki/File:Vivo%20X100%20pic2.jpg |
| 4 | 23 | MacBook Air M3 | 苹果 | **SERIES_MATCH** | Apple MacBook Air 系列 | CC BY-SA 3.0 | 80 | Macbook Air.jpg | https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c9/Macbook_Air.jpg/500px-Macbook_Air.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail | https://commons.wikimedia.org/wiki/File:Macbook%20Air.jpg |
| 5 | 44 | AOC 27 4K | AOC | **SERIES_MATCH** | AOC 显示器系列 | CC BY-SA 4.0 | 80 | AOC 27B2H LCD MONITOR.jpg | https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6b/AOC_27B2H_LCD_MONITOR.jpg/500px-AOC_27B2H_LCD_MONITOR.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail | https://commons.wikimedia.org/wiki/File:AOC%2027B2H%20LCD%20MONITOR.jpg |
| 6 | 45 | 明基 PD2705U | 明基 | **SERIES_MATCH** | BenQ 专业显示器系列 | CC BY-SA 4.0 | 80 | BENQ MONITOR (Жидкокристалический).jpg | https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2e/BENQ_MONITOR_%28%D0%96%D0%B8%D0%B4%D0%BA%D0%BE%D0%BA%D1%80%D0%B8%D1%81%D1%82%D0%B0%D0%BB%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9%29.jpg/500px-BENQ_MONITOR_%28%D0%96%D0%B8%D0%B4%D0%BA%D0%BE%D0%BA%D1%80%D0%B8%D1%81%D1%82%D0%B0%D0%BB%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail | https://commons.wikimedia.org/wiki/File:BENQ%20MONITOR%20(%D0%96%D0%B8%D0%B4%D0%BA%D0%BE%D0%BA%D1%80%D0%B8%D1%81%D1%82%D0%B0%D0%BB%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9).jpg |
| 7 | 48 | Bose QC Ultra | Bose | **SERIES_MATCH** | Bose QuietComfort 系列 | CC BY-SA 4.0 | 80 | Bose QuietComfort Ultra Earbuds - 3.jpg | https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/Bose_QuietComfort_Ultra_Earbuds_-_3.jpg/500px-Bose_QuietComfort_Ultra_Earbuds_-_3.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail | https://commons.wikimedia.org/wiki/File:Bose%20QuietComfort%20Ultra%20Earbuds%20-%203.jpg |
| 8 | 83 | 小米 Watch S3 | 小米 | **SERIES_MATCH** | Xiaomi Watch S 系列 | CC BY-SA 4.0 | 80 | Xiaomi Mi Watch Black.jpg | https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/Xiaomi_Mi_Watch_Black.jpg/500px-Xiaomi_Mi_Watch_Black.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail | https://commons.wikimedia.org/wiki/File:Xiaomi%20Mi%20Watch%20Black.jpg |
| 9 | 96 | RTX 4070 Super | 英伟达 | **SERIES_MATCH** | NVIDIA GeForce RTX 4070 系列 | CC BY-SA 4.0 | 75 | 2023 Gigabyte GeForce RTX 4070 Aero OC 12GB (3).jpg | https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2e/2023_Gigabyte_GeForce_RTX_4070_Aero_OC_12GB_%283%29.jpg/500px-2023_Gigabyte_GeForce_RTX_4070_Aero_OC_12GB_%283%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail | https://commons.wikimedia.org/wiki/File:2023%20Gigabyte%20GeForce%20RTX%204070%20Aero%20OC%2012GB%20(3).jpg |
| 10 | 114 | 三星 990 Pro 2TB | 三星 | **SERIES_MATCH** | Samsung 990 PRO 系列 | CC BY-SA 4.0 | 80 | SAMSUNG M.2 NVMe SSD 990 PRO 4TB.jpg | https://thumb.wikimedia.org/wikipedia/commons/thumb/4/46/SAMSUNG_M.2_NVMe_SSD_990_PRO_4TB.jpg/500px-SAMSUNG_M.2_NVMe_SSD_990_PRO_4TB.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail | https://commons.wikimedia.org/wiki/File:SAMSUNG%20M.2%20NVMe%20SSD%20990%20PRO%204TB.jpg |
| 11 | 123 | 海盗船复仇者 32GB | 海盗船 | **SERIES_MATCH** | Corsair Vengeance 系列 | CC BY-SA 4.0 | 80 | 2014 Corsair Vengeance 4GB, 1600MHz.jpg | https://thumb.wikimedia.org/wikipedia/commons/thumb/1/11/2014_Corsair_Vengeance_4GB%2C_1600MHz.jpg/500px-2014_Corsair_Vengeance_4GB%2C_1600MHz.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail | https://commons.wikimedia.org/wiki/File:2014%20Corsair%20Vengeance%204GB%2C%201600MHz.jpg |
| 12 | 125 | 英睿达 32GB | 英睿达 | **SERIES_MATCH** | Crucial 内存系列 | CC BY-SA 2.0 | 80 | Crucial 1gb SDRAM PC133 DIMM Memory Module.jpg | https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/Crucial_1gb_SDRAM_PC133_DIMM_Memory_Module.jpg/500px-Crucial_1gb_SDRAM_PC133_DIMM_Memory_Module.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail | https://commons.wikimedia.org/wiki/File:Crucial%201gb%20SDRAM%20PC133%20DIMM%20Memory%20Module.jpg |
| 13 | 129 | TP-Link XDR6080 | TP-Link | **SERIES_MATCH** | TP-Link 路由器系列 | CC BY-SA 3.0 | 80 | Router TP-LINK.jpg | https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/Router_TP-LINK.jpg/500px-Router_TP-LINK.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail | https://commons.wikimedia.org/wiki/File:Router%20TP-LINK.jpg |
| 14 | 130 | 华为 AX3 Pro | 华为 | **SERIES_MATCH** | Huawei 路由器系列 | CC BY 4.0 | 80 | HUAWEI Router X3 Pro – Sunrise Gold.jpg | https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/HUAWEI_Router_X3_Pro_%E2%80%93_Sunrise_Gold.jpg/500px-HUAWEI_Router_X3_Pro_%E2%80%93_Sunrise_Gold.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail | https://commons.wikimedia.org/wiki/File:HUAWEI%20Router%20X3%20Pro%20%E2%80%93%20Sunrise%20Gold.jpg |
| 15 | 131 | 中兴 AX5400 Pro | 中兴 | **SERIES_MATCH** | ZTE 路由器系列 | CC BY-SA 4.0 | 75 | ZTE WiFi router4G.jpg | https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/ZTE_WiFi_router4G.jpg/500px-ZTE_WiFi_router4G.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail | https://commons.wikimedia.org/wiki/File:ZTE%20WiFi%20router4G.jpg |

### 逐条匹配依据

**#122 金士顿骇客神条 32GB**（金士顿 / 内存）→ EXACT_MATCH

- 完整型号：`骇客神条 32gb`
- 系列名称：Kingston FURY 系列
- 必需 token：kingston + fury
- 匹配依据：标题含完整型号「骇客神条 32gb」且无变体/容量冲突（品牌+系列 kingston + fury 亦命中）
- 主体说明：Front view of a Kingston FURY Impact DDR5 SO-DIMM Laptop Memory 32GB Module.
- 图片标题：Kingston FURY Impact DDR5 SO-DIMM Laptop Memory 32GB Module - front view.jpg
- 许可：CC BY-SA 4.0｜creator：ITEagle Europe - Sebastiaan Broekhoven
- 缩略图：https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8b/Kingston_FURY_Impact_DDR5_SO-DIMM_Laptop_Memory_32GB_Module_-_front_view.jpg/500px-Kingston_FURY_Impact_DDR5_SO-DIMM_Laptop_Memory_32GB_Module_-_front_view.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail

**#5 小米 14 Ultra**（小米 / 手机）→ SERIES_MATCH

- 完整型号：`14 ultra`
- 系列名称：Xiaomi 14 系列
- 必需 token：xiaomi + 14
- 匹配依据：品牌+系列一致（xiaomi + 14），产品类型为 phone；型号差异：标题缺「ultra」；缺型号关键锚点
- 主体说明：Xiaomi 14.
- 图片标题：Xiaomi 14 (July 10, 2026).jpg
- 许可：CC BY-SA 4.0｜creator：茅野ふたば
- 缩略图：https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/Xiaomi_14_%28July_10%2C_2026%29.jpg/500px-Xiaomi_14_%28July_10%2C_2026%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail

**#8 vivo X100 Ultra**（vivo / 手机）→ SERIES_MATCH

- 完整型号：`x100 ultra`
- 系列名称：vivo X100 系列
- 必需 token：vivo + x100
- 匹配依据：品牌+系列一致（vivo + x100），产品类型为 phone；型号差异：标题缺「ultra」
- 主体说明：Vivo X100
- 图片标题：Vivo X100 pic2.jpg
- 许可：CC BY-SA 4.0｜creator：Vis M
- 缩略图：https://thumb.wikimedia.org/wikipedia/commons/thumb/3/33/Vivo_X100_pic2.jpg/500px-Vivo_X100_pic2.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail

**#23 MacBook Air M3**（苹果 / 笔记本电脑）→ SERIES_MATCH

- 完整型号：`macbook air m3`
- 系列名称：Apple MacBook Air 系列
- 必需 token：macbook + air
- 匹配依据：品牌+系列一致（macbook + air），产品类型为 laptop；标题未出现完整型号
- 主体说明：Macbook Air
- 图片标题：Macbook Air.jpg
- 许可：CC BY-SA 3.0｜creator：https://es.ifixit.com/User/524640/Sam+Lionheart
- 缩略图：https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c9/Macbook_Air.jpg/500px-Macbook_Air.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail

**#44 AOC 27 4K**（AOC / 显示器）→ SERIES_MATCH

- 完整型号：`27 4k`
- 系列名称：AOC 显示器系列
- 必需 token：aoc + monitor
- 匹配依据：品牌+系列一致（aoc + monitor），产品类型为 monitor；标题未出现完整型号
- 主体说明：AOC 27B2H LCD MONITOR
- 图片标题：AOC 27B2H LCD MONITOR.jpg
- 许可：CC BY-SA 4.0｜creator：Dinkun Chen
- 缩略图：https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6b/AOC_27B2H_LCD_MONITOR.jpg/500px-AOC_27B2H_LCD_MONITOR.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail

**#45 明基 PD2705U**（明基 / 显示器）→ SERIES_MATCH

- 完整型号：`pd2705u`
- 系列名称：BenQ 专业显示器系列
- 必需 token：benq + monitor
- 匹配依据：品牌+系列一致（benq + monitor），产品类型为 monitor；标题未出现完整型号；缺型号关键锚点
- 主体说明：Монитор от Benq
- 图片标题：BENQ MONITOR (Жидкокристалический).jpg
- 许可：CC BY-SA 4.0｜creator：Petruhin
- 缩略图：https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2e/BENQ_MONITOR_%28%D0%96%D0%B8%D0%B4%D0%BA%D0%BE%D0%BA%D1%80%D0%B8%D1%81%D1%82%D0%B0%D0%BB%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9%29.jpg/500px-BENQ_MONITOR_%28%D0%96%D0%B8%D0%B4%D0%BA%D0%BE%D0%BA%D1%80%D0%B8%D1%81%D1%82%D0%B0%D0%BB%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail

**#48 Bose QC Ultra**（Bose / 耳机）→ SERIES_MATCH

- 完整型号：`qc ultra`
- 系列名称：Bose QuietComfort 系列
- 必需 token：bose + quietcomfort
- 匹配依据：品牌+系列一致（bose + quietcomfort），产品类型为 earbud；标题未出现完整型号
- 主体说明：店頭展示中のBose社の完全ワイヤレスイヤホン「QuietComfort Ultra Earbuds」。
- 图片标题：Bose QuietComfort Ultra Earbuds - 3.jpg
- 许可：CC BY-SA 4.0｜creator：Kyu3
- 缩略图：https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/Bose_QuietComfort_Ultra_Earbuds_-_3.jpg/500px-Bose_QuietComfort_Ultra_Earbuds_-_3.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail

**#83 小米 Watch S3**（小米 / 智能手表）→ SERIES_MATCH

- 完整型号：`watch s3`
- 系列名称：Xiaomi Watch S 系列
- 必需 token：xiaomi + watch
- 匹配依据：品牌+系列一致（xiaomi + watch），产品类型为 watch；标题未出现完整型号
- 主体说明：​展示在小米之家的小米手錶
- 图片标题：Xiaomi Mi Watch Black.jpg
- 许可：CC BY-SA 4.0｜creator：人工知能
- 缩略图：https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/Xiaomi_Mi_Watch_Black.jpg/500px-Xiaomi_Mi_Watch_Black.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail

**#96 RTX 4070 Super**（英伟达 / 显卡）→ SERIES_MATCH

- 完整型号：`rtx 4070 super`
- 系列名称：NVIDIA GeForce RTX 4070 系列
- 必需 token：geforce + 4070
- 匹配依据：品牌+系列一致（geforce + 4070），产品类型为 geforce；型号差异：标题缺「super」
- 主体说明：Gigabyte GeForce RTX 4070 Aero OC 12GB
- 图片标题：2023 Gigabyte GeForce RTX 4070 Aero OC 12GB (3).jpg
- 许可：CC BY-SA 4.0｜creator：Jacek Halicki
- 缩略图：https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2e/2023_Gigabyte_GeForce_RTX_4070_Aero_OC_12GB_%283%29.jpg/500px-2023_Gigabyte_GeForce_RTX_4070_Aero_OC_12GB_%283%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail

**#114 三星 990 Pro 2TB**（三星 / 固态硬盘）→ SERIES_MATCH

- 完整型号：`990 pro 2tb`
- 系列名称：Samsung 990 PRO 系列
- 必需 token：samsung + 990
- 匹配依据：品牌+系列一致（samsung + 990），产品类型为 ssd；标题未出现完整型号；容量不同（2tb vs 4tb）
- 主体说明：SAMSUNG M.2 NVMe SSD 990 PRO 4TB
- 图片标题：SAMSUNG M.2 NVMe SSD 990 PRO 4TB.jpg
- 许可：CC BY-SA 4.0｜creator：Dinkun Chen
- 缩略图：https://thumb.wikimedia.org/wikipedia/commons/thumb/4/46/SAMSUNG_M.2_NVMe_SSD_990_PRO_4TB.jpg/500px-SAMSUNG_M.2_NVMe_SSD_990_PRO_4TB.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail

**#123 海盗船复仇者 32GB**（海盗船 / 内存）→ SERIES_MATCH

- 完整型号：`复仇者 32gb`
- 系列名称：Corsair Vengeance 系列
- 必需 token：corsair + vengeance
- 匹配依据：品牌+系列一致（corsair + vengeance），产品类型为 memory；标题未出现完整型号；容量不同（32gb vs 4gb）；缺型号关键锚点
- 主体说明：DDR3 memory Corsair Vengeance 4GB, 1600MHz
- 图片标题：2014 Corsair Vengeance 4GB, 1600MHz.jpg
- 许可：CC BY-SA 4.0｜creator：Jacek Halicki
- 缩略图：https://thumb.wikimedia.org/wikipedia/commons/thumb/1/11/2014_Corsair_Vengeance_4GB%2C_1600MHz.jpg/500px-2014_Corsair_Vengeance_4GB%2C_1600MHz.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail

**#125 英睿达 32GB**（英睿达 / 内存）→ SERIES_MATCH

- 完整型号：`32gb`
- 系列名称：Crucial 内存系列
- 必需 token：crucial + memory
- 匹配依据：品牌+系列一致（crucial + memory），产品类型为 memory；标题未出现完整型号；容量不同（32gb vs 1gb）；缺型号关键锚点
- 主体说明：Crucial 1 GB SDRAM PC133 DIMM Memory Module
- 图片标题：Crucial 1gb SDRAM PC133 DIMM Memory Module.jpg
- 许可：CC BY-SA 2.0｜creator：Matt Kieffer
- 缩略图：https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/Crucial_1gb_SDRAM_PC133_DIMM_Memory_Module.jpg/500px-Crucial_1gb_SDRAM_PC133_DIMM_Memory_Module.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail

**#129 TP-Link XDR6080**（TP-Link / 路由器）→ SERIES_MATCH

- 完整型号：`xdr6080`
- 系列名称：TP-Link 路由器系列
- 必需 token：tp-link + router
- 匹配依据：品牌+系列一致（tp-link + router），产品类型为 router；标题未出现完整型号；缺型号关键锚点
- 主体说明：Access Point Client Router - TP-LINK TL-WR543G
- 图片标题：Router TP-LINK.jpg
- 许可：CC BY-SA 3.0｜creator：PLKristof
- 缩略图：https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/Router_TP-LINK.jpg/500px-Router_TP-LINK.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail

**#130 华为 AX3 Pro**（华为 / 路由器）→ SERIES_MATCH

- 完整型号：`ax3 pro`
- 系列名称：Huawei 路由器系列
- 必需 token：huawei + router
- 匹配依据：品牌+系列一致（huawei + router），产品类型为 router；标题未出现完整型号
- 主体说明：​华为路由 X3 Pro 日照金山
- 图片标题：HUAWEI Router X3 Pro – Sunrise Gold.jpg
- 许可：CC BY 4.0｜creator：X-SHLIED
- 缩略图：https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/HUAWEI_Router_X3_Pro_%E2%80%93_Sunrise_Gold.jpg/500px-HUAWEI_Router_X3_Pro_%E2%80%93_Sunrise_Gold.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail

**#131 中兴 AX5400 Pro**（中兴 / 路由器）→ SERIES_MATCH

- 完整型号：`ax5400 pro`
- 系列名称：ZTE 路由器系列
- 必需 token：zte + router
- 匹配依据：品牌+系列一致（zte + router），产品类型为 router；型号差异：标题缺「pro」；缺型号关键锚点
- 主体说明：A. Wi-Fi connection router
- 图片标题：ZTE WiFi router4G.jpg
- 许可：CC BY-SA 4.0｜creator：LoveEuro123
- 缩略图：https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/ZTE_WiFi_router4G.jpg/500px-ZTE_WiFi_router4G.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail

## 三、无可靠候选的产品

| product_id | 产品 | 品牌 | 系列 | 候选池 | 全部被剔除的原因 |
|---|---|---|---|---|---|
| 9 | 一加 12 | 一加 | OnePlus 数字旗舰系列 | 43 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 12 | Redmi K70 至尊版 | 小米 | Redmi K70 系列 | 20 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 17 | 联想小新 Pad Pro | 联想 | Lenovo Xiaoxin/Tab 平板系列 | 20 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 19 | vivo Pad 3 Pro | vivo | vivo Pad 系列 | 38 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 20 | OPPO Pad 3 | OPPO | OPPO Pad 系列 | 40 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 21 | 联想拯救者 Y9000P | 联想 | Lenovo Legion 系列 | 10 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 22 | 联想小新 Pro 16 | 联想 | Lenovo Xiaoxin 系列 | 0 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 25 | 华硕天选 5 Pro | 华硕 | ASUS TUF Gaming 系列 | 21 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 26 | 戴尔 XPS 13 | 戴尔 | Dell XPS 13 系列 | 40 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 27 | 惠普暗影精灵 10 | 惠普 | HP OMEN 系列 | 5 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 28 | ThinkBook 14+ | 联想 | Lenovo ThinkBook 系列 | 12 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 30 | 微星绝影 14 | 微星 | MSI Stealth 系列 | 12 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 31 | 荣耀 MagicBook Pro | 荣耀 | Honor MagicBook 系列 | 26 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 32 | 机械革命翼龙 15 Pro | 机械革命 | Mechrevo 游戏本系列 | 0 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 33 | 联想拯救者刃 9000K | 联想 | Lenovo Legion 台式系列 | 4 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 34 | 惠普暗影精灵台式机 | 惠普 | HP OMEN 台式系列 | 21 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 35 | 戴尔 XPS 台式机 | 戴尔 | Dell XPS 台式系列 | 24 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 36 | 微星海皇戟 | 微星 | MSI Trident 系列 | 18 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 37 | 华硕玩家国度 | 华硕 | ASUS ROG 系列 | 43 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 38 | 联想天逸 510 | 联想 | Lenovo 天逸/台式系列 | 23 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 39 | LG 27GP95RP | LG | LG UltraGear 系列 | 22 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 40 | 三星玄龙骑士 G7 | 三星 | Samsung Odyssey 系列 | 5 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 41 | 戴尔 U2723QE | 戴尔 | Dell UltraSharp 系列 | 15 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 42 | 华硕 TUF VG27AQ | 华硕 | ASUS TUF Gaming 显示器系列 | 4 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 43 | 小米 27 4K | 小米 | Xiaomi 显示器系列 | 14 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 46 | 泰坦军团 P27A6V | 泰坦军团 | Titan Army 显示器系列 | 38 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 47 | 索尼 WH-1000XM5 | 索尼 | Sony WH-1000X 系列 | 0 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 49 | 苹果 AirPods Pro 2 | 苹果 | Apple AirPods Pro 系列 | 26 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 50 | 森海塞尔 Momentum 4 | 森海塞尔 | Sennheiser Momentum 系列 | 3 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 51 | 漫步者 NeoBuds Pro | 漫步者 | Edifier NeoBuds 系列 | 17 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 52 | 华为 FreeBuds Pro 3 | 华为 | Huawei FreeBuds 系列 | 5 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 53 | 小米 Buds 4 Pro | 小米 | Xiaomi Buds 系列 | 21 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 55 | 水月雨 Starfield 2 | 水月雨 | Moondrop Starfield 系列 | 0 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 56 | 铁三角 ATH-M50x | 铁三角 | Audio-Technica ATH-M 系列 | 20 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 57 | Keychron Q1 Pro | Keychron | Keychron Q 系列 | 40 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 59 | 雷蛇黑寡妇 V4 | 雷蛇 | Razer BlackWidow 系列 | 21 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 60 | 达尔优 A98 | 达尔优 | Dareu A 系列键盘 | 0 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 61 | 珂芝 K75 | 珂芝 | Kzzi K 系列键盘 | 0 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 62 | 樱桃 MX 3.0S | 樱桃 | Cherry MX 系列键盘 | 37 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 63 | 狼蛛 F87 | 狼蛛 | AULA 机械键盘系列 | 13 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 64 | 海盗船 K70 | 海盗船 | Corsair K70 系列 | 2 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 66 | 雷蛇毒蝰 V3 Pro | 雷蛇 | Razer Viper 系列 | 12 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 68 | 达尔优 A950 | 达尔优 | Dareu A 系列鼠标 | 2 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 69 | 雷柏 VT9 | 雷柏 | Rapoo 鼠标系列 | 6 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 70 | 卓威 EC2-CW | 卓威 | ZOWIE EC 系列 | 1 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 71 | 多彩 M800 | 多彩 | Delux 鼠标系列 | 9 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 72 | 海盗船 Sabre | 海盗船 | Corsair Sabre 系列 | 21 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 75 | 尼康 Z6 III | 尼康 | Nikon Z6 系列 | 39 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 82 | 华为 Watch GT 4 | 华为 | Huawei Watch GT 系列 | 11 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 86 | OPPO Watch 4 Pro | OPPO | OPPO Watch 系列 | 38 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 87 | 华为 Watch Ultimate | 华为 | Huawei Watch Ultimate 系列 | 0 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 90 | 索尼 PS5 | 索尼 | Sony PlayStation 5 系列 | 39 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 92 | Steam Deck OLED | Valve | Valve Steam Deck 系列 | 29 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 98 | RTX 4090 | 英伟达 | NVIDIA GeForce RTX 4090 系列 | 32 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 99 | RX 7800 XT | AMD | AMD Radeon RX 7800 系列 | 0 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 101 | RTX 4060 Ti | 英伟达 | NVIDIA GeForce RTX 4060 系列 | 45 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 102 | RX 7600 | AMD | AMD Radeon RX 7600 系列 | 0 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 103 | 七彩虹 RTX 4070 | 七彩虹 | Colorful RTX 4070 系列 | 20 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 104 | 微星 RTX 4060 | 微星 | MSI GeForce RTX 4060 系列 | 1 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 108 | 锐龙 7 7800X3D | AMD | AMD Ryzen 7 7800X3D 系列 | 31 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 109 | 锐龙 5 7600 | AMD | AMD Ryzen 5 7600 系列 | 27 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 110 | 锐龙 9 7950X | AMD | AMD Ryzen 9 7950X 系列 | 17 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 111 | i5-12400F | Intel | Intel Core i5-12400 系列 | 39 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 112 | 锐龙 7 7700 | AMD | AMD Ryzen 7 7700 系列 | 26 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 113 | 致态 TiPlus7100 2TB | 致态 | ZhiTai TiPlus7100 系列 | 5 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 115 | 西数 SN850X 2TB | 西数 | WD Black SN850X 系列 | 20 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 116 | 铠侠 RC20 1TB | 铠侠 | Kioxia RC20 系列 | 0 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 117 | 致态 TiPlus5000 1TB | 致态 | ZhiTai TiPlus5000 系列 | 5 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 118 | 金士顿 KC3000 1TB | 金士顿 | Kingston KC3000 系列 | 1 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 119 | 海康威视 C2000 Pro | 海康威视 | Hikvision C2000 系列 | 3 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 120 | 宏碁掠夺者 GM7 | 宏碁 | Acer Predator GM7 系列 | 1 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 121 | 芝奇幻光戟 32GB | 芝奇 | G.Skill Trident Z 系列 | 34 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 124 | 威刚 XPG 32GB | 威刚 | ADATA XPG 系列 | 2 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 126 | 光威 32GB | 光威 | Gloway 内存系列 | 2 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 127 | 华硕 RT-AX86U Pro | 华硕 | ASUS RT-AX86U 系列 | 0 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 128 | 小米 AX9000 | 小米 | Xiaomi AX 路由器系列 | 20 | 缺品牌/系列/类型证据，或主体、许可不合格 |
| 132 | 华硕 RT-AX88U Pro | 华硕 | ASUS RT-AX88U 系列 | 0 | 缺品牌/系列/类型证据，或主体、许可不合格 |

## 四、规则执行说明

- **品牌一致**：`must` token 一律包含品牌 token（如 `corsair`、`kingston`），缺失直接 REJECT。
- **产品类型一致**：按分类校验类型关键词（键盘须含 keyboard、内存须含 memory/ram/ddr、显卡须含 graphics/geforce/radeon…），不符直接 REJECT。
- **禁止仅凭数字型号**：`k70`、`4060` 等数字 token 必须与品牌 token 同时命中；单独命中数字不计。
- **禁止跨代/跨线冒充**：`must` 里的代际/系列 token（如 `x100`、`watch gt`、`wh-1000`）必须出现，X100 Ultra 不会被 X100 Pro 之类替身通过；型号级差异一律降级为 SERIES_MATCH，不标 EXACT。
- **主体排除**：包装/开箱、对比图、展台门店、人物、截图/评测、芯片裸片、logo/矢量、配件线缆、单键/键帽、主板内部件，命中任一即 REJECT。
- **许可**：仅 CC0 / Public Domain / CC BY / CC BY-SA；含 NC/ND 或授权未复核的一律剔除。
- **URL**：只输出 `thumb.wikimedia.org/.../500px-` 缩略图，不使用超大原图。
