# 阶段 B-1 · 已存 47 张真实图片授权审计总结

> 生成时间：2026-10-10T16:24:56.181Z｜模式：**只读审计（未写库、未导入 #12/#49、未改业务代码）**
> 授权证据来源：Wikimedia MediaWiki API `extmetadata`（LicenseShortName / LicenseUrl / Artist / Credit / Categories），一手证据，非二手转述。47/47 全部核验成功。

## 一、总体结果

| 指标 | 数量 | 对账 |
|---|---|---|
| 审计图片总数 | **47** | = 数据库真实图 47 ✅ |
| 许可分类：CC0 | 1 |  |
| 许可分类：CC BY（含版本） | 16 | 2.0×5 / 3.0×6 / 4.0×5 |
| 许可分类：CC BY-SA（含版本） | 30 | 3.0×2 / 4.0×28 |
| 许可分类：PUBLIC_DOMAIN / 其他 / 未核验 / 不适用 | 0 / 0 / 0 / 0 | 全部为 CC 系开放许可 ✅ |

| 授权审核状态 | 数量 | 含义 |
|---|---|---|
| APPROVED | **1** | 无署名义务（CC0），证据充分 |
| APPROVED_WITH_ATTRIBUTION | **43** | 许可允许使用，但必须履行署名 |
| PENDING_EVIDENCE | **3** | Commons 自身标记「License review needed」，授权未复核 |
| REJECTED | **2** | 主体为对比截图（许可本身没问题，但不适合做商品图） |

| 前台展示资格 | 数量 |
|---|---|
| APPROVED（可立即展示） | **1**（#85 佳明 Forerunner 265，CC0） |
| PENDING_EVIDENCE（暂缓） | **44** |
| REJECTED | **2**（#95、#97 对比截图） |
| 合计 | 47 ✅ |

## 二、核心结论：署名义务是当前最大合规缺口

**47 张图里 46 张需要署名（CC BY 16 + CC BY-SA 30），只有 1 张 CC0 无署名义务。**

而当前系统的真实状况：

- `product_images` 表只有 `id / product_id / url / sort` 四列——**作者、许可、来源页面无处存储**；
- 前端（详情页/列表页/对比页）**不显示任何署名信息**；
- 因此：**这 46 张图目前在线上已展示，但署名义务尚未履行**。

按任务规则「只有确认系统能履行对应许可要求后，才可正式开放展示」，本审计将这 44 张（另 2 张 REJECTED）标记为 **PENDING_EVIDENCE（暂缓）**，待署名功能上线后转为 APPROVED_WITH_ATTRIBUTION。这不是说图片不能用——许可明确允许——而是**署名能力缺位期间的诚实处置**。

> 毕设演示语境下风险有限，但报告必须如实记录；阶段 B-2 上线署名系统后即可全部转正（1 张 CC0 + 43 张补署名 + 3 张待 Commons 复核 + 2 张换图）。

## 三、证据不足与不适用的图片（共 5 张）

| 商品 | 图片 | 问题 | 处置 |
|---|---|---|---|
| #24 MacBook Pro 14 | `Apple_Macbook_Pro_14"_2021_-_Keyboard.png` | **Commons 分类含「License review needed」**（授权未经平台复核）；且为键盘局部特写 | PENDING_EVIDENCE：不作为署名问题处理，而是**许可证据本身待复核**；建议阶段 B-2 换整机图 |
| #105 i7-14700K | `Intel_Core_i7-14700K_(INVADERPC).png` | 同上，License review needed | PENDING_EVIDENCE，建议换图 |
| #106 i5-14600K | `Intel_Core_i5-14600K_(INVADERPC)_01.png` | 同上，License review needed | PENDING_EVIDENCE，建议换图 |
| #95 RTX 4070 Ti Super | `RTX_4070_Ti_SUPER_im_Vergleich_…001.png` | **主体为对比视频截图**（画面含多型号）；许可 CC BY-SA 4.0 本身可用 | **REJECTED**（主体不合格），试点批次导入于严格主体规则建立之前，建议阶段 B-2 换图 |
| #97 RTX 4080 Super | `Video_über_die_RTX_4080_Super_…04.png` | 同上，对比截图（画面含 4080 Super + 4070 Super） | **REJECTED**，建议阶段 B-2 换图 |

### 特殊标记（可保留但需知悉）

- **#83 小米 Watch S3**（`Xiaomi_Mi_Watch_Black.jpg`）：Commons 分类含 **GFDL**（双许可迁移文件）。CC BY-SA 与 GFDL 双许可下，可按 CC BY-SA 条款选用，署名按 CC BY-SA 处理即可，风险低但应在记录中留痕。
- **5 张 Flickr 来源**（#73 索尼 A7 IV、#74 佳能 R6 II、#78 索尼 ZV-E10、#79 佳能 EOS R50、#80 松下 S5 II）：均为 Henry Söderlund 等摄影师的 CC BY 2.0 作品，Commons 的 Credit 字段保留了 Flickr 原链接信息；署名文本应包含作者名与 CC BY 2.0 链接。
- **6 张 SERIES 系列图**（#23/#48/#83/#129/#130/#131）：型号为系列级（非精确型号），前端已有「系列参考图」角标；许可审计独立于型号维度，均要求署名。

## 四、每张图的完整审计字段

见 `existing-images-license-audit.csv` / `.json`，每张含：imageId、productId、productName、imageUrl、source、sourcePageUrl、license（含版本）、licenseUrl、author、attributionText（按真实信息生成，缺失标「待补」）、modifications（缩放说明）、licenseVerified、sourceVerified、imageMatchVerified、frontendEligibility、auditStatus、riskNotes、provenance（4 个导入批次，URL 级核对全部一致）。

## 五、下一步（阶段 B-2 建议）

1. **实施署名系统**（见 metadata-schema-proposal.md 推荐方案 B）→ 44 张 PENDING 转正。
2. **换 5 张图**：#24/#105/#106（License review needed）+ #95/#97（对比截图）。
3. 大图治理（见 large-image-review.md）。
4. 之后再考虑导入阶段 A 的 2 个 NEW_HIGH 候选（#12、#49）。
