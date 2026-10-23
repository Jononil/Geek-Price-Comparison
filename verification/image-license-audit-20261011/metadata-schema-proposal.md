# 阶段 B-1 · 图片授权元数据存储方案（方案比较与推荐）

> 生成时间：2026-10-10T16:24:56.181Z｜仅设计，**未执行任何 SQL**

## 一、现状约束（实际核验）

- `product_images` 实际 4 列：`id BIGINT PK AI / product_id BIGINT NOT NULL / url VARCHAR(500) NOT NULL / sort INT NOT NULL DEFAULT 0`（无外键、无 license/author 字段）。
- 后端 `ProductServiceImpl` 将图片组装为 `List<String> images`（只有 URL 字符串）传给前端；前端 `ProductImage.vue` 只消费 URL。
- MyBatis-Plus 实体 `ProductImage` 只有 4 个字段；同步链路 `ProductImagePriceSyncTest` 覆盖"缺失图片保留既有记录"等行为。

## 二、方案比较

| 维度 | 方案 A：扩展 `product_images` 加列 | 方案 B：独立授权元数据表（推荐） |
|---|---|---|
| 改动面 | 需 ALTER 现有表；`ProductImage` 实体、Mapper、所有 `SELECT *` 查询受影响 | 新建表，**现有表与实体零改动** |
| 历史数据迁移 | 179 行全部要处理（47 行回填，132 行占位图留 NULL） | 只为 47 张真实图建授权记录；占位图天然无记录 |
| 同步链路风险 | 图片同步 Service 写入时若不带新列，可能触发默认值/覆盖问题；需回归 `ProductImagePriceSyncTest` 9 个用例 | 同步链路完全不碰授权表，**零回归风险** |
| 多图/多许可 | 每行自带许可，天然支持 | 每条授权记录 1:1 关联 image_id，天然支持 |
| 审核字段扩展 | 塞进业务表，职责混杂 | 审核人/审核时间/核验状态放授权表，职责清晰 |
| 关联一致性 | 无跨表一致性问题 | 需 FK 或应用层保证删除图片时同步删除授权记录 |
| 管理端维护 | 直接改图片行 | 在授权记录上维护，可加"审核状态"工作流 |
| 回滚难度 | ALTER 难回滚（MySQL 8 重建表） | 删表即可，**回滚零风险** |

## 三、推荐：方案 B（独立表 `product_image_license`）

理由：**风险最低、可逐步上线、与现有同步链路完全解耦**。任务要求"优先选择风险较低、可逐步上线的方案"，方案 B 完全符合；方案 A 的 ALTER 与实体改动会波及已测试的同步链路，收益相同但风险更高。

### 3.1 数据模型

```sql
-- 建议 SQL（仅写入报告，未执行）
CREATE TABLE product_image_license (
  id               BIGINT       NOT NULL AUTO_INCREMENT  COMMENT '主键',
  image_id         BIGINT       NOT NULL                 COMMENT 'product_images.id，一图一授权记录',
  source           VARCHAR(32)  NOT NULL DEFAULT 'wikimedia_commons' COMMENT '图片来源标识',
  source_page_url  VARCHAR(500) NULL     DEFAULT NULL    COMMENT '原始文件页面（可追溯证据）',
  license          VARCHAR(64)  NULL     DEFAULT NULL    COMMENT '含版本许可名，如 CC BY-SA 4.0',
  license_url      VARCHAR(500) NULL     DEFAULT NULL    COMMENT '许可证链接',
  author           VARCHAR(200) NULL     DEFAULT NULL    COMMENT '作者/权利人（原文照录，不猜测）',
  attribution_text VARCHAR(1000) NULL    DEFAULT NULL    COMMENT '生成的署名文本（前端展示用）',
  modifications    VARCHAR(500) NULL     DEFAULT NULL    COMMENT '改动说明（缩放/裁切等）',
  match_type       VARCHAR(24)  NULL     DEFAULT NULL    COMMENT 'EXACT_MATCH/SERIES_LEVEL/PARTIAL',
  audit_status     VARCHAR(24)  NOT NULL DEFAULT 'PENDING' COMMENT 'APPROVED/APPROVED_WITH_ATTRIBUTION/PENDING_EVIDENCE/REJECTED',
  reviewer         VARCHAR(64)  NULL     DEFAULT NULL    COMMENT '审核人',
  reviewed_at      DATETIME     NULL     DEFAULT NULL    COMMENT '审核时间',
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_pil_image_id (image_id),
  KEY idx_pil_audit_status (audit_status),
  CONSTRAINT fk_pil_image FOREIGN KEY (image_id) REFERENCES product_images (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品图片授权元数据（一图一条）';
```

### 3.2 字段设计要点

- **`image_id` 唯一键**：一图一份授权记录，杜绝重复；`ON DELETE CASCADE` 保证删除图片时授权记录同步消失，不留孤儿数据。
- **NULL 允许策略**：`license/author/source_page_url` 允许 NULL（对应"证据待补"），但 `audit_status` NOT NULL DEFAULT PENDING——**任何新记录默认不通过**，倒逼导入流程补齐证据。
- **`attribution_text` 预生成**：导入时按"图片来自 X，作者 Y，许可 Z（链接），原始页面 W"模板生成存库，前端直接展示，避免前端拼接逻辑。
- **审核工作流字段**：`reviewer/reviewed_at/audit_status` 支持后台人工复核，与阶段 A/B-1 的审计结论一一对应。

### 3.3 现有 47 张图迁移策略

1. 备份：`mysqldump geek_price product_images > backup/product_images_$(date).sql`（导入前必做）。
2. 回填数据源：本审计产物 `existing-images-license-audit.json`（47 条含全部字段，可直接转 INSERT 脚本——由阶段 B-2 生成并人工确认后执行）。
3. 回填顺序：建表 → 校验 image_id 均存在于 product_images → 批量 INSERT → 抽查 5 条比对 Commons 页面。
4. 132 条占位图**不建授权记录**（占位图无来源可言）；后续占位图被淘汰时授权记录随图片删除（CASCADE）。
5. 回滚：`DROP TABLE product_image_license;`——不影响任何现有功能。

### 3.4 缺失授权信息的处理

- 导入新图时**必须**同时写授权记录；若许可未知 → `audit_status=PENDING_EVIDENCE` 且前端按"暂无实拍图"处理，**不展示该图**。
- 后端详情接口：`LEFT JOIN product_image_license`，无记录或 audit_status=REJECTED 的图片 URL 不下发给前端（在 Service 层过滤）。

### 3.5 前端数据流

```
详情接口新增字段（DTO 扩展，向后兼容）：
  images: string[]                      // 保持不变（仅 audit_status ∈ APPROVED* 的图片）
  imageAttribution: {                   // 与 images[?] 按 URL 对应，或改为对象数组
    url, author, license, licenseUrl, sourcePageUrl, attributionText, modifications, matchType
  }[]
```

（具体页面展示见 frontend-attribution-proposal.md）

### 3.6 后续导入流程如何不丢元数据

导入脚本改为**两表同事务**：

```sql
START TRANSACTION;
INSERT INTO product_images(product_id, url, sort) VALUES (?, ?, ?);
SET @new_image_id = LAST_INSERT_ID();
INSERT INTO product_image_license(image_id, source, source_page_url, license, license_url, author,
       attribution_text, modifications, match_type, audit_status, reviewer, reviewed_at)
 VALUES (@new_image_id, 'wikimedia_commons', ?, ?, ?, ?, ?, ?, ?, 'APPROVED_WITH_ATTRIBUTION', ?, NOW());
COMMIT;
```

导入工具（如 `import-phase2-approved.mjs`）读取审核 JSON 时把 license/author 字段一并带入，**任何缺少授权字段的候选直接拒绝导入**。
