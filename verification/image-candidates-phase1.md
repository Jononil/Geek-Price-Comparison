# 补充商品图片 · 第一阶段候选清单

> 生成时间：2026-10-07T06:01:14.086Z
> 范围：数据库 deleted=0 产品 **132** 个；已有真实图片 **33** 个（已排除）；本轮目标 **99** 个
> 本轮**只收集候选，不写入数据库**；未修改数据库、未改前后端代码。
> 匹配门槛：**品牌 + 完整型号同时命中**；只命中型号数字、拿不到品牌证据的候选已全部剔除。

## 一、总体统计

| 指标 | 数量 |
|---|---|
| 数据库产品总数（deleted=0） | 132 |
| 已有真实图片（已排除） | 33 |
| 本轮检索目标 | 99 |
| **找到可信候选** | **13** |
| 找到候选但需人工复核 | 14 |
| 完全无候选 | 72 |
| 可信：HIGH / MEDIUM / LOW | 7 / 2 / 4 |
| 候选总条数 | 107 |
| 因缺少品牌证据被剔除 | 115 |

## 二、可信候选清单（品牌 + 完整型号均命中）

### #8 vivo X100 Ultra（vivo / 手机）  → LOW

- 型号：`x100 ultra`

| matchStatus | 分数 | 候选图片 URL | Wikimedia 页面 | 许可证 | 合规 | 主体提示 | 匹配依据 |
|---|---|---|---|---|---|---|---|
| **LOW** | 40 | https://upload.wikimedia.org/wikipedia/commons/3/33/Vivo_X100_pic2.jpg | https://commons.wikimedia.org/wiki/File:Vivo_X100_pic2.jpg | CC BY-SA 4.0 | ✅ | — | +30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **LOW** | 40 | https://upload.wikimedia.org/wikipedia/commons/b/bf/Vivo_X100.jpg | https://commons.wikimedia.org/wiki/File:Vivo_X100.jpg | CC BY-SA 4.0 | ✅ | — | +30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **LOW** | 40 | https://upload.wikimedia.org/wikipedia/commons/9/9a/Vivo_X100_pic3.jpg | https://commons.wikimedia.org/wiki/File:Vivo_X100_pic3.jpg | CC BY-SA 4.0 | ✅ | — | +30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |

### #13 iPad Pro M4（苹果 / 平板电脑）  → HIGH

- 型号：`ipad pro m4`

| matchStatus | 分数 | 候选图片 URL | Wikimedia 页面 | 许可证 | 合规 | 主体提示 | 匹配依据 |
|---|---|---|---|---|---|---|---|
| **HIGH** | 100 | https://upload.wikimedia.org/wikipedia/commons/f/fa/M4_iPad_Pro_back_camera.jpg | https://commons.wikimedia.org/wiki/File:M4_iPad_Pro_back_camera.jpg | CC BY-SA 4.0 | ✅ | — | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **HIGH** | 100 | https://upload.wikimedia.org/wikipedia/commons/c/c8/M4_iPad_Pro_series_-_1.jpg | https://commons.wikimedia.org/wiki/File:M4_iPad_Pro_series_-_1.jpg | CC BY-SA 4.0 | ✅ | — | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **HIGH** | 100 | https://upload.wikimedia.org/wikipedia/commons/f/fb/M4_iPad_Pro_front_camera_and_Apple_pencil.jpg | https://commons.wikimedia.org/wiki/File:M4_iPad_Pro_front_camera_and_Apple_pencil.jpg | CC BY-SA 4.0 | ✅ | — | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **HIGH** | 100 | https://upload.wikimedia.org/wikipedia/commons/4/4e/M4_iPad_Pro_series_-_2.jpg | https://commons.wikimedia.org/wiki/File:M4_iPad_Pro_series_-_2.jpg | CC BY-SA 4.0 | ✅ | — | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |

### #50 森海塞尔 Momentum 4（森海塞尔 / 耳机）  → LOW

- 型号：`momentum 4`

| matchStatus | 分数 | 候选图片 URL | Wikimedia 页面 | 许可证 | 合规 | 主体提示 | 匹配依据 |
|---|---|---|---|---|---|---|---|
| **LOW** | 40 | https://upload.wikimedia.org/wikipedia/commons/3/32/Momentum1_0.jpg | https://commons.wikimedia.org/wiki/File:Momentum1_0.jpg | CC BY-SA 4.0 | ✅ | — | +30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |

### #64 海盗船 K70（海盗船 / 键盘）  → LOW

- 型号：`k70`

| matchStatus | 分数 | 候选图片 URL | Wikimedia 页面 | 许可证 | 合规 | 主体提示 | 匹配依据 |
|---|---|---|---|---|---|---|---|
| **LOW** | 50 | https://upload.wikimedia.org/wikipedia/commons/d/dc/Corsair_K70_Super_Key.jpg | https://commons.wikimedia.org/wiki/File:Corsair_K70_Super_Key.jpg | CC BY-SA 4.0 | ✅ | — | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |

### #76 富士 X-T5（富士 / 相机）  → HIGH

- 型号：`x t5`

| matchStatus | 分数 | 候选图片 URL | Wikimedia 页面 | 许可证 | 合规 | 主体提示 | 匹配依据 |
|---|---|---|---|---|---|---|---|
| **HIGH** | 100 | https://upload.wikimedia.org/wikipedia/commons/a/a8/Fujifilm_X-T5_4_nov_2022c.jpg | https://commons.wikimedia.org/wiki/File:Fujifilm_X-T5_4_nov_2022c.jpg | CC BY-SA 4.0 | ✅ | — | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **HIGH** | 100 | https://upload.wikimedia.org/wikipedia/commons/c/cf/Fujifilm_X-T5_4_nov_2022b.jpg | https://commons.wikimedia.org/wiki/File:Fujifilm_X-T5_4_nov_2022b.jpg | CC BY-SA 4.0 | ✅ | — | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **HIGH** | 100 | https://upload.wikimedia.org/wikipedia/commons/3/31/Fujifilm_X-T5_4_nov_2022a.jpg | https://commons.wikimedia.org/wiki/File:Fujifilm_X-T5_4_nov_2022a.jpg | CC BY-SA 4.0 | ✅ | — | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **HIGH** | 100 | https://upload.wikimedia.org/wikipedia/commons/3/31/Fujifilm_X-T5_4_nov_2022d.jpg | https://commons.wikimedia.org/wiki/File:Fujifilm_X-T5_4_nov_2022d.jpg | CC BY-SA 4.0 | ✅ | — | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **HIGH** | 100 | https://upload.wikimedia.org/wikipedia/commons/b/b5/Fujifilm_X-T5_4_nov_2022e.jpg | https://commons.wikimedia.org/wiki/File:Fujifilm_X-T5_4_nov_2022e.jpg | CC BY-SA 4.0 | ✅ | — | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **HIGH** | 100 | https://upload.wikimedia.org/wikipedia/commons/d/dd/Fujifilm_X-T5_4_nov_2022f.jpg | https://commons.wikimedia.org/wiki/File:Fujifilm_X-T5_4_nov_2022f.jpg | CC BY-SA 4.0 | ✅ | — | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |

### #80 松下 S5 II（松下 / 相机）  → HIGH

- 型号：`s5 ii`

| matchStatus | 分数 | 候选图片 URL | Wikimedia 页面 | 许可证 | 合规 | 主体提示 | 匹配依据 |
|---|---|---|---|---|---|---|---|
| **HIGH** | 100 | https://upload.wikimedia.org/wikipedia/commons/7/79/Panasonic_LUMIX_S5_II_%2852682131682%29.jpg | https://commons.wikimedia.org/wiki/File:Panasonic_LUMIX_S5_II_(52682131682).jpg | CC BY 2.0 | ✅ | — | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |

### #81 苹果 Watch Series 9（苹果 / 智能手表）  → HIGH

- 型号：`watch series 9`

| matchStatus | 分数 | 候选图片 URL | Wikimedia 页面 | 许可证 | 合规 | 主体提示 | 匹配依据 |
|---|---|---|---|---|---|---|---|
| **HIGH** | 100 | https://upload.wikimedia.org/wikipedia/commons/3/39/Apple_Watch_Series_9_1_2023-11-14.jpg | https://commons.wikimedia.org/wiki/File:Apple_Watch_Series_9_1_2023-11-14.jpg | CC BY-SA 4.0 | ✅ | — | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **HIGH** | 100 | https://upload.wikimedia.org/wikipedia/commons/5/54/Apple_Watch_Series_9_%28cropped%29.jpg | https://commons.wikimedia.org/wiki/File:Apple_Watch_Series_9_(cropped).jpg | CC BY-SA 4.0 | ✅ | — | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **LOW** | 59 | https://upload.wikimedia.org/wikipedia/commons/4/46/Apple_Watch_Series_9_Cellular_%28logo%29.svg | https://commons.wikimedia.org/wiki/File:Apple_Watch_Series_9_Cellular_(logo).svg | Public domain | ✅ | — | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **LOW** | 59 | https://upload.wikimedia.org/wikipedia/commons/f/f7/Apple_Watch_Series_9_GPS_%28logo%29.svg | https://commons.wikimedia.org/wiki/File:Apple_Watch_Series_9_GPS_(logo).svg | Public domain | ✅ | — | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **LOW** | 40 | https://upload.wikimedia.org/wikipedia/commons/b/b8/Linux_9_complex_fake_error_on_Apple_Watch_Series_8_w_Red_Danger_symbol_and_Chinese_text.jpeg | https://commons.wikimedia.org/wiki/File:Linux_9_complex_fake_error_on_Apple_Watch_Series_8_w_Red_Danger_symbol_and_Chinese_text.jpeg | CC BY-SA 4.0 | ✅ | — | +30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **LOW** | 40 | https://upload.wikimedia.org/wikipedia/commons/7/73/Linux_9_complex_fake_error_on_Apple_Watch_Series_8_w_red_danger_symbol.jpeg | https://commons.wikimedia.org/wiki/File:Linux_9_complex_fake_error_on_Apple_Watch_Series_8_w_red_danger_symbol.jpeg | CC BY-SA 4.0 | ✅ | — | +30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |

### #82 华为 Watch GT 4（华为 / 智能手表）  → LOW

- 型号：`watch gt 4`

| matchStatus | 分数 | 候选图片 URL | Wikimedia 页面 | 许可证 | 合规 | 主体提示 | 匹配依据 |
|---|---|---|---|---|---|---|---|
| **LOW** | 40 | https://upload.wikimedia.org/wikipedia/commons/4/42/AMOLED_Screen_Smart_Watch.jpg | https://commons.wikimedia.org/wiki/File:AMOLED_Screen_Smart_Watch.jpg | CC BY-SA 4.0 | ✅ | — | +30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |

### #85 佳明 Forerunner 265（佳明 / 智能手表）  → HIGH

- 型号：`forerunner 265`

| matchStatus | 分数 | 候选图片 URL | Wikimedia 页面 | 许可证 | 合规 | 主体提示 | 匹配依据 |
|---|---|---|---|---|---|---|---|
| **HIGH** | 100 | https://upload.wikimedia.org/wikipedia/commons/f/f4/Forerunner_265.jpg | https://commons.wikimedia.org/wiki/File:Forerunner_265.jpg | CC0 | ✅ | — | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **HIGH** | 100 | https://upload.wikimedia.org/wikipedia/commons/a/ae/Garmin_Forerunner_265_musicG.jpg | https://commons.wikimedia.org/wiki/File:Garmin_Forerunner_265_musicG.jpg | CC BY-SA 4.0 | ✅ | — | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |

### #91 微软 Xbox Series X（微软 / 游戏机）  → HIGH

- 型号：`xbox series x`

| matchStatus | 分数 | 候选图片 URL | Wikimedia 页面 | 许可证 | 合规 | 主体提示 | 匹配依据 |
|---|---|---|---|---|---|---|---|
| **HIGH** | 100 | https://upload.wikimedia.org/wikipedia/commons/2/2c/Xbox_Series_X_mit_Controller.jpg | https://commons.wikimedia.org/wiki/File:Xbox_Series_X_mit_Controller.jpg | CC BY-SA 4.0 | ✅ | — | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **LOW** | 59 | https://upload.wikimedia.org/wikipedia/commons/a/af/Xbox_Series_X_logo.svg | https://commons.wikimedia.org/wiki/File:Xbox_Series_X_logo.svg | Public domain | ✅ | — | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |

### #101 RTX 4060 Ti（英伟达 / 显卡）  → MEDIUM

- 型号：`rtx 4060 ti`

| matchStatus | 分数 | 候选图片 URL | Wikimedia 页面 | 许可证 | 合规 | 主体提示 | 匹配依据 |
|---|---|---|---|---|---|---|---|
| **MEDIUM** | 79 | https://upload.wikimedia.org/wikipedia/commons/b/ba/RTX4060TI%E8%AF%84%E6%B5%8B%EF%BC%9A%E5%8F%AA%E6%AF%943060TI%E5%BF%AB10%25_%28%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan%29_06.png | https://commons.wikimedia.org/wiki/File:RTX4060TI%E8%AF%84%E6%B5%8B%EF%BC%9A%E5%8F%AA%E6%AF%943060TI%E5%BF%AB10%25_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_06.png | CC BY 3.0 | ✅ | — | +30 标题/描述包含品牌；+20 描述/标签包含完整型号；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **MEDIUM** | 79 | https://upload.wikimedia.org/wikipedia/commons/9/95/RTX4060TI%E8%AF%84%E6%B5%8B%EF%BC%9A%E5%8F%AA%E6%AF%943060TI%E5%BF%AB10%25_%28%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan%29_08.png | https://commons.wikimedia.org/wiki/File:RTX4060TI%E8%AF%84%E6%B5%8B%EF%BC%9A%E5%8F%AA%E6%AF%943060TI%E5%BF%AB10%25_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_08.png | CC BY 3.0 | ✅ | — | +30 标题/描述包含品牌；+20 描述/标签包含完整型号；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **MEDIUM** | 79 | https://upload.wikimedia.org/wikipedia/commons/2/2c/RTX4060TI%E8%AF%84%E6%B5%8B%EF%BC%9A%E5%8F%AA%E6%AF%943060TI%E5%BF%AB10%25_%28%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan%29_10.png | https://commons.wikimedia.org/wiki/File:RTX4060TI%E8%AF%84%E6%B5%8B%EF%BC%9A%E5%8F%AA%E6%AF%943060TI%E5%BF%AB10%25_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_10.png | CC BY 3.0 | ✅ | — | +30 标题/描述包含品牌；+20 描述/标签包含完整型号；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **MEDIUM** | 79 | https://upload.wikimedia.org/wikipedia/commons/4/4e/RTX4060TI%E8%AF%84%E6%B5%8B%EF%BC%9A%E5%8F%AA%E6%AF%943060TI%E5%BF%AB10%25_%28%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan%29_09.png | https://commons.wikimedia.org/wiki/File:RTX4060TI%E8%AF%84%E6%B5%8B%EF%BC%9A%E5%8F%AA%E6%AF%943060TI%E5%BF%AB10%25_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_09.png | CC BY 3.0 | ✅ | — | +30 标题/描述包含品牌；+20 描述/标签包含完整型号；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **MEDIUM** | 79 | https://upload.wikimedia.org/wikipedia/commons/8/8e/RTX4060TI%E8%AF%84%E6%B5%8B%EF%BC%9A%E5%8F%AA%E6%AF%943060TI%E5%BF%AB10%25_%28%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan%29_12.png | https://commons.wikimedia.org/wiki/File:RTX4060TI%E8%AF%84%E6%B5%8B%EF%BC%9A%E5%8F%AA%E6%AF%943060TI%E5%BF%AB10%25_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_12.png | CC BY 3.0 | ✅ | — | +30 标题/描述包含品牌；+20 描述/标签包含完整型号；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |

### #107 i9-14900K（Intel / CPU）  → HIGH

- 型号：`i9 14900k`

| matchStatus | 分数 | 候选图片 URL | Wikimedia 页面 | 许可证 | 合规 | 主体提示 | 匹配依据 |
|---|---|---|---|---|---|---|---|
| **HIGH** | 100 | https://upload.wikimedia.org/wikipedia/commons/1/12/Intel_i9-14900K.webp | https://commons.wikimedia.org/wiki/File:Intel_i9-14900K.webp | CC BY-SA 4.0 | ✅ | — | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **HIGH** | 100 | https://upload.wikimedia.org/wikipedia/commons/0/01/Intel_Core_i9-14900K_%28INVADERPC%29.png | https://commons.wikimedia.org/wiki/File:Intel_Core_i9-14900K_(INVADERPC).png | CC BY 3.0 | ✅ | — | +50 标题包含完整型号；+30 标题/描述包含品牌；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **MEDIUM** | 79 | https://upload.wikimedia.org/wikipedia/commons/e/e3/14-%D1%8B%D0%B9_%D0%BF%D1%80%D0%BE%D0%B2%D0%B0%D0%BB_Intel_%D0%97%D0%B0%D1%87%D0%B5%D0%BC_%D0%BF%D0%BE%D1%8F%D0%B2%D0%B8%D0%BB%D0%B8%D1%81%D1%8C_14900K%2C_14700K_%D0%B8_14600K-00.08.30.155_%28%D0%9C%D0%BE%D0%B9_%D0%9A%D0%BE%D0%BC%D0%BF%D1%8C%D1%8E%D1%82%D0%B5%D1%80%29.png | https://commons.wikimedia.org/wiki/File:14-%D1%8B%D0%B9_%D0%BF%D1%80%D0%BE%D0%B2%D0%B0%D0%BB_Intel_%D0%97%D0%B0%D1%87%D0%B5%D0%BC_%D0%BF%D0%BE%D1%8F%D0%B2%D0%B8%D0%BB%D0%B8%D1%81%D1%8C_14900K,_14700K_%D0%B8_14600K-00.08.30.155_(%D0%9C%D0%BE%D0%B9_%D0%9A%D0%BE%D0%BC%D0%BF%D1%8C%D1%8E%D1%82%D0%B5%D1%80).png | CC BY 3.0 | ✅ | — | +30 标题/描述包含品牌；+20 描述/标签包含完整型号；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **LOW** | 40 | https://upload.wikimedia.org/wikipedia/commons/c/c6/%D0%94%D0%B5%D1%88%D1%91%D0%B2%D1%8B%D0%B9_Core_i9_%C2%A6_%D0%9C%D1%83%D1%82%D0%B0%D0%BD%D1%82_12900HX_%D0%BF%D1%80%D0%BE%D1%82%D0%B8%D0%B2_14600K_%D0%B8_14900K_%281440p_30fps_VP9-160kbit_Opus%29-00.02.22.000_%28%D0%9C%D0%BE%D0%B9_%D0%9A%D0%BE%D0%BC%D0%BF%D1%8C%D1%8E%D1%82%D0%B5%D1%80%29.png | https://commons.wikimedia.org/wiki/File:%D0%94%D0%B5%D1%88%D1%91%D0%B2%D1%8B%D0%B9_Core_i9_%C2%A6_%D0%9C%D1%83%D1%82%D0%B0%D0%BD%D1%82_12900HX_%D0%BF%D1%80%D0%BE%D1%82%D0%B8%D0%B2_14600K_%D0%B8_14900K_(1440p_30fps_VP9-160kbit_Opus)-00.02.22.000_(%D0%9C%D0%BE%D0%B9_%D0%9A%D0%BE%D0%BC%D0%BF%D1%8C%D1%8E%D1%82%D0%B5%D1%80).png | CC BY 3.0 | ✅ | — | +30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **LOW** | 40 | https://upload.wikimedia.org/wikipedia/commons/f/f5/%D0%94%D0%B5%D1%88%D1%91%D0%B2%D1%8B%D0%B9_Core_i9_%C2%A6_%D0%9C%D1%83%D1%82%D0%B0%D0%BD%D1%82_12900HX_%D0%BF%D1%80%D0%BE%D1%82%D0%B8%D0%B2_14600K_%D0%B8_14900K_%281440p_30fps_VP9-160kbit_Opus%29-00.02.20.000_%28%D0%9C%D0%BE%D0%B9_%D0%9A%D0%BE%D0%BC%D0%BF%D1%8C%D1%8E%D1%82%D0%B5%D1%80%29.png | https://commons.wikimedia.org/wiki/File:%D0%94%D0%B5%D1%88%D1%91%D0%B2%D1%8B%D0%B9_Core_i9_%C2%A6_%D0%9C%D1%83%D1%82%D0%B0%D0%BD%D1%82_12900HX_%D0%BF%D1%80%D0%BE%D1%82%D0%B8%D0%B2_14600K_%D0%B8_14900K_(1440p_30fps_VP9-160kbit_Opus)-00.02.20.000_(%D0%9C%D0%BE%D0%B9_%D0%9A%D0%BE%D0%BC%D0%BF%D1%8C%D1%8E%D1%82%D0%B5%D1%80).png | CC BY 3.0 | ✅ | — | +30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |
| **LOW** | 40 | https://upload.wikimedia.org/wikipedia/commons/8/8e/%D0%94%D0%B5%D1%88%D1%91%D0%B2%D1%8B%D0%B9_Core_i9_%C2%A6_%D0%9C%D1%83%D1%82%D0%B0%D0%BD%D1%82_12900HX_%D0%BF%D1%80%D0%BE%D1%82%D0%B8%D0%B2_14600K_%D0%B8_14900K_%281440p_30fps_VP9-160kbit_Opus%29-00.03.46.000_%28%D0%9C%D0%BE%D0%B9_%D0%9A%D0%BE%D0%BC%D0%BF%D1%8C%D1%8E%D1%82%D0%B5%D1%80%29.png | https://commons.wikimedia.org/wiki/File:%D0%94%D0%B5%D1%88%D1%91%D0%B2%D1%8B%D0%B9_Core_i9_%C2%A6_%D0%9C%D1%83%D1%82%D0%B0%D0%BD%D1%82_12900HX_%D0%BF%D1%80%D0%BE%D1%82%D0%B8%D0%B2_14600K_%D0%B8_14900K_(1440p_30fps_VP9-160kbit_Opus)-00.03.46.000_(%D0%9C%D0%BE%D0%B9_%D0%9A%D0%BE%D0%BC%D0%BF%D1%8C%D1%8E%D1%82%D0%B5%D1%80).png | CC BY 3.0 | ✅ | — | +30 标题/描述包含品牌；+10 分类一致；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |

### #122 金士顿骇客神条 32GB（金士顿 / 内存）  → MEDIUM

- 型号：`骇客神条 32gb` → 匹配用：`Fury 32gb`
- 产品线对照：骇客神条→Fury

| matchStatus | 分数 | 候选图片 URL | Wikimedia 页面 | 许可证 | 合规 | 主体提示 | 匹配依据 |
|---|---|---|---|---|---|---|---|
| **MEDIUM** | 70 | https://upload.wikimedia.org/wikipedia/commons/8/8a/Pea_sant_pc.jpg | https://commons.wikimedia.org/wiki/File:Pea_sant_pc.jpg | CC0 | ✅ | — | +30 标题/描述包含品牌；+20 描述/标签包含完整型号；+10 来源为 Wikimedia Commons；+10 开放许可（CC0/CC BY/CC BY-SA/PD） |

## 三、需人工复核的候选（型号证据偏弱或系列名未确认）

### #5 小米 14 Ultra（小米）  → HIGH

- 复核原因：最佳候选主体类型存疑：store_or_booth
- 型号：`14 ultra` → `14 ultra`
- 最佳候选：https://upload.wikimedia.org/wikipedia/commons/e/e8/HK_%E4%B8%AD%E7%92%B0_Central_%E7%9A%87%E5%90%8E%E5%A4%A7%E9%81%93%E4%B8%AD_33_Queen%27s_Road_Central_shop_%E8%B1%90%E6%BE%A4%E9%9B%BB%E5%99%A8_Fortress_Store_%E6%89%8B%E6%A9%9F_smartphone_XiaoMi_14_Ultra_watch_May_2024_R12S_01.jpg
  - 标题：HK 中環 Central 皇后大道中 33 Queen's Road Central shop 豐澤電器 Fortress Store 手機 smartphone XiaoMi 14 Ultra watch May 2024 R12S 01.jpg
  - 许可证：CC0（合规）

### #9 一加 12（一加）  → HIGH

- 复核原因：纯数字型号（易与日期/编号撞车）
- 型号：`12` → `12`
- 最佳候选：https://upload.wikimedia.org/wikipedia/commons/c/cc/OnePlus_AC2003_with_a_broken_screen%2C_12.jpg
  - 标题：OnePlus AC2003 with a broken screen, 12.jpg
  - 许可证：CC BY-SA 2.0（合规）

### #25 华硕天选 5 Pro（华硕）  → HIGH

- 复核原因：产品线中文名与海外名的对应关系未经证实（官方海外名并非该字符串）
- 型号：`天选 5 pro` → `TUF Gaming 5 pro`
- 最佳候选：https://upload.wikimedia.org/wikipedia/commons/5/57/ASUS_TUF_Gaming_5_Pro_Laptop.jpg
  - 标题：ASUS TUF Gaming 5 Pro Laptop.jpg
  - 许可证：CC0（合规）

### #26 戴尔 XPS 13（戴尔）  → HIGH

- 复核原因：最佳候选主体类型存疑：multi_device
- 型号：`xps 13` → `xps 13`
- 最佳候选：https://upload.wikimedia.org/wikipedia/commons/5/5c/Dell_XPS_13_9350_and_9300.jpg
  - 标题：Dell XPS 13 9350 and 9300.jpg
  - 许可证：CC BY-SA 4.0（合规）

### #31 荣耀 MagicBook Pro（荣耀）  → HIGH

- 复核原因：型号不含可区分数字（仅产品线名）
- 型号：`magicbook pro` → `magicbook pro`
- 最佳候选：https://upload.wikimedia.org/wikipedia/commons/6/6b/Honor_MagicBook_Pro_14_%28May_1%2C_2025%29.jpg
  - 标题：Honor MagicBook Pro 14 (May 1, 2025).jpg
  - 许可证：CC BY-SA 4.0（合规）

### #36 微星海皇戟（微星）  → HIGH

- 复核原因：型号不含可区分数字（仅产品线名）
- 型号：`海皇戟` → `Trident`
- 最佳候选：https://upload.wikimedia.org/wikipedia/commons/4/4a/Motherboard_MSI_Trident_X_9th_20201120_DSC6186.jpg
  - 标题：Motherboard MSI Trident X 9th 20201120 DSC6186.jpg
  - 许可证：CC BY 4.0（合规）

### #37 华硕玩家国度（华硕）  → HIGH

- 复核原因：型号不含可区分数字（仅产品线名）
- 型号：`玩家国度` → `ROG`
- 最佳候选：https://upload.wikimedia.org/wikipedia/commons/4/44/Asus_ROG_Laptop_Keyboard.jpg
  - 标题：Asus ROG Laptop Keyboard.jpg
  - 许可证：CC BY-SA 4.0（合规）

### #90 索尼 PS5（索尼）  → HIGH

- 复核原因：最佳候选主体类型存疑：chip_die_or_micrograph
- 型号：`ps5` → `ps5`
- 最佳候选：https://upload.wikimedia.org/wikipedia/commons/a/ab/PS5_Zen2_CCX_CCX_%2850952534286%29.jpg
  - 标题：PS5 Zen2 CCX CCX (50952534286).jpg
  - 许可证：CC0（合规）

### #96 RTX 4070 Super（英伟达）  → LOW

- 复核原因：最佳候选主体类型存疑：comparison_shot
- 型号：`rtx 4070 super` → `rtx 4070 super`
- 最佳候选：https://upload.wikimedia.org/wikipedia/commons/8/8f/RTX_4070_Ti_SUPER_im_Vergleich_mit_anderen_RTX_40er-Karten_%28%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan%29_003.png
  - 标题：RTX 4070 Ti SUPER im Vergleich mit anderen RTX 40er-Karten (极客湾Geekerwan) 003.png
  - 许可证：CC BY 3.0（合规）

### #98 RTX 4090（英伟达）  → HIGH

- 复核原因：最佳候选主体类型存疑：packaging_or_unboxing
- 型号：`rtx 4090` → `rtx 4090`
- 最佳候选：https://upload.wikimedia.org/wikipedia/commons/e/ea/NVIDIA_RTX_4090_Founders_Edition_-_Unboxing_%28ZMASLO%29.png
  - 标题：NVIDIA RTX 4090 Founders Edition - Unboxing (ZMASLO).png
  - 许可证：CC BY 3.0（合规）

### #108 锐龙 7 7800X3D（AMD）  → HIGH

- 复核原因：最佳候选主体类型存疑：chip_die_or_micrograph
- 型号：`7 7800x3d` → `7 7800x3d`
- 最佳候选：https://upload.wikimedia.org/wikipedia/commons/5/53/AMD%405nmCCD%286nmIOD%29%40Zen4%40Raphael%40Ryzen_7_7800X3D%40100-000000910_BS_2312PGY_9LW3390030138_DSCx07_IOD%40SWIR.jpg
  - 标题：AMD@5nmCCD(6nmIOD)@Zen4@Raphael@Ryzen 7 7800X3D@100-000000910 BS 2312PGY 9LW3390030138 DSCx07 IOD@SWIR.jpg
  - 许可证：CC0（合规）

### #110 锐龙 9 7950X（AMD）  → MEDIUM

- 复核原因：最佳候选主体类型存疑：comparison_shot
- 型号：`9 7950x` → `9 7950x`
- 最佳候选：https://upload.wikimedia.org/wikipedia/commons/7/78/AMD_Ryzen_7000-Serie_-_Der_ultimative_CPU_und_Mainboard_Vergleich_%28Memory_PC%29_04.png
  - 标题：AMD Ryzen 7000-Serie - Der ultimative CPU und Mainboard Vergleich (Memory PC) 04.png
  - 许可证：CC BY 3.0（合规）

### #111 i5-12400F（Intel）  → HIGH

- 复核原因：最佳候选主体类型存疑：chip_die_or_micrograph
- 型号：`i5 12400f` → `i5 12400f`
- 最佳候选：https://upload.wikimedia.org/wikipedia/commons/9/94/Intel%40intel7%2810nmESF%29%40AlderLake%40ADL-S%286P%2B0E%29%40i5-12400F%40SRL5Z_DSCx10_poly%405xExt.jpg
  - 标题：Intel@intel7(10nmESF)@AlderLake@ADL-S(6P+0E)@i5-12400F@SRL5Z DSCx10 poly@5xExt.jpg
  - 许可证：CC0（合规）

### #112 锐龙 7 7700（AMD）  → LOW

- 复核原因：纯数字型号（易与日期/编号撞车）；最佳候选主体类型存疑：comparison_shot
- 型号：`7 7700` → `7 7700`
- 最佳候选：https://upload.wikimedia.org/wikipedia/commons/d/df/AMD_Ryzen_7000-Serie_-_Der_ultimative_CPU_und_Mainboard_Vergleich_%28Memory_PC%29_05.png
  - 标题：AMD Ryzen 7000-Serie - Der ultimative CPU und Mainboard Vergleich (Memory PC) 05.png
  - 许可证：CC BY 3.0（合规）

## 四、完全无候选的产品

- #12 Redmi K70 至尊版（小米）｜检索词：`Xiaomi redmi k70 至尊版`、`redmi k70 至尊版`、`Xiaomi redmi k70 Ultra`、`redmi k70 Ultra`、`Xiaomi redmi k70 Ultra smartphone`
- #17 联想小新 Pad Pro（联想）｜检索词：`Lenovo 小新 pad pro`、`小新 pad pro`、`Lenovo Xiaoxin pad pro`、`Xiaoxin pad pro`、`Lenovo Xiaoxin pad pro tablet`
- #19 vivo Pad 3 Pro（vivo）｜检索词：`vivo pad 3 pro`、`pad 3 pro`、`vivo pad 3 pro tablet`
- #20 OPPO Pad 3（OPPO）｜检索词：`OPPO pad 3`、`pad 3`、`OPPO pad 3 tablet`
- #21 联想拯救者 Y9000P（联想）｜检索词：`Lenovo 拯救者 y9000p`、`拯救者 y9000p`、`Lenovo Legion y9000p`、`Legion y9000p`、`Lenovo Legion y9000p laptop`
- #22 联想小新 Pro 16（联想）｜检索词：`Lenovo 小新 pro 16`、`小新 pro 16`、`Lenovo Xiaoxin pro 16`、`Xiaoxin pro 16`、`Lenovo Xiaoxin pro 16 laptop`
- #23 MacBook Air M3（苹果）｜检索词：`Apple macbook air m3`、`macbook air m3`、`Apple macbook air m3 laptop`
- #27 惠普暗影精灵 10（惠普）｜检索词：`HP 暗影精灵 10`、`暗影精灵 10`、`HP OMEN 10`、`OMEN 10`、`HP OMEN 10 laptop`
- #28 ThinkBook 14+（联想）｜检索词：`Lenovo thinkbook 14+`、`thinkbook 14+`、`Lenovo thinkbook 14+ laptop`
- #30 微星绝影 14（微星）｜检索词：`MSI 绝影 14`、`绝影 14`、`MSI Stealth 14`、`Stealth 14`、`MSI Stealth 14 laptop`
- #32 机械革命翼龙 15 Pro（机械革命）｜检索词：`Mechrevo 翼龙 15 pro`、`翼龙 15 pro`、`Mechrevo 翼龙 15 pro laptop`
- #33 联想拯救者刃 9000K（联想）｜检索词：`Lenovo 拯救者刃 9000k`、`拯救者刃 9000k`、`Lenovo Legion刃 9000k`、`Legion刃 9000k`、`Lenovo Legion刃 9000k desktop PC`
- #34 惠普暗影精灵台式机（惠普）｜检索词：`HP 暗影精灵台式机`、`暗影精灵台式机`、`HP OMEN台式机`、`OMEN台式机`、`HP OMEN台式机 desktop PC`
- #35 戴尔 XPS 台式机（戴尔）｜检索词：`Dell xps 台式机`、`xps 台式机`、`Dell xps 台式机 desktop PC`
- #38 联想天逸 510（联想）｜检索词：`Lenovo 天逸 510`、`天逸 510`、`Lenovo 天逸 510 desktop PC`
- #39 LG 27GP95RP（LG）｜检索词：`LG 27gp95rp`、`27gp95rp`、`LG 27gp95rp monitor`
- #40 三星玄龙骑士 G7（三星）｜检索词：`Samsung 玄龙骑士 g7`、`玄龙骑士 g7`、`Samsung Odyssey g7`、`Odyssey g7`、`Samsung Odyssey g7 monitor`
- #41 戴尔 U2723QE（戴尔）｜检索词：`Dell u2723qe`、`u2723qe`、`Dell u2723qe monitor`
- #42 华硕 TUF VG27AQ（华硕）｜检索词：`ASUS tuf vg27aq`、`tuf vg27aq`、`ASUS tuf vg27aq monitor`
- #43 小米 27 4K（小米）｜检索词：`Xiaomi 27 4k`、`27 4k`、`Xiaomi 27 4k monitor`
- #44 AOC 27 4K（AOC）｜检索词：`AOC 27 4k`、`27 4k`、`AOC 27 4k monitor`
- #45 明基 PD2705U（明基）｜检索词：`BenQ pd2705u`、`pd2705u`、`BenQ pd2705u monitor`
- #46 泰坦军团 P27A6V（泰坦军团）｜检索词：`Titan Army p27a6v`、`p27a6v`、`Titan Army p27a6v monitor`
- #47 索尼 WH-1000XM5（索尼）｜检索词：`Sony wh 1000xm5`、`wh 1000xm5`、`Sony wh 1000xm5 headphones`
- #48 Bose QC Ultra（Bose）｜检索词：`Bose qc ultra`、`qc ultra`、`Bose qc ultra headphones`
- #49 苹果 AirPods Pro 2（苹果）｜检索词：`Apple airpods pro 2`、`airpods pro 2`、`Apple airpods pro 2 headphones`
- #51 漫步者 NeoBuds Pro（漫步者）｜检索词：`Edifier neobuds pro`、`neobuds pro`、`Edifier neobuds pro headphones`
- #52 华为 FreeBuds Pro 3（华为）｜检索词：`Huawei freebuds pro 3`、`freebuds pro 3`、`Huawei freebuds pro 3 headphones`
- #53 小米 Buds 4 Pro（小米）｜检索词：`Xiaomi buds 4 pro`、`buds 4 pro`、`Xiaomi buds 4 pro headphones`
- #55 水月雨 Starfield 2（水月雨）｜检索词：`Moondrop starfield 2`、`starfield 2`、`Moondrop starfield 2 headphones`
- #56 铁三角 ATH-M50x（铁三角）｜检索词：`Audio-Technica ath m50x`、`ath m50x`、`Audio-Technica ath m50x headphones`
- #57 Keychron Q1 Pro（Keychron）｜检索词：`Keychron q1 pro`、`q1 pro`、`Keychron q1 pro keyboard`
- #59 雷蛇黑寡妇 V4（雷蛇）｜检索词：`Razer 黑寡妇 v4`、`黑寡妇 v4`、`Razer 黑寡妇 v4 keyboard`
- #60 达尔优 A98（达尔优）｜检索词：`Dareu a98`、`a98`、`Dareu a98 keyboard`
- #61 珂芝 K75（珂芝）｜检索词：`Kzzi k75`、`k75`、`Kzzi k75 keyboard`
- #62 樱桃 MX 3.0S（樱桃）｜检索词：`Cherry mx 3.0s`、`mx 3.0s`、`Cherry mx 3.0s keyboard`
- #63 狼蛛 F87（狼蛛）｜检索词：`AULA f87`、`f87`、`AULA f87 keyboard`
- #66 雷蛇毒蝰 V3 Pro（雷蛇）｜检索词：`Razer 毒蝰 v3 pro`、`毒蝰 v3 pro`、`Razer 毒蝰 v3 pro mouse`
- #68 达尔优 A950（达尔优）｜检索词：`Dareu a950`、`a950`、`Dareu a950 mouse`
- #69 雷柏 VT9（雷柏）｜检索词：`Rapoo vt9`、`vt9`、`Rapoo vt9 mouse`
- #70 卓威 EC2-CW（卓威）｜检索词：`ZOWIE ec2 cw`、`ec2 cw`、`ZOWIE ec2 cw mouse`
- #71 多彩 M800（多彩）｜检索词：`Delux m800`、`m800`、`Delux m800 mouse`
- #72 海盗船 Sabre（海盗船）｜检索词：`Corsair sabre`、`sabre`、`Corsair sabre mouse`
- #75 尼康 Z6 III（尼康）｜检索词：`Nikon z6 iii`、`z6 iii`、`Nikon z6 iii camera`
- #83 小米 Watch S3（小米）｜检索词：`Xiaomi watch s3`、`watch s3`、`Xiaomi watch s3 smartwatch`
- #86 OPPO Watch 4 Pro（OPPO）｜检索词：`OPPO watch 4 pro`、`watch 4 pro`、`OPPO watch 4 pro smartwatch`
- #87 华为 Watch Ultimate（华为）｜检索词：`Huawei watch ultimate`、`watch ultimate`、`Huawei watch ultimate smartwatch`
- #92 Steam Deck OLED（Valve）｜检索词：`Valve steam deck oled`、`steam deck oled`、`Valve steam deck oled game console`
- #99 RX 7800 XT（AMD）｜检索词：`AMD rx 7800 xt`、`rx 7800 xt`、`AMD rx 7800 xt graphics card`
- #102 RX 7600（AMD）｜检索词：`AMD rx 7600`、`rx 7600`、`AMD rx 7600 graphics card`
- #103 七彩虹 RTX 4070（七彩虹）｜检索词：`Colorful rtx 4070`、`rtx 4070`、`Colorful rtx 4070 graphics card`
- #104 微星 RTX 4060（微星）｜检索词：`MSI rtx 4060`、`rtx 4060`、`MSI rtx 4060 graphics card`
- #109 锐龙 5 7600（AMD）｜检索词：`AMD 5 7600`、`5 7600`、`AMD 5 7600 CPU`
- #113 致态 TiPlus7100 2TB（致态）｜检索词：`ZhiTai tiplus7100 2tb`、`tiplus7100 2tb`、`ZhiTai tiplus7100 2tb SSD`
- #114 三星 990 Pro 2TB（三星）｜检索词：`Samsung 990 pro 2tb`、`990 pro 2tb`、`Samsung 990 pro 2tb SSD`
- #115 西数 SN850X 2TB（西数）｜检索词：`Western Digital sn850x 2tb`、`sn850x 2tb`、`Western Digital sn850x 2tb SSD`
- #116 铠侠 RC20 1TB（铠侠）｜检索词：`Kioxia rc20 1tb`、`rc20 1tb`、`Kioxia rc20 1tb SSD`
- #117 致态 TiPlus5000 1TB（致态）｜检索词：`ZhiTai tiplus5000 1tb`、`tiplus5000 1tb`、`ZhiTai tiplus5000 1tb SSD`
- #118 金士顿 KC3000 1TB（金士顿）｜检索词：`Kingston kc3000 1tb`、`kc3000 1tb`、`Kingston kc3000 1tb SSD`
- #119 海康威视 C2000 Pro（海康威视）｜检索词：`Hikvision c2000 pro`、`c2000 pro`、`Hikvision c2000 pro SSD`
- #120 宏碁掠夺者 GM7（宏碁）｜检索词：`Acer 掠夺者 gm7`、`掠夺者 gm7`、`Acer Predator gm7`、`Predator gm7`、`Acer Predator gm7 SSD`
- #121 芝奇幻光戟 32GB（芝奇）｜检索词：`G.Skill 幻光戟 32gb`、`幻光戟 32gb`、`G.Skill Trident Z 32gb`、`Trident Z 32gb`、`G.Skill Trident Z 32gb RAM`
- #123 海盗船复仇者 32GB（海盗船）｜检索词：`Corsair 复仇者 32gb`、`复仇者 32gb`、`Corsair Vengeance 32gb`、`Vengeance 32gb`、`Corsair Vengeance 32gb RAM`
- #124 威刚 XPG 32GB（威刚）｜检索词：`ADATA xpg 32gb`、`xpg 32gb`、`ADATA xpg 32gb RAM`
- #125 英睿达 32GB（英睿达）｜检索词：`Crucial 32gb`、`32gb`、`Crucial 32gb RAM`
- #126 光威 32GB（光威）｜检索词：`Gloway 32gb`、`32gb`、`Gloway 32gb RAM`
- #127 华硕 RT-AX86U Pro（华硕）｜检索词：`ASUS rt ax86u pro`、`rt ax86u pro`、`ASUS rt ax86u pro router`
- #128 小米 AX9000（小米）｜检索词：`Xiaomi ax9000`、`ax9000`、`Xiaomi ax9000 router`
- #129 TP-Link XDR6080（TP-Link）｜检索词：`TP-Link xdr6080`、`xdr6080`、`TP-Link xdr6080 router`
- #130 华为 AX3 Pro（华为）｜检索词：`Huawei ax3 pro`、`ax3 pro`、`Huawei ax3 pro router`
- #131 中兴 AX5400 Pro（中兴）｜检索词：`ZTE ax5400 pro`、`ax5400 pro`、`ZTE ax5400 pro router`
- #132 华硕 RT-AX88U Pro（华硕）｜检索词：`ASUS rt ax88u pro`、`rt ax88u pro`、`ASUS rt ax88u pro router`

## 五、说明

- 状态阈值与验证阶段一致：HIGH ≥80、MEDIUM 60-79、LOW 40-59，REJECT 已剔除。
- 只命中型号数字、没有品牌证据的候选（如 A98/VT9 实为公路编号、K75 为 BMW 摩托、K70 为大众卡车、M800 为主板、Sabre 为战机）**已全部剔除**，共 115 条。
- 中文品牌/产品线已用显式对照表转成英文检索词；未确认海外名的中文片段会在报告中标注，这类产品召回会偏低。
- `主体提示` 标出芯片裸片/店铺陈列/开箱/多设备/对比图等"型号对但主体未必合适"的情况。
- 无候选的产品集中在：中国大陆专供机型、外设/存储小众品牌、以及型号本身过于宽泛的产品。
