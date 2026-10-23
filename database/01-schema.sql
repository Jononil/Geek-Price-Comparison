-- ============================================================
-- 极客比价 - 数据库表结构
-- 数据库：geek_price
-- 字符集：utf8mb4，存储引擎：InnoDB
-- ============================================================

CREATE DATABASE IF NOT EXISTS geek_price DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE geek_price;

-- ============================================================
-- 一、RBAC 权限体系
-- ============================================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    username      VARCHAR(50)  NOT NULL COMMENT '用户名（登录用）',
    password      VARCHAR(100) NOT NULL COMMENT '密码（BCrypt 哈希）',
    nickname      VARCHAR(50)  DEFAULT NULL COMMENT '昵称',
    email         VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    phone         VARCHAR(20)  DEFAULT NULL COMMENT '手机号',
    avatar        VARCHAR(500) DEFAULT NULL COMMENT '头像 URL',
    status        TINYINT      NOT NULL DEFAULT 1 COMMENT '状态：1正常 0禁用',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted       TINYINT      NOT NULL DEFAULT 0 COMMENT '逻辑删除：0未删 1已删',
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username),
    UNIQUE KEY uk_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
    id          BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
    name        VARCHAR(50) NOT NULL COMMENT '角色名称',
    code        VARCHAR(50) NOT NULL COMMENT '角色编码',
    description VARCHAR(200) DEFAULT NULL COMMENT '角色描述',
    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 权限表
CREATE TABLE IF NOT EXISTS permissions (
    id          BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
    name        VARCHAR(50) NOT NULL COMMENT '权限名称',
    code        VARCHAR(100) NOT NULL COMMENT '权限编码',
    description VARCHAR(200) DEFAULT NULL COMMENT '权限描述',
    PRIMARY KEY (id),
    UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';

-- 用户-角色关联
CREATE TABLE IF NOT EXISTS user_roles (
    id      BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_role (user_id, role_id),
    KEY idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

-- 角色-权限关联
CREATE TABLE IF NOT EXISTS role_permissions (
    id            BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    role_id       BIGINT NOT NULL COMMENT '角色ID',
    permission_id BIGINT NOT NULL COMMENT '权限ID',
    PRIMARY KEY (id),
    UNIQUE KEY uk_role_permission (role_id, permission_id),
    KEY idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表';

-- ============================================================
-- 二、基础数据（分类 / 品牌 / 平台 / 标签）
-- ============================================================

-- 分类表（支持层级）
CREATE TABLE IF NOT EXISTS categories (
    id         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
    name       VARCHAR(50) NOT NULL COMMENT '分类名称',
    icon       VARCHAR(100) DEFAULT NULL COMMENT '图标',
    parent_id  BIGINT      NOT NULL DEFAULT 0 COMMENT '父分类ID，0为顶级',
    sort       INT         NOT NULL DEFAULT 0 COMMENT '排序值，越小越靠前',
    status     TINYINT     NOT NULL DEFAULT 1 COMMENT '状态：1启用 0禁用',
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted    TINYINT     NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (id),
    KEY idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品分类表';

-- 品牌表
CREATE TABLE IF NOT EXISTS brands (
    id          BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
    name        VARCHAR(100) NOT NULL COMMENT '品牌名称',
    logo        VARCHAR(500) DEFAULT NULL COMMENT '品牌 Logo',
    description VARCHAR(500) DEFAULT NULL COMMENT '品牌简介',
    status      TINYINT     NOT NULL DEFAULT 1 COMMENT '状态：1启用 0禁用',
    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted     TINYINT     NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='品牌表';

-- 平台表
CREATE TABLE IF NOT EXISTS platforms (
    id         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
    name       VARCHAR(50) NOT NULL COMMENT '平台名称',
    code       VARCHAR(50) NOT NULL COMMENT '平台编码',
    status     TINYINT     NOT NULL DEFAULT 1 COMMENT '状态：1启用 0禁用',
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='电商平台表';

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
    id         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
    name       VARCHAR(50) NOT NULL COMMENT '标签名称',
    type       VARCHAR(50) DEFAULT 'normal' COMMENT '标签类型：normal通用/discount降价/hot热门/recommend推荐',
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品标签表';

-- ============================================================
-- 三、产品体系
-- ============================================================

-- 产品表
CREATE TABLE IF NOT EXISTS products (
    id                BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键',
    name              VARCHAR(200)  NOT NULL COMMENT '产品名称',
    brand_id          BIGINT        DEFAULT NULL COMMENT '品牌ID',
    category_id       BIGINT        DEFAULT NULL COMMENT '分类ID',
    description       VARCHAR(1000) DEFAULT NULL COMMENT '产品简介',
    official_price    DECIMAL(12,2) DEFAULT NULL COMMENT '官方参考价格',
    current_price     DECIMAL(12,2) DEFAULT NULL COMMENT '当前参考价格（全网最低）',
    score             DECIMAL(5,1)  DEFAULT 0.0 COMMENT '综合评分（0-10）',
    value_score       INT           DEFAULT 0 COMMENT '性价比评分（0-100）',
    performance_score INT           DEFAULT 0 COMMENT '性能得分（0-100）',
    user_rating       DECIMAL(3,1)  DEFAULT 0.0 COMMENT '用户评分（0-5）',
    sales             INT           DEFAULT 0 COMMENT '销量/热度模拟值',
    heat              INT           DEFAULT 0 COMMENT '热度值',
    launch_date       DATE          DEFAULT NULL COMMENT '上市时间',
    status            TINYINT       NOT NULL DEFAULT 1 COMMENT '状态：1上架 0下架',
    is_recommend      TINYINT       NOT NULL DEFAULT 0 COMMENT '是否推荐：1是 0否',
    is_hot            TINYINT       NOT NULL DEFAULT 0 COMMENT '是否热门：1是 0否',
    created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted           TINYINT       NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (id),
    KEY idx_brand_id (brand_id),
    KEY idx_category_id (category_id),
    KEY idx_value_score (value_score),
    KEY idx_heat (heat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品表';

-- 产品参数表
CREATE TABLE IF NOT EXISTS product_specs (
    id         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    product_id BIGINT       NOT NULL COMMENT '产品ID',
    spec_key   VARCHAR(50)  NOT NULL COMMENT '参数键（如 cpu/screen/battery）',
    spec_label VARCHAR(50)  NOT NULL COMMENT '参数显示名（如 处理器/屏幕）',
    spec_value VARCHAR(500) NOT NULL COMMENT '参数值',
    sort       INT          NOT NULL DEFAULT 0 COMMENT '排序',
    PRIMARY KEY (id),
    KEY idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品参数表';

-- 产品图片表
CREATE TABLE IF NOT EXISTS product_images (
    id         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    product_id BIGINT       NOT NULL COMMENT '产品ID',
    url        VARCHAR(500) NOT NULL COMMENT '图片URL',
    sort       INT          NOT NULL DEFAULT 0 COMMENT '排序',
    PRIMARY KEY (id),
    KEY idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品图片表';

-- 产品-标签关联
CREATE TABLE IF NOT EXISTS product_tags (
    id         BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    product_id BIGINT NOT NULL COMMENT '产品ID',
    tag_id     BIGINT NOT NULL COMMENT '标签ID',
    PRIMARY KEY (id),
    UNIQUE KEY uk_product_tag (product_id, tag_id),
    KEY idx_tag_id (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品标签关联表';

-- ============================================================
-- 四、价格体系
-- ============================================================

-- 产品各平台当前价格
CREATE TABLE IF NOT EXISTS product_prices (
    id            BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键',
    product_id    BIGINT        NOT NULL COMMENT '产品ID',
    platform_id   BIGINT        NOT NULL COMMENT '平台ID',
    title         VARCHAR(200)  DEFAULT NULL COMMENT '商品标题',
    url           VARCHAR(500)  DEFAULT NULL COMMENT '商品链接',
    price         DECIMAL(12,2) NOT NULL COMMENT '当前价格',
    original_price DECIMAL(12,2) DEFAULT NULL COMMENT '原价',
    discount      DECIMAL(12,2) DEFAULT 0.00 COMMENT '优惠金额',
    shop_name     VARCHAR(100)  DEFAULT NULL COMMENT '店铺名称',
    is_official   TINYINT       NOT NULL DEFAULT 0 COMMENT '是否自营/官方：1是 0否',
    stock_status  TINYINT       NOT NULL DEFAULT 1 COMMENT '库存状态：1有货 0无货',
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted       TINYINT       NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (id),
    KEY idx_product_id (product_id),
    KEY idx_platform_id (platform_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品平台价格表';

-- 价格历史记录
CREATE TABLE IF NOT EXISTS price_history (
    id          BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键',
    product_id  BIGINT        NOT NULL COMMENT '产品ID',
    platform_id BIGINT        NOT NULL COMMENT '平台ID',
    price       DECIMAL(12,2) NOT NULL COMMENT '价格',
    record_date DATE          NOT NULL COMMENT '记录日期',
    source      VARCHAR(50)   DEFAULT 'manual' COMMENT '数据来源',
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_product_platform_date (product_id, platform_id, record_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='价格历史表';

-- ============================================================
-- 五、内容体系（测评 / 评价）
-- ============================================================

-- 专业测评表
CREATE TABLE IF NOT EXISTS review_articles (
    id                BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键',
    title             VARCHAR(200)  NOT NULL COMMENT '测评标题',
    cover             VARCHAR(500)  DEFAULT NULL COMMENT '封面图',
    product_id        BIGINT        DEFAULT NULL COMMENT '关联产品ID',
    author            VARCHAR(50)   NOT NULL COMMENT '作者',
    summary           VARCHAR(500)  DEFAULT NULL COMMENT '摘要',
    content           LONGTEXT      COMMENT '正文（富文本）',
    score             DECIMAL(4,1)  DEFAULT 0.0 COMMENT '综合评分',
    performance_score DECIMAL(4,1)  DEFAULT 0.0 COMMENT '性能评价',
    appearance_score  DECIMAL(4,1)  DEFAULT 0.0 COMMENT '外观评价',
    screen_score      DECIMAL(4,1)  DEFAULT 0.0 COMMENT '屏幕评价',
    battery_score     DECIMAL(4,1)  DEFAULT 0.0 COMMENT '续航评价',
    experience        VARCHAR(1000) DEFAULT NULL COMMENT '使用体验',
    pros              VARCHAR(1000) DEFAULT NULL COMMENT '优点',
    cons              VARCHAR(1000) DEFAULT NULL COMMENT '缺点',
    views             INT           NOT NULL DEFAULT 0 COMMENT '浏览量',
    likes             INT           NOT NULL DEFAULT 0 COMMENT '点赞数',
    status            TINYINT       NOT NULL DEFAULT 1 COMMENT '状态：1已发布 0下架/草稿',
    publish_time      DATETIME      DEFAULT NULL COMMENT '发布时间',
    created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted           TINYINT       NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (id),
    KEY idx_product_id (product_id),
    KEY idx_views (views)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='专业测评表';

-- 用户评价表
CREATE TABLE IF NOT EXISTS reviews (
    id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    product_id  BIGINT       NOT NULL COMMENT '产品ID',
    user_id     BIGINT       NOT NULL COMMENT '用户ID',
    star        TINYINT      NOT NULL DEFAULT 5 COMMENT '星级（1-5）',
    content     VARCHAR(1000) DEFAULT NULL COMMENT '评价内容',
    like_count  INT          NOT NULL DEFAULT 0 COMMENT '点赞数',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted     TINYINT      NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (id),
    KEY idx_product_id (product_id),
    KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户评价表';

-- 评价评论/回复表
CREATE TABLE IF NOT EXISTS review_comments (
    id         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    review_id  BIGINT       NOT NULL COMMENT '评价ID',
    user_id    BIGINT       NOT NULL COMMENT '用户ID',
    content    VARCHAR(500) NOT NULL COMMENT '评论内容',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    deleted    TINYINT      NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (id),
    KEY idx_review_id (review_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评价评论表';

-- 评价点赞表
CREATE TABLE IF NOT EXISTS review_likes (
    id         BIGINT   NOT NULL AUTO_INCREMENT COMMENT '主键',
    review_id  BIGINT   NOT NULL COMMENT '评价ID',
    user_id    BIGINT   NOT NULL COMMENT '用户ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_review_user (review_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评价点赞表';

-- ============================================================
-- 六、用户行为
-- ============================================================

-- 收藏表（target_type：1产品 2测评）
CREATE TABLE IF NOT EXISTS favorites (
    id          BIGINT   NOT NULL AUTO_INCREMENT COMMENT '主键',
    user_id     BIGINT   NOT NULL COMMENT '用户ID',
    target_type TINYINT  NOT NULL COMMENT '目标类型：1产品 2测评',
    target_id   BIGINT   NOT NULL COMMENT '目标ID',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_target (user_id, target_type, target_id),
    KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏表';

-- 浏览历史表
CREATE TABLE IF NOT EXISTS browse_history (
    id         BIGINT   NOT NULL AUTO_INCREMENT COMMENT '主键',
    user_id    BIGINT   NOT NULL COMMENT '用户ID',
    product_id BIGINT   NOT NULL COMMENT '产品ID',
    viewed_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '浏览时间',
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='浏览历史表';

-- 对比记录表
CREATE TABLE IF NOT EXISTS comparison_records (
    id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    user_id     BIGINT       NOT NULL COMMENT '用户ID',
    product_ids VARCHAR(500) NOT NULL COMMENT '对比产品ID列表（逗号分隔）',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对比记录表';

-- ============================================================
-- 七、推荐与算法配置
-- ============================================================

-- 推荐结果表
CREATE TABLE IF NOT EXISTS recommendations (
    id         BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键',
    user_id    BIGINT        NOT NULL COMMENT '用户ID',
    product_id BIGINT        NOT NULL COMMENT '推荐产品ID',
    score      DECIMAL(10,4) NOT NULL COMMENT '推荐分数',
    reason     VARCHAR(500)  DEFAULT NULL COMMENT '推荐理由',
    type       VARCHAR(50)   DEFAULT 'hybrid' COMMENT '推荐类型：hybrid混合/coldstart冷启动/hot热门/value高性价比',
    created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='推荐结果表';

-- 算法参数配置表（性价比评分各维度权重）
CREATE TABLE IF NOT EXISTS algorithm_configs (
    id                   BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    category_id          BIGINT       NOT NULL DEFAULT 0 COMMENT '分类ID，0为全局默认',
    performance_weight   DECIMAL(5,2) NOT NULL DEFAULT 0.30 COMMENT '性能权重',
    function_weight      DECIMAL(5,2) NOT NULL DEFAULT 0.20 COMMENT '功能权重',
    user_rating_weight   DECIMAL(5,2) NOT NULL DEFAULT 0.20 COMMENT '用户评分权重',
    price_weight         DECIMAL(5,2) NOT NULL DEFAULT 0.30 COMMENT '价格优势权重',
    heat_weight          DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '热度权重',
    updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_category_id (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='算法参数配置表';
