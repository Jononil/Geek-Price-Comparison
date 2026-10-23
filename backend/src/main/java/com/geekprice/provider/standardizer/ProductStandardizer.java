package com.geekprice.provider.standardizer;

import com.geekprice.entity.PriceHistory;
import com.geekprice.entity.Product;
import com.geekprice.entity.ProductImage;
import com.geekprice.entity.ProductPrice;
import com.geekprice.entity.ProductSpec;
import com.geekprice.provider.dto.ExternalProductDTO;

import java.util.List;

/**
 * 商品标准化器。
 *
 * 职责：把外部平台商品结构（ExternalProductDTO）转换为系统内部的统一实体，
 * 并生成跨平台唯一的商品身份标识（ProductIdentityKey）。
 *
 * 本阶段只负责「标准化」与「身份识别」，不执行任何数据库写入；
 * 落库与去重由 Step 5（product_source + 同步）负责。
 */
public interface ProductStandardizer {

    /**
     * 将外部商品转换为系统内部 Product 实体。
     * 只做字段映射，不计算推荐分数 / 性价比，不解析 brandId / categoryId（由 Step 5 落库时解析）。
     */
    Product toProduct(ExternalProductDTO externalProduct);

    /** 将外部规格参数转换为 ProductSpec 列表（保留中文规格名）。 */
    List<ProductSpec> toSpecs(ExternalProductDTO externalProduct, Long productId);

    /** 按 sort 索引取出外部图片列表中的一张，映射为 ProductImage（不下图片、不访问 CDN）。 */
    ProductImage toProductImage(ExternalProductDTO externalProduct, Long productId, int sort);

    /** 将外部商品某平台报价转换为 ProductPrice。 */
    ProductPrice toProductPrice(ExternalProductDTO externalProduct, Long productId, Long platformId);

    /** 将外部历史价格转换为 PriceHistory 列表（事件信息放入 source 字段）。 */
    List<PriceHistory> toPriceHistory(ExternalProductDTO externalProduct, Long productId, Long platformId);

    /** 生成商品标准身份标识。 */
    ProductIdentityKey buildIdentityKey(ExternalProductDTO externalProduct);

    /**
     * 品牌名称归一化：中文别名映射为英文标准品牌，英文品牌直接转大写。
     * 例如 苹果 / Apple / APPLE 统一为 APPLE，华为 / Huawei 统一为 HUAWEI。
     * 用于品牌标准化映射（Step 7 解析 brandId）与身份重建。
     */
    String normalizeBrand(String brand);

    /**
     * 分类名称归一化：别名映射为标准分类名。例如 平板 -&gt; 平板电脑、游戏设备 -&gt; 游戏机。
     * 用于分类标准化映射（Step 7 解析 categoryId）。
     */
    String normalizeCategory(String category);
}
