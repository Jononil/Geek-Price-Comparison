
ALTER TABLE product_specs ADD COLUMN source_url VARCHAR(500) NULL COMMENT '参数来源URL',
  ADD COLUMN source_type VARCHAR(32) NULL COMMENT '来源类型: official/reference_db/internal_knowledge',
  ADD COLUMN verify_status VARCHAR(32) NOT NULL DEFAULT 'template' COMMENT '核验状态: verified/reference/template';