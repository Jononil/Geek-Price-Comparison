-- ============================================================
-- 图片授权审核增强（阶段：管理端图片授权管理）
-- ------------------------------------------------------------
-- 1) product_image_license 增加 risk_notes 列：
--    记录审计发现的风险标记（如 Commons "License review needed"、
--    主体为对比图等）。存在未解除风险标记的记录不允许审核通过，
--    防止"点一下按钮"绕过证据问题。
-- 2) 按 image-license-audit-20261011 审计结论回填 5 条风险标记：
--    #24/#105/#106：Commons 分类含 License review needed（授权未复核）
--    #95/#97：主体为对比视频截图，非商品本体图
-- 本文件可重复执行（先判列存在再加列）。
-- ============================================================

-- 1. 加列（幂等）
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'product_image_license' AND column_name = 'risk_notes');
SET @ddl = IF(@col_exists = 0,
    'ALTER TABLE product_image_license ADD COLUMN risk_notes VARCHAR(500) DEFAULT NULL COMMENT ''风险标记（解除后清空；存在标记时禁止审核通过）'' AFTER match_type',
    'SELECT ''risk_notes 已存在，跳过'' AS notice');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. 回填风险标记（只在当前值为空时写入，不覆盖已有内容）
UPDATE product_image_license pil
    JOIN product_images pi ON pi.id = pil.image_id
SET pil.risk_notes = 'Commons 分类含 License review needed：授权未经平台复核，需人工到原始文件页复核后方可通过'
WHERE pi.product_id IN (24, 105, 106) AND (pil.risk_notes IS NULL OR pil.risk_notes = '');

UPDATE product_image_license pil
    JOIN product_images pi ON pi.id = pil.image_id
SET pil.risk_notes = '主体为对比视频截图（画面含多个型号），非商品本体图，不得作为商品主图通过'
WHERE pi.product_id IN (95, 97) AND (pil.risk_notes IS NULL OR pil.risk_notes = '');
