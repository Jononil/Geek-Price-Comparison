# 阶段 A · 各资源授权规则与来源核验审计

> 生成时间：2026-10-10T15:36:29.600Z

## 一、已核验事实（本轮实际执行）

### 1. Wikimedia Commons

- **授权获取方式**：通过 MediaWiki API `prop=imageinfo&iiprop=extmetadata` 直接读取 Commons 文件页的结构化元数据（LicenseShortName / LicenseUrl / Artist / ImageDescription / Categories），这是授权的一手证据，非二手转述。
- **许可分布（47 张已存图）**：全部来自 Commons，许可集中于 CC0 / Public Domain / CC BY / CC BY-SA 系列（导入闸门 `isAutoAdoptLicense` 仅允许 CC0/PD/CC BY/CC BY-SA，含 NC/ND 或「License review needed」一律剔除）。
- **署名要求**：CC BY / CC BY-SA 要求标注作者与许可链接；CC0/PD 无署名要求（但注明来源是好实践）。47 张图中大多数为 CC BY-SA，**署名义务存在**（见第三节风险）。
- **原始页面可追溯**：每条候选都记录了 `sourcePageUrl`（commons.wikimedia.org/wiki/File:...），人工点开即可复核。
- **限流**：同一 IP 高频请求会触发 429（本轮并发验证时大量 429，慢速 4 秒/张后 47/47 全部 200）——证明 429 是限流而非失效。

### 2. Openverse

- **今日两次实测均不可达**：`fetch failed`（TCP 层失败）。DNS 可解析（128.242.240.212），但 TCP 443 连接超时 → 网络出口阻断，非域名错误、非鉴权问题。
- 旧域名 api.openverse.engineering 可连但 301 重定向回主域名，绕不过。
- **状态：未验证**（无法访问即无法核验其许可字段）。本轮未从 Openverse 取得任何候选，报告中不宣称其"支持"。

### 3. Open Products Facts

- API 可达（world.openproductsfacts.org/api/v2），返回条目含 `image_front_url`。
- 数据库为开放授权（同 Open Food Facts 体系）；图片 URL 可直接访问（本轮实测 200）。
- **对本项目的实际贡献：0**。49 个品牌共 229 条有图条目，严格匹配（品牌+型号 token 全命中、型号非纯数字）仅 2 条：#49 AirPods Pro（系列级名，弱于 Commons 已有候选）、#82 Huawei Watch GT（系列级，非 GT 4）。大量品牌条目为 0（致态/水月雨/珂芝/达尔优/狼蛛/雷柏/卓威/多彩/七彩虹/芝奇/海康威视/光威/中兴/vivo/AMD 等）。

## 二、未核验事项（明确不宣称）

| 事项 | 状态 | 说明 |
|---|---|---|
| Openverse 许可条款 | **未验证** | 服务不可达，无法读取任何许可字段 |
| Flickr API 许可 | **未验证** | 域名不可达 |
| Unsplash/Pexels/Pixabay 许可细节 | **未验证** | 需注册 API Key；且按任务规则其通用图库内容不适用于精确型号匹配 |
| Europeana 个别藏品的许可 | 部分验证 | 抽样确认许可为 InC 1.0 / CC BY-NC-ND 4.0，**不适合本项目**（不可商用/不可演绎），故整体判为不可用源 |
| 品牌官网图片 | 未采用 | 商品页图片版权属厂商，无自由转载授权 |
| GitHub 托管图片 | 未采用 | 仓库中出现不等于开源许可 |

## 三、关键许可风险（需在阶段 B 前解决）

### 风险 1：署名信息无处存储（结构性缺口）

`product_images` 表实际只有 4 列：`id / product_id / url / sort`，**没有** license / source / author / license_url 字段（已核验 information_schema）。

这意味着：

- 已入库的 47 张图中，**CC BY / CC BY-SA 图片的作者与许可链接无法从数据库读出**，前端页面也无处展示署名。
- 严格来说，CC BY / CC BY-SA 的使用条件（署名+许可链接）目前**未在产品页面履行**。
- CC0 / PD 图片无此义务。

**处置建议（阶段 B 决策项，本轮不改）**：

a) 若仅用于毕业设计演示用途，风险可控，但报告中应如实记录；
b) 若追求合规：可维护 `verification/` 下的署名映射文件，或在前端详情页加"图片来源 Wikimedia Commons · CC BY-SA · 作者 XXX"角标，或（小范围）扩展 product_images 增加 author/license 列——需你拍板，属结构变更。

### 风险 2：许可字段不可追溯的导入批次

第 28 张导入批次（final-image-import-result.md）当时仅记录了许可证名（如 CC BY-SA 4.0），但未把 license_url / author 写入任何持久化位置。好在这些图片均可通过 Commons 页面回查（URL 保留了文件名），补录可行。

### 风险 3：429 限流不是失效，但会误导自动化检查

本轮 3 轮验证（curl 并发 / curl 慢速 / 浏览器并发 / 浏览器慢速）证明：并发触发 429，慢速全部 200。任何未来验收脚本都应慢速验证，否则会把限流误判为失效。
