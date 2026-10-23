# 8 个 `finalReviewRequired` 产品：人工判定辅助复核结果

> 生成时间：2026-10-06
> 复核范围：**仅** 8 个 `finalReviewRequired` 项（db#5、6、16、25、26、78、97、98）
> 复核依据：**已采集的候选元数据**（Wikimedia 标题 / description / categories）+ 数据库产品名·品牌·类别；#25 额外做厂商命名核对
> 只读声明：本轮**未重新搜索整批产品图片**、**未执行任何 INSERT / UPDATE / DELETE**、**未修改** `backend/` `frontend/` `admin/` `database`、**未触碰** `final-approved-product-images.json`
> 数据库基线：`products = 132`，`product_images = 137`（复核前后一致）

---

## 一、8 项复核结论一览

| # | db id | 产品 | 候选图 | 能确认是目标产品 | 产品本体实拍 | 适合做主图 | 最终建议 |
|---|---|---|---|---|---|---|---|
| 1 | 5 | 小米 14 Ultra | 零售店陈列照 | ✅ 是 | ⚠️ 否（店面陈列） | ❌ 否 | **REJECT** |
| 2 | 6 | 小米 14 | Xiaomi 14 (July 10, 2026).jpg | ✅ 是 | ✅ 是 | ✅ 是 | **APPROVE** |
| 3 | 16 | 小米平板 7 Pro | Xiaomi Pad 7 Pro.jpg | ✅ 是 | ✅ 是 | ✅ 是 | **APPROVE** |
| 4 | 25 | 华硕天选 5 Pro | ASUS TUF Gaming 5 Pro Laptop.jpg | ❌ **无法确认** | ⚠️ 仅一张非官方命名的笔记本照 | ❌ 否 | **REJECT** |
| 5 | 26 | 戴尔 XPS 13 | DELL XPS 13 and 15 (…).jpg | ✅ 是（2017 款） | ⚠️ 两台设备 | ❌ 否 | **REJECT** |
| 6 | 78 | 索尼 ZV-E10 | booth 照（Rode 麦克风） | ✅ 是 | ✅ 是 | ⚠️ 一般（建议换备选） | **APPROVE**（改用备选 URL） |
| 7 | 97 | RTX 4080 Super | Video…Vergleichskarten 04.png | ⚠️ 画面同时含 4070 Super | ⚠️ 两张不同卡 | ❌ 否 | **REJECT** |
| 8 | 98 | RTX 4090 | …Unboxing (ZMASLO).png | ✅ 是 | ❌ 否（主体为包装中的卡） | ❌ 否 | **REJECT** |

---

## 二、逐条复核明细

### 1. db#5 小米 14 Ultra — **REJECT**

| 字段 | 内容 |
|---|---|
| db id | 5 |
| databaseProductName | 小米 14 Ultra |
| candidate image URL | `https://upload.wikimedia.org/wikipedia/commons/e/e8/HK_中環_Central_皇后大道中_33_Queen's_Road_Central_shop_豐澤電器_Fortress_Store_手機_smartphone_XiaoMi_14_Ultra_watch_May_2024_R12S_01.jpg` |
| image title | `HK 中環 Central 皇后大道中 33 Queen's Road Central shop 豐澤電器 Fortress Store 手機 smartphone XiaoMi 14 Ultra watch May 2024 R12S 01.jpg` |
| source | wikimedia (Commons) |
| 当前匹配依据 | 标题含 `XiaoMi 14 Ultra`；Commons 分类含 `Xiaomi 14 Ultra`；description 为门市拍摄说明 |
| 可确认是目标产品 | **是**（标题 + Commons 分类双重指向 Xiaomi 14 Ultra） |
| 产品本体实拍 | **否**：拍摄场景为香港中环丰泽（Fortress）门市，Commons 分类为 `Fortress shops in Central, Hong Kong` / `Smartphones in Hong Kong`，标题同时出现 `smartphone` 与 `watch` |
| 适合作为 product_images 主图 | **否** |
| 最终建议 | **REJECT** |
| 一句话理由 | 型号身份没问题，但这是一张零售店陈列照、画面里同时有手机与手表，主体不唯一，属规则 B「店铺/展台整体陈列」不适用情形。（本批候选中该产品没有更干净的替代图——其余候选分别是 Mi 11 Ultra / Xiaomi 15 Ultra / SU7 Ultra 汽车 / Pad 7 Ultra / Xiaomi 17 Ultra，均为不同型号。） |

### 2. db#6 小米 14 — **APPROVE**

| 字段 | 内容 |
|---|---|
| db id | 6 |
| databaseProductName | 小米 14 |
| candidate image URL | `https://upload.wikimedia.org/wikipedia/commons/5/52/Xiaomi_14_%28July_10%2C_2026%29.jpg` |
| image title | `Xiaomi 14 (July 10, 2026).jpg` |
| source | wikimedia (Commons) |
| 当前匹配依据 | 型号 "14" 命中标题；但**不止于此**：description 为 `Xiaomi 14.`，Commons 分类为 `Xiaomi 14` + `Front of smartphones` |
| 可确认是目标产品 | **是**（Xiaomi + 14 的联合证据出现在标题、description、Commons 分类三处） |
| 产品本体实拍 | **是**：分类 `Front of smartphones`（手机正面），另有同批 `Xiaomi 14 rear`（背面） |
| 适合作为 product_images 主图 | **是** |
| 最终建议 | **APPROVE** |
| 一句话理由 | 虽属纯数字型号，但已满足「联合证据」要求——Xiaomi 与 14 同时出现在标题、描述与 Commons 分类中；且同批候选里 `Xiaomi 14 Pro` 是**另一个分类**并被正确拒绝，说明 Pro 与标准版已被区分开。 |

### 3. db#16 小米平板 7 Pro — **APPROVE**

| 字段 | 内容 |
|---|---|
| db id | 16 |
| databaseProductName | 小米平板 7 Pro |
| candidate image URL | `https://upload.wikimedia.org/wikipedia/commons/1/16/Xiaomi_Pad_7_Pro.jpg` |
| image title | `Xiaomi Pad 7 Pro.jpg` |
| source | wikimedia (Commons) |
| 当前匹配依据 | 型号数字+后缀 `7 Pro` 命中；description `Xiaomi Pad 7 Pro tablet.`；Commons 分类 `Xiaomi tablets` |
| 可确认是目标产品 | **是**：`小米平板` = `Xiaomi Pad` 是小米官方同一产品线的中英文写法（小米 = Xiaomi，平板 = Pad），型号段 `7 Pro` 完全一致 |
| 产品本体实拍 | **是**：单台平板整机照 |
| 适合作为 product_images 主图 | **是** |
| 最终建议 | **APPROVE** |
| 一句话理由 | 属纯语言转换（小米平板↔Xiaomi Pad）+ 型号完全一致；关键佐证是同批候选中 `Xiaomi Pad 7`（非 Pro）仅得 30 分被拒绝，证明该匹配**区分了 Pro 与非 Pro**，不是靠系列名蒙混。 |

### 4. db#25 华硕天选 5 Pro — **REJECT（无法确认）**

| 字段 | 内容 |
|---|---|
| db id | 25 |
| databaseProductName | 华硕天选 5 Pro |
| candidate image URL | `https://upload.wikimedia.org/wikipedia/commons/5/57/ASUS_TUF_Gaming_5_Pro_Laptop.jpg` |
| image title | `ASUS TUF Gaming 5 Pro Laptop.jpg` |
| source | wikimedia (Commons) |
| 当前匹配依据 | 数据库名 `华硕天选 5 Pro` 分词为 `["华硕天选","5","pro"]`，其中中文系列名被当作可省的「系列头」，**实际只要求 `5` + `pro`**；文件仅 2 个候选，另一个是无关的《全唐詩》djvu |
| 可确认是目标产品 | **否** |
| 产品本体实拍 | 是笔记本照，但无法确认是哪一款 |
| 适合作为 product_images 主图 | **否** |
| 最终建议 | **REJECT** |
| 一句话理由 | 证据链不足以确认对应关系，且厂商命名核对显示**该文件使用的名字并非天选 5 Pro 的官方名称**。 |

**#25 命名核对（本轮重点，含外部证据）**

1. **华硕官方对应关系**：ASUS 中国官网把「华硕天选5 Pro」放在 TUF Gaming 产品线下，其页面 URL 即为 `…/tuf-gaming/asus-tuf-gaming-a16-2024/`（锐龙版，型号 FA607PV），酷睿版对应 `asus-tuf-gaming-f16-2024`（型号 FX607JV）。
   参考：[华硕天选5 Pro 锐龙版（ASUS 官网，URL 路径为 asus-tuf-gaming-a16-2024，型号 FA607PV）](https://www.asus.com.cn/laptops/for-gaming/tuf-gaming/asus-tuf-gaming-a16-2024/helpdesk_service?model2Name=FA607PV)、[华硕天选5 Pro 酷睿版（asus-tuf-gaming-f16-2024，型号 FX607JV）](https://www.asus.com.cn/laptops/for-gaming/tuf-gaming/asus-tuf-gaming-f16-2024/helpdesk_service?model2Name=FX607JV)
   → 即：**天选5 Pro 的海外官方名是 TUF Gaming A16 / F16 (2024)，不是「TUF Gaming 5 Pro」**。
2. **候选文件侧证据极弱**：description 只是重复标题；Commons 分类只有 `ASUS TX Gaming` 一个（既非 A16/F16、也非天选、且 `TX Gaming` 不是 ASUS 的正式产品线名）；没有任何型号编号（如 FA607 / FX607）可供交叉验证。
3. **结论**：`ASUS TUF Gaming 5 Pro` 与 `华硕天选 5 Pro` **无法确认存在对应关系**；相反，天选5 Pro 的官方对应名是 A16/F16，与该文件标题并不吻合。
   **因此不能因为都出现「5 Pro」就通过** —— 判定 **REJECT**。
   （若你能从包装/型号贴纸等渠道确认该图实为 FA607/FX607 机型，可再单独复议；当前证据不足。）

### 5. db#26 戴尔 XPS 13 — **REJECT**

| 字段 | 内容 |
|---|---|
| db id | 26 |
| databaseProductName | 戴尔 XPS 13 |
| candidate image URL | `https://upload.wikimedia.org/wikipedia/commons/…/DELL_XPS_13_and_15_(37080596413).jpg` |
| image title | `DELL XPS 13 and 15 (37080596413).jpg` |
| source | wikimedia (Commons) |
| 当前匹配依据 | 标题含 `XPS 13`；Commons 分类 `Dell XPS 13 (2017)`、`Dell XPS 15 (2017)`、**`Comparisons of laptops`** |
| 可确认是目标产品 | **是**（XPS 13 2017 款），但数据库中该产品名未标注年份 |
| 产品本体实拍 | **否**：分类明确为 `Comparisons of laptops`，画面为 **XPS 13 与 XPS 15 两台并排** |
| 适合作为 product_images 主图 | **否** |
| 最终建议 | **REJECT** |
| 一句话理由 | 属「多设备合影/对比图」，画面里有两台不同尺寸机型，主体不唯一，不适合做单品主图。（备选候选也不合用：79 分的是一张「C 键断裂的替换键盘特写」，同样不宜作主图。） |

### 6. db#78 索尼 ZV-E10 — **APPROVE（建议改用备选 URL）**

| 字段 | 内容 |
|---|---|
| db id | 78 |
| databaseProductName | 索尼 ZV-E10 |
| candidate image URL（原选） | `https://upload.wikimedia.org/wikipedia/commons/3/35/Sony_ZV-E10_with_Rode_microphone_at_Hai_Kuo_Musical_Instrument_booth_20221224.jpg` |
| image title | `Sony ZV-E10 with Rode microphone at Hai Kuo Musical Instrument booth 20221224.jpg` |
| source | wikimedia (Commons) |
| 当前匹配依据 | 标题含 `Sony ZV-E10`；description（中文）说明是「2022 台北樂器大展，海國樂器攤位舞台活動錄影使用的索尼數位相機 ZV-E10 加 Rode 麥克風」；Commons 分类含 `Sony ZV-E10`、`Rear views of digital cameras`、`Photographs of cameras by Solomon203` |
| 可确认是目标产品 | **是**（标题 + description + `Sony ZV-E10` 分类三重证据） |
| 产品本体实拍 | **是**：相机背面实拍（含一支 Rode 麦克风附件） |
| 适合作为 product_images 主图 | **一般**：机型正确、主体是相机，但属展会摊位场景且外挂了第三方麦克风，作为商品主图不够干净 |
| 最终建议 | **APPROVE** —— 但**建议改用同批已采集的备选候选**（更干净的棚拍单机照，且为 HIGH + 合法许可）：`https://upload.wikimedia.org/wikipedia/commons/b/ba/Sony_ZV-E10_with_Sony_E_16-50mm_F3.5-5.6_OSS_PZ_-_by_Henry_S%C3%B6derlund_%2851375243603%29.jpg`（CC BY 2.0，分类 `Sony ZV-E10` + `Cameras and lenses on black background`） |
| 一句话理由 | 型号身份证据充分、可导入；但原选候选是展会摊位照并带外接麦克风，建议换成同批的棚拍单机照更合适。 |

> **附加发现（重要）**：#78 的候选里有一张 `Sony ZV-E10 Mark II.tiff` 也被打了 **100 HIGH**（CC BY 4.0），但其 Commons 分类是 **`Sony ZV-E10M2`**——那是 **Mark II，属不同型号**。本轮它没有被选为最佳候选，因此不影响导入；但这说明「ZV-E10 Mark II」这类罗马数字后缀存在漏拦风险，建议后续把 `mark ii` / `m2` 之类纳入变体词表。（本轮不改匹配逻辑，仅记录。）

### 7. db#97 RTX 4080 Super — **REJECT**

| 字段 | 内容 |
|---|---|
| db id | 97 |
| databaseProductName | RTX 4080 Super |
| candidate image URL | `https://upload.wikimedia.org/wikipedia/commons/f/f8/Video_über_die_RTX_4080_Super_und_Vergleichskarten_(极客湾Geekerwan)_04.png` |
| image title | `Video über die RTX 4080 Super und Vergleichskarten (极客湾Geekerwan) 04.png` |
| source | wikimedia (Commons) |
| 当前匹配依据 | 标题含 `RTX 4080 Super`；描述说明画面内容 |
| 可确认是目标产品 | **部分**：description 明确写 “Here you can see the NVIDIA GeForce RTX 4080 Super **and 4070 Super**”，Commons 分类同时挂了 `NVIDIA GeForce RTX 4070 Super` 与 `NVIDIA GeForce RTX 4080 Super` |
| 产品本体实拍 | **否**：这是评测视频截图，画面内是**两张不同型号**的显卡 |
| 适合作为 product_images 主图 | **否**（规则 B「对比图无法确认目标产品」「多个不同型号设备无法确定主体」） |
| 最终建议 | **REJECT** |
| 一句话理由 | 画面同时含 4080 Super 与 4070 Super，主体不唯一；且**该 URL 早在上一轮试点就已导入**（product_images.id=35439，product_id=97），本轮更不应重复。 |

> 备注：本批 10 个候选全是极客湾评测视频截图，其中 `05/06/15/23` 等也都同时出现 4080 / 4090 / 4070 Super 等其它型号，**没有一张是 4080 Super 单卡实拍**，因此该产品暂时拿不到干净主图。

### 8. db#98 RTX 4090 — **REJECT**

| 字段 | 内容 |
|---|---|
| db id | 98 |
| databaseProductName | RTX 4090 |
| candidate image URL | `https://upload.wikimedia.org/wikipedia/commons/e/ea/NVIDIA_RTX_4090_Founders_Edition_-_Unboxing_(ZMASLO).png` |
| image title | `NVIDIA RTX 4090 Founders Edition - Unboxing (ZMASLO).png` |
| source | wikimedia (Commons) |
| 当前匹配依据 | 标题含 `RTX 4090 Founders Edition` |
| 可确认是目标产品 | **是**（型号正确） |
| 产品本体实拍 | **否**：description 为 “View of the NVIDIA RTX 4090 Founders Edition **in its packaging**”，主体是**包装中的显卡**（开箱画面） |
| 适合作为 product_images 主图 | **否**（规则 B「包装盒为主体」）；**另有许可隐患**：该文件 Commons 分类含 **`License review needed`**，即授权尚未通过 Commons 复核，不满足「许可可确认」要求 |
| 最终建议 | **REJECT** |
| 一句话理由 | 主体是包装中的显卡而非产品本体，且该文件在 Commons 标注 `License review needed`（授权未复核），两项都不满足主图采用条件。（若后续需要，同批里 `Asus Strix RTX 4090.jpg`（CC BY-SA 4.0，分类 `NVIDIA GeForce RTX 4090`）是单卡实拍、相对更合用，但属 AIB 非公版，需你确认口径。） |

---

## 三、FINAL_DECISION

| 结论 | 数量 | 明细 |
|---|---|---|
| **APPROVE** | **3** | db#6 小米 14、db#16 小米平板 7 Pro、db#78 索尼 ZV-E10（建议用备选 URL） |
| **REJECT** | **5** | db#5 小米 14 Ultra、db#25 华硕天选 5 Pro、db#26 戴尔 XPS 13、db#97 RTX 4080 Super、db#98 RTX 4090 |
| **KEEP_REVIEW** | **0** | 无（8 项均已给出明确结论） |
| 合计 | 8 | — |

---

## 四、IMPORT_IMPACT

**本轮不会执行任何数据库写入。** 以下仅为「若按本轮 APPROVE 结果执行」的估算：

| 项目 | 数量 |
|---|---|
| 本轮 APPROVE | 3 |
| 其中 URL 已存在（必须继续跳过） | **0** |
| 其中产品已有其它真实图片（应跳过） | **0** |
| **预计新增 `product_images`** | **3 行** |

逐条预计插入（若后续获批执行）：

```sql
-- db#6 小米 14（现有：仅 placehold.co 占位图，sort=0）
INSERT INTO product_images(product_id, url, sort) VALUES (6, 'https://upload.wikimedia.org/wikipedia/commons/5/52/Xiaomi_14_%28July_10%2C_2026%29.jpg', 1);

-- db#16 小米平板 7 Pro（现有：仅 placehold.co 占位图，sort=0）
INSERT INTO product_images(product_id, url, sort) VALUES (16, 'https://upload.wikimedia.org/wikipedia/commons/1/16/Xiaomi_Pad_7_Pro.jpg', 1);

-- db#78 索尼 ZV-E10（现有：仅 placehold.co 占位图，sort=0）—— 建议使用备选棚拍候选
INSERT INTO product_images(product_id, url, sort) VALUES (78, 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Sony_ZV-E10_with_Sony_E_16-50mm_F3.5-5.6_OSS_PZ_-_by_Henry_S%C3%B6derlund_%2851375243603%29.jpg', 1);
```

已确认跳过项：

- **db#97 RTX 4080 Super**：其候选 URL 已在库中（`product_images.id=35439`），即使不 REJECT 也必须按 `DUPLICATE` 跳过 → 本项对新增量贡献 **0**。

若把本轮 3 条与上一轮已确认的 25 条合并考虑，导入后预期为：

| 阶段 | product_images | 真实图片 |
|---|---|---|
| 当前基线 | 137 | 5 |
| 仅执行上一轮 25 条 | 162 | 30 |
| 再叠加本轮 APPROVE 3 条 | 165 | 33 |

> 以上仅为估算，**实际执行需你另行确认**；本轮已按要求停在此处。

---

## 五、本轮未改动的内容（自查）

- 未执行 `INSERT` / `UPDATE` / `DELETE` / `ALTER` / `DROP` / `TRUNCATE`；全部 SQL 均为 `SELECT`
- 数据库复核前后：`products = 132`、`product_images = 137`（完全一致）
- 未修改 `backend/`、`frontend/`、`admin/`、`database`
- 未修改 `product_images` 现有数据；未覆盖 `final-approved-product-images.json`
- 未重新运行整批图片搜索；未重新审核已 `finalApproved` 的 28 个产品（仅在本报告第四节引用其数量）
- 未为了凑数量把「型号可能对应」写成「确定对应」——#25 即按此原则判为 REJECT
