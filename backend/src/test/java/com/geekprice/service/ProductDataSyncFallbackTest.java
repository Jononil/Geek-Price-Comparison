package com.geekprice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.entity.Platform;
import com.geekprice.entity.Product;
import com.geekprice.entity.ProductPrice;
import com.geekprice.entity.ProductSource;
import com.geekprice.mapper.PlatformMapper;
import com.geekprice.mapper.ProductMapper;
import com.geekprice.mapper.ProductPriceMapper;
import com.geekprice.mapper.ProductSourceMapper;
import com.geekprice.provider.mock.MockJdProvider;
import com.geekprice.provider.mock.MockProductProvider;
import com.geekprice.provider.mock.MockTaobaoProvider;
import com.geekprice.provider.mock.MockTmallProvider;
import com.geekprice.service.dto.SyncResult;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.springframework.test.context.ActiveProfiles;

/**
 * 数据同步异常处理与 Fallback 集成测试（Step 8）。
 *
 * 核心验证：任何单个平台 / 单个商品 / 单个字段的异常，都不能让整个同步任务失败，
 * 且新数据同步失败时绝不删除数据库已有有效数据。
 *
 * 通过 MockProductProvider 的 errorMode（平台级故障）与 corruptMode（单商品字段篡改）
 * 注入各类故障，验证 {@link ProductDataSyncService} 的隔离与 fallback 能力。
 */
@SpringBootTest
@Transactional
@ActiveProfiles("test")
class ProductDataSyncFallbackTest {

    private static final int MOCK_PRODUCT_COUNT = 50;

    @Autowired
    private ProductDataSyncService syncService;
    @Autowired
    private ProductMapper productMapper;
    @Autowired
    private ProductPriceMapper productPriceMapper;
    @Autowired
    private ProductSourceMapper productSourceMapper;
    @Autowired
    private PlatformMapper platformMapper;
    @Autowired
    private MockJdProvider jdProvider;
    @Autowired
    private MockTaobaoProvider taobaoProvider;
    @Autowired
    private MockTmallProvider tmallProvider;

    // ==================== 工具方法 ====================

    private Platform platform(String code) {
        return platformMapper.selectOne(new LambdaQueryWrapper<Platform>().eq(Platform::getCode, code));
    }

    private long countSource(Long platformId) {
        return productSourceMapper.selectCount(
                new LambdaQueryWrapper<ProductSource>().eq(ProductSource::getPlatformId, platformId));
    }

    private void setField(MockProductProvider provider, String fieldName, Object value) throws Exception {
        Field field = MockProductProvider.class.getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(provider, value);
    }

    private void setErrorMode(MockProductProvider provider, String mode) throws Exception {
        setField(provider, "errorMode", mode);
    }

    private void setCorruptMode(MockProductProvider provider, String mode) throws Exception {
        setField(provider, "corruptMode", mode);
    }

    private boolean hasSyncedProductWithNullBrand(Long platformId) {
        for (ProductSource s : productSourceMapper.selectList(
                new LambdaQueryWrapper<ProductSource>().eq(ProductSource::getPlatformId, platformId))) {
            Product p = productMapper.selectById(s.getProductId());
            if (p != null && p.getBrandId() == null) {
                return true;
            }
        }
        return false;
    }

    private boolean hasSyncedProductWithNullCategory(Long platformId) {
        for (ProductSource s : productSourceMapper.selectList(
                new LambdaQueryWrapper<ProductSource>().eq(ProductSource::getPlatformId, platformId))) {
            Product p = productMapper.selectById(s.getProductId());
            if (p != null && p.getCategoryId() == null) {
                return true;
            }
        }
        return false;
    }

    @AfterEach
    void resetProviders() throws Exception {
        for (MockProductProvider p : List.of(jdProvider, taobaoProvider, tmallProvider)) {
            setErrorMode(p, "SUCCESS");
            setCorruptMode(p, "NONE");
            p.resetCatalog();
        }
    }

    /** 验证「jd 故障被隔离 + 其他平台继续 + 已有数据不删除」的通用断言 */
    private void assertProviderFailureIsolated(String errorMode) throws Exception {
        setErrorMode(jdProvider, "SUCCESS");
        syncService.syncAll();
        Platform jd = platform("jd");
        Platform taobao = platform("taobao");
        Platform tmall = platform("tmall");
        long jdBefore = countSource(jd.getId());
        long taobaoBefore = countSource(taobao.getId());
        long tmallBefore = countSource(tmall.getId());
        long productBefore = productMapper.selectCount(null);

        setErrorMode(jdProvider, errorMode);
        SyncResult result = syncService.syncAll();

        assertTrue(result.getFailCount() >= 1, errorMode + " 应导致 jd 失败");
        assertEquals(taobaoBefore, countSource(taobao.getId()), "淘宝应继续同步");
        assertEquals(tmallBefore, countSource(tmall.getId()), "天猫应继续同步");
        assertEquals(jdBefore, countSource(jd.getId()), "京东已有来源不应被删除");
        assertEquals(productBefore, productMapper.selectCount(null), "已有商品不应被删除");
    }

    // ==================== Provider 级异常隔离 ====================

    @Test
    void providerTimeoutIsIsolated() throws Exception {
        assertProviderFailureIsolated("TIMEOUT");
    }

    @Test
    void providerRateLimitIsIsolated() throws Exception {
        assertProviderFailureIsolated("RATE_LIMIT");
    }

    @Test
    void providerServerErrorIsIsolated() throws Exception {
        assertProviderFailureIsolated("SERVER_ERROR");
    }

    @Test
    void providerConnectionErrorIsIsolated() throws Exception {
        // 连接失败 / 非法 JSON / 未知运行时异常：Provider 直接抛异常，也应被隔离
        assertProviderFailureIsolated("CONNECTION_ERROR");
    }

    @Test
    void providerBadGatewayServiceUnavailableForbiddenIsIsolated() throws Exception {
        for (String mode : List.of("BAD_GATEWAY", "SERVICE_UNAVAILABLE", "FORBIDDEN")) {
            assertProviderFailureIsolated(mode);
        }
    }

    @Test
    void providerAuthFailureIsIsolatedWithoutLeakingCredentials() throws Exception {
        assertProviderFailureIsolated("UNAUTHORIZED");

        // 401/403 失败消息不含任何凭证关键词（同步层只记录 code + message，不记录请求头 / 凭证）
        setErrorMode(jdProvider, "UNAUTHORIZED");
        SyncResult r = syncService.syncPlatform("jd");
        assertTrue(r.getFailCount() >= 1);
        String msg = r.getMessage() == null ? "" : r.getMessage().toLowerCase();
        assertFalse(msg.contains("apikey"), "不应泄露 API Key");
        assertFalse(msg.contains("token"), "不应泄露 Token");
        assertFalse(msg.contains("secret"), "不应泄露 Secret");
        assertFalse(msg.contains("password"), "不应泄露密码");
        assertFalse(msg.contains("authorization"), "不应泄露 Authorization");
    }

    // ==================== 空数据 / null 数据处理 ====================

    @Test
    void nullResponseDoesNotDeleteExistingData() throws Exception {
        syncService.syncAll();
        Platform jd = platform("jd");
        long jdBefore = countSource(jd.getId());
        long productBefore = productMapper.selectCount(null);

        setErrorMode(jdProvider, "NULL_RESPONSE");
        SyncResult r = syncService.syncPlatform("jd");

        // null 响应视为「本次无有效数据」，不视为失败、不删除已有数据
        assertEquals(0, r.getFailCount(), "null 响应不应记为失败");
        assertEquals(0, r.getSuccessCount());
        assertEquals(jdBefore, countSource(jd.getId()));
        assertEquals(productBefore, productMapper.selectCount(null));
    }

    @Test
    void emptyResponseDoesNotDeleteExistingData() throws Exception {
        syncService.syncAll();
        Platform jd = platform("jd");
        long jdBefore = countSource(jd.getId());
        long productBefore = productMapper.selectCount(null);

        setErrorMode(jdProvider, "EMPTY");
        SyncResult r = syncService.syncPlatform("jd");

        assertEquals(0, r.getFailCount(), "空列表不应记为失败");
        assertEquals(jdBefore, countSource(jd.getId()));
        assertEquals(productBefore, productMapper.selectCount(null));
    }

    // ==================== 单商品字段缺失 / 异常隔离 ====================

    @Test
    void missingModelIsSkippedAndOthersContinue() throws Exception {
        setCorruptMode(jdProvider, "NULL_MODEL");
        SyncResult r = syncService.syncPlatform("jd");

        assertEquals(MOCK_PRODUCT_COUNT, r.getTotal());
        assertEquals(MOCK_PRODUCT_COUNT - 1, r.getSuccessCount(), "其余商品应继续同步");
        assertEquals(1, r.getSkipCount(), "缺型号的商品应被跳过");
        assertEquals(0, r.getFailCount());
    }

    @Test
    void missingExternalIdIsSkippedAndOthersContinue() throws Exception {
        setCorruptMode(jdProvider, "NULL_EXTERNAL_ID");
        SyncResult r = syncService.syncPlatform("jd");

        assertEquals(MOCK_PRODUCT_COUNT, r.getTotal());
        assertEquals(MOCK_PRODUCT_COUNT - 1, r.getSuccessCount());
        assertEquals(1, r.getSkipCount(), "缺 externalId 的商品应被跳过");
        assertEquals(0, r.getFailCount());
    }

    @Test
    void missingBrandStillSyncsWithNullBrandId() throws Exception {
        setCorruptMode(jdProvider, "NULL_BRAND");
        SyncResult r = syncService.syncPlatform("jd");

        // 品牌为可选字段：缺失不跳过、不失败，商品仍同步，brandId 保持 null
        assertEquals(MOCK_PRODUCT_COUNT, r.getSuccessCount());
        assertEquals(0, r.getSkipCount());
        assertEquals(0, r.getFailCount());
        assertTrue(hasSyncedProductWithNullBrand(platform("jd").getId()), "应有品牌为 null 的商品");
    }

    @Test
    void missingCategoryStillSyncsWithNullCategoryId() throws Exception {
        setCorruptMode(jdProvider, "NULL_CATEGORY");
        SyncResult r = syncService.syncPlatform("jd");

        assertEquals(MOCK_PRODUCT_COUNT, r.getSuccessCount());
        assertEquals(0, r.getSkipCount());
        assertEquals(0, r.getFailCount());
        assertTrue(hasSyncedProductWithNullCategory(platform("jd").getId()), "应有分类为 null 的商品");
    }

    @Test
    void missingPriceStillSyncsWithoutPrice() throws Exception {
        setCorruptMode(jdProvider, "NULL_PRICE");
        Platform jd = platform("jd");
        SyncResult r = syncService.syncPlatform("jd");

        // 价格为可选字段：缺失不跳过、不失败，商品仍同步，仅跳过报价落库
        assertEquals(MOCK_PRODUCT_COUNT, r.getSuccessCount());
        assertEquals(0, r.getSkipCount());
        assertEquals(0, r.getFailCount());

        // 缺价格的商品仍建立商品与来源记录，但 current_price 为 null 且无任何 jd 报价行
        List<ProductSource> jdSources = productSourceMapper.selectList(
                new LambdaQueryWrapper<ProductSource>().eq(ProductSource::getPlatformId, jd.getId()));
        int withoutPrice = 0;
        for (ProductSource source : jdSources) {
            Product p = productMapper.selectById(source.getProductId());
            if (p != null && p.getCurrentPrice() == null) {
                withoutPrice++;
                assertEquals(0, productPriceMapper.selectCount(
                        new LambdaQueryWrapper<ProductPrice>()
                                .eq(ProductPrice::getProductId, p.getId())
                                .eq(ProductPrice::getPlatformId, jd.getId())),
                        "缺价格的商品不应产生报价行");
            }
        }
        assertEquals(1, withoutPrice, "应恰好有 1 个商品因缺价格而无报价");
    }

    @Test
    void singleProductExceptionIsIsolated() throws Exception {
        // 型号超长导致 products.name 超过 VARCHAR(200) 而抛异常，模拟「单个商品落库失败」
        setCorruptMode(jdProvider, "LONG_NAME");
        SyncResult r = syncService.syncPlatform("jd");

        assertEquals(MOCK_PRODUCT_COUNT, r.getTotal());
        assertEquals(MOCK_PRODUCT_COUNT - 1, r.getSuccessCount(), "其余商品应继续同步");
        assertEquals(1, r.getFailCount(), "该商品应失败");
        assertEquals(0, r.getSkipCount());
    }

    // ==================== 已有数据保护 ====================

    @Test
    void existingProductPreservedOnProviderTimeout() throws Exception {
        syncService.syncAll();
        Platform jd = platform("jd");
        long jdSourceBefore = countSource(jd.getId());
        long priceBefore = productPriceMapper.selectCount(
                new LambdaQueryWrapper<ProductPrice>().eq(ProductPrice::getPlatformId, jd.getId()));
        long productBefore = productMapper.selectCount(null);

        setErrorMode(jdProvider, "TIMEOUT");
        syncService.syncAll();

        // 旧 Product / ProductSource / 价格等有效数据均保留
        assertEquals(productBefore, productMapper.selectCount(null));
        assertEquals(jdSourceBefore, countSource(jd.getId()));
        assertEquals(priceBefore, productPriceMapper.selectCount(
                new LambdaQueryWrapper<ProductPrice>().eq(ProductPrice::getPlatformId, jd.getId())));
    }

    // ==================== 幂等性未破坏 ====================

    @Test
    void idempotencyIsPreserved() {
        // 13. 重复 externalId 不产生重复来源
        Platform jd = platform("jd");
        syncService.syncPlatform("jd");
        long jdSourceCount1 = countSource(jd.getId());
        syncService.syncPlatform("jd");
        assertEquals(jdSourceCount1, countSource(jd.getId()), "重复同步不应产生重复来源");

        // 14. 相同 IdentityKey 跨平台聚合为同一 Product
        syncService.syncAll();
        ProductSource sample = productSourceMapper.selectList(null).get(0);
        long sourceCount = productSourceMapper.selectCount(
                new LambdaQueryWrapper<ProductSource>().eq(ProductSource::getProductId, sample.getProductId()));
        assertEquals(3, sourceCount, "三平台同款商品应聚合为同一 Product");
    }
}
