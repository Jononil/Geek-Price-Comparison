// 初始化数据生成脚本：生成 130+ 产品的完整 SQL
// 运行：node generate-data.js
const fs = require('fs');

// 品牌名 → id（base-data 28 个 + 补充 32 个）
const brands = {
  '苹果': 1, '华为': 2, '小米': 3, 'OPPO': 4, 'vivo': 5, '荣耀': 6, '三星': 7, '一加': 8,
  '联想': 9, '华硕': 10, '戴尔': 11, '惠普': 12, '索尼': 13, 'Bose': 14, '森海塞尔': 15,
  '罗技': 16, '雷蛇': 17, '英伟达': 18, 'AMD': 19, 'Intel': 20, '微星': 21, '七彩虹': 22,
  '致态': 23, '漫步者': 24, '大疆': 25, '佳能': 26, '尼康': 27, '任天堂': 28,
  'LG': 29, 'AOC': 30, 'Keychron': 31, 'TP-Link': 32, '西数': 33, '铠侠': 34, '金士顿': 35,
  '芝奇': 36, '海盗船': 37, '威刚': 38, '英睿达': 39, '光威': 40, '明基': 41, '泰坦军团': 42,
  '水月雨': 43, '铁三角': 44, '樱桃': 45, '狼蛛': 46, '卓威': 47, '多彩': 48, '松下': 49,
  '佳明': 50, '微软': 51, '机械革命': 52, '宏碁': 53, '海康威视': 54, '中兴': 55,
  '达尔优': 56, '珂芝': 57, '雷柏': 58, '富士': 59, 'Valve': 60
};

// 补充品牌（id >= 29）
const extraBrands = [
  [29, 'LG'], [30, 'AOC'], [31, 'Keychron'], [32, 'TP-Link'], [33, '西数'], [34, '铠侠'],
  [35, '金士顿'], [36, '芝奇'], [37, '海盗船'], [38, '威刚'], [39, '英睿达'], [40, '光威'],
  [41, '明基'], [42, '泰坦军团'], [43, '水月雨'], [44, '铁三角'], [45, '樱桃'], [46, '狼蛛'],
  [47, '卓威'], [48, '多彩'], [49, '松下'], [50, '佳明'], [51, '微软'], [52, '机械革命'],
  [53, '宏碁'], [54, '海康威视'], [55, '中兴'], [56, '达尔优'], [57, '珂芝'], [58, '雷柏'],
  [59, '富士'], [60, 'Valve']
];

// 分类 id → [分类名, 参数模板数组 [label, 值列表]]
const specTemplates = {
  1: ['手机', [['处理器', ['A18 Pro芯片', '骁龙8 Gen3', '天玑9300+', 'A16芯片']], ['屏幕', ['6.7英寸 OLED', '6.1英寸 OLED', '6.78英寸 2K LTPO']], ['运行内存', ['8GB', '12GB', '16GB']], ['存储', ['128GB', '256GB', '512GB']], ['电池', ['4000mAh', '5000mAh', '5500mAh']], ['摄像头', ['4800万三摄', '5000万三摄', '2亿像素主摄']]]],
  2: ['平板电脑', [['处理器', ['M4芯片', 'M2芯片', '骁龙8 Gen2']], ['屏幕', ['11英寸', '12.9英寸', '14英寸 2.8K']], ['内存', ['8GB', '12GB', '16GB']], ['存储', ['128GB', '256GB', '512GB']], ['电池', ['8000mAh', '10000mAh', '12000mAh']]]],
  3: ['笔记本电脑', [['CPU', ['i9-14900HX', 'Ultra 5 125H', 'M3芯片', 'R7-8845H']], ['GPU', ['RTX 4060', 'RTX 4070', '集成显卡']], ['内存', ['16GB', '32GB']], ['硬盘', ['512GB SSD', '1TB SSD']], ['屏幕', ['2.5K 120Hz', '3K 120Hz', '2.8K OLED']], ['重量', ['1.3kg', '1.8kg', '2.4kg']]]],
  4: ['台式电脑', [['CPU', ['i7-14700K', 'i9-14900K', 'R7-7800X3D']], ['GPU', ['RTX 4070', 'RTX 4080', 'RTX 4090']], ['内存', ['16GB', '32GB']], ['硬盘', ['1TB SSD', '2TB SSD']]]],
  5: ['显示器', [['尺寸', ['27英寸', '32英寸']], ['分辨率', ['2K', '4K']], ['刷新率', ['144Hz', '160Hz', '240Hz']], ['面板', ['Fast IPS', 'Nano IPS', 'MiniLED']]]],
  6: ['耳机', [['类型', ['头戴式', '入耳式', '真无线']], ['降噪', ['主动降噪', '自适应降噪']], ['续航', ['20小时', '30小时', '40小时']], ['连接', ['蓝牙5.3', 'LDAC', '有线']]]],
  7: ['键盘', [['结构', ['Gasket', 'Top结构']], ['轴体', ['红轴', '茶轴', '青轴']], ['连接', ['三模', '有线', '蓝牙']], ['配列', ['87键', '98键', '104键']]]],
  8: ['鼠标', [['传感器', ['HERO 2', 'PAW3395', 'Focus Pro']], ['重量', ['49g', '60g', '80g']], ['连接', ['无线', '有线', '三模']], ['DPI', ['26000', '30000']]]],
  9: ['相机', [['传感器', ['全画幅', 'APS-C', '一英寸']], ['像素', ['2400万', '3300万', '5000万']], ['视频', ['4K 60fps', '4K 120fps', '8K']], ['防抖', ['五轴防抖', '电子防抖']]]],
  10: ['智能手表', [['屏幕', ['1.43英寸 AMOLED', '1.5英寸']], ['续航', ['7天', '14天', '30天']], ['功能', ['心率监测', '血氧监测', 'GPS']], ['防水', ['5ATM', 'IP68']]]],
  11: ['游戏机', [['类型', ['掌机', '主机']], ['存储', ['256GB', '512GB', '1TB']], ['分辨率', ['1080P', '4K']], ['特性', ['便携', '体感', '云游戏']]]],
  12: ['显卡', [['核心', ['AD104', 'AD103', 'Navi 32']], ['显存', ['12GB', '16GB', '24GB']], ['架构', ['Ada Lovelace', 'RDNA3']], ['接口', ['PCIe 4.0 x16']]]],
  13: ['CPU', [['核心', ['8核16线程', '16核24线程', '8核']], ['频率', ['4.6GHz', '5.0GHz', '5.7GHz']], ['制程', ['7nm', '5nm', '4nm']], ['缓存', ['32MB', '36MB', '96MB']]]],
  14: ['固态硬盘', [['容量', ['1TB', '2TB', '4TB']], ['接口', ['PCIe 4.0', 'PCIe 5.0']], ['读取', ['7000MB/s', '7400MB/s']], ['颗粒', ['TLC', 'QLC']]]],
  15: ['内存', [['容量', ['16GB', '32GB', '64GB']], ['频率', ['5600MHz', '6000MHz', '6400MHz']], ['类型', ['DDR5', 'DDR4']], ['时序', ['C30', 'C36']]]],
  16: ['路由器', [['频段', ['双频', '三频']], ['速率', ['AX5400', 'AX6000', 'AX9000']], ['端口', ['2.5G网口', '千兆网口']], ['特性', ['Mesh组网', 'WiFi 6']]]]
};

// 产品数据：[名称, 品牌名, 分类id, 价格]
const products = [
  // 手机 (12)
  ['iPhone 16 Pro', '苹果', 1, 7199], ['iPhone 15', '苹果', 1, 4999], ['华为 Mate 60 Pro', '华为', 1, 6499],
  ['华为 Pura 70 Pro', '华为', 1, 5499], ['小米 14 Ultra', '小米', 1, 5799], ['小米 14', '小米', 1, 3999],
  ['OPPO Find X7 Ultra', 'OPPO', 1, 5999], ['vivo X100 Ultra', 'vivo', 1, 5499], ['一加 12', '一加', 1, 3799],
  ['荣耀 Magic 6 Pro', '荣耀', 1, 5299], ['三星 Galaxy S24', '三星', 1, 5499], ['Redmi K70 至尊版', '小米', 1, 2499],
  // 平板 (8)
  ['iPad Pro M4', '苹果', 2, 8999], ['iPad Air M2', '苹果', 2, 4799], ['华为 MatePad Pro', '华为', 2, 3999],
  ['小米平板 7 Pro', '小米', 2, 2799], ['联想小新 Pad Pro', '联想', 2, 1999], ['三星 Galaxy Tab S9', '三星', 2, 5499],
  ['vivo Pad 3 Pro', 'vivo', 2, 3299], ['OPPO Pad 3', 'OPPO', 2, 2599],
  // 笔记本 (12)
  ['联想拯救者 Y9000P', '联想', 3, 8899], ['联想小新 Pro 16', '联想', 3, 5499], ['MacBook Air M3', '苹果', 3, 7999],
  ['MacBook Pro 14', '苹果', 3, 14999], ['华硕天选 5 Pro', '华硕', 3, 6999], ['戴尔 XPS 13', '戴尔', 3, 9999],
  ['惠普暗影精灵 10', '惠普', 3, 7499], ['ThinkBook 14+', '联想', 3, 5699], ['华为 MateBook 14', '华为', 3, 6299],
  ['微星绝影 14', '微星', 3, 8999], ['荣耀 MagicBook Pro', '荣耀', 3, 4999], ['机械革命翼龙 15 Pro', '机械革命', 3, 6299],
  // 台式电脑 (6)
  ['联想拯救者刃 9000K', '联想', 4, 15999], ['惠普暗影精灵台式机', '惠普', 4, 8999], ['戴尔 XPS 台式机', '戴尔', 4, 12999],
  ['微星海皇戟', '微星', 4, 10999], ['华硕玩家国度', '华硕', 4, 13999], ['联想天逸 510', '联想', 4, 3999],
  // 显示器 (8)
  ['LG 27GP95RP', 'LG', 5, 2349], ['三星玄龙骑士 G7', '三星', 5, 3499], ['戴尔 U2723QE', '戴尔', 5, 3999],
  ['华硕 TUF VG27AQ', '华硕', 5, 1799], ['小米 27 4K', '小米', 5, 1899], ['AOC 27 4K', 'AOC', 5, 2199],
  ['明基 PD2705U', '明基', 5, 3699], ['泰坦军团 P27A6V', '泰坦军团', 5, 1599],
  // 耳机 (10)
  ['索尼 WH-1000XM5', '索尼', 6, 1899], ['Bose QC Ultra', 'Bose', 6, 2399], ['苹果 AirPods Pro 2', '苹果', 6, 1699],
  ['森海塞尔 Momentum 4', '森海塞尔', 6, 2199], ['漫步者 NeoBuds Pro', '漫步者', 6, 699], ['华为 FreeBuds Pro 3', '华为', 6, 1099],
  ['小米 Buds 4 Pro', '小米', 6, 899], ['三星 Galaxy Buds 2 Pro', '三星', 6, 999], ['水月雨 Starfield 2', '水月雨', 6, 399],
  ['铁三角 ATH-M50x', '铁三角', 6, 899],
  // 键盘 (8)
  ['Keychron Q1 Pro', 'Keychron', 7, 899], ['罗技 MX Keys', '罗技', 7, 699], ['雷蛇黑寡妇 V4', '雷蛇', 7, 999],
  ['达尔优 A98', '达尔优', 7, 399], ['珂芝 K75', '珂芝', 7, 299], ['樱桃 MX 3.0S', '樱桃', 7, 799],
  ['狼蛛 F87', '狼蛛', 7, 199], ['海盗船 K70', '海盗船', 7, 1099],
  // 鼠标 (8)
  ['罗技 G Pro X Superlight 2', '罗技', 8, 849], ['雷蛇毒蝰 V3 Pro', '雷蛇', 8, 999], ['罗技 MX Master 3S', '罗技', 8, 649],
  ['达尔优 A950', '达尔优', 8, 299], ['雷柏 VT9', '雷柏', 8, 199], ['卓威 EC2-CW', '卓威', 8, 999],
  ['多彩 M800', '多彩', 8, 149], ['海盗船 Sabre', '海盗船', 8, 549],
  // 相机 (8)
  ['索尼 A7 IV', '索尼', 9, 13999], ['佳能 R6 Mark II', '佳能', 9, 14999], ['尼康 Z6 III', '尼康', 9, 12999],
  ['富士 X-T5', '富士', 9, 9999], ['大疆 Pocket 3', '大疆', 9, 3499], ['索尼 ZV-E10', '索尼', 9, 4299],
  ['佳能 EOS R50', '佳能', 9, 4499], ['松下 S5 II', '松下', 9, 10999],
  // 智能手表 (8)
  ['苹果 Watch Series 9', '苹果', 10, 2999], ['华为 Watch GT 4', '华为', 10, 1299], ['小米 Watch S3', '小米', 10, 699],
  ['三星 Galaxy Watch 6', '三星', 10, 1799], ['佳明 Forerunner 265', '佳明', 10, 2399], ['OPPO Watch 4 Pro', 'OPPO', 10, 1999],
  ['华为 Watch Ultimate', '华为', 10, 4999], ['苹果 Watch Ultra 2', '苹果', 10, 5499],
  // 游戏机 (6)
  ['任天堂 Switch OLED', '任天堂', 11, 1999], ['索尼 PS5', '索尼', 11, 3899], ['微软 Xbox Series X', '微软', 11, 3499],
  ['Steam Deck OLED', 'Valve', 11, 3999], ['任天堂 Switch Lite', '任天堂', 11, 999], ['ROG Ally', '华硕', 11, 4999],
  // 显卡 (10)
  ['RTX 4070 Ti Super', '英伟达', 12, 5899], ['RTX 4070 Super', '英伟达', 12, 4599], ['RTX 4080 Super', '英伟达', 12, 7899],
  ['RTX 4090', '英伟达', 12, 13999], ['RX 7800 XT', 'AMD', 12, 3649], ['RX 7900 XTX', 'AMD', 12, 6999],
  ['RTX 4060 Ti', '英伟达', 12, 2999], ['RX 7600', 'AMD', 12, 1999], ['七彩虹 RTX 4070', '七彩虹', 12, 4399],
  ['微星 RTX 4060', '微星', 12, 2299],
  // CPU (8)
  ['i7-14700K', 'Intel', 13, 2899], ['i5-14600K', 'Intel', 13, 1899], ['i9-14900K', 'Intel', 13, 4199],
  ['锐龙 7 7800X3D', 'AMD', 13, 2499], ['锐龙 5 7600', 'AMD', 13, 1299], ['锐龙 9 7950X', 'AMD', 13, 3999],
  ['i5-12400F', 'Intel', 13, 899], ['锐龙 7 7700', 'AMD', 13, 1899],
  // 固态硬盘 (8)
  ['致态 TiPlus7100 2TB', '致态', 14, 879], ['三星 990 Pro 2TB', '三星', 14, 1399], ['西数 SN850X 2TB', '西数', 14, 1099],
  ['铠侠 RC20 1TB', '铠侠', 14, 399], ['致态 TiPlus5000 1TB', '致态', 14, 499], ['金士顿 KC3000 1TB', '金士顿', 14, 599],
  ['海康威视 C2000 Pro', '海康威视', 14, 449], ['宏碁掠夺者 GM7', '宏碁', 14, 549],
  // 内存 (6)
  ['芝奇幻光戟 32GB', '芝奇', 15, 799], ['金士顿骇客神条 32GB', '金士顿', 15, 649], ['海盗船复仇者 32GB', '海盗船', 15, 749],
  ['威刚 XPG 32GB', '威刚', 15, 599], ['英睿达 32GB', '英睿达', 15, 549], ['光威 32GB', '光威', 15, 449],
  // 路由器 (6)
  ['华硕 RT-AX86U Pro', '华硕', 16, 1299], ['小米 AX9000', '小米', 16, 999], ['TP-Link XDR6080', 'TP-Link', 16, 599],
  ['华为 AX3 Pro', '华为', 16, 299], ['中兴 AX5400 Pro', '中兴', 16, 449], ['华硕 RT-AX88U Pro', '华硕', 16, 1899]
];

// 平台
const platforms = [[1, '京东'], [2, '淘宝'], [3, '拼多多']];
// 标签（value/discount/hot/recommend）
const tags = { 1: '高性价比', 2: '降价', 3: '热门', 4: '编辑推荐', 5: '新品', 6: '旗舰', 7: '入门', 8: '学生党推荐', 9: '史低' };

function esc(s) { return s.replace(/'/g, "''"); }
function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

let sql = 'USE geek_price;\n\n';
// 补充品牌
sql += 'INSERT INTO brands (id, name, description, status) VALUES\n';
sql += extraBrands.map(([id, name]) => `(${id}, '${name}', NULL, 1)`).join(',\n') + ';\n\n';

// 产品 + 参数 + 图片 + 标签
const productSql = [];
const specSql = [];
const imageSql = [];
const tagSql = [];

products.forEach(([name, brandName, catId, basePrice], idx) => {
  const id = idx + 1;
  const brandId = brands[brandName];
  const valueScore = rnd(70, 96);
  const performanceScore = rnd(60, 98);
  const userRating = (rnd(40, 50) / 10).toFixed(1);
  const heat = rnd(500, 9800);
  const sales = rnd(100, 50000);
  const launchDate = `2024-${String(rnd(1, 12)).padStart(2, '0')}-${String(rnd(1, 28)).padStart(2, '0')}`;

  productSql.push(`(${id}, '${esc(name)}', ${brandId}, ${catId}, '${esc(name)}，${specTemplates[catId][0]}品类代表作，性价比突出，广受好评。', ${basePrice}, ${basePrice}, ${(rnd(80, 96) / 10).toFixed(1)}, ${valueScore}, ${performanceScore}, ${userRating}, ${sales}, ${heat}, '${launchDate}', 1, ${rnd(0, 1)}, ${rnd(0, 1)}, NOW(), NOW(), 0)`);

  // 参数
  const [catName, specs] = specTemplates[catId];
  specs.forEach(([label, values], si) => {
    specSql.push(`(${id}, '${label}', '${label}', '${esc(values[rnd(0, values.length - 1)])}', ${si})`);
  });

  // 图片（2 张占位图）
  imageSql.push(`(${id}, 'https://placehold.co/400x300/e5e7eb/9ca3af?text=${encodeURIComponent(name)}', 0)`);

  // 标签：性价比高的打高性价比，部分打热门/降价
  const t = [];
  if (valueScore >= 90) t.push(1);
  if (rnd(0, 2) === 0) t.push(3);
  if (rnd(0, 3) === 0) t.push(2);
  if (t.length === 0) t.push(4);
  t.forEach((tid) => tagSql.push(`(${id}, ${tid})`));
});

sql += 'INSERT INTO products (id, name, brand_id, category_id, description, official_price, current_price, score, value_score, performance_score, user_rating, sales, heat, launch_date, status, is_recommend, is_hot, created_at, updated_at, deleted) VALUES\n';
sql += productSql.join(',\n') + ';\n\n';

sql += 'INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort) VALUES\n';
sql += specSql.join(',\n') + ';\n\n';

sql += 'INSERT INTO product_images (product_id, url, sort) VALUES\n';
sql += imageSql.join(',\n') + ';\n\n';

sql += 'INSERT INTO product_tags (product_id, tag_id) VALUES\n';
sql += tagSql.join(',\n') + ';\n\n';

// 价格（每产品 3 平台）+ 历史价格（30 天）
const priceSql = [];
const historySql = [];
products.forEach(([name, brandName, catId, basePrice], idx) => {
  const id = idx + 1;
  platforms.forEach(([pid, pname]) => {
    const offset = pid === 3 ? -rnd(1, 8) : pid === 1 ? 0 : -rnd(0, 4); // 拼多多最便宜
    const price = Math.max(1, basePrice + Math.round(basePrice * offset / 100));
    const original = Math.round(basePrice * (1 + rnd(3, 15) / 100));
    priceSql.push(`(${id}, ${pid}, '${esc(name)}', 'https://example.com/item/${id}', ${price}, ${original}, ${original - price}, '${pname}官方旗舰店', ${pid === 1 ? 1 : 0}, 1, NOW(), 0)`);

    // 历史价格 30 条
    for (let d = 30; d >= 1; d--) {
      const histPrice = price + rnd(-Math.round(price * 0.05), Math.round(price * 0.1));
      historySql.push(`(${id}, ${pid}, ${Math.max(1, histPrice)}, DATE_SUB(CURDATE(), INTERVAL ${d} DAY), 'mock')`);
    }
  });
});

sql += 'INSERT INTO product_prices (product_id, platform_id, title, url, price, original_price, discount, shop_name, is_official, stock_status, updated_at, deleted) VALUES\n';
sql += priceSql.join(',\n') + ';\n\n';

sql += 'INSERT INTO price_history (product_id, platform_id, price, record_date, source) VALUES\n';
sql += historySql.join(',\n') + ';\n\n';

// 测评（每分类 2 篇）
const articleSql = [];
for (let catId = 1; catId <= 16; catId++) {
  const [catName] = specTemplates[catId];
  for (let a = 0; a < 2; a++) {
    const title = `${catName}${a === 0 ? '年度横评：谁才是性价比之王' : '深度实测：旗舰与入门该怎么选'}`;
    const author = a === 0 ? '极客实验室' : '硬件狂魔';
    articleSql.push(`('${esc(title)}', NULL, NULL, '${author}', '对多款${catName}进行了多维度实测，从性能、体验、价格三个角度给出购买建议。', '<p>本文对${catName}品类的主流产品进行了详细实测，涵盖性能跑分、实际体验、续航表现与价格对比，帮助消费者做出理性选择。</p>', ${(rnd(82, 96) / 10).toFixed(1)}, 9.2, 8.8, 8.9, 8.6, '整体表现均衡，值得推荐。', '性能出色；做工扎实；性价比高', '重量偏大；价格略高', ${rnd(1000, 50000)}, ${rnd(50, 2000)}, 1, NOW(), NOW(), NOW(), 0)`);
  }
}
sql += 'INSERT INTO review_articles (title, cover, product_id, author, summary, content, score, performance_score, appearance_score, screen_score, battery_score, experience, pros, cons, views, likes, status, publish_time, created_at, updated_at, deleted) VALUES\n';
sql += articleSql.join(',\n') + ';\n\n';

// 评价（每产品 3 条，用户 id 1-3）
const reviewSql = [];
const reviewContents = ['性价比很高，值得购买！', '做工不错，用了一周很满意。', '性能强劲，就是价格小贵。', '这个价位无敌了，强烈推荐。', '物流快，包装完好，体验好。'];
products.forEach(([name], idx) => {
  const id = idx + 1;
  for (let u = 1; u <= 3; u++) {
    reviewSql.push(`(${id}, ${u}, ${rnd(4, 5)}, '${reviewContents[rnd(0, reviewContents.length - 1)]}', ${rnd(0, 200)}, NOW(), NOW(), 0)`);
  }
});
sql += 'INSERT INTO reviews (product_id, user_id, star, content, like_count, created_at, updated_at, deleted) VALUES\n';
sql += reviewSql.join(',\n') + ';\n';

fs.writeFileSync('03-product-data.sql', sql);
console.log(`已生成 03-product-data.sql：${products.length} 个产品，${historySql.length} 条历史价格，${articleSql.length} 篇测评，${reviewSql.length} 条评价`);
