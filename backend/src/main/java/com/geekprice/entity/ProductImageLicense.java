package com.geekprice.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 商品图片授权元数据（方案 B：独立表，一图一条记录）。
 *
 * 与 product_images 通过 image_id 一一关联（唯一键 + 外键级联）：
 * 删除图片时授权记录随之删除；未建立授权记录的图片一律不下发给用户端。
 */
@Data
@TableName("product_image_license")
public class ProductImageLicense {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** product_images.id（唯一） */
    private Long imageId;

    /** 来源标识（如 wikimedia_commons） */
    private String source;

    /** 原始文件页面（授权证据入口） */
    private String sourcePageUrl;

    /** 原始未缩放图片地址（缩略图失效时回退） */
    private String originalUrl;

    /** 含版本许可名（如 CC BY-SA 4.0） */
    private String license;

    /** 许可证链接 */
    private String licenseUrl;

    /** 作者/权利人（原文照录，不猜测） */
    private String author;

    /** 署名文本（前端展示用） */
    private String attributionText;

    /** 改动说明（缩放/裁切等） */
    private String modifications;

    /** 型号匹配结论：EXACT_MATCH / SERIES_LEVEL / PARTIAL */
    private String matchType;

    /** 风险标记（解除后清空；存在标记时禁止审核通过） */
    private String riskNotes;

    /** 审核状态：APPROVED / APPROVED_WITH_ATTRIBUTION / PENDING_EVIDENCE / REJECTED */
    private String auditStatus;

    /** 审核人/审核批次 */
    private String reviewer;

    /** 审核时间 */
    private LocalDateTime reviewedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
