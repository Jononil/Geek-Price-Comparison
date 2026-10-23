# 图片候选来源验证报告

> 验证方式：**全部实测**（真实 HTTP 请求 + 覆盖率统计），非文档推断
> 本轮**未写数据库**、未改任何代码
> 验证时间：2026-10-07

---

## 一、结论速览

| 来源 | 可达 | 开放许可 | 有商品图 URL | 品牌+型号匹配 | 中国大陆覆盖 | 判定 |
|---|---|---|---|---|---|---|
| **Wikimedia Commons**（已用） | ✅ | ✅ | ✅ | ✅（需精选） | ⚠️ 偏弱 | **继续用，但已接近上限** |
| Wikidata | ✅ | ✅ | ⚠️ 靠 P18 间接 | ⚠️ 实体稀少 | ❌ | 仅作补充 |
| Openverse | ❌ **不可达** | — | — | — | — | **不可用** |
| Flickr 免密钥 Feed | ❌ **不可达** | — | — | — | — | 不可用 |
| Pixabay / Unsplash / Pexels | ⚠️ 需 API Key | ⚠️ 自有许可 | ✅ | ⚠️ 图库泛图 | ❌ | 不建议 |
| Open Products Facts | ✅ | ✅ 开放数据库 | ✅ 4xx JPG | ❌ **实测零命中** | ❌ | **不可用** |
| Europeana | ✅ | ❌ 多为 InC / NC-ND | ✅ | ❌ 博物馆老物件 | ❌ | **不可用** |
| Smithsonian / 纽约公共图书馆 / NASA | ✅ | ⚠️ 混合 | ✅ | ❌ 与数码产品无关 | ❌ | 不可用 |
| 百度百科 / 搜狗 / 360 图片 | ✅ | ❌ **无开放许可** | ✅ | ✅ | ✅ | **不可用（版权风险）** |
| 淘宝 / 京东 | — | ❌ | — | — | ✅ | 按你的要求排除 |

---

## 二、关键实测证据

### 1. Openverse **在这个环境里根本连不上**（不是限流）

```
❌ 不可达  https://api.openverse.org/v1/images/
❌ 不可达  https://api.openverse.org/v1/images/?q=phone
❌ 不可达  https://openverse.org/
❌ 不可达  https://api.openverse.engineering/v1/images/?q=phone
```

DNS 能解析（`202.160.128.16`），但 TCP/HTTPS 全部 `fetch failed`。
**同时**连 `en.wikipedia.org`、`zh.wikipedia.org`、`flickr.com`、`archive.org`、`api.duckduckgo.com` 也不可达，
而 `commons.wikimedia.org`、`upload.wikimedia.org`、`wikidata.org` 正常。

⇒ 这是**本机网络环境对境外站点的限制**，不是 Openverse 服务问题。国内网络环境访问 Openverse 本就常不稳定。

### 2. Openverse 曾是本项目第一轮的原计划来源

第一轮要对「Mock 50 产品」同时验证 Wikimedia **和 Openverse**，最终产物里 Openverse 的覆盖数据缺失 —— 与本轮实测一致。

### 3. Open Products Facts：能拿到图 URL，但**对我们的型号零命中**

图片 URL 可直接访问（已实测 200）：
```
https://images.openproductsfacts.org/images/products/694/181/274/2181/front_fr.7.400.jpg  (Xiaomi Redmi Note 14 Pro)
```

但对 72 个缺图产品按「品牌+完整型号」严格匹配的结果：

```
待测品牌数 = 47   品牌池总条目 = 229
72 个无候选产品中，OPF 严格命中 = 1 个   ← 仅 #49 AirPods Pro 2（且是「AirPods Pro」，无 2）
```

大量品牌条目为 **0**：ZhiTai、Moondrop、Kzzi、DAREU、AULA、Rapoo、ZOWIE、Delux、Colorful、G.Skill、Hikvision、Gloway、ZTE、Mechrevo、AOC、Titan Army、Keychron、Cherry、Edifier、vivo、AMD、Crucial、Western Digital、Acer…
ASUS 看似 1030 条，但**有图片的只有 4 条**。

⇒ OPF 是法国的开放商品数据库，主力是食品/日用品，**数码产品覆盖极差**，且**没有中国大陆机型**。

### 4. Europeana 有内容，但**许可和品类都不合用**

```
「xiaomi」 命中 50 → 全是 TEXT（大学论文），rights = InC（受版权保护）
「smartphone」 命中 699 → 博物馆藏品照，rights = InC 1.0
「lenovo laptop」 命中 1 → ThinkPad T400（2008 年），CC BY-NC-ND（禁商用+禁演绎）
「laptop computer」 → Bondwell B200 / Toshiba T3200 / Amstrad PPC 640（1980 年代老机器）
```

⇒ 一是**许可证不允许**（NC/ND 或 InC），二是**都是博物馆古董**，不是我们要的在售型号。

### 5. Wikimedia Commons 的挖掘上限

多策略实测（品牌分类遍历 + 中文检索 + 检索词���体），抽样 16 个缺图产品：

```
额外「找到」4 个，逐条核查全是假阳性：
  #12 Redmi K70  → 门店照片（Xiaomi Redmi Store）
  #17 联想小新 Pad Pro → ThinkPad Mini Dock 扩展坞（不是平板）
  #22 联想小新 Pro 16 → CES 2012 展台照
  #62 樱桃 MX 3.0S → Cherry Mx reds 声音 .wav（音频文件！）
⇒ 真实新增 ≈ 0
```

中文检索词同样无效 —— Commons 上「致态」「珂芝」「水月雨」「光威」命中的都是**古籍 djvu 扫描**（《北山小集》《愧郯錄》《天雨花》），属噪声。

Commons 数码品类真实体量（实测）：
```
Category:Lenovo laptops        78      Category:Computer mice     125
Category:ASUS laptops         159      Category:Headphones        315
Category:Solid-state drives    54      Category:Routers            30
Category:Xiaomi smartphones     3      Category:Razer products      0
Category:Mechanical keyboards   0      Category:Graphics cards      0
```

⇒ 通用品类还有几十~几百个文件，但**「品牌+具体型号」级的图基本已被 phase-1 挖完**。

### 6. 中国大陆图片源：能拿到 URL，但**无开放许可**

```
✅ 200  百度百科 API
✅ 200  搜狗图片
✅ 200  360 图片
```

技术上都可用，但**均不提供开放许可**，属版权图片；抓取还有合规风险。按你「免费/开放或允许项目使用」的前提，**这条路不成立**。

---

## 三、对你 6 项要求的逐条回答

| 你的要求 | 实测结论 |
|---|---|
| 免费/开放或允许项目使用 | ✅ 只有 Wikimedia Commons 满足；Europeana 多为 InC/NC-ND；百度/搜狗/360 无许可 |
| 能直接获得商品图片 URL | ✅ Commons / OPF 可以；Openverse 连不上 |
| 能根据品牌+完整型号匹配 | ✅ 仅 Commons 可行；OPF 实测 1/72；Europeana 全是博物馆古董 |
| 对中国大陆数码产品覆盖较好 | ❌ **没有任何可达的开放源满足**。Commons 对大陆机型覆盖极弱 |
| 不爬淘宝/京东高危页面 | ✅ 未触碰（也排除了百度/搜狗/360 此类无授权图源） |
| 先验证不写库 | ✅ 本轮纯验证，数据库未变动 |

---

## 四、结论与建议

### 直接结论

**在当前网络环境下，没有比 Wikimedia Commons 更合适的开放图片源。**
不是我没找到，而是：唯一真正合适的 Openverse 连不上；其余可达来源要么许可不允许、要么品类/地域完全不对、要么实测零命中。

**「图片太少」的根因，不是来源选得少，而是：**
1. 库里缺图的是**中国大陆专供机型 + 小众外设品牌**（珂芝/狼蛛/达尔优/致态/光威/海康威视/泰坦军团…），这些在全球开放图库里**天然没有实拍图**；
2. 剩下的国际品牌型号，**Commons 里能挖的已被 phase-1 挖完**（实测新增≈0）。

### 现实的提升路径（按性价比排序）

**路径 A（推荐）：把「型号级」标准放宽到「系列级」，但明确标注**
很多缺图产品其实有**同系列**的图（如 K70→K70 系列键盘、Corsair 内存、G.Skill 内存条实物）。
可新增一档 `SERIES_MATCH`，导入时**只作为"系列参考图"**并在前端不标注为精确型号。
这是唯一能显著提升数量的合规做法，但需要你同意「非精确型号」这个前提。

**路径 B：接受当前 40 张 + 继续只走高置信命中**
保持严格标准，后续靠新拍摄/众包补充。数量不涨，但零错配风险。

**路径 C：申请 Openverse API Token（如果换了网络环境）**
Openverse 官方支持注册免费 token，返回 100+ 结果/页，聚合 Flickr/Wikimedia 等 CC 内容。
**但本机当前不可达**，需要先解决网络问题（或换一台机器）再谈。

**路径 D：获取一个真正商用授权的图库 Key**
如 Pixabay/Unsplash 商业授权，或直接采购供应商图（Icecat 等）。需预算与账号，超出"免费开放"前提。

---

## 五、本轮验证方法（可复现）

- 可达性：对 18 个候选域名做真实 HTTP 请求（GET，跟随重定向，10s 超时）
- 覆盖率：对 72 个缺图产品按「品牌 + 完整型号 token 全命中」做严格匹配统计
- 挖掘上限：抽样 16 个产品，试「品牌分类遍历（最多 5×500 文件）+ 中文检索 + 4 种检索词变体」
- 逐条人工核查所有"新命中"，剔除假阳性

**数据库状态（本轮未变动）**：products=132、product_images=172、真实图=40
