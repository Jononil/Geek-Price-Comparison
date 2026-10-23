-- ============================================================
-- 极客比价 - 仿真商品数据源（Mock Provider 体系）
-- 说明：
--   1. 本脚本只负责「product_source 表结构」与「天猫平台基础数据」。
--   2. 不在本脚本写入 150 条商品来源关系——这些关系由 ProductDataSyncService
--      依据 ProductIdentityKey + externalProductId + platformId 动态建立。
--   3. 本脚本可重复执行（幂等），不破坏已有数据。
-- ============================================================

USE geek_price;

-- ---------- 商品数据来源映射表 ----------
CREATE TABLE IF NOT EXISTS product_source (
    id                  BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    product_id          BIGINT       NOT NULL COMMENT '系统产品ID',
    platform_id         BIGINT       NOT NULL COMMENT '平台ID',
    external_product_id VARCHAR(64)  NOT NULL COMMENT '外部平台商品ID（如 JD-100001）',
    provider            VARCHAR(32)  NOT NULL COMMENT '数据源Provider（MOCK_JD/MOCK_TAOBAO/MOCK_TMALL）',
    last_sync_time      DATETIME     DEFAULT NULL COMMENT '最近同步时间',
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted             TINYINT      NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (id),
    -- 同一平台 + 同一外部商品 ID 只允许一条来源记录（跨平台比价去重基础）
    UNIQUE KEY uk_platform_external (platform_id, external_product_id),
    KEY idx_product_id (product_id),
    KEY idx_platform_id (platform_id),
    KEY idx_product_identity (product_id, platform_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品数据来源映射表';

-- ---------- 天猫平台基础数据（幂等） ----------
-- 现有平台 1-5 为 jd/taobao/pdd/suning/douyin，此处补充 tmall。
-- 不硬编码 id，由自增分配（在 1-5 已存在时通常为 6），避免与其他平台主键冲突。
-- 通过 code 唯一键 + NOT EXISTS 保证重复执行不会产生重复平台记录。
INSERT INTO platforms (name, code, status)
SELECT '天猫', 'tmall', 1
WHERE NOT EXISTS (SELECT 1 FROM platforms WHERE code = 'tmall');
