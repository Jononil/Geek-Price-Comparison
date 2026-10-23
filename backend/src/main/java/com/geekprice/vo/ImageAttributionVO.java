package com.geekprice.vo;

import lombok.Data;

/**
 * 图片署名信息（随商品下发给前端，用于署名展示）。
 *
 * 与 images 数组按 url 对应：前端用展示图的 URL 找到对应署名记录。
 */
@Data
public class ImageAttributionVO {

    /** 对应 product_images.url（与 Product.images 中的元素一致） */
    private String url;

    /** 作者/权利人 */
    private String author;

    /** 含版本许可名（如 CC BY-SA 4.0） */
    private String license;

    /** 许可证链接 */
    private String licenseUrl;

    /** 原始文件页面 */
    private String sourcePageUrl;

    /** 预生成署名文本 */
    private String attributionText;

    /** 改动说明（如"官方 500px 缩放版"） */
    private String modifications;

    /** 型号匹配结论：EXACT_MATCH / SERIES_LEVEL / PARTIAL */
    private String matchType;

    /** 来源标识 */
    private String source;
}
