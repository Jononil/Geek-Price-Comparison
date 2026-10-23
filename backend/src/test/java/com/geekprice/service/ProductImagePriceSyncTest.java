package com.geekprice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.entity.Platform;
import com.geekprice.entity.ProductImage;
import com.geekprice.entity.ProductPrice;
import com.geekprice.entity.ProductSource;
import com.geekprice.mapper.PlatformMapper;
import com.geekprice.mapper.ProductImageMapper;
import com.geekprice.mapper.ProductPriceMapper;
import com.geekprice.mapper.ProductSourceMapper;
import com.geekprice.provider.mock.MockJdProvider;
import com.geekprice.provider.mock.MockProductProvider;
import com.geekprice.service.dto.SyncResult;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.springframework.test.context.ActiveProfiles;

/**
 * 图片与价格数据完善 集成测试（Step 11）。
 *
 * 验证图片 / 价格同步的异常隔离、幂等与数据保护：
 * 1. 正常图片写入；2. 图片缺失 / 为空时保留已有图片；3. 异常图片（null/空白/重复）不影响同步、不产生重复数据；
 * 4. 正常价格写入；5. 缺失 / 负数价格保护已有报价；6. 重复同步不产生重复图片/报价；7. 多平台价格正常保存。
 *
 * 通过 MockProductProvider 的 corruptMode 注入图片 / 价格字段故障，验证 ProductSyncWriter 的隔离能力。
 */
@SpringBootTest
@Transactional
@ActiveProfiles("test")
class ProductImagePriceSyncTest {

    private static final int MOCK_PRODUCT_COUNT = 50;

    @Autowired
    private ProductDataSyncService syncService;
    @Autowired
    private ProductImageMapper productImageMapper;
    @Autowired
    private ProductPriceMapper productPriceMapper;
    @Autowired
    private ProductSourceMapper productSourceMapper;
    @Autowired
    private PlatformMapper platformMapper;
    @Autowired
    private MockJdProvider jdProvider;

    private Platform platform(String code) {
        return platformMapper.selectOne(new LambdaQueryWrapper<Platform>().eq(Platform::getCode, code));
    }

    private void setCorruptMode(MockProductProvider provider, String mode) throws Exception {
        Field field = MockProductProvider.class.getDeclaredField("corruptMode");
        field.setAccessible(true);
        field.set(provider, mode);
    }

    @AfterEach
    void resetProviders() throws Exception {
        setCorruptMode(jdProvider, "NONE");
        jdProvider.resetCatalog();
    }

    private Long anySyncedProductId(Platform platform) {
        return productSourceMapper.selectList(
                new LambdaQueryWrapper<ProductSource>().eq(ProductSource::getPlatformId, platform.getId()))
                .get(0).getProductId();
    }

    // ===== 测试 1：正常图片同步 =====

    @Test
    void normalImagesWritten() {
        syncService.syncPlatform("jd");
        Long productId = anySyncedProductId(platform("jd"));
        List<ProductImage> images = productImageMapper.selectList(
                new LambdaQueryWrapper<ProductImage>().eq(ProductImage::getProductId, productId));
        assertFalse(images.isEmpty(), "商品应写入图片");
        for (ProductImage image : images) {
            assertNotNull(image.getUrl(), "图片 URL 不应为 null");
            assertFalse(image.getUrl().isBlank(), "图片 URL 不应为空白");
        }
    }

    // ===== 测试 2/3：图片缺失 / 为空时保留已有图片 =====

    @Test
    void missingImagesPreserveExisting() throws Exception {
        syncService.syncPlatform("jd");
        long before = productImageMapper.selectCount(null);

        setCorruptMode(jdProvider, "NULL_IMAGES");
        SyncResult r = syncService.syncPlatform("jd");

        assertEquals(MOCK_PRODUCT_COUNT, r.getSuccessCount(), "图片缺失不应导致商品同步失败");
        assertEquals(0, r.getFailCount());
        assertEquals(before, productImageMapper.selectCount(null), "图片缺失不应删除已有有效图片");
    }

    @Test
    void emptyImagesPreserveExisting() throws Exception {
        syncService.syncPlatform("jd");
        long before = productImageMapper.selectCount(null);

        setCorruptMode(jdProvider, "EMPTY_IMAGES");
        SyncResult r = syncService.syncPlatform("jd");

        assertEquals(MOCK_PRODUCT_COUNT, r.getSuccessCount(), "图片为空不应导致商品同步失败");
        assertEquals(before, productImageMapper.selectCount(null), "图片为空不应删除已有有效图片");
    }

    // ===== 测试 4：异常图片（null/空白/重复）不影响同步，且不产生重复/空白数据 =====

    @Test
    void invalidImagesSkippedWithoutBreaking() throws Exception {
        setCorruptMode(jdProvider, "BAD_IMAGES");
        SyncResult r = syncService.syncPlatform("jd");

        assertEquals(MOCK_PRODUCT_COUNT, r.getSuccessCount(), "异常图片不应导致商品同步失败");
        assertEquals(0, r.getFailCount());
        // 重复地址只插一次
        assertEquals(1, productImageMapper.selectCount(
                new LambdaQueryWrapper<ProductImage>().eq(ProductImage::getUrl, "https://cdn.example.com/dup.jpg")),
                "重复图片地址只应插入一次");
        // 有效图片正常写入
        assertEquals(1, productImageMapper.selectCount(
                new LambdaQueryWrapper<ProductImage>().eq(ProductImage::getUrl, "/images/products/step11-valid.svg")),
                "有效图片应正常写入");
        // 空白图片地址不产生数据
        assertEquals(0, productImageMapper.selectCount(
                new LambdaQueryWrapper<ProductImage>().eq(ProductImage::getUrl, "")),
                "空白图片地址不应写入数据库");
    }

    // ===== 测试 5：正常价格同步 =====

    @Test
    void normalPriceWritten() {
        syncService.syncPlatform("jd");
        Platform jd = platform("jd");
        Long productId = anySyncedProductId(jd);
        ProductPrice price = productPriceMapper.selectOne(
                new LambdaQueryWrapper<ProductPrice>()
                        .eq(ProductPrice::getProductId, productId)
                        .eq(ProductPrice::getPlatformId, jd.getId()));
        assertNotNull(price, "商品应写入平台报价");
        assertTrue(price.getPrice().compareTo(BigDecimal.ZERO) > 0, "正常价格应为正数");
    }

    // ===== 测试 6/7：缺失 / 负数价格保护已有报价 =====

    @Test
    void nullPricePreservesExistingQuote() throws Exception {
        Platform jd = platform("jd");
        syncService.syncPlatform("jd");
        long countBefore = productPriceMapper.selectCount(
                new LambdaQueryWrapper<ProductPrice>().eq(ProductPrice::getPlatformId, jd.getId()));

        setCorruptMode(jdProvider, "NULL_PRICE");
        SyncResult r = syncService.syncPlatform("jd");

        assertEquals(MOCK_PRODUCT_COUNT, r.getSuccessCount(), "缺价格不应导致商品同步失败");
        assertEquals(countBefore, productPriceMapper.selectCount(
                new LambdaQueryWrapper<ProductPrice>().eq(ProductPrice::getPlatformId, jd.getId())),
                "缺价格不应删除已有有效报价");
    }

    @Test
    void negativePricePreservesExistingQuote() throws Exception {
        Platform jd = platform("jd");
        syncService.syncPlatform("jd");

        setCorruptMode(jdProvider, "NEGATIVE_PRICE");
        SyncResult r = syncService.syncPlatform("jd");

        assertEquals(MOCK_PRODUCT_COUNT, r.getSuccessCount(), "负数价格不应导致商品同步失败");
        // 负数被拒绝：不写入、不覆盖，全库不存在任何负数报价
        long negativeCount = productPriceMapper.selectCount(
                new LambdaQueryWrapper<ProductPrice>()
                        .eq(ProductPrice::getPlatformId, jd.getId())
                        .lt(ProductPrice::getPrice, BigDecimal.ZERO));
        assertEquals(0, negativeCount, "非法负数价格不应破坏已有有效报价");
    }

    // ===== 测试 8：重复同步不产生重复图片 / 报价数据 =====

    @Test
    void resyncDoesNotDuplicateImagesOrPrices() {
        syncService.syncAll();
        Long productId = productSourceMapper.selectList(null).get(0).getProductId();
        long imagesBefore = productImageMapper.selectCount(
                new LambdaQueryWrapper<ProductImage>().eq(ProductImage::getProductId, productId));
        long pricesBefore = productPriceMapper.selectCount(
                new LambdaQueryWrapper<ProductPrice>().eq(ProductPrice::getProductId, productId));

        syncService.syncAll();

        assertEquals(imagesBefore, productImageMapper.selectCount(
                new LambdaQueryWrapper<ProductImage>().eq(ProductImage::getProductId, productId)),
                "重复同步不应产生重复图片");
        assertEquals(pricesBefore, productPriceMapper.selectCount(
                new LambdaQueryWrapper<ProductPrice>().eq(ProductPrice::getProductId, productId)),
                "重复同步不应产生重复报价");
    }

    // ===== 测试 9：多平台价格正常保存 =====

    @Test
    void multiPlatformPricesSaved() {
        syncService.syncAll();
        Long productId = productSourceMapper.selectList(null).get(0).getProductId();
        List<ProductPrice> prices = productPriceMapper.selectList(
                new LambdaQueryWrapper<ProductPrice>().eq(ProductPrice::getProductId, productId));
        assertEquals(3, prices.size(), "三平台报价应全部保存");
        for (ProductPrice price : prices) {
            assertNotNull(price.getPlatformId());
            assertTrue(price.getPrice().compareTo(BigDecimal.ZERO) > 0, "多平台报价应为正数");
        }
    }
}
