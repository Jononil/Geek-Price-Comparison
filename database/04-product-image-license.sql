-- ============================================================
-- 商品图片授权元数据表（阶段 B-2：图片展示闭环）
-- ------------------------------------------------------------
-- 目的：把每张 product_images 的来源/许可/作者/署名信息持久化，
--       供用户端展示过滤（未审核图片不下发）与前端署名展示使用。
-- 设计：独立表（方案 B），不修改 product_images 表结构；
--       一图一条授权记录（image_id 唯一），删除图片时级联清理。
-- 本文件可重复执行（IF NOT EXISTS），不静默覆盖已有数据。
-- ============================================================

CREATE TABLE IF NOT EXISTS product_image_license (
    id               BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键',
    image_id         BIGINT        NOT NULL                COMMENT '图片ID（product_images.id，一图一授权记录）',
    source           VARCHAR(32)   NOT NULL DEFAULT 'wikimedia_commons' COMMENT '图片来源标识',
    source_page_url  VARCHAR(500)  DEFAULT NULL COMMENT '原始文件页面（授权证据入口）',
    original_url     VARCHAR(500)  DEFAULT NULL COMMENT '原始未缩放图片地址（回退用）',
    license          VARCHAR(64)   DEFAULT NULL COMMENT '含版本许可名（如 CC BY-SA 4.0）',
    license_url      VARCHAR(500)  DEFAULT NULL COMMENT '许可证链接',
    author           VARCHAR(200)  DEFAULT NULL COMMENT '作者/权利人（原文照录，不猜测）',
    attribution_text VARCHAR(1000) DEFAULT NULL COMMENT '署名文本（前端展示用）',
    modifications    VARCHAR(500)  DEFAULT NULL COMMENT '改动说明（缩放/裁切等）',
    match_type       VARCHAR(24)   DEFAULT NULL COMMENT '型号匹配结论：EXACT_MATCH/SERIES_LEVEL/PARTIAL',
    audit_status     VARCHAR(32)   NOT NULL DEFAULT 'PENDING_EVIDENCE' COMMENT '审核状态：APPROVED/APPROVED_WITH_ATTRIBUTION/PENDING_EVIDENCE/REJECTED',
    reviewer         VARCHAR(64)   DEFAULT NULL COMMENT '审核人/审核批次',
    reviewed_at      DATETIME      DEFAULT NULL COMMENT '审核时间',
    created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_pil_image_id (image_id),
    KEY idx_pil_audit_status (audit_status),
    CONSTRAINT fk_pil_image FOREIGN KEY (image_id) REFERENCES product_images (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品图片授权元数据表';
