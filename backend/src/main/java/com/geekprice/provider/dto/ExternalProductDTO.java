package com.geekprice.provider.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 外部商品结构。
 *
 * 模拟第三方电商 API 返回的单条商品数据。字段命名与真实电商 API 对齐
 * （externalProductId / title / brand / price / shopName / sku / stock 等），
 * 未来接入真实 API 时只需把 HTTP 响应 JSON 反序列化为本结构。
 */
@Data
public class ExternalProductDTO {

    /** 外部平台商品 ID（如 JD-100001 / TB-200001 / TM-300001） */
    private String externalProductId;

    /** 平台商品标题 */
    private String title;

    /** 品牌名 */
    private String brand;

    /** 分类名 */
    private String category;

    /** 型号（身份归一化的核心字段，如 "iPhone 17 256GB"） */
    private String model;

    /** 商品描述 */
    private String description;

    /** 当前价格 */
    private BigDecimal price;

    /** 原价 / 官方价 */
    private BigDecimal originalPrice;

    /** 店铺名称 */
    private String shopName;

    /** SKU / 版本 / 颜色 */
    private String sku;

    /** 商品链接（模拟） */
    private String url;

    /** 是否有货 */
    private Boolean stock;

    /** 促销状态 */
    private String promotionStatus;

    /** 商品图片路径列表（相对路径，如 /images/products/iphone17.svg） */
    private List<String> images;

    /** 规格参数（品类相关，如 处理器/内存/存储/屏幕/电池 等） */
    private Map<String, String> specs;

    /** 销量 */
    private Integer sales;

    /** 热度 */
    private Integer heat;

    /** 用户评分（0-5） */
    private Double rating;

    /** 性能评分（0-100） */
    private Integer performanceScore;

    /** 上市日期 */
    private LocalDate launchDate;

    /** 历史价格 */
    private List<ExternalPriceDTO> priceHistory;
}
