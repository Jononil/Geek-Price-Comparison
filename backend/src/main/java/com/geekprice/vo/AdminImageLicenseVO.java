package com.geekprice.vo;

import com.geekprice.entity.ProductImageLicense;
import lombok.Data;

/**
 * 管理端图片授权列表项：授权记录 + 图片/商品上下文。
 * 署名完整性由后端计算，前端只做展示。
 */
@Data
public class AdminImageLicenseVO {

    /** 授权记录全部字段 */
    private ProductImageLicense license;

    /** 图片ID（= license.imageId，便于前端操作） */
    private Long imageId;

    /** 商品ID */
    private Long productId;

    /** 商品名称 */
    private String productName;

    /** 图片URL（用于缩略预览） */
    private String imageUrl;

    /** 署名信息是否完整：作者+许可+许可链接+来源页面 全部非空 */
    private boolean attributionComplete;
}
