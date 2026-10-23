package com.geekprice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.entity.Platform;
import com.geekprice.entity.PriceHistory;
import com.geekprice.entity.Product;
import com.geekprice.entity.ProductImage;
import com.geekprice.entity.ProductPrice;
import com.geekprice.entity.ProductSource;
import com.geekprice.entity.ProductSpec;
import com.geekprice.mapper.PlatformMapper;
import com.geekprice.mapper.PriceHistoryMapper;
import com.geekprice.mapper.ProductImageMapper;
import com.geekprice.mapper.ProductMapper;
import com.geekprice.mapper.ProductPriceMapper;
import com.geekprice.mapper.ProductSourceMapper;
import com.geekprice.mapper.ProductSpecMapper;
import com.geekprice.provider.mock.MockJdProvider;
import com.geekprice.provider.mock.MockProductProvider;
import com.geekprice.service.dto.SyncResult;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.springframework.test.context.ActiveProfiles;

/**
 * ProductDataSyncService 集成测试。
 *
 * 使用真实 MySQL（geek_price 库）+ 真实 Mock Provider + 真实 Mapper，
 * 通过 {@code @Transactional} 让每个测试方法结束后整体回滚，避免污染现有数据。
 *
 * 覆盖 Step 6 要求的六个核心场景：
 * 1. 空库首次同步创建商品及关联数据；2. 重复同步不产生重复商品；
 * 3. 三平台同款商品聚合为 1 Product + 3 Source + 3 Price；
 * 4. 价格变化后重同步可更新报价；5. currentPrice 等于各平台最低价；
 * 6. Provider 失败不中断、不删除本地已有数据。
 */
@SpringBootTest
@Transactional
@ActiveProfiles("test")
class ProductDataSyncServiceTest {

    /** Mock 数据源每个平台的商品数（products.json 为 50 商品 × 3 平台） */
    private static final int MOCK_PRODUCT_COUNT = 50;

    @Autowired
    private ProductDataSyncService syncService;
    @Autowired
    private ProductMapper productMapper;
    @Autowired
    private ProductPriceMapper productPriceMapper;
    @Autowired
    private PriceHistoryMapper priceHistoryMapper;
    @Autowired
    private ProductSpecMapper productSpecMapper;
    @Autowired
    private ProductImageMapper productImageMapper;
    @Autowired
    private ProductSourceMapper productSourceMapper;
    @Autowired
    private PlatformMapper platformMapper;
    @Autowired
    private MockJdProvider jdProvider;

    private Platform platform(String code) {
        return platformMapper.selectOne(new LambdaQueryWrapper<Platform>().eq(Platform::getCode, code));
    }

    // ===== 测试 1：空库首次同步创建商品及关联数据 =====

    @Test
    void syncCreatesProductSourcePriceSpecHistory() {
        Platform jd = platform("jd");

        SyncResult result = syncService.syncPlatform("jd");

        assertEquals(MOCK_PRODUCT_COUNT, result.getTotal());
        assertEquals(MOCK_PRODUCT_COUNT, result.getSuccessCount());
        assertEquals(0, result.getFailCount());

        // 来源映射 50 条（product_source 为本阶段新增表，初始为空，计数可靠）
        long sourceCount = productSourceMapper.selectCount(
                new LambdaQueryWrapper<ProductSource>().eq(ProductSource::getPlatformId, jd.getId()));
        assertEquals(MOCK_PRODUCT_COUNT, sourceCount);

        // 任取一个商品，验证其报价 / 规格 / 图片 / 历史价格均已落库
        ProductSource sample = productSourceMapper.selectList(
                new LambdaQueryWrapper<ProductSource>().eq(ProductSource::getPlatformId, jd.getId())).get(0);
        Long productId = sample.getProductId();
        // 该商品在京东恰好 1 条报价
        assertEquals(1, productPriceMapper.selectCount(
                new LambdaQueryWrapper<ProductPrice>()
                        .eq(ProductPrice::getProductId, productId)
                        .eq(ProductPrice::getPlatformId, jd.getId())));
        assertTrue(productSpecMapper.selectCount(
                new LambdaQueryWrapper<ProductSpec>().eq(ProductSpec::getProductId, productId)) > 0);
        assertTrue(productImageMapper.selectCount(
                new LambdaQueryWrapper<ProductImage>().eq(ProductImage::getProductId, productId)) > 0);
        assertTrue(priceHistoryMapper.selectCount(
                new LambdaQueryWrapper<PriceHistory>()
                        .eq(PriceHistory::getProductId, productId)
                        .eq(PriceHistory::getPlatformId, jd.getId())) > 0);
    }

    // ===== 测试 2：重复同步不产生重复商品 =====

    @Test
    void resyncDoesNotDuplicate() {
        Platform jd = platform("jd");
        syncService.syncPlatform("jd");
        ProductSource before = productSourceMapper.selectList(
                new LambdaQueryWrapper<ProductSource>().eq(ProductSource::getPlatformId, jd.getId())).get(0);
        String externalId = before.getExternalProductId();
        Long productIdBefore = before.getProductId();

        syncService.syncPlatform("jd");

        // 同一 externalProductId 仍指向同一 productId（说明未重复建商品）
        ProductSource after = productSourceMapper.selectOne(
                new LambdaQueryWrapper<ProductSource>()
                        .eq(ProductSource::getPlatformId, jd.getId())
                        .eq(ProductSource::getExternalProductId, externalId));
        assertEquals(productIdBefore, after.getProductId());
        // 来源数量仍为 50，未翻倍
        long sourceCount = productSourceMapper.selectCount(
                new LambdaQueryWrapper<ProductSource>().eq(ProductSource::getPlatformId, jd.getId()));
        assertEquals(MOCK_PRODUCT_COUNT, sourceCount);
    }

    // ===== 测试 3：三平台同款商品聚合为 1 Product + 3 Source + 3 Price =====

    @Test
    void crossPlatformAggregatesSingleProduct() {
        syncService.syncAll();

        // 任取一个同步商品，验证其跨平台来源与报价均为 3 条
        ProductSource sample = productSourceMapper.selectList(null).get(0);
        Long productId = sample.getProductId();
        long sourceCount = productSourceMapper.selectCount(
                new LambdaQueryWrapper<ProductSource>().eq(ProductSource::getProductId, productId));
        assertEquals(3, sourceCount);
        long priceCount = productPriceMapper.selectCount(
                new LambdaQueryWrapper<ProductPrice>().eq(ProductPrice::getProductId, productId));
        assertEquals(3, priceCount);

        // 三条来源的 provider 各不相同（jd / taobao / tmall）
        List<ProductSource> sources = productSourceMapper.selectList(
                new LambdaQueryWrapper<ProductSource>().eq(ProductSource::getProductId, productId));
        assertEquals(3, sources.stream().map(ProductSource::getProvider).distinct().count());
    }

    // ===== 测试 4：价格变化后重同步可更新报价 =====

    @Test
    void priceUpdateRefreshesQuote() {
        Platform jd = platform("jd");
        syncService.syncPlatform("jd");
        // 通过 product_source 定位同步商品在京东的报价，避免误取手工数据
        ProductSource source = productSourceMapper.selectList(
                new LambdaQueryWrapper<ProductSource>().eq(ProductSource::getPlatformId, jd.getId())).get(0);
        ProductPrice price = productPriceMapper.selectOne(
                new LambdaQueryWrapper<ProductPrice>()
                        .eq(ProductPrice::getProductId, source.getProductId())
                        .eq(ProductPrice::getPlatformId, jd.getId()));
        BigDecimal correct = price.getPrice();

        // 人为把报价改错
        ProductPrice dirty = new ProductPrice();
        dirty.setId(price.getId());
        dirty.setPrice(new BigDecimal("1.00"));
        productPriceMapper.updateById(dirty);

        // 重新同步后应恢复为 Provider 的最新报价
        syncService.syncPlatform("jd");
        ProductPrice refreshed = productPriceMapper.selectById(price.getId());
        assertEquals(0, correct.compareTo(refreshed.getPrice()));
    }

    // ===== 测试 5：currentPrice 等于各平台最低价 =====

    @Test
    void currentPriceIsMinAcrossPlatforms() {
        syncService.syncAll();

        ProductSource sample = productSourceMapper.selectList(null).get(0);
        Long productId = sample.getProductId();
        List<ProductPrice> prices = productPriceMapper.selectList(
                new LambdaQueryWrapper<ProductPrice>().eq(ProductPrice::getProductId, productId));
        assertEquals(3, prices.size());

        BigDecimal min = prices.stream()
                .map(ProductPrice::getPrice)
                .min(BigDecimal::compareTo)
                .orElseThrow();
        Product product = productMapper.selectById(productId);
        assertEquals(0, min.compareTo(product.getCurrentPrice()));
    }

    // ===== 测试 6：Provider 失败不中断、不删除本地已有数据 =====

    @Test
    void providerFailureDoesNotDeleteExistingData() throws Exception {
        // 先全量同步成功
        syncService.syncAll();
        Platform jd = platform("jd");
        long jdSourceBefore = productSourceMapper.selectCount(
                new LambdaQueryWrapper<ProductSource>().eq(ProductSource::getPlatformId, jd.getId()));

        // 让 jd Provider 模拟服务端异常（Step 8 将改为 @ConfigurationProperties 配置，这里临时用反射切换）
        Field errorModeField = MockProductProvider.class.getDeclaredField("errorMode");
        errorModeField.setAccessible(true);
        errorModeField.set(jdProvider, "SERVER_ERROR");
        try {
            SyncResult result = syncService.syncAll();

            // 京东失败应被记录，且不删除本地已有来源数据
            assertTrue(result.getFailCount() > 0);
            long jdSourceAfter = productSourceMapper.selectCount(
                    new LambdaQueryWrapper<ProductSource>().eq(ProductSource::getPlatformId, jd.getId()));
            assertEquals(jdSourceBefore, jdSourceAfter);
        } finally {
            errorModeField.set(jdProvider, "SUCCESS");
        }
    }

    // ===== 测试 7：三平台同款商品 brandId / categoryId 已解析且一致，未知品牌不失败 =====

    @Test
    void syncedProductHasResolvedBrandAndCategory() {
        syncService.syncAll();

        // 可解析品牌的商品（Apple -> 苹果）：三平台聚合为 1 条 Product，brandId / categoryId 均已写入
        Product apple = findProductByNamePrefix("Apple");
        assertNotNull(apple, "Apple 商品应同步成功");
        assertNotNull(apple.getBrandId(), "Apple 应解析到品牌主键");
        assertNotNull(apple.getCategoryId(), "Apple 应解析到分类主键");
        assertEquals(3, productSourceMapper.selectCount(
                new LambdaQueryWrapper<ProductSource>().eq(ProductSource::getProductId, apple.getId())));

        // 未知品牌（JBL 不在 brands 表）：brandId 为 null，但商品仍同步成功、不失败、不自动创建
        Product jbl = findProductByNamePrefix("JBL");
        assertNotNull(jbl, "JBL 商品应同步成功");
        assertNull(jbl.getBrandId(), "JBL 未在品牌表注册，brandId 应为 null");
    }

    /** 按商品名前缀（Mock 数据品牌）定位同步商品 */
    private Product findProductByNamePrefix(String prefix) {
        for (ProductSource source : productSourceMapper.selectList(null)) {
            Product product = productMapper.selectById(source.getProductId());
            if (product != null && product.getName() != null && product.getName().startsWith(prefix)) {
                return product;
            }
        }
        return null;
    }
}
