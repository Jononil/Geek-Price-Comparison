package com.geekprice.provider.standardizer;

import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 商品标准身份标识（ProductIdentityKey）。
 *
 * 用于跨平台识别「同一个标准商品」：同一商品在京东 / 淘宝 / 天猫的三个平台报价，
 * 经过归一化后应得到完全相同的 normalizedKey，从而支持后续 Step 5 的商品去重。
 *
 * 示例：
 * <pre>
 * brand  = Apple      -> APPLE
 * model  = iPhone 17  -> IPHONE17
 * coreSpec = 256GB     -> 256GB
 * normalizedKey        -> APPLE_IPHONE17_256GB
 * </pre>
 *
 * 相等性仅取决于 normalizedKey：两个 key 的 normalizedKey 相同即视为同一商品。
 */
@Data
@Builder
@EqualsAndHashCode(of = "normalizedKey")
public class ProductIdentityKey {

    /** 归一化品牌，如 APPLE */
    private String brand;

    /** 归一化型号，如 IPHONE17 */
    private String model;

    /** 归一化核心规格（容量），如 256GB；无容量时为 "" */
    private String coreSpec;

    /** 归一化完整标识，如 APPLE_IPHONE17_256GB；相等即视为同一商品 */
    private String normalizedKey;
}
