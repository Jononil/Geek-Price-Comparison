package com.geekprice.provider.standardizer;

import com.geekprice.entity.PriceHistory;
import com.geekprice.entity.Product;
import com.geekprice.entity.ProductImage;
import com.geekprice.entity.ProductPrice;
import com.geekprice.entity.ProductSpec;
import com.geekprice.provider.dto.ExternalPriceDTO;
import com.geekprice.provider.dto.ExternalProductDTO;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.springframework.test.context.ActiveProfiles;

/**
 * ProductStandardizer 单元测试。
 *
 * 覆盖 Step 4 要求的五个核心场景：
 * 1. 品牌归一化；2. 型号归一化；3. 容量归一化；4. 颜色剔除；5. 跨平台商品同身份。
 * 另附实体映射冒烟测试，验证 Product / ProductPrice / PriceHistory 等字段正确映射。
 */
@ActiveProfiles("test")
class ProductStandardizerImplTest {

    private final ProductStandardizer standardizer = new ProductStandardizerImpl();

    /** 构造最小 DTO（只关心身份相关字段） */
    private ExternalProductDTO identityDto(String brand, String model, Map<String, String> specs) {
        ExternalProductDTO d = new ExternalProductDTO();
        d.setBrand(brand);
        d.setModel(model);
        d.setSpecs(specs);
        return d;
    }

    private ExternalPriceDTO pricePoint(String price, LocalDate date, String event) {
        ExternalPriceDTO p = new ExternalPriceDTO();
        p.setPrice(new BigDecimal(price));
        p.setDate(date);
        p.setEvent(event);
        return p;
    }

    // ===== 测试 1：品牌归一化 =====

    @Test
    void brandNormalization() {
        assertEquals("APPLE", standardizer.buildIdentityKey(identityDto("Apple", "iPhone 17", Map.of("存储", "256GB"))).getBrand());
        assertEquals("APPLE", standardizer.buildIdentityKey(identityDto("苹果", "iPhone 17", Map.of("存储", "256GB"))).getBrand());
        assertEquals("APPLE", standardizer.buildIdentityKey(identityDto("APPLE", "iPhone 17", Map.of("存储", "256GB"))).getBrand());
        assertEquals("APPLE", standardizer.buildIdentityKey(identityDto("apple", "iPhone 17", Map.of("存储", "256GB"))).getBrand());
        assertEquals("HUAWEI", standardizer.buildIdentityKey(identityDto("华为", "Mate 70 Pro", Map.of("存储", "512GB"))).getBrand());
        assertEquals("XIAOMI", standardizer.buildIdentityKey(identityDto("小米", "15 Pro", Map.of("存储", "512GB"))).getBrand());
        assertEquals("SAMSUNG", standardizer.buildIdentityKey(identityDto("三星", "Galaxy S25 Ultra", Map.of("存储", "256GB"))).getBrand());
    }

    // ===== 测试 2：型号归一化 =====

    @Test
    void modelNormalization() {
        assertEquals("IPHONE17", standardizer.buildIdentityKey(identityDto("Apple", "iPhone 17", Map.of("存储", "256GB"))).getModel());
        assertEquals("IPHONE17", standardizer.buildIdentityKey(identityDto("Apple", "iphone17", Map.of("存储", "256GB"))).getModel());
        assertEquals("IPHONE17", standardizer.buildIdentityKey(identityDto("Apple", "IPHONE 17", Map.of("存储", "256GB"))).getModel());
        assertEquals("MATE70PRO", standardizer.buildIdentityKey(identityDto("华为", "Mate 70 Pro", Map.of("存储", "512GB"))).getModel());
    }

    // ===== 测试 3：容量归一化 =====

    @Test
    void capacityNormalization() {
        assertEquals("256GB", standardizer.buildIdentityKey(identityDto("Apple", "iPhone 17", Map.of("存储", "256G"))).getCoreSpec());
        assertEquals("256GB", standardizer.buildIdentityKey(identityDto("Apple", "iPhone 17", Map.of("存储", "256GB"))).getCoreSpec());
        assertEquals("256GB", standardizer.buildIdentityKey(identityDto("Apple", "iPhone 17", Map.of("存储", "256 GB"))).getCoreSpec());
        assertEquals("256GB", standardizer.buildIdentityKey(identityDto("Apple", "iPhone 17", Map.of("存储", "256g"))).getCoreSpec());
        assertEquals("1TB", standardizer.buildIdentityKey(identityDto("Apple", "MacBook Pro 14 M4", Map.of("硬盘", "1TB SSD"))).getCoreSpec());
        assertEquals("512GB", standardizer.buildIdentityKey(identityDto("Apple", "iPad Pro 11 M4", Map.of("存储", "512G"))).getCoreSpec());
    }

    // ===== 测试 4：颜色剔除 =====

    @Test
    void colorRemovalDoesNotAffectIdentity() {
        ProductIdentityKey black = standardizer.buildIdentityKey(identityDto("Apple", "iPhone 17 黑色", Map.of("存储", "256GB")));
        ProductIdentityKey white = standardizer.buildIdentityKey(identityDto("Apple", "iPhone 17 白色", Map.of("存储", "256GB")));
        ProductIdentityKey blue = standardizer.buildIdentityKey(identityDto("Apple", "iPhone 17 蓝色", Map.of("存储", "256GB")));
        assertEquals(black.getNormalizedKey(), white.getNormalizedKey());
        assertEquals(black.getNormalizedKey(), blue.getNormalizedKey());
        assertEquals("APPLE_IPHONE17_256GB", black.getNormalizedKey());
    }

    // ===== 测试 5：跨平台商品同身份 =====

    @Test
    void crossPlatformSameIdentity() {
        // 京东视角：Apple + iPhone 17 + 256G + 黑色
        ExternalProductDTO jd = identityDto("Apple", "iPhone 17", Map.of("存储", "256G"));
        jd.setSku("256G 黑色");
        // 天猫视角：苹果 + iPhone17 + 256GB + 白色
        ExternalProductDTO tmall = identityDto("苹果", "iPhone17", Map.of("存储", "256GB"));
        tmall.setSku("256GB 白色");

        ProductIdentityKey jdKey = standardizer.buildIdentityKey(jd);
        ProductIdentityKey tmallKey = standardizer.buildIdentityKey(tmall);

        assertEquals("APPLE_IPHONE17_256GB", jdKey.getNormalizedKey());
        assertEquals(jdKey, tmallKey);
        assertEquals(jdKey.getNormalizedKey(), tmallKey.getNormalizedKey());
    }

    // ===== 附加测试：内存不与存储容量混淆 =====

    @Test
    void ramNotConfusedWithStorage() {
        // 16GB 内存 + 1TB 硬盘 -> 核心规格应是 1TB，而不是 16GB
        ExternalProductDTO laptop = identityDto("联想", "Legion Y9000P",
                Map.of("内存", "16GB", "硬盘", "1TB SSD"));
        assertEquals("1TB", standardizer.buildIdentityKey(laptop).getCoreSpec());
        assertEquals("LENOVO_LEGIONY9000P_1TB", standardizer.buildIdentityKey(laptop).getNormalizedKey());
    }

    // ===== 附加测试：实体映射 =====

    @Test
    void entityMapping() {
        ExternalProductDTO d = new ExternalProductDTO();
        d.setBrand("Apple");
        d.setModel("iPhone 17 256GB");
        d.setCategory("手机");
        d.setDescription("A19 Pro 芯片加持的年度旗舰");
        d.setTitle("Apple iPhone 17 256GB 深空黑 5G手机");
        d.setUrl("https://item.jd.com/100001.html");
        d.setPrice(new BigDecimal("5999"));
        d.setOriginalPrice(new BigDecimal("6499"));
        d.setShopName("Apple产品京东自营旗舰店");
        d.setPromotionStatus("自营");
        d.setStock(true);
        d.setRating(4.8);
        d.setPerformanceScore(95);
        d.setSales(152000);
        d.setHeat(9800);
        d.setLaunchDate(LocalDate.of(2025, 9, 20));
        d.setSpecs(Map.of("存储", "256GB", "处理器", "A19 Pro"));
        d.setImages(List.of("/images/products/iphone17.svg"));
        d.setPriceHistory(List.of(pricePoint("5999", LocalDate.now(), "当前")));

        Product product = standardizer.toProduct(d);
        assertEquals("Apple iPhone 17 256GB", product.getName());
        assertEquals("Apple", product.getBrandName());
        assertEquals("手机", product.getCategoryName());
        assertEquals(new BigDecimal("6499"), product.getOfficialPrice());
        assertEquals(new BigDecimal("5999"), product.getCurrentPrice());
        assertEquals(95, product.getPerformanceScore());
        assertEquals(new BigDecimal("4.8"), product.getUserRating());
        assertEquals(152000, product.getSales());
        assertEquals(LocalDate.of(2025, 9, 20), product.getLaunchDate());

        ProductPrice price = standardizer.toProductPrice(d, 1L, 2L);
        assertEquals(1L, price.getProductId());
        assertEquals(2L, price.getPlatformId());
        assertEquals(1, price.getIsOfficial());
        assertEquals(1, price.getStockStatus());
        assertEquals(new BigDecimal("5999"), price.getPrice());

        List<ProductSpec> specs = standardizer.toSpecs(d, 1L);
        assertEquals(2, specs.size());

        ProductImage image = standardizer.toProductImage(d, 1L, 0);
        assertEquals("/images/products/iphone17.svg", image.getUrl());

        List<PriceHistory> history = standardizer.toPriceHistory(d, 1L, 2L);
        assertEquals(1, history.size());
        assertEquals("当前", history.get(0).getSource());
        assertEquals(2L, history.get(0).getPlatformId());
    }

    // ===== 附加测试：不同商品身份必须不同 =====

    @Test
    void distinctProductsHaveDistinctKeys() {
        ProductIdentityKey a = standardizer.buildIdentityKey(identityDto("Apple", "iPhone 17", Map.of("存储", "256GB")));
        ProductIdentityKey b = standardizer.buildIdentityKey(identityDto("Apple", "iPhone 17 Pro", Map.of("存储", "256GB")));
        ProductIdentityKey c = standardizer.buildIdentityKey(identityDto("Apple", "iPhone 17", Map.of("存储", "512GB")));
        assertNotEquals(a.getNormalizedKey(), b.getNormalizedKey());
        assertNotEquals(a.getNormalizedKey(), c.getNormalizedKey());
        assertTrue(a.getNormalizedKey().startsWith("APPLE_"));
    }
}
