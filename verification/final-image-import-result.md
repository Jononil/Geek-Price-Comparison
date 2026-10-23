# 真实产品图片最终正式导入结果

> 执行时间：2026-10-07T03:59:23.582Z
> 模式：`execute`（已真正写库）
> 导入集合 = 上一轮 finalApproved 的 25 条 + 本轮复核 APPROVE 的 3 条（db#6 / db#16 / db#78）
> 被拒绝、绝不导入：db#5、db#25、db#26、db#97、db#98

## 1. 导入前数据库数量

| 指标 | 数值 |
|---|---|
| products | 132 |
| product_images | 137 |
| 其中真实图片（非 placehold.co） | 5 |
| schema 表数量 | 25 |

## 2. 本次计划 INSERT 数量

**28 条**（预期 28）

## 3. 实际 INSERT 数量

**28 条**

## 4. 导入后数据库数量

| 指标 | 预期 | 实际 | 结果 |
|---|---|---|---|
| product_images | 165 | 165 | ✅ |
| 本次新增 | 28 | 28 | ✅ |
| products | 132 | 132 | ✅ |
| schema 表数量 | 25 | 25 | ✅ |
| 真实图片 | 33 | 33 | ✅ |

## 5. 新增图片明细（28 条）

| # | product_id | 产品名 | 品牌 | 类别 | imageUrl | source | license | Commons 页面 | imageId | 写入 |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1 | iPhone 16 Pro | 苹果 | 手机 | https://upload.wikimedia.org/wikipedia/commons/1/1c/Back_of_iPhone_16_Pro_-_1.jpg | wikimedia | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Back_of_iPhone_16_Pro_-_1.jpg | 40527 | ✅ |
| 2 | 2 | iPhone 15 | 苹果 | 手机 | https://upload.wikimedia.org/wikipedia/commons/4/48/Apple_iPhone_15.jpg | wikimedia | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Apple_iPhone_15.jpg | 40528 | ✅ |
| 3 | 3 | 华为 Mate 60 Pro | 华为 | 手机 | https://upload.wikimedia.org/wikipedia/commons/0/0c/About_Huawei_Mate_60_Pro.jpg | wikimedia | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:About_Huawei_Mate_60_Pro.jpg | 40529 | ✅ |
| 4 | 4 | 华为 Pura 70 Pro | 华为 | 手机 | https://upload.wikimedia.org/wikipedia/commons/e/ed/HUAWEI_Pura_70_Pro_Black_Back.jpg | wikimedia | CC BY 4.0 | https://commons.wikimedia.org/wiki/File:HUAWEI_Pura_70_Pro_Black_Back.jpg | 40530 | ✅ |
| 5 | 7 | OPPO Find X7 Ultra | OPPO | 手机 | https://upload.wikimedia.org/wikipedia/commons/b/b2/Oppo_Find_X7_Ultra.jpg | wikimedia | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Oppo_Find_X7_Ultra.jpg | 40531 | ✅ |
| 6 | 10 | 荣耀 Magic 6 Pro | 荣耀 | 手机 | https://upload.wikimedia.org/wikipedia/commons/c/c1/Honor_Magic_6_Pro_white_Back.jpg | wikimedia | CC BY 4.0 | https://commons.wikimedia.org/wiki/File:Honor_Magic_6_Pro_white_Back.jpg | 40532 | ✅ |
| 7 | 11 | 三星 Galaxy S24 | 三星 | 手机 | https://upload.wikimedia.org/wikipedia/commons/4/46/Samsung_Galaxy_S24_%28webtekno%29_008.png | wikimedia | CC BY 3.0 | https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_S24_(webtekno)_008.png | 40533 | ✅ |
| 8 | 14 | iPad Air M2 | 苹果 | 平板电脑 | https://upload.wikimedia.org/wikipedia/commons/b/b5/M2_iPad_Air_front_Camera_and_Apple_Pencil.jpg | wikimedia | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:M2_iPad_Air_front_Camera_and_Apple_Pencil.jpg | 40534 | ✅ |
| 9 | 15 | 华为 MatePad Pro | 华为 | 平板电脑 | https://upload.wikimedia.org/wikipedia/commons/b/bc/An_11-inch_HUAWEI_MatePad_Pro.jpg | wikimedia | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:An_11-inch_HUAWEI_MatePad_Pro.jpg | 40535 | ✅ |
| 10 | 18 | 三星 Galaxy Tab S9 | 三星 | 平板电脑 | https://upload.wikimedia.org/wikipedia/commons/0/05/Samsung_Galaxy_Tab_S9.png | wikimedia | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_Tab_S9.png | 40536 | ✅ |
| 11 | 24 | MacBook Pro 14 | 苹果 | 笔记本电脑 | https://upload.wikimedia.org/wikipedia/commons/b/b4/Apple_Macbook_Pro_14%22_2021_-_Keyboard.png | wikimedia | CC BY 3.0 | https://commons.wikimedia.org/wiki/File:Apple_Macbook_Pro_14%22_2021_-_Keyboard.png | 40537 | ✅ |
| 12 | 29 | 华为 MateBook 14 | 华为 | 笔记本电脑 | https://upload.wikimedia.org/wikipedia/commons/8/8f/Huawei_MateBook_14_%282023%29%2C_February_4%2C_2024.jpg | wikimedia | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Huawei_MateBook_14_(2023),_February_4,_2024.jpg | 40538 | ✅ |
| 13 | 54 | 三星 Galaxy Buds 2 Pro | 三星 | 耳机 | https://upload.wikimedia.org/wikipedia/commons/a/ac/Samsung_Galaxy_Buds_2_Pro.png | wikimedia | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_Buds_2_Pro.png | 40539 | ✅ |
| 14 | 58 | 罗技 MX Keys | 罗技 | 键盘 | https://upload.wikimedia.org/wikipedia/commons/7/78/Logitech_MX_Keys_YR0073_Wireless_Keyboard.jpg | wikimedia | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Logitech_MX_Keys_YR0073_Wireless_Keyboard.jpg | 40540 | ✅ |
| 15 | 73 | 索尼 A7 IV | 索尼 | 相机 | https://upload.wikimedia.org/wikipedia/commons/8/8b/Sony_A7_IV_%28ILCE-7M4%29_-_by_Henry_S%C3%B6derlund_%2851739988735%29.jpg | wikimedia | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Sony_A7_IV_(ILCE-7M4)_-_by_Henry_S%C3%B6derlund_(51739988735).jpg | 40541 | ✅ |
| 16 | 74 | 佳能 R6 Mark II | 佳能 | 相机 | https://upload.wikimedia.org/wikipedia/commons/f/f8/Canon_EOS_R6_Mark_II_-_by_Henry_S%C3%B6derlund_%2852546794891%29.jpg | wikimedia | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Canon_EOS_R6_Mark_II_-_by_Henry_S%C3%B6derlund_(52546794891).jpg | 40542 | ✅ |
| 17 | 77 | 大疆 Pocket 3 | 大疆 | 相机 | https://upload.wikimedia.org/wikipedia/commons/b/b9/DJI_Osmo_Pocket_3_-_3.jpg | wikimedia | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:DJI_Osmo_Pocket_3_-_3.jpg | 40543 | ✅ |
| 18 | 79 | 佳能 EOS R50 | 佳能 | 相机 | https://upload.wikimedia.org/wikipedia/commons/d/dd/Canon_EOS_R50_%2852694437103%29.jpg | wikimedia | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Canon_EOS_R50_(52694437103).jpg | 40544 | ✅ |
| 19 | 84 | 三星 Galaxy Watch 6 | 三星 | 智能手表 | https://upload.wikimedia.org/wikipedia/commons/b/b9/Samsung_Galaxy_Watch_6.jpg | wikimedia | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_Watch_6.jpg | 40545 | ✅ |
| 20 | 88 | 苹果 Watch Ultra 2 | 苹果 | 智能手表 | https://upload.wikimedia.org/wikipedia/commons/3/33/Apple_Watch_Ultra_2.jpg | wikimedia | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Apple_Watch_Ultra_2.jpg | 40546 | ✅ |
| 21 | 93 | 任天堂 Switch Lite | 任天堂 | 游戏机 | https://upload.wikimedia.org/wikipedia/commons/0/0f/Nintendo_Switch_Lite_%28turquoise%29_-_3.jpg | wikimedia | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Nintendo_Switch_Lite_(turquoise)_-_3.jpg | 40547 | ✅ |
| 22 | 94 | ROG Ally | 华硕 | 游戏机 | https://upload.wikimedia.org/wikipedia/commons/e/ef/ROG_ALLY_-_3.jpg | wikimedia | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:ROG_ALLY_-_3.jpg | 40548 | ✅ |
| 23 | 100 | RX 7900 XTX | AMD | 显卡 | https://upload.wikimedia.org/wikipedia/commons/a/a8/Sapphire_AMD_Radeon_RX_7900_XTX.jpg | wikimedia | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Sapphire_AMD_Radeon_RX_7900_XTX.jpg | 40549 | ✅ |
| 24 | 105 | i7-14700K | Intel | CPU | https://upload.wikimedia.org/wikipedia/commons/b/b8/Intel_Core_i7-14700K_%28INVADERPC%29.png | wikimedia | CC BY 3.0 | https://commons.wikimedia.org/wiki/File:Intel_Core_i7-14700K_(INVADERPC).png | 40550 | ✅ |
| 25 | 106 | i5-14600K | Intel | CPU | https://upload.wikimedia.org/wikipedia/commons/6/63/Intel_Core_i5-14600K_%28INVADERPC%29_01.png | wikimedia | CC BY 3.0 | https://commons.wikimedia.org/wiki/File:Intel_Core_i5-14600K_(INVADERPC)_01.png | 40551 | ✅ |
| 26 | 6 | 小米 14 | 小米 | 手机 | https://upload.wikimedia.org/wikipedia/commons/5/52/Xiaomi_14_%28July_10%2C_2026%29.jpg | wikimedia | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Xiaomi_14_(July_10,_2026).jpg | 40552 | ✅ |
| 27 | 16 | 小米平板 7 Pro | 小米 | 平板电脑 | https://upload.wikimedia.org/wikipedia/commons/1/16/Xiaomi_Pad_7_Pro.jpg | wikimedia | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Xiaomi_Pad_7_Pro.jpg | 40553 | ✅ |
| 28 | 78 | 索尼 ZV-E10 | 索尼 | 相机 | https://upload.wikimedia.org/wikipedia/commons/b/ba/Sony_ZV-E10_with_Sony_E_16-50mm_F3.5-5.6_OSS_PZ_-_by_Henry_S%C3%B6derlund_%2851375243603%29.jpg | wikimedia | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Sony_ZV-E10_with_Sony_E_16-50mm_F3.5-5.6_OSS_PZ_-_by_Henry_S%C3%B6derlund_(51375243603).jpg | 40554 | ✅ |

> 说明：`product_images` 表只有 `id / product_id / url / sort` 四列（已核验），
> 因此没有 source/license/licenseUrl/attribution 等列可写；本表内的 source/license 为验证阶段记录的来源信息，schema 未被改动。

## 6. db#78 使用的最终 URL

- 使用 URL：`https://upload.wikimedia.org/wikipedia/commons/b/ba/Sony_ZV-E10_with_Sony_E_16-50mm_F3.5-5.6_OSS_PZ_-_by_Henry_S%C3%B6derlund_%2851375243603%29.jpg`
- 是否正确使用棚拍备选（而非 booth 展会照）：✅ 是
- 未使用的原候选：`https://upload.wikimedia.org/wikipedia/commons/3/35/Sony_ZV-E10_with_Rode_microphone_at_Hai_Kuo_Musical_Instrument_booth_20221224.jpg`

## 7. 被拒绝的 5 个产品（未导入）

| db id | 产品 | 拒绝原因 |
|---|---|---|
| 5 | 小米 14 Ultra | 零售店陈列照，画面同时含手机与手表，主体不唯一 |
| 25 | 华硕天选 5 Pro | 无法确认对应关系；天选5 Pro 官方海外名为 TUF Gaming A16/F16 (2024)，非「TUF Gaming 5 Pro」 |
| 26 | 戴尔 XPS 13 | 多设备对比合影（XPS 13 + XPS 15） |
| 97 | RTX 4080 Super | 画面同时含 4080 Super 与 4070 Super；且该 URL 早已入库（重复） |
| 98 | RTX 4090 | 主体为包装中的显卡；且文件标注 License review needed |

## 8. 重复 / 跳过记录

- 导入后 `product_images` 中**无重复 URL**。
- 被拒产品是否被误加图片：否 ✅
- 集合内 product_id 唯一、每个产品仅 1 张（推进前已校验）。

## 9. 数据一致性检查结果

写库前 11 项检查：

| # | 检查项 | 结果 | 说明 |
|---|---|---|---|
| 1 | ① 最终待插入记录数量 = 28 | ✅ 通过 | 实际 28 |
| 2 | ② 全部 product_id 真实存在于 products | ✅ 通过 | 28 个均存在 |
| 3 | ③ 全部产品 deleted = 0 | ✅ 通过 | 全部未删除 |
| 4 | ④ URL 非 NULL、非空 | ✅ 通过 | 全部非空 |
| 5 | ⑤ URL 在 product_images 中不存在 | ✅ 通过 | 无重复 URL |
| 6 | ⑥ 集合内 product_id / URL 不重复 | ✅ 通过 | 每条产品各 1 张 |
| 7 | ⑦ 不含被拒绝的 db id (5/25/26/97/98) | ✅ 通过 | 均未出现 |
| 8 | ⑧ db#78 使用棚拍备选 URL（非 booth 展会照） | ✅ 通过 | 6-50mm_F3.5-5.6_OSS_PZ_-_by_Henry_S%C3%B6derlund_%2851375243603%29.jpg |
| 9 | ⑨ 沿用现有 product_images 结构（不改 schema） | ✅ 通过 | id,product_id,url,sort |
| 10 | ⑩ 不修改 products 表 | ✅ 通过 | 本轮 SQL 只含 INSERT INTO product_images |
| 11 | ⑪ 不修改其它业务表 | ✅ 通过 | 同上 |

导入后一致性：

| 检查项 | 结果 |
|---|---|
| 28 个目标产品均已存在对应图片记录 | ✅ |
| db#5/25/26/97/98 未被新增错误图片 | ✅ |
| db#78 保存的是棚拍单机 URL | ✅ |
| 无重复 URL | ✅ |
| 原有 5 张真实图片未被修改/删除 | ✅ |

## 10. 最终结论

```
IMPORT_STATUS = SUCCESS
BEFORE_PRODUCT_IMAGES = 137
INSERTED = 28
AFTER_PRODUCT_IMAGES = 165
EXPECTED_PRODUCT_IMAGES = 165
```

**本轮正式导入完整成功**：`INSERTED = 28` 且 `AFTER_PRODUCT_IMAGES = 165`，全部一致性检查通过。

### 附：本轮未改动的内容

- 未修改 `products` / `brands` / `categories` / `product_source` / 价格 / 评论 / 推荐算法
- 未修改 `backend` Java、`frontend`、`admin`；未接入新图片源；未重新搜索整批图片
- 未修改审核标准；未把任何 REJECT 项重新 APPROVE；未为凑数量增加其它图片