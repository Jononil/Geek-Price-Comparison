# 真实数据库产品 × Wikimedia Commons 覆盖率验证报告

> 生成时间：2026-10-07T03:28:23.478Z
> 产品来源：数据库 `geek_price.products`（`deleted = 0`），共 **132** 个产品
> 图片来源：**Wikimedia Commons（唯一来源）**
> 本报告只做验证：**未执行任何数据库写操作**，未导入任何图片。

## 一、结论速览

| 指标 | 数值 | 占比 |
|---|---|---|
| 数据库产品总数 | 132 | 100% |
| Wikimedia 有候选 | 71 | 53.8% |
| Wikimedia 无候选 | 61 | 46.2% |
| HIGH | 40 | 30.3% |
| MEDIUM | 7 | 5.3% |
| LOW | 5 | 3.8% |
| REJECT | 80 | 60.6% |
| 许可合规的 HIGH | 40 | 30.3% |
| **autoAdopt（可自动采用）** | **40** | **30.3%** |

现有图片状况（placehold.co 按「没有真实图片」处理）：

| 状况 | 产品数 |
|---|---|
| 已有真实图片 | 5 |
| 仍只有占位图 / 无图 | 127 |

## 二、验证方法

1. 从数据库读取 `products WHERE deleted = 0`，并 JOIN `brands` / `categories` 取品牌名与分类名；
2. `products` 表**没有 `model` 列**（任务书给的 SQL 会报 `Unknown column 'model'`），
   因此型号由产品名按确定性规则得到：**去掉开头的品牌词**（纯格式处理，非模糊匹配），
   与上一轮已确认的映射口径 B 一致；
3. 用 `lib/matching.mjs` 的 `buildSignals` / `buildQueries` / `scoreCandidate` 做检索与评分；
4. Wikimedia 检索复用 `lib/wikimedia.mjs`（每产品最多 3 条查询：品牌+型号 / 型号 / 品牌+型号+分类）；
5. 许可判断复用 `isAutoAdoptLicense`；
6. `autoAdopt` 需同时满足：`matchStatus=HIGH` + `licenseAllowed=true` + 图片主体明确；
7. 全程只执行 SELECT（脚本内含非 SELECT 断言），不写任何表。

## 三、匹配与许可规则（本轮未放宽）

- 型号必须**完全一致**；仅允许大小写/空格/连字符等纯格式差异；
- 仅允许已核实的 `MODEL_ALIASES`：`sony a7m4 → a7 iv / a7iv / alpha 7 iv / alpha 7 mark iv`、
  `ipad pro 11 m4 → ipad pro m4 / ipad pro m4 11-inch / ipad pro 11-inch m4`；
- **禁止**任何型号推断：`RTX 5070 ≠ 5070 Ti`、`iPhone 17 ≠ 17 Pro/Pro Max`、
  `Mate 70 Pro ≠ Mate 70 Pro+`、`MacBook Pro 14 M4 ≠ 16 M4 Pro`、`Bose QC Ultra ≠ QuietComfort Ultra Earbuds`；
- **禁止**系列名代替具体型号、Pro/Pro Max 混用、Ti/Ti Super 混用、不同年份/尺寸/芯片混用、
  配件图冒充产品主体、仅凭品牌或搜索词相似判同；
- 无法确认一律判 REJECT。

许可：允许 `CC0 / Public Domain / CC BY / CC BY-SA`；
禁止 `CC BY-NC / BY-NC-SA / BY-NC-ND / BY-ND / Unknown`。
「找到图片」不等于「可以使用」。

## 四、License 统计

| 许可证 | 产品数（取该产品最佳候选的许可） |
|---|---|
| CC BY-SA 4.0 | 33 |
| CC BY 3.0 | 11 |
| Public domain | 9 |
| CC0 | 7 |
| CC BY 4.0 | 5 |
| CC BY-SA 2.0 | 3 |
| CC BY 2.0 | 3 |

- 许可合规：**71** 个
- 许可不合规（NC/ND/未知等）：**0** 个
- 其中「HIGH 但许可不合规」：**0** 个（不可自动采用）

## 五、autoAdopt 明细

满足全部条件的共 **40** 个产品：

| # | 产品 | 型号 | 分类 | 分数 | 许可 | 图片标题 |
|---|---|---|---|---|---|---|
| 1 | iPhone 16 Pro | iphone 16 pro | 手机 | 100 | CC BY-SA 4.0 | File:Back of iPhone 16 Pro - 1.jpg |
| 2 | iPhone 15 | iphone 15 | 手机 | 100 | CC BY-SA 4.0 | File:Apple iPhone 15.jpg |
| 3 | 华为 Mate 60 Pro | mate 60 pro | 手机 | 100 | CC BY-SA 4.0 | File:About Huawei Mate 60 Pro.jpg |
| 4 | 华为 Pura 70 Pro | pura 70 pro | 手机 | 100 | CC BY 4.0 | File:HUAWEI Pura 70 Pro Black Back.jpg |
| 5 | 小米 14 Ultra | 14 ultra | 手机 | 100 | CC0 | File:HK 中環 Central 皇后大道中 33 Queen's Road Central shop 豐澤電器 Fortress Store 手機 smartphone XiaoMi 14 Ultra watch May 2024 R12S 01.jpg |
| 6 | 小米 14 | 14 | 手机 | 100 | CC BY-SA 4.0 | File:Xiaomi 14 (July 10, 2026).jpg |
| 7 | OPPO Find X7 Ultra | find x7 ultra | 手机 | 100 | CC BY-SA 4.0 | File:Oppo Find X7 Ultra.jpg |
| 10 | 荣耀 Magic 6 Pro | magic 6 pro | 手机 | 100 | CC BY 4.0 | File:Honor Magic 6 Pro white Back.jpg |
| 11 | 三星 Galaxy S24 | galaxy s24 | 手机 | 100 | CC BY 3.0 | File:Samsung Galaxy S24 (webtekno) 008.png |
| 14 | iPad Air M2 | ipad air m2 | 平板电脑 | 100 | CC BY-SA 4.0 | File:M2 iPad Air front Camera and Apple Pencil.jpg |
| 15 | 华为 MatePad Pro | matepad pro | 平板电脑 | 100 | CC BY-SA 4.0 | File:An 11-inch HUAWEI MatePad Pro.jpg |
| 16 | 小米平板 7 Pro | 小米平板 7 pro | 平板电脑 | 100 | CC BY-SA 4.0 | File:Xiaomi Pad 7 Pro.jpg |
| 18 | 三星 Galaxy Tab S9 | galaxy tab s9 | 平板电脑 | 100 | CC BY-SA 4.0 | File:Samsung Galaxy Tab S9.png |
| 24 | MacBook Pro 14 | macbook pro 14 | 笔记本电脑 | 100 | CC BY 3.0 | File:Apple Macbook Pro 14" 2021 - Keyboard.png |
| 25 | 华硕天选 5 Pro | 华硕天选 5 pro | 笔记本电脑 | 100 | CC0 | File:ASUS TUF Gaming 5 Pro Laptop.jpg |
| 26 | 戴尔 XPS 13 | xps 13 | 笔记本电脑 | 100 | CC0 | File:DELL XPS 13 and 15 (37080596413).jpg |
| 29 | 华为 MateBook 14 | matebook 14 | 笔记本电脑 | 100 | CC BY-SA 4.0 | File:Huawei MateBook 14 (2023), February 4, 2024.jpg |
| 54 | 三星 Galaxy Buds 2 Pro | galaxy buds 2 pro | 耳机 | 100 | CC BY-SA 4.0 | File:Samsung Galaxy Buds 2 Pro.png |
| 58 | 罗技 MX Keys | mx keys | 键盘 | 100 | CC BY-SA 4.0 | File:Logitech MX Keys YR0073 Wireless Keyboard.jpg |
| 65 | 罗技 G Pro X Superlight 2 | g pro x superlight 2 | 鼠标 | 100 | CC BY-SA 4.0 | File:Logitech Pro X Superlight 2 sample 20231216.jpg |
| 67 | 罗技 MX Master 3S | mx master 3s | 鼠标 | 100 | CC BY 4.0 | File:Logitech MX Master 3S HS03.jpg |
| 73 | 索尼 A7 IV | a7 iv | 相机 | 100 | CC BY 2.0 | File:Sony A7 IV (ILCE-7M4) - by Henry Söderlund (51739988735).jpg |
| 74 | 佳能 R6 Mark II | r6 mark ii | 相机 | 100 | CC BY 2.0 | File:Canon EOS R6 Mark II - by Henry Söderlund (52546794891).jpg |
| 77 | 大疆 Pocket 3 | pocket 3 | 相机 | 100 | CC BY-SA 4.0 | File:DJI Osmo Pocket 3 - 3.jpg |
| 78 | 索尼 ZV-E10 | zv e10 | 相机 | 100 | CC BY-SA 4.0 | File:Sony ZV-E10 with Rode microphone at Hai Kuo Musical Instrument booth 20221224.jpg |
| 79 | 佳能 EOS R50 | eos r50 | 相机 | 100 | CC BY 2.0 | File:Canon EOS R50 (52694437103).jpg |
| 84 | 三星 Galaxy Watch 6 | galaxy watch 6 | 智能手表 | 100 | CC BY-SA 4.0 | File:Samsung Galaxy Watch 6.jpg |
| 88 | 苹果 Watch Ultra 2 | watch ultra 2 | 智能手表 | 100 | CC BY-SA 4.0 | File:Apple Watch Ultra 2.jpg |
| 89 | 任天堂 Switch OLED | switch oled | 游戏机 | 100 | CC BY-SA 4.0 | File:Nintendo Switch OLED.png |
| 90 | 索尼 PS5 | ps5 | 游戏机 | 100 | CC0 | File:PS5 Zen2 CCX CCX (50952534286).jpg |
| 93 | 任天堂 Switch Lite | switch lite | 游戏机 | 100 | CC BY-SA 4.0 | File:Nintendo Switch Lite (turquoise) - 3.jpg |
| 94 | ROG Ally | rog ally | 游戏机 | 100 | CC BY-SA 4.0 | File:ROG ALLY - 3.jpg |
| 97 | RTX 4080 Super | rtx 4080 super | 显卡 | 100 | CC BY 3.0 | File:Video über die RTX 4080 Super und Vergleichskarten (极客湾Geekerwan) 04.png |
| 98 | RTX 4090 | rtx 4090 | 显卡 | 100 | CC BY 3.0 | File:NVIDIA RTX 4090 Founders Edition - Unboxing (ZMASLO).png |
| 100 | RX 7900 XTX | rx 7900 xtx | 显卡 | 100 | CC BY-SA 4.0 | File:Sapphire AMD Radeon RX 7900 XTX.jpg |
| 105 | i7-14700K | i7 14700k | CPU | 100 | CC BY 3.0 | File:Intel Core i7-14700K (INVADERPC).png |
| 106 | i5-14600K | i5 14600k | CPU | 100 | CC BY 3.0 | File:Intel Core i5-14600K (INVADERPC) 01.png |
| 108 | 锐龙 7 7800X3D | 7 7800x3d | CPU | 100 | CC0 | File:AMD@5nmCCD(6nmIOD)@Zen4@Raphael@Ryzen 7 7800X3D@100-000000910 BS 2312PGY 9LW3390030138 DSCx07 IOD@SWIR.jpg |
| 109 | 锐龙 5 7600 | 5 7600 | CPU | 100 | CC0 | File:AMD@5nmCCD(6nmIOD)@Zen4@Raphael@Ryzen 5 7600@100-000001015 BQ 2246SUY 9LS4795W20142 DSC02685-DSC02786.jpg |
| 111 | i5-12400F | i5 12400f | CPU | 100 | CC0 | File:Intel@intel7(10nmESF)@AlderLake@ADL-S(6P+0E)@i5-12400F@SRL5Z DSCx10 poly@5xExt.jpg |

## 六、最值得导入的产品 Top 20

| 排名 | # | 产品 | 型号 | 分类 | 分数 | 许可 | 图片 |
|---|---|---|---|---|---|---|---|
| 1 | 1 | iPhone 16 Pro | iphone 16 pro | 手机 | 100 | CC BY-SA 4.0 | File:Back of iPhone 16 Pro - 1.jpg |
| 2 | 2 | iPhone 15 | iphone 15 | 手机 | 100 | CC BY-SA 4.0 | File:Apple iPhone 15.jpg |
| 3 | 3 | 华为 Mate 60 Pro | mate 60 pro | 手机 | 100 | CC BY-SA 4.0 | File:About Huawei Mate 60 Pro.jpg |
| 4 | 4 | 华为 Pura 70 Pro | pura 70 pro | 手机 | 100 | CC BY 4.0 | File:HUAWEI Pura 70 Pro Black Back.jpg |
| 5 | 5 | 小米 14 Ultra | 14 ultra | 手机 | 100 | CC0 | File:HK 中環 Central 皇后大道中 33 Queen's Road Central shop 豐澤電器 Fortress Store 手機 smartphone XiaoMi 14 Ultra watch May 2024 R12S 01.jpg |
| 6 | 6 | 小米 14 | 14 | 手机 | 100 | CC BY-SA 4.0 | File:Xiaomi 14 (July 10, 2026).jpg |
| 7 | 7 | OPPO Find X7 Ultra | find x7 ultra | 手机 | 100 | CC BY-SA 4.0 | File:Oppo Find X7 Ultra.jpg |
| 8 | 10 | 荣耀 Magic 6 Pro | magic 6 pro | 手机 | 100 | CC BY 4.0 | File:Honor Magic 6 Pro white Back.jpg |
| 9 | 11 | 三星 Galaxy S24 | galaxy s24 | 手机 | 100 | CC BY 3.0 | File:Samsung Galaxy S24 (webtekno) 008.png |
| 10 | 14 | iPad Air M2 | ipad air m2 | 平板电脑 | 100 | CC BY-SA 4.0 | File:M2 iPad Air front Camera and Apple Pencil.jpg |
| 11 | 15 | 华为 MatePad Pro | matepad pro | 平板电脑 | 100 | CC BY-SA 4.0 | File:An 11-inch HUAWEI MatePad Pro.jpg |
| 12 | 16 | 小米平板 7 Pro | 小米平板 7 pro | 平板电脑 | 100 | CC BY-SA 4.0 | File:Xiaomi Pad 7 Pro.jpg |
| 13 | 18 | 三星 Galaxy Tab S9 | galaxy tab s9 | 平板电脑 | 100 | CC BY-SA 4.0 | File:Samsung Galaxy Tab S9.png |
| 14 | 24 | MacBook Pro 14 | macbook pro 14 | 笔记本电脑 | 100 | CC BY 3.0 | File:Apple Macbook Pro 14" 2021 - Keyboard.png |
| 15 | 25 | 华硕天选 5 Pro | 华硕天选 5 pro | 笔记本电脑 | 100 | CC0 | File:ASUS TUF Gaming 5 Pro Laptop.jpg |
| 16 | 26 | 戴尔 XPS 13 | xps 13 | 笔记本电脑 | 100 | CC0 | File:DELL XPS 13 and 15 (37080596413).jpg |
| 17 | 29 | 华为 MateBook 14 | matebook 14 | 笔记本电脑 | 100 | CC BY-SA 4.0 | File:Huawei MateBook 14 (2023), February 4, 2024.jpg |
| 18 | 54 | 三星 Galaxy Buds 2 Pro | galaxy buds 2 pro | 耳机 | 100 | CC BY-SA 4.0 | File:Samsung Galaxy Buds 2 Pro.png |
| 19 | 58 | 罗技 MX Keys | mx keys | 键盘 | 100 | CC BY-SA 4.0 | File:Logitech MX Keys YR0073 Wireless Keyboard.jpg |
| 20 | 65 | 罗技 G Pro X Superlight 2 | g pro x superlight 2 | 鼠标 | 100 | CC BY-SA 4.0 | File:Logitech Pro X Superlight 2 sample 20231216.jpg |

## 七、典型无法匹配的产品

- **Wikimedia 无候选（61 个）**：iPad Pro M4、联想小新 Pad Pro、联想拯救者 Y9000P、联想小新 Pro 16、惠普暗影精灵 10、荣耀 MagicBook Pro、机械革命翼龙 15 Pro、联想拯救者刃 9000K、惠普暗影精灵台式机、戴尔 XPS 台式机、华硕玩家国度、联想天逸 510、LG 27GP95RP、三星玄龙骑士 G7、戴尔 U2723QE 等
- **REJECT（80 个）**：一加 12(20)、iPad Pro M4(0)、联想小新 Pad Pro(0)、vivo Pad 3 Pro(20)、OPPO Pad 3(20)、联想拯救者 Y9000P(0)、联想小新 Pro 16(0)、惠普暗影精灵 10(0)、ThinkBook 14+(30)、微星绝影 14(20)、荣耀 MagicBook Pro(0)、机械革命翼龙 15 Pro(0)、联想拯救者刃 9000K(0)、惠普暗影精灵台式机(0)、戴尔 XPS 台式机(0) 等

原因分布：

| 原因 | 产品数 |
|---|---|
| 两个来源均无候选（本轮只用 Wikimedia，故为 Wikimedia 无候选） | 61 |
| 未命中型号或命中配件/非实物图/其他型号 | 19 |
| 型号未出现在标题（仅描述命中），封顶 79 | 7 |
| 存在明显扣分项，未达可用线；扣分：-20 只有品牌、没有型号 | 4 |
| 存在明显扣分项，未达可用线 | 1 |

## 八、典型误匹配风险

### 8.1 本轮实测发现并已修复的跨型号误配（回归用例已固化）

第一轮跑出来 42 个 autoAdopt，人工复核发现其中数条是**跨型号误配**，已修复并写成回归用例
（`lib/scoring-selftest.mjs` 第 20 组，自测总数 100 → 128 项）：

| 数据库产品 | 误配到的标题 | 缺陷类型 | 修复方式 |
|---|---|---|---|
| 索尼 A7 IV | `sony A7 R IV launch` | 命中跨度内夹入非型号字母 `R` | 跨度内禁止出现非型号 token |
| 华为 MateBook 14 | `MateBook D 14` / `MateBook GT 14` | 同上（夹 `D` / `GT`） | 同上 |
| 三星 990 Pro 2TB | `990 PRO 4TB` | 容量/SKU 冲突 | 标题写了别的容量即判不匹配 |
| 大疆 Pocket 3 | `DJI Osmo Pocket - 3` | 末尾照片序号被当成型号数字 | 剥掉标题末尾 ` - N` |
| 苹果 Watch Ultra 2 | `Apple Watch Ultra - 2` | 同上 | 同上 |
| 小米 14 | `... Seaside City (2024-12-14)` | 日期里的 `14` 被当成型号 | 标题也去日期噪声 |
| 三星 Galaxy Watch 6 | `Galaxy Watch 6 Classic` 群拍 | `Classic` 属不同 SKU | 变体词表加入 `classic` |
| i9-14900K | 对比视频标题（含 14600K/12900HX） | 跨度内夹入其它型号数字 | 同「跨度内禁止非型号 token」 |

### 8.2 当前仍存在的残余风险（不构成跨型号误配，但建议人工复核）

- **主体类型可疑（2 个 autoAdopt 产品）**：型号完全正确，但图片主体可能不是产品实拍
  （芯片裸片/显微图、店铺陈列照）。这类图用作产品主图并不合适，建议试点前人工过一眼：

  | # | 产品 | 分数 | 主体类型 | 图片 |
  |---|---|---|---|---|
  | 5 | 小米 14 Ultra | 100 | store_display | File:HK 中環 Central 皇后大道中 33 Queen's Road Central shop 豐澤電器 Fortress Store 手機 smartphone XiaoMi 14 Ultra watch May 2024 R12S 01.jpg |
  | 108 | 锐龙 7 7800X3D | 100 | chip_die_or_micrograph | File:AMD@5nmCCD(6nmIOD)@Zen4@Raphael@Ryzen 7 7800X3D@100-000000910 BS 2312PGY 9LW3390030138 DSCx07 IOD@SWIR.jpg |

- **多设备合影**：如「DELL XPS 13 and 15」「SAMSUNG Galaxy Tab S9, W24, Z Fold 5 …」这类图里同时出现多台设备，
  目标型号确实在图中，但主体不唯一。建议人工确认或优先换用单机实拍图。
- **纯数字型号偏弱**：如「小米 14」「小米 15」这类型号，其型号 token 只有一个数字，
  理论上最容易被日期/编号撞上；本轮已通过「标题去日期 + 禁止跨度内非型号 token」压制，但仍属需要重点抽查的类型。
- **同名不同品类**：如「990 Pro」既是三星 SSD 也是 Beyerdynamic 耳机型号（DT-990 Pro），
  本轮该候选被判为 MEDIUM 70 而非 HIGH，未进入 autoAdopt；但说明「型号字符串相同」并不等于「品类相同」，
  正式接入时建议再加一层品类校验。

在 601 条候选中，被规则拦下的风险类型：

| 风险类型 | 命中次数 |
|---|---|
| 只有品牌没有型号 | 121 |
| 同系列不同数字（如 4070 vs 4080） | 51 |
| 标题多出升档 SKU（Pro/Max/Ti/Super/Ultra…） | 25 |
| 壁纸/logo/矢量图等非实物图 | 17 |
| 配件/保护壳冒充主体 | 5 |
| 配件（充电器/线材/支架） | 1 |

## 九、复现方式

```bash
node verification/verify-db-product-images.mjs
```

产出：`db-product-image-verification.json`、`db-product-image-verification.csv`、`db-product-image-summary.md`。

<!-- FINAL-REVIEW:BEGIN -->

## 十、最终导入前复核（40 个 HIGH / autoAdopt）

> 复核时间：2026-10-07T03:39:47.701Z
> 复核范围：`matchStatus=HIGH` **且** `licenseAllowed=true` **且** `autoAdopt=true`，共 **40** 个。
> 本流程只读（仅 SELECT），**未执行任何 INSERT / UPDATE / DELETE**；下面的 SQL 仅作展示。

### 10.1 复核结论汇总

| 结论 | 数量 |
|---|---|
| HIGH 总数 | 40 |
| **最终确认可导入（finalApproved）** | **28** |
| 需要人工复核（finalReviewRequired） | 8 |
| 最终剔除（finalRejected） | 4 |
| 其中：已存在相同图片（DUPLICATE） | 2 |
| 其中：已有其它真实图片而跳过 | 1 |
| **预计 INSERT 数量** | **25** |

### 10.2 全部 40 个 HIGH 逐条复核

| db product_id | 产品名称 | 型号 | 类别 | 分数 | Wikimedia 图片标题 | 图片 URL | Commons 页面 | license | creator | matchStatus | autoAdopt | 复核结论 | 剔除/复核原因 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | iPhone 16 Pro | iphone 16 pro | 手机 | 100 | Back of iPhone 16 Pro - 1.jpg | https://upload.wikimedia.org/wikipedia/commons/1/1c/Back_of_iPhone_16_Pro_-_1.jpg | https://commons.wikimedia.org/wiki/File:Back_of_iPhone_16_Pro_-_1.jpg | CC BY-SA 4.0 | Kyu3a | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 2 | iPhone 15 | iphone 15 | 手机 | 100 | Apple iPhone 15.jpg | https://upload.wikimedia.org/wikipedia/commons/4/48/Apple_iPhone_15.jpg | https://commons.wikimedia.org/wiki/File:Apple_iPhone_15.jpg | CC BY-SA 4.0 | IPHONE 15 | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 3 | 华为 Mate 60 Pro | mate 60 pro | 手机 | 100 | About Huawei Mate 60 Pro.jpg | https://upload.wikimedia.org/wikipedia/commons/0/0c/About_Huawei_Mate_60_Pro.jpg | https://commons.wikimedia.org/wiki/File:About_Huawei_Mate_60_Pro.jpg | CC BY-SA 4.0 | メイド理世 | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 4 | 华为 Pura 70 Pro | pura 70 pro | 手机 | 100 | HUAWEI Pura 70 Pro Black Back.jpg | https://upload.wikimedia.org/wikipedia/commons/e/ed/HUAWEI_Pura_70_Pro_Black_Back.jpg | https://commons.wikimedia.org/wiki/File:HUAWEI_Pura_70_Pro_Black_Back.jpg | CC BY 4.0 | X-SHLIED | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 5 | 小米 14 Ultra | 14 ultra | 手机 | 100 | HK 中環 Central 皇后大道中 33 Queen's Road Central shop 豐澤電器 Fortress Store 手機 smartphone XiaoMi 14 Ultra watch May 2024 R12S 01.jpg | https://upload.wikimedia.org/wikipedia/commons/e/e8/HK_%E4%B8%AD%E7%92%B0_Central_%E7%9A%87%E5%90%8E%E5%A4%A7%E9%81%93%E4%B8%AD_33_Queen%27s_Road_Central_shop_%E8%B1%90%E6%BE%A4%E9%9B%BB%E5%99%A8_Fortress_Store_%E6%89%8B%E6%A9%9F_smartphone_XiaoMi_14_Ultra_watch_May_2024_R12S_01.jpg | https://commons.wikimedia.org/wiki/File:HK_%E4%B8%AD%E7%92%B0_Central_%E7%9A%87%E5%90%8E%E5%A4%A7%E9%81%93%E4%B8%AD_33_Queen%27s_Road_Central_shop_%E8%B1%90%E6%BE%A4%E9%9B%BB%E5%99%A8_Fortress_Store_%E6%89%8B%E6%A9%9F_smartphone_XiaoMi_14_Ultra_watch_May_2024_R12S_01.jpg | CC0 | DUSOAM 68 HNWUA | HIGH | true | **finalReviewRequired** | 店铺/展台陈列照，画面主体不唯一 |
| 6 | 小米 14 | 14 | 手机 | 100 | Xiaomi 14 (July 10, 2026).jpg | https://upload.wikimedia.org/wikipedia/commons/5/52/Xiaomi_14_%28July_10%2C_2026%29.jpg | https://commons.wikimedia.org/wiki/File:Xiaomi_14_(July_10,_2026).jpg | CC BY-SA 4.0 | 茅野ふたば | HIGH | true | **finalReviewRequired** | 纯数字型号，仅凭一个数字命中，证据偏弱 |
| 7 | OPPO Find X7 Ultra | find x7 ultra | 手机 | 100 | Oppo Find X7 Ultra.jpg | https://upload.wikimedia.org/wikipedia/commons/b/b2/Oppo_Find_X7_Ultra.jpg | https://commons.wikimedia.org/wiki/File:Oppo_Find_X7_Ultra.jpg | CC BY-SA 4.0 | HundenvonPenang | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 10 | 荣耀 Magic 6 Pro | magic 6 pro | 手机 | 100 | Honor Magic 6 Pro white Back.jpg | https://upload.wikimedia.org/wikipedia/commons/c/c1/Honor_Magic_6_Pro_white_Back.jpg | https://commons.wikimedia.org/wiki/File:Honor_Magic_6_Pro_white_Back.jpg | CC BY 4.0 | X-SHLIED | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 11 | 三星 Galaxy S24 | galaxy s24 | 手机 | 100 | Samsung Galaxy S24 (webtekno) 008.png | https://upload.wikimedia.org/wikipedia/commons/4/46/Samsung_Galaxy_S24_%28webtekno%29_008.png | https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_S24_(webtekno)_008.png | CC BY 3.0 | webtekno | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 14 | iPad Air M2 | ipad air m2 | 平板电脑 | 100 | M2 iPad Air front Camera and Apple Pencil.jpg | https://upload.wikimedia.org/wikipedia/commons/b/b5/M2_iPad_Air_front_Camera_and_Apple_Pencil.jpg | https://commons.wikimedia.org/wiki/File:M2_iPad_Air_front_Camera_and_Apple_Pencil.jpg | CC BY-SA 4.0 | Kyu3a | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 15 | 华为 MatePad Pro | matepad pro | 平板电脑 | 100 | An 11-inch HUAWEI MatePad Pro.jpg | https://upload.wikimedia.org/wikipedia/commons/b/bc/An_11-inch_HUAWEI_MatePad_Pro.jpg | https://commons.wikimedia.org/wiki/File:An_11-inch_HUAWEI_MatePad_Pro.jpg | CC BY-SA 4.0 | X-SHLIED | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 16 | 小米平板 7 Pro | 小米平板 7 pro | 平板电脑 | 100 | Xiaomi Pad 7 Pro.jpg | https://upload.wikimedia.org/wikipedia/commons/1/16/Xiaomi_Pad_7_Pro.jpg | https://commons.wikimedia.org/wiki/File:Xiaomi_Pad_7_Pro.jpg | CC BY-SA 4.0 | 茅野ふたば | HIGH | true | **finalReviewRequired** | 型号中的中文系列名未在标题出现，系列名未获确认 |
| 18 | 三星 Galaxy Tab S9 | galaxy tab s9 | 平板电脑 | 100 | Samsung Galaxy Tab S9.png | https://upload.wikimedia.org/wikipedia/commons/0/05/Samsung_Galaxy_Tab_S9.png | https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_Tab_S9.png | CC BY-SA 4.0 | AnVuong1222004 (11) | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 24 | MacBook Pro 14 | macbook pro 14 | 笔记本电脑 | 100 | Apple Macbook Pro 14" 2021 - Keyboard.png | https://upload.wikimedia.org/wikipedia/commons/b/b4/Apple_Macbook_Pro_14%22_2021_-_Keyboard.png | https://commons.wikimedia.org/wiki/File:Apple_Macbook_Pro_14%22_2021_-_Keyboard.png | CC BY 3.0 | Gyasi Linje | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 25 | 华硕天选 5 Pro | 华硕天选 5 pro | 笔记本电脑 | 100 | ASUS TUF Gaming 5 Pro Laptop.jpg | https://upload.wikimedia.org/wikipedia/commons/5/57/ASUS_TUF_Gaming_5_Pro_Laptop.jpg | https://commons.wikimedia.org/wiki/File:ASUS_TUF_Gaming_5_Pro_Laptop.jpg | CC0 | HuangWending18072009 | HIGH | true | **finalReviewRequired** | 型号中的中文系列名未在标题出现，系列名未获确认 |
| 26 | 戴尔 XPS 13 | xps 13 | 笔记本电脑 | 100 | DELL XPS 13 and 15 (37080596413).jpg | https://upload.wikimedia.org/wikipedia/commons/2/21/DELL_XPS_13_and_15_%2837080596413%29.jpg | https://commons.wikimedia.org/wiki/File:DELL_XPS_13_and_15_(37080596413).jpg | CC0 | Tinh tế Photo | HIGH | true | **finalReviewRequired** | 疑似多设备合影，主体不唯一 |
| 29 | 华为 MateBook 14 | matebook 14 | 笔记本电脑 | 100 | Huawei MateBook 14 (2023), February 4, 2024.jpg | https://upload.wikimedia.org/wikipedia/commons/8/8f/Huawei_MateBook_14_%282023%29%2C_February_4%2C_2024.jpg | https://commons.wikimedia.org/wiki/File:Huawei_MateBook_14_(2023),_February_4,_2024.jpg | CC BY-SA 4.0 | メイド理世 | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 54 | 三星 Galaxy Buds 2 Pro | galaxy buds 2 pro | 耳机 | 100 | Samsung Galaxy Buds 2 Pro.png | https://upload.wikimedia.org/wikipedia/commons/a/ac/Samsung_Galaxy_Buds_2_Pro.png | https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_Buds_2_Pro.png | CC BY-SA 4.0 | Metra pro | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 58 | 罗技 MX Keys | mx keys | 键盘 | 100 | Logitech MX Keys YR0073 Wireless Keyboard.jpg | https://upload.wikimedia.org/wikipedia/commons/7/78/Logitech_MX_Keys_YR0073_Wireless_Keyboard.jpg | https://commons.wikimedia.org/wiki/File:Logitech_MX_Keys_YR0073_Wireless_Keyboard.jpg | CC BY-SA 4.0 | TaurusEmerald | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 65 | 罗技 G Pro X Superlight 2 | g pro x superlight 2 | 鼠标 | 100 | Logitech Pro X Superlight 2 sample 20231216.jpg | https://upload.wikimedia.org/wikipedia/commons/8/88/Logitech_Pro_X_Superlight_2_sample_20231216.jpg | https://commons.wikimedia.org/wiki/File:Logitech_Pro_X_Superlight_2_sample_20231216.jpg | CC BY-SA 4.0 | Solomon203 | HIGH | true | **finalApproved**（DUPLICATE） | 型号完全一致、主体明确、许可合规、品类一致 |
| 67 | 罗技 MX Master 3S | mx master 3s | 鼠标 | 100 | Logitech MX Master 3S HS03.jpg | https://upload.wikimedia.org/wikipedia/commons/2/25/Logitech_MX_Master_3S_HS03.jpg | https://commons.wikimedia.org/wiki/File:Logitech_MX_Master_3S_HS03.jpg | CC BY 4.0 | Hayden Schiff | HIGH | true | **finalApproved**（DUPLICATE） | 型号完全一致、主体明确、许可合规、品类一致 |
| 73 | 索尼 A7 IV | a7 iv | 相机 | 100 | Sony A7 IV (ILCE-7M4) - by Henry Söderlund (51739988735).jpg | https://upload.wikimedia.org/wikipedia/commons/8/8b/Sony_A7_IV_%28ILCE-7M4%29_-_by_Henry_S%C3%B6derlund_%2851739988735%29.jpg | https://commons.wikimedia.org/wiki/File:Sony_A7_IV_(ILCE-7M4)_-_by_Henry_S%C3%B6derlund_(51739988735).jpg | CC BY 2.0 | Henry Söderlund from Helsinki, Finland, Finland | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 74 | 佳能 R6 Mark II | r6 mark ii | 相机 | 100 | Canon EOS R6 Mark II - by Henry Söderlund (52546794891).jpg | https://upload.wikimedia.org/wikipedia/commons/f/f8/Canon_EOS_R6_Mark_II_-_by_Henry_S%C3%B6derlund_%2852546794891%29.jpg | https://commons.wikimedia.org/wiki/File:Canon_EOS_R6_Mark_II_-_by_Henry_S%C3%B6derlund_(52546794891).jpg | CC BY 2.0 | Henry Söderlund from Helsinki, Finland | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 77 | 大疆 Pocket 3 | pocket 3 | 相机 | 100 | DJI Osmo Pocket 3 - 3.jpg | https://upload.wikimedia.org/wikipedia/commons/b/b9/DJI_Osmo_Pocket_3_-_3.jpg | https://commons.wikimedia.org/wiki/File:DJI_Osmo_Pocket_3_-_3.jpg | CC BY-SA 4.0 | Kyu3a | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 78 | 索尼 ZV-E10 | zv e10 | 相机 | 100 | Sony ZV-E10 with Rode microphone at Hai Kuo Musical Instrument booth 20221224.jpg | https://upload.wikimedia.org/wikipedia/commons/3/35/Sony_ZV-E10_with_Rode_microphone_at_Hai_Kuo_Musical_Instrument_booth_20221224.jpg | https://commons.wikimedia.org/wiki/File:Sony_ZV-E10_with_Rode_microphone_at_Hai_Kuo_Musical_Instrument_booth_20221224.jpg | CC BY-SA 4.0 | Solomon203 | HIGH | true | **finalReviewRequired** | 店铺/展台陈列照，画面主体不唯一 |
| 79 | 佳能 EOS R50 | eos r50 | 相机 | 100 | Canon EOS R50 (52694437103).jpg | https://upload.wikimedia.org/wikipedia/commons/d/dd/Canon_EOS_R50_%2852694437103%29.jpg | https://commons.wikimedia.org/wiki/File:Canon_EOS_R50_(52694437103).jpg | CC BY 2.0 | Henry Söderlund from Helsinki, Finland | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 84 | 三星 Galaxy Watch 6 | galaxy watch 6 | 智能手表 | 100 | Samsung Galaxy Watch 6.jpg | https://upload.wikimedia.org/wikipedia/commons/b/b9/Samsung_Galaxy_Watch_6.jpg | https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_Watch_6.jpg | CC BY-SA 4.0 | Ganesh Mohan T | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 88 | 苹果 Watch Ultra 2 | watch ultra 2 | 智能手表 | 100 | Apple Watch Ultra 2.jpg | https://upload.wikimedia.org/wikipedia/commons/3/33/Apple_Watch_Ultra_2.jpg | https://commons.wikimedia.org/wiki/File:Apple_Watch_Ultra_2.jpg | CC BY-SA 4.0 | Pangalau | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 89 | 任天堂 Switch OLED | switch oled | 游戏机 | 100 | Nintendo Switch OLED.png | https://upload.wikimedia.org/wikipedia/commons/f/fe/Nintendo_Switch_OLED.png | https://commons.wikimedia.org/wiki/File:Nintendo_Switch_OLED.png | CC BY-SA 4.0 | Padgriffin | HIGH | true | **finalApproved**（ALREADY_HAS_REAL_IMAGE） | 型号完全一致、主体明确、许可合规、品类一致 |
| 90 | 索尼 PS5 | ps5 | 游戏机 | 100 | PS5 Zen2 CCX CCX (50952534286).jpg | https://upload.wikimedia.org/wikipedia/commons/a/ab/PS5_Zen2_CCX_CCX_%2850952534286%29.jpg | https://commons.wikimedia.org/wiki/File:PS5_Zen2_CCX_CCX_(50952534286).jpg | CC0 | Fritzchens Fritz from Berlin | HIGH | true | **finalRejected** | 图片主体为芯片裸片/显微图，不是产品本体实拍，不能作为产品主图 |
| 93 | 任天堂 Switch Lite | switch lite | 游戏机 | 100 | Nintendo Switch Lite (turquoise) - 3.jpg | https://upload.wikimedia.org/wikipedia/commons/0/0f/Nintendo_Switch_Lite_%28turquoise%29_-_3.jpg | https://commons.wikimedia.org/wiki/File:Nintendo_Switch_Lite_(turquoise)_-_3.jpg | CC BY-SA 4.0 | KKPCW | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 94 | ROG Ally | rog ally | 游戏机 | 100 | ROG ALLY - 3.jpg | https://upload.wikimedia.org/wikipedia/commons/e/ef/ROG_ALLY_-_3.jpg | https://commons.wikimedia.org/wiki/File:ROG_ALLY_-_3.jpg | CC BY-SA 4.0 | KKPCW（Kyu3） | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 97 | RTX 4080 Super | rtx 4080 super | 显卡 | 100 | Video über die RTX 4080 Super und Vergleichskarten (极客湾Geekerwan) 04.png | https://upload.wikimedia.org/wikipedia/commons/f/f8/Video_%C3%BCber_die_RTX_4080_Super_und_Vergleichskarten_%28%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan%29_04.png | https://commons.wikimedia.org/wiki/File:Video_%C3%BCber_die_RTX_4080_Super_und_Vergleichskarten_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_04.png | CC BY 3.0 | 极客湾Geekerwan | HIGH | true | **finalReviewRequired** | 对比/视频截图，画面可能含多张卡或多个型号 |
| 98 | RTX 4090 | rtx 4090 | 显卡 | 100 | NVIDIA RTX 4090 Founders Edition - Unboxing (ZMASLO).png | https://upload.wikimedia.org/wikipedia/commons/e/ea/NVIDIA_RTX_4090_Founders_Edition_-_Unboxing_%28ZMASLO%29.png | https://commons.wikimedia.org/wiki/File:NVIDIA_RTX_4090_Founders_Edition_-_Unboxing_(ZMASLO).png | CC BY 3.0 | ZMASLO | HIGH | true | **finalReviewRequired** | 开箱/包装照，主体可能是包装盒而非产品 |
| 100 | RX 7900 XTX | rx 7900 xtx | 显卡 | 100 | Sapphire AMD Radeon RX 7900 XTX.jpg | https://upload.wikimedia.org/wikipedia/commons/a/a8/Sapphire_AMD_Radeon_RX_7900_XTX.jpg | https://commons.wikimedia.org/wiki/File:Sapphire_AMD_Radeon_RX_7900_XTX.jpg | CC BY-SA 4.0 | Geni | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 105 | i7-14700K | i7 14700k | CPU | 100 | Intel Core i7-14700K (INVADERPC).png | https://upload.wikimedia.org/wikipedia/commons/b/b8/Intel_Core_i7-14700K_%28INVADERPC%29.png | https://commons.wikimedia.org/wiki/File:Intel_Core_i7-14700K_(INVADERPC).png | CC BY 3.0 | INVADER PC | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 106 | i5-14600K | i5 14600k | CPU | 100 | Intel Core i5-14600K (INVADERPC) 01.png | https://upload.wikimedia.org/wikipedia/commons/6/63/Intel_Core_i5-14600K_%28INVADERPC%29_01.png | https://commons.wikimedia.org/wiki/File:Intel_Core_i5-14600K_(INVADERPC)_01.png | CC BY 3.0 | INVADER PC | HIGH | true | **finalApproved** | 型号完全一致、主体明确、许可合规、品类一致 |
| 108 | 锐龙 7 7800X3D | 7 7800x3d | CPU | 100 | AMD@5nmCCD(6nmIOD)@Zen4@Raphael@Ryzen 7 7800X3D@100-000000910 BS 2312PGY 9LW3390030138 DSCx07 IOD@SWIR.jpg | https://upload.wikimedia.org/wikipedia/commons/5/53/AMD%405nmCCD%286nmIOD%29%40Zen4%40Raphael%40Ryzen_7_7800X3D%40100-000000910_BS_2312PGY_9LW3390030138_DSCx07_IOD%40SWIR.jpg | https://commons.wikimedia.org/wiki/File:AMD@5nmCCD(6nmIOD)@Zen4@Raphael@Ryzen_7_7800X3D@100-000000910_BS_2312PGY_9LW3390030138_DSCx07_IOD@SWIR.jpg | CC0 | FritzchensFritz | HIGH | true | **finalRejected** | 图片主体为芯片裸片/显微图，不是产品本体实拍，不能作为产品主图 |
| 109 | 锐龙 5 7600 | 5 7600 | CPU | 100 | AMD@5nmCCD(6nmIOD)@Zen4@Raphael@Ryzen 5 7600@100-000001015 BQ 2246SUY 9LS4795W20142 DSC02685-DSC02786.jpg | https://upload.wikimedia.org/wikipedia/commons/6/6c/AMD%405nmCCD%286nmIOD%29%40Zen4%40Raphael%40Ryzen_5_7600%40100-000001015_BQ_2246SUY_9LS4795W20142_DSC02685-DSC02786.jpg | https://commons.wikimedia.org/wiki/File:AMD@5nmCCD(6nmIOD)@Zen4@Raphael@Ryzen_5_7600@100-000001015_BQ_2246SUY_9LS4795W20142_DSC02685-DSC02786.jpg | CC0 | FritzchensFritz | HIGH | true | **finalRejected** | 图片主体为芯片裸片/显微图，不是产品本体实拍，不能作为产品主图 |
| 111 | i5-12400F | i5 12400f | CPU | 100 | Intel@intel7(10nmESF)@AlderLake@ADL-S(6P+0E)@i5-12400F@SRL5Z DSCx10 poly@5xExt.jpg | https://upload.wikimedia.org/wikipedia/commons/9/94/Intel%40intel7%2810nmESF%29%40AlderLake%40ADL-S%286P%2B0E%29%40i5-12400F%40SRL5Z_DSCx10_poly%405xExt.jpg | https://commons.wikimedia.org/wiki/File:Intel@intel7(10nmESF)@AlderLake@ADL-S(6P%2B0E)@i5-12400F@SRL5Z_DSCx10_poly@5xExt.jpg | CC0 | Fritzchens Fritz | HIGH | true | **finalRejected** | 图片主体为芯片裸片/显微图，不是产品本体实拍，不能作为产品主图 |

### 10.3 最终确认可导入清单（finalApproved）

| db product_id | 产品名称 | 品牌 | 类别 | 图片标题 | license | 处置 |
|---|---|---|---|---|---|---|
| 1 | iPhone 16 Pro | 苹果 | 手机 | Back of iPhone 16 Pro - 1.jpg | CC BY-SA 4.0 | 将 INSERT |
| 2 | iPhone 15 | 苹果 | 手机 | Apple iPhone 15.jpg | CC BY-SA 4.0 | 将 INSERT |
| 3 | 华为 Mate 60 Pro | 华为 | 手机 | About Huawei Mate 60 Pro.jpg | CC BY-SA 4.0 | 将 INSERT |
| 4 | 华为 Pura 70 Pro | 华为 | 手机 | HUAWEI Pura 70 Pro Black Back.jpg | CC BY 4.0 | 将 INSERT |
| 7 | OPPO Find X7 Ultra | OPPO | 手机 | Oppo Find X7 Ultra.jpg | CC BY-SA 4.0 | 将 INSERT |
| 10 | 荣耀 Magic 6 Pro | 荣耀 | 手机 | Honor Magic 6 Pro white Back.jpg | CC BY 4.0 | 将 INSERT |
| 11 | 三星 Galaxy S24 | 三星 | 手机 | Samsung Galaxy S24 (webtekno) 008.png | CC BY 3.0 | 将 INSERT |
| 14 | iPad Air M2 | 苹果 | 平板电脑 | M2 iPad Air front Camera and Apple Pencil.jpg | CC BY-SA 4.0 | 将 INSERT |
| 15 | 华为 MatePad Pro | 华为 | 平板电脑 | An 11-inch HUAWEI MatePad Pro.jpg | CC BY-SA 4.0 | 将 INSERT |
| 18 | 三星 Galaxy Tab S9 | 三星 | 平板电脑 | Samsung Galaxy Tab S9.png | CC BY-SA 4.0 | 将 INSERT |
| 24 | MacBook Pro 14 | 苹果 | 笔记本电脑 | Apple Macbook Pro 14" 2021 - Keyboard.png | CC BY 3.0 | 将 INSERT |
| 29 | 华为 MateBook 14 | 华为 | 笔记本电脑 | Huawei MateBook 14 (2023), February 4, 2024.jpg | CC BY-SA 4.0 | 将 INSERT |
| 54 | 三星 Galaxy Buds 2 Pro | 三星 | 耳机 | Samsung Galaxy Buds 2 Pro.png | CC BY-SA 4.0 | 将 INSERT |
| 58 | 罗技 MX Keys | 罗技 | 键盘 | Logitech MX Keys YR0073 Wireless Keyboard.jpg | CC BY-SA 4.0 | 将 INSERT |
| 65 | 罗技 G Pro X Superlight 2 | 罗技 | 鼠标 | Logitech Pro X Superlight 2 sample 20231216.jpg | CC BY-SA 4.0 | 跳过（DUPLICATE） |
| 67 | 罗技 MX Master 3S | 罗技 | 鼠标 | Logitech MX Master 3S HS03.jpg | CC BY 4.0 | 跳过（DUPLICATE） |
| 73 | 索尼 A7 IV | 索尼 | 相机 | Sony A7 IV (ILCE-7M4) - by Henry Söderlund (51739988735).jpg | CC BY 2.0 | 将 INSERT |
| 74 | 佳能 R6 Mark II | 佳能 | 相机 | Canon EOS R6 Mark II - by Henry Söderlund (52546794891).jpg | CC BY 2.0 | 将 INSERT |
| 77 | 大疆 Pocket 3 | 大疆 | 相机 | DJI Osmo Pocket 3 - 3.jpg | CC BY-SA 4.0 | 将 INSERT |
| 79 | 佳能 EOS R50 | 佳能 | 相机 | Canon EOS R50 (52694437103).jpg | CC BY 2.0 | 将 INSERT |
| 84 | 三星 Galaxy Watch 6 | 三星 | 智能手表 | Samsung Galaxy Watch 6.jpg | CC BY-SA 4.0 | 将 INSERT |
| 88 | 苹果 Watch Ultra 2 | 苹果 | 智能手表 | Apple Watch Ultra 2.jpg | CC BY-SA 4.0 | 将 INSERT |
| 89 | 任天堂 Switch OLED | 任天堂 | 游戏机 | Nintendo Switch OLED.png | CC BY-SA 4.0 | 跳过（ALREADY_HAS_REAL_IMAGE） |
| 93 | 任天堂 Switch Lite | 任天堂 | 游戏机 | Nintendo Switch Lite (turquoise) - 3.jpg | CC BY-SA 4.0 | 将 INSERT |
| 94 | ROG Ally | 华硕 | 游戏机 | ROG ALLY - 3.jpg | CC BY-SA 4.0 | 将 INSERT |
| 100 | RX 7900 XTX | AMD | 显卡 | Sapphire AMD Radeon RX 7900 XTX.jpg | CC BY-SA 4.0 | 将 INSERT |
| 105 | i7-14700K | Intel | CPU | Intel Core i7-14700K (INVADERPC).png | CC BY 3.0 | 将 INSERT |
| 106 | i5-14600K | Intel | CPU | Intel Core i5-14600K (INVADERPC) 01.png | CC BY 3.0 | 将 INSERT |

### 10.4 需要人工复核（finalReviewRequired，未纳入本次 INSERT 计划）

| db product_id | 产品名称 | 图片标题 | 现有真实图 | 复核原因 |
|---|---|---|---|---|
| 5 | 小米 14 Ultra | HK 中環 Central 皇后大道中 33 Queen's Road Central shop 豐澤電器 Fortress Store 手機 smartphone XiaoMi 14 Ultra watch May 2024 R12S 01.jpg | 0 | 店铺/展台陈列照，画面主体不唯一 |
| 6 | 小米 14 | Xiaomi 14 (July 10, 2026).jpg | 0 | 纯数字型号，仅凭一个数字命中，证据偏弱 |
| 16 | 小米平板 7 Pro | Xiaomi Pad 7 Pro.jpg | 0 | 型号中的中文系列名未在标题出现，系列名未获确认 |
| 25 | 华硕天选 5 Pro | ASUS TUF Gaming 5 Pro Laptop.jpg | 0 | 型号中的中文系列名未在标题出现，系列名未获确认 |
| 26 | 戴尔 XPS 13 | DELL XPS 13 and 15 (37080596413).jpg | 0 | 疑似多设备合影，主体不唯一 |
| 78 | 索尼 ZV-E10 | Sony ZV-E10 with Rode microphone at Hai Kuo Musical Instrument booth 20221224.jpg | 0 | 店铺/展台陈列照，画面主体不唯一 |
| 97 | RTX 4080 Super | Video über die RTX 4080 Super und Vergleichskarten (极客湾Geekerwan) 04.png | 1 | 对比/视频截图，画面可能含多张卡或多个型号 |
| 98 | RTX 4090 | NVIDIA RTX 4090 Founders Edition - Unboxing (ZMASLO).png | 0 | 开箱/包装照，主体可能是包装盒而非产品 |

### 10.5 最终剔除（finalRejected）

| db product_id | 产品名称 | 图片标题 | 剔除原因 |
|---|---|---|---|
| 90 | 索尼 PS5 | PS5 Zen2 CCX CCX (50952534286).jpg | 图片主体为芯片裸片/显微图，不是产品本体实拍，不能作为产品主图 |
| 108 | 锐龙 7 7800X3D | AMD@5nmCCD(6nmIOD)@Zen4@Raphael@Ryzen 7 7800X3D@100-000000910 BS 2312PGY 9LW3390030138 DSCx07 IOD@SWIR.jpg | 图片主体为芯片裸片/显微图，不是产品本体实拍，不能作为产品主图 |
| 109 | 锐龙 5 7600 | AMD@5nmCCD(6nmIOD)@Zen4@Raphael@Ryzen 5 7600@100-000001015 BQ 2246SUY 9LS4795W20142 DSC02685-DSC02786.jpg | 图片主体为芯片裸片/显微图，不是产品本体实拍，不能作为产品主图 |
| 111 | i5-12400F | Intel@intel7(10nmESF)@AlderLake@ADL-S(6P+0E)@i5-12400F@SRL5Z DSCx10 poly@5xExt.jpg | 图片主体为芯片裸片/显微图，不是产品本体实拍，不能作为产品主图 |

### 10.6 预计执行的 SQL（仅展示，本次未执行）

```sql
INSERT INTO product_images(product_id, url, sort) VALUES (1, 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Back_of_iPhone_16_Pro_-_1.jpg', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (2, 'https://upload.wikimedia.org/wikipedia/commons/4/48/Apple_iPhone_15.jpg', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (3, 'https://upload.wikimedia.org/wikipedia/commons/0/0c/About_Huawei_Mate_60_Pro.jpg', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (4, 'https://upload.wikimedia.org/wikipedia/commons/e/ed/HUAWEI_Pura_70_Pro_Black_Back.jpg', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (7, 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Oppo_Find_X7_Ultra.jpg', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (10, 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Honor_Magic_6_Pro_white_Back.jpg', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (11, 'https://upload.wikimedia.org/wikipedia/commons/4/46/Samsung_Galaxy_S24_%28webtekno%29_008.png', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (14, 'https://upload.wikimedia.org/wikipedia/commons/b/b5/M2_iPad_Air_front_Camera_and_Apple_Pencil.jpg', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (15, 'https://upload.wikimedia.org/wikipedia/commons/b/bc/An_11-inch_HUAWEI_MatePad_Pro.jpg', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (18, 'https://upload.wikimedia.org/wikipedia/commons/0/05/Samsung_Galaxy_Tab_S9.png', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (24, 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Apple_Macbook_Pro_14%22_2021_-_Keyboard.png', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (29, 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Huawei_MateBook_14_%282023%29%2C_February_4%2C_2024.jpg', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (54, 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Samsung_Galaxy_Buds_2_Pro.png', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (58, 'https://upload.wikimedia.org/wikipedia/commons/7/78/Logitech_MX_Keys_YR0073_Wireless_Keyboard.jpg', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (73, 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Sony_A7_IV_%28ILCE-7M4%29_-_by_Henry_S%C3%B6derlund_%2851739988735%29.jpg', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (74, 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Canon_EOS_R6_Mark_II_-_by_Henry_S%C3%B6derlund_%2852546794891%29.jpg', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (77, 'https://upload.wikimedia.org/wikipedia/commons/b/b9/DJI_Osmo_Pocket_3_-_3.jpg', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (79, 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Canon_EOS_R50_%2852694437103%29.jpg', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (84, 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Samsung_Galaxy_Watch_6.jpg', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (88, 'https://upload.wikimedia.org/wikipedia/commons/3/33/Apple_Watch_Ultra_2.jpg', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (93, 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Nintendo_Switch_Lite_%28turquoise%29_-_3.jpg', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (94, 'https://upload.wikimedia.org/wikipedia/commons/e/ef/ROG_ALLY_-_3.jpg', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (100, 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Sapphire_AMD_Radeon_RX_7900_XTX.jpg', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (105, 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Intel_Core_i7-14700K_%28INVADERPC%29.png', 1);
INSERT INTO product_images(product_id, url, sort) VALUES (106, 'https://upload.wikimedia.org/wikipedia/commons/6/63/Intel_Core_i5-14600K_%28INVADERPC%29_01.png', 1);
```

**本次是否执行 INSERT：否**（预计 25 条，等待人工确认后再决定）。

<!-- FINAL-REVIEW:END -->
