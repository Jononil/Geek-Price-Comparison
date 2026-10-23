-- ============================================================
-- 极客比价 - 基础数据（角色/权限/分类/品牌/平台/标签/算法配置）
-- 说明：默认账号（admin/editor/user）由后端 DataInitializer 用 BCrypt 动态创建
-- ============================================================

USE geek_price;

-- ---------- 角色 ----------
INSERT INTO roles (id, name, code, description) VALUES
(1, '普通用户', 'USER', '浏览、搜索、对比、收藏、评价'),
(2, '编辑', 'EDITOR', '管理专业测评'),
(3, '管理员', 'ADMIN', '系统全部管理权限');

-- ---------- 权限 ----------
INSERT INTO permissions (id, name, code, description) VALUES
(1, '产品管理', 'product:manage', '产品的增删改查、上下架'),
(2, '分类管理', 'category:manage', '分类的增删改查'),
(3, '品牌管理', 'brand:manage', '品牌的增删改查'),
(4, '平台管理', 'platform:manage', '平台的增删改查'),
(5, '价格管理', 'price:manage', '价格录入与更新'),
(6, '测评管理', 'review:manage', '专业测评的发布与管理'),
(7, '评论管理', 'comment:manage', '用户评价的审核与删除'),
(8, '用户管理', 'user:manage', '用户的查询、禁用、角色分配'),
(9, '推荐管理', 'recommend:manage', '推荐内容与权重管理'),
(10, '算法参数', 'algorithm:manage', '性价比算法权重配置'),
(11, '数据统计', 'dashboard:view', '查看数据看板');

-- ---------- 角色-权限关联 ----------
-- 管理员拥有全部权限
INSERT INTO role_permissions (role_id, permission_id) VALUES
(3,1),(3,2),(3,3),(3,4),(3,5),(3,6),(3,7),(3,8),(3,9),(3,10),(3,11);
-- 编辑仅拥有测评管理
INSERT INTO role_permissions (role_id, permission_id) VALUES (2,6);

-- ---------- 分类（16 个顶级分类） ----------
INSERT INTO categories (id, name, icon, parent_id, sort, status) VALUES
(1, '手机', 'Smartphone', 0, 1, 1),
(2, '平板电脑', 'Iphone', 0, 2, 1),
(3, '笔记本电脑', 'Monitor', 0, 3, 1),
(4, '台式电脑', 'Cpu', 0, 4, 1),
(5, '显示器', 'Monitor', 0, 5, 1),
(6, '耳机', 'Headset', 0, 6, 1),
(7, '键盘', 'Keycap', 0, 7, 1),
(8, '鼠标', 'Mouse', 0, 8, 1),
(9, '相机', 'Camera', 0, 9, 1),
(10, '智能手表', 'Watch', 0, 10, 1),
(11, '游戏机', 'Gamepad', 0, 11, 1),
(12, '显卡', 'Cpu', 0, 12, 1),
(13, 'CPU', 'Cpu', 0, 13, 1),
(14, '固态硬盘', 'Files', 0, 14, 1),
(15, '内存', 'Files', 0, 15, 1),
(16, '路由器', 'Share', 0, 16, 1);

-- ---------- 品牌 ----------
INSERT INTO brands (id, name, logo, description, status) VALUES
(1, '苹果', NULL, 'Apple Inc.，全球领先的消费电子品牌', 1),
(2, '华为', NULL, '华为技术有限公司，通信与智能终端', 1),
(3, '小米', NULL, '小米科技，高性价比智能生态', 1),
(4, 'OPPO', NULL, 'OPPO 广东移动通信', 1),
(5, 'vivo', NULL, '维沃移动通信', 1),
(6, '荣耀', NULL, '荣耀终端', 1),
(7, '三星', NULL, 'Samsung，韩国消费电子巨头', 1),
(8, '一加', NULL, 'OnePlus，旗舰性能品牌', 1),
(9, '联想', NULL, '联想集团，PC 龙头', 1),
(10, '华硕', NULL, 'ASUS，PC 与硬件品牌', 1),
(11, '戴尔', NULL, 'Dell，PC 与工作站', 1),
(12, '惠普', NULL, 'HP，PC 与打印', 1),
(13, '索尼', NULL, 'Sony，影音与影像', 1),
(14, 'Bose', NULL, 'Bose，降噪音频', 1),
(15, '森海塞尔', NULL, 'Sennheiser，专业音频', 1),
(16, '罗技', NULL, 'Logitech，外设品牌', 1),
(17, '雷蛇', NULL, 'Razer，电竞外设', 1),
(18, '英伟达', NULL, 'NVIDIA，GPU 领导者', 1),
(19, 'AMD', NULL, 'AMD，CPU/GPU 品牌', 1),
(20, 'Intel', NULL, '英特尔，CPU 品牌', 1),
(21, '微星', NULL, 'MSI，电竞硬件', 1),
(22, '七彩虹', NULL, 'Colorful，显卡品牌', 1),
(23, '致态', NULL, '长江存储旗下存储品牌', 1),
(24, '漫步者', NULL, 'Edifier，音频品牌', 1),
(25, '大疆', NULL, 'DJI，无人机与影像', 1),
(26, '佳能', NULL, 'Canon，影像品牌', 1),
(27, '尼康', NULL, 'Nikon，影像品牌', 1),
(28, '任天堂', NULL, 'Nintendo，游戏机品牌', 1);

-- ---------- 平台 ----------
INSERT INTO platforms (id, name, code, status) VALUES
(1, '京东', 'jd', 1),
(2, '淘宝', 'taobao', 1),
(3, '拼多多', 'pdd', 1),
(4, '苏宁易购', 'suning', 1),
(5, '抖音商城', 'douyin', 1);

-- ---------- 标签 ----------
INSERT INTO tags (id, name, type) VALUES
(1, '高性价比', 'value'),
(2, '降价', 'discount'),
(3, '热门', 'hot'),
(4, '编辑推荐', 'recommend'),
(5, '新品', 'new'),
(6, '旗舰', 'flagship'),
(7, '入门', 'entry'),
(8, '学生党推荐', 'student'),
(9, '史低', 'lowest');

-- ---------- 算法参数配置（全局默认权重） ----------
-- 性能 30% + 功能 20% + 用户评分 20% + 价格优势 30% = 100%
INSERT INTO algorithm_configs (id, category_id, performance_weight, function_weight, user_rating_weight, price_weight, heat_weight) VALUES
(1, 0, 0.30, 0.20, 0.20, 0.30, 0.00);
