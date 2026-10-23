# 产品图片数据源可行性验证报告

> 生成时间：2026-10-06T17:15:12.832Z
> 数据源：Wikimedia Commons、Openverse（均为公开 API）
> 待验证产品：`backend/src/main/resources/mock-data/products.json` 中的 50 个 Mock 产品
> 本报告为**可行性验证**，不涉及生产接入：未改数据库、未写 `product_images`、未改任何生产代码。

## 一、结论

**判定：C —— 两个来源覆盖率都不足，不建议正式接入。**

- 50 个产品中，**30 个（60.0%）**能得到 HIGH 或 MEDIUM 的可用图片；
- 若**只用 Wikimedia Commons**，可用数为 **30 个（60.0%）**；
- Openverse 额外补救了 **0 个** Wikimedia 拿不到可用图的产品；
- **9 个产品**在两个来源中都没有任何候选。

### 本轮（增加型号别名表后）关键问答

| 问题 | 答案 |
|---|---|
| 别名修复前覆盖率（HIGH+MEDIUM） | **58.0%**（29/50） |
| 别名修复后覆盖率（HIGH+MEDIUM） | **60.0%**（30/50） |
| 别名实际增加的匹配数 | **1 个**产品从「不可用」升为「可用」 |
| HIGH + 合法许可证的自动采用数量 | **26 个产品**（共 119 张候选可自动采用） |
| MEDIUM 数量 | **4 个产品**（一律 autoAdopt=false） |
| 无法自动采用数量 | **24 个产品** |
| 是否值得做小范围生产试点 | **建议：可以挑「可自动采用」的产品做小范围试点（只落 HIGH + 合法许可，其余回退占位图）** |

> autoAdopt 规则：`matchStatus === "HIGH"` **且** 许可为 CC0 / Public Domain / CC BY / CC BY-SA。
> MEDIUM、LOW、REJECT 一律 false；许可含 NC/ND、缺失或无法识别也一律 false。
> 本轮共有 119 张 HIGH 候选，其中 0 张因许可不合规而 `autoAdopt=false`。

## 二、验证方法

### 2.1 流程

1. 从 `products.json` 读取 50 个 Mock 产品，提取 `brand` / `model` / `title` / `category` / `specs`；
2. 以 `model` 为基准去除容量后缀（`256GB`、`1TB`）得到「型号核心」；
3. 用三档搜索词查询 Wikimedia Commons：`{brand} {model}` → `{model}` → `{brand} {model} {category}`；
4. 若命中型号别名表，把别名写法插在第 1 档之后优先检索；
5. Wikimedia 无结果或最佳分 < 60 时，用 Openverse 补充（`{brand} {model}`、`{model}`）；
6. 只抓取元数据与缩略图（`iiprop=url|size|extmetadata|mime`、`iiurlwidth=480`），不下载原图；
7. 对每个候选计算 `matchScore`，再做产品级汇总；
8. **整轮跑两遍**：先关闭别名跑「别名前」基线，再开启别名跑「别名后」，用于量化别名增益。

### 2.2 评分规则

加分：

| 条件 | 分值 |
|---|---|
| 标题包含完整 model | +50 |
| 标题包含 brand | +30 |
| 描述/标签包含完整 model | +20 |
| 分类与产品 category 一致 | +10 |
| 来源是 Wikimedia Commons | +10 |
| 许可为 CC0/CC BY/CC BY-SA/Public Domain | +10 |

扣分（逐条累加）：

| 条件 | 分值 |
|---|---|
| 含 case/cover/sleeve/protector | -50 |
| 含 concept | -40 |
| 含 wallpaper/logo/vector/mockup 等非实物图 | -40 |
| 含 accessory/charger/cable 等 | -30 |
| 明显是其他型号（同系列数字不一致） | -30 |
| 变体冲突（标题多出 Pro/Max/Ti/Super 等） | -30 |
| 明显是其他型号（标题多出 Ti/Super/Pro/Max/Ultra/XT/OLED 等升档 SKU） | -30 |
| 型号描述不完整（缺少变体词） | -15 |
| 只有品牌、没有型号 | -20 |

分级：HIGH >=80、MEDIUM 60-79、LOW 40-59、REJECT <40

### 2.3 为压制假阳性做的关键处理

实测中发现「有搜索结果」与「图片真的对应该型号」之间差距很大，因此做了四项针对性处理：

1. **相机署名剔除**：Wikimedia 上大量图片带有 `Taken with Vivo X200 Pro` 这类分类，
   含义是「用该手机拍摄」。不做处理时，一张植物照片会因为相机署名被误判为该手机本体。
2. **日期噪声剔除**：`photographs taken on 2015-04-10` 这类分类会带来孤立数字 `10`，
   可能被当作 `Watch Series 10` 的型号数字。
3. **整词匹配 + 邻近约束**：型号 token 不做子串匹配（否则 `of` 会命中 `f`），
   且数字与系列词必须相邻出现，避免远处数字凑出假命中。
4. **HIGH 必须有标题级证据**：型号只出现在描述/标签时封顶 79 分（MEDIUM）。

上述规则由 `lib/scoring-selftest.mjs` 用 45 项断言覆盖，
其中第 9～14 组用例直接复现了本轮在真实数据里踩到的假阳性。

## 三、总体覆盖统计

| 指标 | 数量 | 占比 |
|---|---|---|
| 总产品数 | 50 | 100% |
| Wikimedia 有结果 | 41 | 82.0% |
| Wikimedia HIGH | 26 | 52.0% |
| Wikimedia MEDIUM | 4 | 8.0% |
| Openverse 补充成功 | 0 | 0.0% |
| 两个来源都无结果 | 9 | 18.0% |
| **HIGH + MEDIUM 合计** | **30** | **60.0%** |

产品级判定分布（取该产品全部候选中的最高分）：

| 等级 | 产品数 | 占比 |
|---|---|---|
| HIGH (>=80) | 26 | 52.0% |
| MEDIUM (60-79) | 4 | 8.0% |
| LOW (40-59) | 6 | 12.0% |
| REJECT (<40) | 14 | 28.0% |

## 四、最容易匹配的产品

| # | 产品 | 分类 | 最佳分 | 等级 | 最佳候选 |
|---|---|---|---|---|---|
| 1 | Apple iPhone 17 256GB | 手机 | 100 | HIGH | File:IPhone 17 launch at Apple TRX Malaysia 10.jpg |
| 4 | 小米 15 Pro 512GB | 手机 | 100 | HIGH | File:Xiaomi 15 Pro (1).jpg |
| 6 | OPPO Find X8 256GB | 手机 | 100 | HIGH | File:OPPO Find X8 - About Phone (November 1, 2024).jpg |
| 8 | 荣耀 Magic7 256GB | 手机 | 100 | HIGH | File:Honor Magic7 Series (May 1, 2025).jpg |
| 9 | 三星 Galaxy S25 Ultra 256GB | 手机 | 100 | HIGH | File:Samsung Galaxy S25 Ultra Titanium Silverblue.jpg |
| 13 | 小米 Pad 7 Pro | 平板 | 100 | HIGH | File:Xiaomi Pad 7 Pro.jpg |
| 18 | ASUS TUF 5 Pro | 笔记本电脑 | 100 | HIGH | File:ASUS TUF Gaming 5 Pro Laptop.jpg |
| 19 | Intel Core i7-14700K | CPU | 100 | HIGH | File:Intel Core i7-14700K (INVADERPC).png |
| 20 | AMD Ryzen 7 7800X3D | CPU | 100 | HIGH | File:AMD@5nmCCD(6nmIOD)@Zen4@Raphael@Ryzen 7 7800X3D@100-000000910 BS 2312PGY 9LW3390030138 DSCx07 IOD@SWIR.jpg |
| 21 | Intel Core i5-14600K | CPU | 100 | HIGH | File:Intel Core i5-14600K (INVADERPC) 01.png |

## 五、最难匹配的产品

| # | 产品 | 分类 | 最佳分 | 等级 | 候选数 |
|---|---|---|---|---|---|
| 16 | 联想 Legion Y9000P | 笔记本电脑 | 0 | REJECT | 0 |
| 17 | 联想 Xiaoxin Pro 16 | 笔记本电脑 | 0 | REJECT | 0 |
| 24 | AMD RX 7800 XT | 显卡 | 0 | REJECT | 0 |
| 26 | 联想 Legion 27 2K | 显示器 | 0 | REJECT | 0 |
| 27 | ASUS PG27UQR | 显示器 | 0 | REJECT | 0 |
| 29 | Sony WH-1000XM6 | 耳机 | 0 | REJECT | 0 |
| 31 | Bose Bose QC Ultra | 耳机 | 0 | REJECT | 0 |
| 32 | JBL JBL Tune 770NC | 耳机 | 0 | REJECT | 0 |
| 48 | 小米 AX9000 | 路由器 | 0 | REJECT | 0 |
| 25 | 三星 Odyssey G8 32 | 显示器 | 20 | REJECT | 1 |

完全无候选（两个来源都没有返回任何图片）：

- #16 联想 Legion Y9000P（笔记本电脑）
- #17 联想 Xiaoxin Pro 16（笔记本电脑）
- #24 AMD RX 7800 XT（显卡）
- #26 联想 Legion 27 2K（显示器）
- #27 ASUS PG27UQR（显示器）
- #29 Sony WH-1000XM6（耳机）
- #31 Bose Bose QC Ultra（耳机）
- #32 JBL JBL Tune 770NC（耳机）
- #48 小米 AX9000（路由器）

## 六、常见误匹配类型

在 353 条候选中，被扣分规则命中的次数：

| 误匹配类型 | 命中次数 |
|---|---|
| onlyBrand（只有品牌、没有型号） | 71 |
| otherModel（同系列数字不一致，如 4070 vs 4080） | 41 |
| variantExtra（同系列升档 SKU，如 Ti/Super/Pro/Max） | 16 |
| plusUpgrade（加号升档 SKU，如 Pro+） | 5 |
| case/cover/sleeve/protector（配件、保护壳） | 5 |
| wallpaper/logo/vector/mockup（非实物图） | 4 |
| accessory/charger/cable/stand（配件） | 1 |
| 型号仅出现在描述/标签（相机署名、EXIF 等），标题未出现 | 32 |

> 说明：同一候选可能同时命中多条，故合计大于候选总数。

## 六之二、召回率核查：是「来源没有」还是「查询太窄」？

覆盖率只有五成左右，必须先排除「是搜索词写窄了」。
因此对 14 个未命中产品换用**更宽或更常见的搜索词**复核（脚本：`recall-check.mjs`）。
结论：**绝大多数属于来源侧确实没有该型号，而不是查询太窄。**

| 产品 | 换用搜索词后的实际情况 | 判定 |
|---|---|---|
| #14 MacBook Pro 14 M4 | `MacBook Pro 14-inch` 只找到 **2021 款** 14 吋机身，无 M4 款 | 来源缺该型号 |
| #16 Legion Y9000P | `Lenovo Legion` 只找到 **Y520**（另一型号） | 来源缺该型号 |
| #17 Xiaoxin Pro 16 | `Xiaoxin Pro 16` 仅命中无关 PDF；`Lenovo Xiaoxin` 为 0 | 来源缺该型号 |
| #25 Odyssey G8 32 | 仅返回无关 PDF/公报，无显示器实物 | 来源缺该型号 |
| #27 ASUS PG27UQR | `PG27UQR` 为 0；只有 ASUS 其他型号显示器 | 来源缺该型号 |
| #29 Sony WH-1000XM6 | `WH-1000XM6`、`WH-1000XM5`、`Sony WH-1000XM` **全部为 0** | 整个系列都缺 |
| #30 华为 FreeBuds Pro 4 | 只有 **FreeBuds 5 / FreeBuds 6** | 来源缺该型号 |
| #31 Bose QC Ultra | `Bose QuietComfort Ultra` 找到的是 **Earbuds 版**（非该头戴型号） | 型号不同 |
| #32 JBL Tune 770NC | `JBL Tune` 只返回无关书籍/音乐；仅通用 JBL 耳机 | 来源缺该型号 |
| #37 雷蛇 DeathAdder V3 Pro | 只有 **DeathAdder 2013 / Elite**（老型号） | 来源缺该型号 |
| #39 Sony A7M4 | `Sony A7 IV` / `Sony Alpha 7 IV` **能找到本机** | ⚠️ 可避免的漏判（命名差异） |
| #44 小米 Watch S4 | 只有通用 Xiaomi Watch / Mi Band | 来源缺该型号 |
| #47 华为 Q6 | 只有华为其他路由器型号（B610h 等） | 来源缺该型号 |
| #48 小米 AX9000 | `Xiaomi AX9000` 为 0；`Xiaomi router` 返回公交线路等无关内容 | 来源缺该型号 |

### 两个可改进点（不影响本次结论）

1. **命名习惯差异**：`Sony A7M4` 在 Commons 上写作 `A7 IV` / `Alpha 7 IV`（罗马数字），
   当前按字母数字整词匹配会漏掉。若后续正式接入，建议补一层「型号别名表」。
2. **同系列老型号污染**：`Legion Y520`、`DeathAdder 2013`、`MacBook Pro 2021` 这类同系列
   不同代产品会大量出现在搜索结果里——它们被现有规则正确拒绝，但也说明该型号本身确实没有图。

> 注意：把上表 #39 修好也只让覆盖率从 54% 升到约 56%，**不改变最终判定**。

## 六之三、型号别名表（本轮新增）

### 收录的别名（显式映射，全部经真实 API 核实）

| 产品型号（归一化键） | 别名写法 | 核实到的真实图片 |
|---|---|---|
| `sony a7m4` | `sony a7 iv`、`sony a7iv`、`sony alpha 7 iv`、`sony alpha 7 mark iv` | `Sony A7 IV (ILCE-7M4) - by Henry Söderlund.jpg`、`Sony a7 IV 33MP Mirrorless Digital Camera.jpg`、`Man using DJI RS2 and Sony a7IV ....jpg` |
| `ipad pro 11 m4` | `ipad pro m4`、`ipad pro m4 11-inch`、`ipad pro 11-inch m4` | `About iPad Pro 11-inch (M4).jpg`、`IPad Pro M4 11-inch.jpeg` |

### 明确**未**收录的（因为它们是不同型号，不是别名）

| 看起来像别名 | 为什么不是 |
|---|---|
| `RTX 5070` → `RTX 5070 Ti` | Ti 是升档 SKU，不同型号 |
| `iPhone 17` → `iPhone 17 Pro` / `Pro Max` | 不同型号 |
| `Mate 70 Pro` → `Mate 70 Pro+` | 不同型号（且实测只有 Pro+ 的图） |
| `MacBook Pro 14 M4` → `MacBook Pro 16-inch M4 Pro` | 尺寸与芯片都不同 |
| `MacBook Pro 14 M4` → `MacBook Pro 14" 2021` | 年份/芯片不同 |
| `Bose QC Ultra` → `Bose QuietComfort Ultra Earbuds` | 头戴式 ≠ 入耳式；Commons 上只有后者 |
| `联想 Xiaoxin Pro 16` → `IdeaPad Pro 16` | 区域命名差异属实，但 Commons 上查无实机图，无法核实 → 不收录 |
| `Sony WH-1000XM6` → `WH-1000XM5` / `WH1000XM6` | 实测均为 0 条，整个系列都缺图 |
| `AMD RX 7800 XT` → `Radeon RX 7800 XT` | 实测为 0 条，加前缀也没用 |

### 别名如何匹配（防止张冠李戴）

别名**按连续短语整段命中**，不做模糊匹配。因此：

- `Sony A7 IV (ILCE-7M4)` → 命中（标题里连续出现 `a7 iv`）
- `Sony a7R IV` → **不命中**（token 为 `a7, r, iv`，中间隔着 `r`，短语不连续）
- `Sony Alpha 7R IV` → **不命中**（同上）
- 关闭别名开关后，同一张 `Sony A7 IV` 图片会退回 30 分（REJECT）——这条已写成回归用例。

### 别名带来的实际增益

| # | 产品 | 别名 | 别名前 | 别名后 |
|---|---|---|---|---|
| 39 | Sony A7M4 | `sony a7 iv`、`sony a7iv`、`sony alpha 7 iv`、`sony alpha 7 mark iv` | 20 REJECT | **100 HIGH** |

**别名实际增加的匹配数：1 个产品。**

### 关于「跨轮次数字波动」的重要说明

本轮**别名前**基线的可用率（58.0%）比上一轮报告的 56% 要高，
这不是因为改了评分规则，而是因为 **Wikimedia Commons 的搜索索引本身在变化**：
两次运行之间，个别产品的检索结果发生了增减（例如 iPad Pro 11 M4 从 50 LOW 变为 80 HIGH、
华为 Q6 从无结果变为 70 MEDIUM、罗技 G Pro X 从 90 HIGH 降为 70 MEDIUM）。

因此：

- **别名增益（1 个产品）是在同一次运行内、背靠背跑「别名前 / 别名后」得到的**，对比是干净的；
- 跨轮次的绝对覆盖率不宜直接相减，引用时应注明数据抓取日期。

## 六之四、HIGH 自动采用试点（autoAdopt）

本轮不写数据库，只在验证结果里标记 `autoAdopt`。准入规则严格为：

```
autoAdopt = (matchStatus === "HIGH") && license ∈ { CC0, Public Domain, CC BY, CC BY-SA }
```

| 指标 | 数量 |
|---|---|
| 可自动采用的产品数（至少 1 张） | **26** |
| 可自动采用的候选张数 | 119 |
| HIGH 候选总数 | 119 |
| 其中因许可不合规而不可自动采用 | 0 |
| MEDIUM 产品数（一律 false） | 4 |
| LOW 产品数（一律 false） | 6 |
| REJECT 产品数（一律 false） | 14 |
| 无法自动采用的产品数 | **24** |

可自动采用的产品清单：

| # | 产品 | 最佳分 | 可自动采用张数 | 最佳候选 |
|---|---|---|---|---|
| 1 | Apple iPhone 17 256GB | 100 HIGH | 7 | File:IPhone 17 launch at Apple TRX Malaysia 10.jpg |
| 4 | 小米 15 Pro 512GB | 100 HIGH | 2 | File:Xiaomi 15 Pro (1).jpg |
| 6 | OPPO Find X8 256GB | 100 HIGH | 5 | File:OPPO Find X8 - About Phone (November 1, 2024).jpg |
| 8 | 荣耀 Magic7 256GB | 100 HIGH | 4 | File:Honor Magic7 Series (May 1, 2025).jpg |
| 9 | 三星 Galaxy S25 Ultra 256GB | 100 HIGH | 7 | File:Samsung Galaxy S25 Ultra Titanium Silverblue.jpg |
| 10 | Apple iPad Pro 11 M4 256GB | 80 HIGH | 2 | File:About iPad Pro 11-inch (M4).jpg |
| 13 | 小米 Pad 7 Pro | 100 HIGH | 1 | File:Xiaomi Pad 7 Pro.jpg |
| 15 | Apple MacBook Air 13 M4 | 80 HIGH | 1 | File:MacBook Air (13-inch, M4, Silver).jpg |
| 18 | ASUS TUF 5 Pro | 100 HIGH | 1 | File:ASUS TUF Gaming 5 Pro Laptop.jpg |
| 19 | Intel Core i7-14700K | 100 HIGH | 1 | File:Intel Core i7-14700K (INVADERPC).png |
| 20 | AMD Ryzen 7 7800X3D | 100 HIGH | 8 | File:AMD@5nmCCD(6nmIOD)@Zen4@Raphael@Ryzen 7 7800X3D@100-000000910 BS 2312PGY 9LW3390030138 DSCx07 IOD@SWIR.jpg |
| 21 | Intel Core i5-14600K | 100 HIGH | 1 | File:Intel Core i5-14600K (INVADERPC) 01.png |
| 22 | NVIDIA RTX 4070 Ti Super | 100 HIGH | 10 | File:RTX 4070 Ti SUPER im Vergleich mit anderen RTX 40er-Karten (极客湾Geekerwan) 001.png |
| 23 | NVIDIA RTX 4080 Super | 100 HIGH | 10 | File:Video über die RTX 4080 Super und Vergleichskarten (极客湾Geekerwan) 04.png |
| 28 | Apple AirPods Pro 3 | 100 HIGH | 1 | File:AirPods Pro 3 in weiß.jpg |
| 35 | 罗技 MX Mechanical | 80 HIGH | 4 | File:Mitsumi miniature mechanical MYT -- vs MX Clear.jpg |
| 36 | 罗技 G Pro X Superlight 2 | 100 HIGH | 1 | File:Logitech Pro X Superlight 2 sample 20231216.jpg |
| 38 | 罗技 MX Master 3S | 100 HIGH | 10 | File:Logitech MX Master 3S HS03.jpg |
| 39 | Sony A7M4 | 100 HIGH | 4 | File:Sony A7 IV (ILCE-7M4) - by Henry Söderlund (51739988735).jpg |
| 40 | 佳能 EOS R8 | 100 HIGH | 10 | File:Canon EOS R8 27 may 2023a.jpg |
| 41 | Sony ZV-E10 | 100 HIGH | 6 | File:Sony ZV-E10 with Rode microphone at Hai Kuo Musical Instrument booth 20221224.jpg |
| 42 | Apple Watch Series 10 | 100 HIGH | 4 | File:Apple Watch Series 10.jpeg |
| 43 | 华为 Watch GT 5 | 100 HIGH | 1 | File:Huawei Watch GT 5 (54236021569).jpg |
| 45 | 三星 T7 Shield 2TB | 100 HIGH | 8 | File:SAMSUNG PROTABLE SSD T7 SHIELD 4TB LEFT SIDE.jpg |
| 49 | Sony PS5 Pro | 80 HIGH | 3 | File:Video über die PS5 Pro (BeatEmUps) (2160p 60fps VP9-128kbit AAC)-00.02.23.200.png |
| 50 | 任天堂 Switch OLED | 100 HIGH | 7 | File:Nintendo Switch OLED.png |

## 七、许可证统计

全部 353 条候选的许可证分布（前 15）：

| 许可证 | 数量 |
|---|---|
| CC BY-SA 4.0 | 147 |
| CC0 | 56 |
| CC BY 3.0 | 55 |
| Public domain | 31 |
| CC BY 4.0 | 30 |
| CC BY-SA 2.0 | 13 |
| CC BY 2.0 | 11 |
| CC BY-SA 3.0 | 6 |
| CC BY-SA 3.0 de | 2 |
| CC BY 2.5 | 1 |
| Attribution | 1 |

其中 HIGH/MEDIUM 候选（160 条）的许可证分布（前 15）：

| 许可证 | 数量 |
|---|---|
| CC BY-SA 4.0 | 68 |
| CC BY 3.0 | 28 |
| CC0 | 24 |
| CC BY 4.0 | 21 |
| Public domain | 12 |
| CC BY 2.0 | 5 |
| CC BY-SA 2.0 | 1 |
| CC BY-SA 3.0 | 1 |

### 推荐保留的许可证

| 许可证 | 是否推荐 | 说明 |
|---|---|---|
| CC0 / Public Domain | ✅ 推荐 | 无署名义务，商用最安全 |
| CC BY | ✅ 推荐 | 需署名，可商用 |
| CC BY-SA | ⚠️ 可用但需注意 | 需署名，且衍生作品需同许可，图片仅展示通常无碍 |
| CC BY-NC / BY-NC-SA / BY-NC-ND | ❌ 不推荐 | 禁止商用，毕业设计演示虽可用，但后续风险高 |
| GFDL / 未标注 | ❌ 不推荐 | 义务复杂或许可不明 |

正式接入时建议只保留 **CC0 / Public Domain / CC BY / CC BY-SA**，并在页面上标注作者与许可。

## 八、重点产品人工核查

### 8.1 iPhone 17

### #1 Apple iPhone 17 256GB（手机）

- 型号核心：`iPhone 17`
- 搜索词：`Apple iPhone 17`、`iPhone 17`、`Apple iPhone 17 phone`
- 候选数：10（Wikimedia 10 / Openverse 0）
- 最佳匹配：**100 HIGH**，可自动采用候选 7 张

| matchScore | matchStatus | autoAdopt | 命中方式 | source | title | license | creator | sourceUrl |
|---|---|---|---|---|---|---|---|---|
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:IPhone 17 launch at Apple TRX Malaysia 10.jpg | CC0 | Ahmad Ali Karim | https://commons.wikimedia.org/wiki/File:IPhone_17_launch_at_Apple_TRX_Malaysia_10.jpg |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:IPhone 17 launch at Apple TRX Malaysia 13.jpg | CC0 | Ahmad Ali Karim | https://commons.wikimedia.org/wiki/File:IPhone_17_launch_at_Apple_TRX_Malaysia_13.jpg |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:IPhone 17 launch at Apple TRX Malaysia 19.jpg | CC0 | Ahmad Ali Karim | https://commons.wikimedia.org/wiki/File:IPhone_17_launch_at_Apple_TRX_Malaysia_19.jpg |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:IPhone 17 launch at Apple TRX Malaysia 59.jpg | CC0 | Ahmad Ali Karim | https://commons.wikimedia.org/wiki/File:IPhone_17_launch_at_Apple_TRX_Malaysia_59.jpg |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:IPhone 17 launch at Apple TRX Malaysia 60.jpg | CC0 | Ahmad Ali Karim | https://commons.wikimedia.org/wiki/File:IPhone_17_launch_at_Apple_TRX_Malaysia_60.jpg |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:IPhone 17 launch at Apple TRX Malaysia 61.jpg | CC0 | Ahmad Ali Karim | https://commons.wikimedia.org/wiki/File:IPhone_17_launch_at_Apple_TRX_Malaysia_61.jpg |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:IPhone 17 launch at Apple TRX Malaysia 66.jpg | CC0 | Ahmad Ali Karim | https://commons.wikimedia.org/wiki/File:IPhone_17_launch_at_Apple_TRX_Malaysia_66.jpg |
| 50 | LOW | — | 主型号 | wikimedia | File:Space Black iPhone Air.jpg | CC0 | Ahmad Ali Karim | https://commons.wikimedia.org/wiki/File:Space_Black_iPhone_Air.jpg |
| 50 | LOW | — | 主型号 | wikimedia | File:Light Gold iPhone Air.jpg | CC0 | Ahmad Ali Karim | https://commons.wikimedia.org/wiki/File:Light_Gold_iPhone_Air.jpg |
| 50 | LOW | — | 主型号 | wikimedia | File:Sky Blue iPhone Air.jpg | CC0 | Ahmad Ali Karim | https://commons.wikimedia.org/wiki/File:Sky_Blue_iPhone_Air.jpg |

### #2 Apple iPhone 17 Pro 256GB（手机）

- 型号核心：`iPhone 17 Pro`
- 搜索词：`Apple iPhone 17 Pro`、`iPhone 17 Pro`、`Apple iPhone 17 Pro phone`
- 候选数：10（Wikimedia 10 / Openverse 0）
- 最佳匹配：**50 LOW**，可自动采用候选 0 张

| matchScore | matchStatus | autoAdopt | 命中方式 | source | title | license | creator | sourceUrl |
|---|---|---|---|---|---|---|---|---|
| 50 | LOW | — | 主型号 | wikimedia | File:Silver iPhone 17 Pro Max.jpg | CC0 | Ahmad Ali Karim | https://commons.wikimedia.org/wiki/File:Silver_iPhone_17_Pro_Max.jpg |
| 50 | LOW | — | 主型号 | wikimedia | File:Cosmic Orange iPhone 17 Pro Max.jpg | CC0 | Ahmad Ali Karim | https://commons.wikimedia.org/wiki/File:Cosmic_Orange_iPhone_17_Pro_Max.jpg |
| 50 | LOW | — | 主型号 | wikimedia | File:Deep Blue iPhone 17 Pro Max.jpg | CC0 | Ahmad Ali Karim | https://commons.wikimedia.org/wiki/File:Deep_Blue_iPhone_17_Pro_Max.jpg |
| 40 | LOW | — | 主型号 | wikimedia | File:IPhone 17 launch at Apple TRX Malaysia 55.jpg | CC0 | Ahmad Ali Karim | https://commons.wikimedia.org/wiki/File:IPhone_17_launch_at_Apple_TRX_Malaysia_55.jpg |
| 40 | LOW | — | 主型号 | wikimedia | File:IPhone 17 launch at Apple TRX Malaysia 76.jpg | CC0 | Ahmad Ali Karim | https://commons.wikimedia.org/wiki/File:IPhone_17_launch_at_Apple_TRX_Malaysia_76.jpg |
| 40 | LOW | — | 主型号 | wikimedia | File:IPhone 17 launch at Apple TRX Malaysia 77.jpg | CC0 | Ahmad Ali Karim | https://commons.wikimedia.org/wiki/File:IPhone_17_launch_at_Apple_TRX_Malaysia_77.jpg |
| 40 | LOW | — | 主型号 | wikimedia | File:IPhone 17 launch at Apple TRX Malaysia 78.jpg | CC0 | Ahmad Ali Karim | https://commons.wikimedia.org/wiki/File:IPhone_17_launch_at_Apple_TRX_Malaysia_78.jpg |
| 40 | LOW | — | 主型号 | wikimedia | File:IPhone 17 launch at Apple TRX Malaysia 98.jpg | CC0 | Ahmad Ali Karim | https://commons.wikimedia.org/wiki/File:IPhone_17_launch_at_Apple_TRX_Malaysia_98.jpg |
| 40 | LOW | — | 主型号 | wikimedia | File:IPhone 17 launch at Apple TRX Malaysia 99.jpg | CC0 | Ahmad Ali Karim | https://commons.wikimedia.org/wiki/File:IPhone_17_launch_at_Apple_TRX_Malaysia_99.jpg |
| 10 | REJECT | — | 主型号 | wikimedia | File:IPhone 17 Pro Max (with Apple logo).svg | Public domain | Alex Neman | https://commons.wikimedia.org/wiki/File:IPhone_17_Pro_Max_(with_Apple_logo).svg |

### 8.2 MacBook Pro 14 M4 / MacBook Air

### #14 Apple MacBook Pro 14 M4（笔记本电脑）

- 型号核心：`MacBook Pro 14 M4`
- 搜索词：`Apple MacBook Pro 14 M4`、`MacBook Pro 14 M4`、`Apple MacBook Pro 14 M4 laptop`
- 候选数：4（Wikimedia 4 / Openverse 0）
- 最佳匹配：**40 LOW**，可自动采用候选 0 张

| matchScore | matchStatus | autoAdopt | 命中方式 | source | title | license | creator | sourceUrl |
|---|---|---|---|---|---|---|---|---|
| 40 | LOW | — | 主型号 | wikimedia | File:Review zu Apple Hardware mit Apple M4-CPUs (Geekerwan) 14.png | CC BY 3.0 | 极客湾Geekerwan | https://commons.wikimedia.org/wiki/File:Review_zu_Apple_Hardware_mit_Apple_M4-CPUs_(Geekerwan)_14.png |
| 40 | LOW | — | 主型号 | wikimedia | File:Apple M4 ailesi aygitlar tr.svg | CC BY-SA 4.0 | Oğuz Ergin | https://commons.wikimedia.org/wiki/File:Apple_M4_ailesi_aygitlar_tr.svg |
| 40 | LOW | — | 主型号 | wikimedia | File:Apple M serisi Geekbench 6 kusaklar tr.svg | CC BY-SA 4.0 | Oğuz Ergin | https://commons.wikimedia.org/wiki/File:Apple_M_serisi_Geekbench_6_kusaklar_tr.svg |
| 40 | LOW | — | 主型号 | wikimedia | File:Apple M serisi Handbrake enerji tr.svg | CC BY-SA 4.0 | Oğuz Ergin | https://commons.wikimedia.org/wiki/File:Apple_M_serisi_Handbrake_enerji_tr.svg |

### #15 Apple MacBook Air 13 M4（笔记本电脑）

- 型号核心：`MacBook Air 13 M4`
- 搜索词：`Apple MacBook Air 13 M4`、`MacBook Air 13 M4`、`Apple MacBook Air 13 M4 laptop`
- 候选数：2（Wikimedia 2 / Openverse 0）
- 最佳匹配：**80 HIGH**，可自动采用候选 1 张

| matchScore | matchStatus | autoAdopt | 命中方式 | source | title | license | creator | sourceUrl |
|---|---|---|---|---|---|---|---|---|
| 80 | HIGH | ✅ | 主型号 | wikimedia | File:MacBook Air (13-inch, M4, Silver).jpg | CC0 | AzureSaturn | https://commons.wikimedia.org/wiki/File:MacBook_Air_(13-inch,_M4,_Silver).jpg |
| 30 | REJECT | — | 主型号 | wikimedia | File:MacBook Air M4.svg | CC BY-SA 4.0 | Всемилостивѣйшій | https://commons.wikimedia.org/wiki/File:MacBook_Air_M4.svg |

### 8.3 RTX 4070 Ti Super / RTX 4080 Super

> **注意：50 个 Mock 产品中并不存在 `RTX 5070`。**
> 现有显卡产品为 `RTX 4070 Ti Super`(#22)、`RTX 4080 Super`(#23)、`RX 7800 XT`(#24)。
> 因此这里列出真实显卡产品的候选，
> 并用「反例探针」验证任务书点名的 `RTX 5070 Ti` ≠ `RTX 5070` 规则。

### #22 NVIDIA RTX 4070 Ti Super（显卡）

- 型号核心：`RTX 4070 Ti Super`
- 搜索词：`NVIDIA RTX 4070 Ti Super`、`RTX 4070 Ti Super`、`NVIDIA RTX 4070 Ti Super graphics card`
- 候选数：10（Wikimedia 10 / Openverse 0）
- 最佳匹配：**100 HIGH**，可自动采用候选 10 张

| matchScore | matchStatus | autoAdopt | 命中方式 | source | title | license | creator | sourceUrl |
|---|---|---|---|---|---|---|---|---|
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:RTX 4070 Ti SUPER im Vergleich mit anderen RTX 40er-Karten (极客湾Geekerwan) 001.png | CC BY 3.0 | 极客湾Geekerwan | https://commons.wikimedia.org/wiki/File:RTX_4070_Ti_SUPER_im_Vergleich_mit_anderen_RTX_40er-Karten_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_001.png |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:RTX 4070 Ti SUPER im Vergleich mit anderen RTX 40er-Karten (极客湾Geekerwan) 007.png | CC BY 3.0 | 极客湾Geekerwan | https://commons.wikimedia.org/wiki/File:RTX_4070_Ti_SUPER_im_Vergleich_mit_anderen_RTX_40er-Karten_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_007.png |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:RTX 4070 Ti SUPER im Vergleich mit anderen RTX 40er-Karten (极客湾Geekerwan) 011.png | CC BY 3.0 | 极客湾Geekerwan | https://commons.wikimedia.org/wiki/File:RTX_4070_Ti_SUPER_im_Vergleich_mit_anderen_RTX_40er-Karten_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_011.png |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:RTX 4070 Ti SUPER im Vergleich mit anderen RTX 40er-Karten (极客湾Geekerwan) 012.png | CC BY 3.0 | 极客湾Geekerwan | https://commons.wikimedia.org/wiki/File:RTX_4070_Ti_SUPER_im_Vergleich_mit_anderen_RTX_40er-Karten_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_012.png |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:RTX 4070 Ti SUPER im Vergleich mit anderen RTX 40er-Karten (极客湾Geekerwan) 013.png | CC BY 3.0 | 极客湾Geekerwan | https://commons.wikimedia.org/wiki/File:RTX_4070_Ti_SUPER_im_Vergleich_mit_anderen_RTX_40er-Karten_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_013.png |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:RTX 4070 Ti SUPER im Vergleich mit anderen RTX 40er-Karten (极客湾Geekerwan) 014.png | CC BY 3.0 | 极客湾Geekerwan | https://commons.wikimedia.org/wiki/File:RTX_4070_Ti_SUPER_im_Vergleich_mit_anderen_RTX_40er-Karten_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_014.png |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:RTX 4070 Ti SUPER im Vergleich mit anderen RTX 40er-Karten (极客湾Geekerwan) 015.png | CC BY 3.0 | 极客湾Geekerwan | https://commons.wikimedia.org/wiki/File:RTX_4070_Ti_SUPER_im_Vergleich_mit_anderen_RTX_40er-Karten_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_015.png |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:RTX 4070 Ti SUPER im Vergleich mit anderen RTX 40er-Karten (极客湾Geekerwan) 016.png | CC BY 3.0 | 极客湾Geekerwan | https://commons.wikimedia.org/wiki/File:RTX_4070_Ti_SUPER_im_Vergleich_mit_anderen_RTX_40er-Karten_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_016.png |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:RTX 4070 Ti SUPER im Vergleich mit anderen RTX 40er-Karten (极客湾Geekerwan) 018.png | CC BY 3.0 | 极客湾Geekerwan | https://commons.wikimedia.org/wiki/File:RTX_4070_Ti_SUPER_im_Vergleich_mit_anderen_RTX_40er-Karten_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_018.png |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:RTX 4070 Ti SUPER im Vergleich mit anderen RTX 40er-Karten (极客湾Geekerwan) 019.png | CC BY 3.0 | 极客湾Geekerwan | https://commons.wikimedia.org/wiki/File:RTX_4070_Ti_SUPER_im_Vergleich_mit_anderen_RTX_40er-Karten_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_019.png |

### #23 NVIDIA RTX 4080 Super（显卡）

- 型号核心：`RTX 4080 Super`
- 搜索词：`NVIDIA RTX 4080 Super`、`RTX 4080 Super`、`NVIDIA RTX 4080 Super graphics card`
- 候选数：10（Wikimedia 10 / Openverse 0）
- 最佳匹配：**100 HIGH**，可自动采用候选 10 张

| matchScore | matchStatus | autoAdopt | 命中方式 | source | title | license | creator | sourceUrl |
|---|---|---|---|---|---|---|---|---|
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:Video über die RTX 4080 Super und Vergleichskarten (极客湾Geekerwan) 04.png | CC BY 3.0 | 极客湾Geekerwan | https://commons.wikimedia.org/wiki/File:Video_%C3%BCber_die_RTX_4080_Super_und_Vergleichskarten_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_04.png |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:Video über die RTX 4080 Super und Vergleichskarten (极客湾Geekerwan) 05.png | CC BY 3.0 | 极客湾Geekerwan | https://commons.wikimedia.org/wiki/File:Video_%C3%BCber_die_RTX_4080_Super_und_Vergleichskarten_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_05.png |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:Video über die RTX 4080 Super und Vergleichskarten (极客湾Geekerwan) 06.png | CC BY 3.0 | 极客湾Geekerwan | https://commons.wikimedia.org/wiki/File:Video_%C3%BCber_die_RTX_4080_Super_und_Vergleichskarten_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_06.png |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:Video über die RTX 4080 Super und Vergleichskarten (极客湾Geekerwan) 09.png | CC BY 3.0 | 极客湾Geekerwan | https://commons.wikimedia.org/wiki/File:Video_%C3%BCber_die_RTX_4080_Super_und_Vergleichskarten_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_09.png |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:Video über die RTX 4080 Super und Vergleichskarten (极客湾Geekerwan) 10.png | CC BY 3.0 | 极客湾Geekerwan | https://commons.wikimedia.org/wiki/File:Video_%C3%BCber_die_RTX_4080_Super_und_Vergleichskarten_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_10.png |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:Video über die RTX 4080 Super und Vergleichskarten (极客湾Geekerwan) 15.png | CC BY 3.0 | 极客湾Geekerwan | https://commons.wikimedia.org/wiki/File:Video_%C3%BCber_die_RTX_4080_Super_und_Vergleichskarten_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_15.png |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:Video über die RTX 4080 Super und Vergleichskarten (极客湾Geekerwan) 17.png | CC BY 3.0 | 极客湾Geekerwan | https://commons.wikimedia.org/wiki/File:Video_%C3%BCber_die_RTX_4080_Super_und_Vergleichskarten_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_17.png |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:Video über die RTX 4080 Super und Vergleichskarten (极客湾Geekerwan) 23.png | CC BY 3.0 | 极客湾Geekerwan | https://commons.wikimedia.org/wiki/File:Video_%C3%BCber_die_RTX_4080_Super_und_Vergleichskarten_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_23.png |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:Video über die RTX 4080 Super und Vergleichskarten (极客湾Geekerwan) 36.png | CC BY 3.0 | 极客湾Geekerwan | https://commons.wikimedia.org/wiki/File:Video_%C3%BCber_die_RTX_4080_Super_und_Vergleichskarten_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_36.png |
| 100 | HIGH | ✅ | 主型号 | wikimedia | File:Video über die RTX 4080 Super und Vergleichskarten (极客湾Geekerwan) 37.png | CC BY 3.0 | 极客湾Geekerwan | https://commons.wikimedia.org/wiki/File:Video_%C3%BCber_die_RTX_4080_Super_und_Vergleichskarten_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_37.png |

### 8.4 Sony A7M4（本轮别名修复重点）

### #39 Sony A7M4（相机）

- 型号核心：`A7M4`
- 命中别名：`sony a7 iv`、`sony a7iv`、`sony alpha 7 iv`、`sony alpha 7 mark iv`
- 搜索词：`Sony A7M4`、`sony a7 iv`、`sony a7iv`、`sony alpha 7 iv`、`sony alpha 7 mark iv`、`A7M4`
- 候选数：10（Wikimedia 10 / Openverse 0）
- 最佳匹配：**100 HIGH**，可自动采用候选 4 张

| matchScore | matchStatus | autoAdopt | 命中方式 | source | title | license | creator | sourceUrl |
|---|---|---|---|---|---|---|---|---|
| 100 | HIGH | ✅ | 别名 | wikimedia | File:Sony A7 IV (ILCE-7M4) - by Henry Söderlund (51739988735).jpg | CC BY 2.0 | Henry Söderlund from Helsinki, Finland, Finland | https://commons.wikimedia.org/wiki/File:Sony_A7_IV_(ILCE-7M4)_-_by_Henry_S%C3%B6derlund_(51739988735).jpg |
| 100 | HIGH | ✅ | 别名 | wikimedia | File:Sony Alpha 7 Mark IV.jpg | CC BY-SA 4.0 | Macflies | https://commons.wikimedia.org/wiki/File:Sony_Alpha_7_Mark_IV.jpg |
| 100 | HIGH | ✅ | 别名 | wikimedia | File:Man using DJI RS2 and Sony a7IV 20240922180042.jpg | CC BY-SA 4.0 | TurnOnTheNight | https://commons.wikimedia.org/wiki/File:Man_using_DJI_RS2_and_Sony_a7IV_20240922180042.jpg |
| 100 | HIGH | ✅ | 别名 | wikimedia | File:Sony a7 IV 33MP Mirrorless Digital Camera.jpg | CC BY-SA 4.0 | ROCKY | https://commons.wikimedia.org/wiki/File:Sony_a7_IV_33MP_Mirrorless_Digital_Camera.jpg |
| 70 | MEDIUM | — | 别名 | wikimedia | File:Sony.alpha.7IV.G-Master.24-105mm.DSC00141.jpg | CC0 | Bautsch | https://commons.wikimedia.org/wiki/File:Sony.alpha.7IV.G-Master.24-105mm.DSC00141.jpg |
| 40 | LOW | — | 主型号 | wikimedia | File:Sony Alpha 7R II, III and IV with Sony lenses (51250202508).jpg | CC BY 2.0 | John Brighenti from Rockville, MD, United States | https://commons.wikimedia.org/wiki/File:Sony_Alpha_7R_II,_III_and_IV_with_Sony_lenses_(51250202508).jpg |
| 30 | REJECT | — | 主型号 | wikimedia | File:Francisco sierra photography sony A7 R IV launch.png | CC BY-SA 4.0 | Fran88si | https://commons.wikimedia.org/wiki/File:Francisco_sierra_photography_sony_A7_R_IV_launch.png |
| 20 | REJECT | — | 主型号 | wikimedia | File:2024-03-12 3ª Sessão Ordinária de 2024 do CNMP 01.jpg | CC BY-SA 2.0 | Conselho Nacional do Ministério Público | https://commons.wikimedia.org/wiki/File:2024-03-12_3%C2%AA_Sess%C3%A3o_Ordin%C3%A1ria_de_2024_do_CNMP_01.jpg |
| 20 | REJECT | — | 主型号 | wikimedia | File:2024-03-12 3ª Sessão Ordinária de 2024 do CNMP 03.jpg | CC BY-SA 2.0 | Conselho Nacional do Ministério Público | https://commons.wikimedia.org/wiki/File:2024-03-12_3%C2%AA_Sess%C3%A3o_Ordin%C3%A1ria_de_2024_do_CNMP_03.jpg |
| 20 | REJECT | — | 主型号 | wikimedia | File:2024-03-12 3ª Sessão Ordinária de 2024 do CNMP 04.jpg | CC BY-SA 2.0 | Conselho Nacional do Ministério Público | https://commons.wikimedia.org/wiki/File:2024-03-12_3%C2%AA_Sess%C3%A3o_Ordin%C3%A1ria_de_2024_do_CNMP_04.jpg |


## 九、反例探针（真实 API 结果）

用「容易混淆」的查询词直接搜 Wikimedia，再把真实结果回灌评分函数：

| 探针 | 查询词 | 对应产品 | 结果数 | HIGH 数 | 最高分 | 等级 |
|---|---|---|---|---|---|---|
| RTX 5070 Ti 是否会被当成 RTX 5070 | `RTX 5070 Ti` | NVIDIA RTX 5070 | 9 | 0 | 50 | LOW |
| RTX 4080 是否会被当成 RTX 4070 Ti Super | `RTX 4080` | NVIDIA RTX 4070 Ti Super | 9 | 0 | 10 | REJECT |
| iPhone 17 case 是否会被当成 iPhone 17 本体 | `iPhone 17 case` | Apple iPhone 17 256GB | 10 | 0 | 59 | LOW |
| MacBook Pro case 是否会被当成 MacBook Pro | `MacBook Pro case` | Apple MacBook Pro 14 M4 | 6 | 0 | 30 | REJECT |
| MacBook Air 是否会被当成 MacBook Pro | `MacBook Air` | Apple MacBook Pro 14 M4 | 10 | 0 | 30 | REJECT |
| Watch GT 5 Pro 是否会被当成 Watch GT 5 | `Watch GT 5 Pro` | 华为 Watch GT 5 | 5 | 1 | 100 | HIGH |

> 读表提示：最后一行 `Watch GT 5 Pro` 的 1 条 HIGH **不是误判**。
> 用 `Watch GT 5 Pro` 搜索时，Wikimedia 顺带返回了一张标题为 `Huawei Watch GT 5` 的照片——
> 那正是本产品本体，属于正确命中；而所有 `GT 5 Pro` 变体都被正确压到 50（LOW）。
> 其余各行的 HIGH 数均为 0，说明负例规则在真实数据上生效。

**RTX 5070 Ti 是否会被当成 RTX 5070**（查询 `RTX 5070 Ti`）

| matchScore | matchStatus | title | 扣分/加分要点 |
|---|---|---|---|
| 50 | LOW | File:PNY RTX 5070 Ti at Computex 2025.jpg | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；-30 变体冲突（标题多出 ti）；-30 明显是其他型号（同系列不同 SKU：ti） |
| 10 | REJECT | File:CHE TITANO, MSI SVELA LE RTX 50 CUSTOM! 🔥 (1920p 25fps VP9 LQ-152kbit Opus)-00.03.58.500.png | +30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；-30 疑似其他型号（同系列数字不一致）；-20 只有品牌、没有型号 |
| 10 | REJECT | File:CHE TITANO, MSI SVELA LE RTX 50 CUSTOM! 🔥 (1920p 25fps VP9 LQ-152kbit Opus)-00.04.22.500.png | +30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；-30 疑似其他型号（同系列数字不一致）；-20 只有品牌、没有型号 |
| 10 | REJECT | File:CHE TITANO, MSI SVELA LE RTX 50 CUSTOM! 🔥 (1920p 25fps VP9 LQ-152kbit Opus)-00.04.18.500.png | +30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；-30 疑似其他型号（同系列数字不一致）；-20 只有品牌、没有型号 |
| 10 | REJECT | File:CHE TITANO, MSI SVELA LE RTX 50 CUSTOM! 🔥 (1920p 25fps VP9 LQ-152kbit Opus)-00.04.26.700.png | +30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；-30 疑似其他型号（同系列数字不一致）；-20 只有品牌、没有型号 |

**RTX 4080 是否会被当成 RTX 4070 Ti Super**（查询 `RTX 4080`）

| matchScore | matchStatus | title | 扣分/加分要点 |
|---|---|---|---|
| 10 | REJECT | File:2023 Adapter NVIDIA 12VHPWR (2).jpg | +30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；-30 标题含 accessory/charger/cable 等配件词；-20 只有品牌、没有型号 |
| 10 | REJECT | File:2023 Adapter NVIDIA 12VHPWR (1).jpg | +30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；-30 标题含 accessory/charger/cable 等配件词；-20 只有品牌、没有型号 |
| 10 | REJECT | File:Video über die RTX 4080 Super und Vergleichskarten (极客湾Geekerwan) 05.png | +30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；-30 疑似其他型号（同系列数字不一致）；-20 只有品牌、没有型号 |
| 10 | REJECT | File:Video über die RTX 4080 Super und Vergleichskarten (极客湾Geekerwan) 06.png | +30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；-30 疑似其他型号（同系列数字不一致）；-20 只有品牌、没有型号 |
| 10 | REJECT | File:Video über die RTX 4080 Super und Vergleichskarten (极客湾Geekerwan) 09.png | +30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；-30 疑似其他型号（同系列数字不一致）；-20 只有品牌、没有型号 |

**iPhone 17 case 是否会被当成 iPhone 17 本体**（查询 `iPhone 17 case`）

| matchScore | matchStatus | title | 扣分/加分要点 |
|---|---|---|---|
| 59 | LOW | File:Apple iPhone 17 Silicone Case (Black) unboxing.jpg | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；-50 标题含 case/cover/sleeve/protector；→ 命中配件/非实物图规则，封顶 59（不得判为 MEDIUM/HIGH） |
| 59 | LOW | File:Apple iPhone 17 Silicone Case (Black) rear.jpg | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；-50 标题含 case/cover/sleeve/protector；→ 命中配件/非实物图规则，封顶 59（不得判为 MEDIUM/HIGH） |
| 59 | LOW | File:Apple iPhone 17 Silicone Case (Black).jpg | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；-50 标题含 case/cover/sleeve/protector；→ 命中配件/非实物图规则，封顶 59（不得判为 MEDIUM/HIGH） |
| 20 | REJECT | File:Casal de Gràcia.JPG | +10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| 20 | REJECT | File:IPhone 17 Pro Urban Armor Gear Civilian (2025-12-28).jpg | +50 标题包含完整型号；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；-30 变体冲突（标题多出 pro）；-30 明显是其他型号（同系列不同 SKU：pro） |

**MacBook Pro case 是否会被当成 MacBook Pro**（查询 `MacBook Pro case`）

| matchScore | matchStatus | title | 扣分/加分要点 |
|---|---|---|---|
| 30 | REJECT | File:Participant with His Laptop - Indian National Championship - WRO - Kolkata 2016-10-23 1533.JPG | +10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| 30 | REJECT | File:Wikiindaba Day 2-40.jpg | +10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| 30 | REJECT | File:KolMeetAug18-CCD 11.jpg | +10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| 30 | REJECT | File:Multi-Monitor Macbook Pro.png | +10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| 0 | REJECT | File:Federal Cases, Volume 19.djvu | +10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；-50 标题含 case/cover/sleeve/protector |

**MacBook Air 是否会被当成 MacBook Pro**（查询 `MacBook Air`）

| matchScore | matchStatus | title | 扣分/加分要点 |
|---|---|---|---|
| 30 | REJECT | File:MacBook Air black.jpg | +10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| 10 | REJECT | File:MacBook Air M1.png | +30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；-30 疑似其他型号（同系列数字不一致）；-20 只有品牌、没有型号 |
| 10 | REJECT | File:MacBook Air display at Apple Covent Garden, November 2012.jpg | +30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；-30 疑似其他型号（同系列数字不一致）；-20 只有品牌、没有型号 |
| 0 | REJECT | File:MacBook Air (Early 2015).jpg | +10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；-30 疑似其他型号（同系列数字不一致） |
| 0 | REJECT | File:MacBook Air Station; May 2012.jpg | +10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；-30 疑似其他型号（同系列数字不一致） |

**Watch GT 5 Pro 是否会被当成 Watch GT 5**（查询 `Watch GT 5 Pro`）

| matchScore | matchStatus | title | 扣分/加分要点 |
|---|---|---|---|
| 100 | HIGH | File:Huawei Watch GT 5 (54236021569).jpg | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；→ autoAdopt=true（HIGH 且许可为 CC0/PD/CC BY/CC BY-SA） |
| 50 | LOW | File:HK 香港 中環站 Central 港鐵 MTR Station Hong Kong 通道 passageway big ads 華維手錶 Huawei Watch GT 5 Pro November 2024 R125R 01.jpg | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；-30 变体冲突（标题多出 pro）；-30 明显是其他型号（同系列不同 SKU：pro） |
| 50 | LOW | File:HK 香港 中環站 Central 港鐵 MTR Station Hong Kong 通道 passageway big ads 華維手錶 Huawei Watch GT 5 Pro November 2024 R125R 02.jpg | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；-30 变体冲突（标题多出 pro）；-30 明显是其他型号（同系列不同 SKU：pro） |
| 50 | LOW | File:HK 香港 中環站 Central 港鐵 MTR Station Hong Kong 通道 passageway big ads 華維手錶 Huawei Watch GT 5 Pro November 2024 R125R 03.jpg | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；-30 变体冲突（标题多出 pro）；-30 明显是其他型号（同系列不同 SKU：pro） |
| 50 | LOW | File:HK 香港 中環站 Central 港鐵 MTR Station Hong Kong 通道 passageway big ads 華維手錶 Huawei Watch GT 5 Pro November 2024 R125R 04.jpg | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD）；-30 变体冲突（标题多出 pro）；-30 明显是其他型号（同系列不同 SKU：pro） |

## 十、是否适合正式接入 / 是否值得小范围试点

**全站正式接入判定：C —— 两个来源覆盖率都不足，不建议正式接入。**

**小范围生产试点判定：建议：可以挑「可自动采用」的产品做小范围试点（只落 HIGH + 合法许可，其余回退占位图）**

支持判定的关键事实：

1. 别名修复前可用率 58.0%（29/50），别名修复后 60.0%（30/50），别名净增 1 个产品。
2. Wikimedia Commons 单源可用率 60.0%（30/50），Openverse 补充后到 60.0%；两个来源合计仍有 9 个产品完全没有候选。
3. 可自动采用（HIGH + 合法许可）的产品有 **26 个**，占全站 52.0%；
   这是「零人工介入即可落库」的真实上限。
4. 已用更宽的搜索词复核过 14 个未命中产品（见第六之二节）：**绝大多数是来源侧确实没有该型号**。
5. 无法匹配的产品集中在四类：
   - **中国大陆市场专属机型**（Legion Y9000P、Xiaoxin Pro 16、MatePad Pro 12.2、Q6、AX9000）；
   - **刚发布或小众型号**（WH-1000XM6、FreeBuds Pro 4、DeathAdder V3 Pro、PG27UQR）；
   - **整个产品线在 Commons 上缺失**（Sony WH-1000X 系列连 XM5 都搜不到）；
   - **子型号/升档型号**（X200 只搜到 Pro/mini 版、Mate 70 Pro 只搜到 Pro+ 版）。
6. 反例探针显示评分规则可靠：iPhone 17 保护壳被压到 59（LOW）、
   RTX 5070 Ti 被压到 50（LOW）、MacBook Air 不会被当成 MacBook Pro，
   说明「有结果就用」的风险已被规则挡住——覆盖率低是**真实召回不足**，不是判定过严。

### 结论

- **不建议**把 Wikimedia/Openverse 作为全站产品图主来源（覆盖率只有五成多）；
- **建议**做一次**小范围生产试点**，范围严格限定为「可自动采用」的那批产品：
  - 只落 `autoAdopt === true` 的图片（HIGH + CC0/PD/CC BY/CC BY-SA）；
  - 其余产品继续用现有本地占位图 `/images/products/*.svg`，页面不空窗；
  - MEDIUM 只进人工审核队列，不自动落库；LOW/REJECT 直接丢弃；
  - 试点期间保留来源 URL、作者、许可，满足署名义务；
  - 试点评估指标建议用「人工抽检准确率」而不是覆盖率。

若后续要扩大接入，建议：

- 优先补「中国大陆市场机型」的数据源（Commons 基本没有）；
- 继续扩充**已核实**的型号别名表（如区域命名差异），但仍保持显式枚举；
- 复用本专项的 `lib/matching.mjs` 评分逻辑，避免「有结果就用」造成张冠李戴。

## 十一、复现方式

```bash
# 1) 评分规则自测（不联网）
node verification/lib/scoring-selftest.mjs

# 2) 采集 + 评分（带本地缓存，可重复执行）
node verification/verify-product-images.mjs

# 3) 生成汇总报告
node verification/build-summary.mjs
```

产出文件：

- `verification/product-image-verification.json`（全部候选与探针明细）
- `verification/product-image-verification.csv`（候选汇总表）
- `verification/product-image-summary.md`（本报告）
