package com.geekprice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.entity.Platform;
import com.geekprice.entity.PriceHistory;
import com.geekprice.entity.ProductSource;
import com.geekprice.mapper.PlatformMapper;
import com.geekprice.mapper.PriceHistoryMapper;
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
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.springframework.test.context.ActiveProfiles;

/**
 * 价格历史 集成测试（Step 12）。
 *
 * 验证价格历史记录的保存、去重、幂等与数据保护：
 * 1. 首次出现价格正确记录；2. 价格不变 / 重复同步不产生重复历史；3. 多平台历史彼此独立；
 * 4. 精度一致（5999 / 5999.00）、同日同价幂等、价格变化新增、非法负数跳过；
 * 5. 历史缺失不删除已有历史。
 *
 * 通过 MockProductProvider 的 CUSTOM_HISTORY / NULL_HISTORY 故障注入验证 ProductSyncWriter 的历史去重与隔离。
 */
@SpringBootTest
@Transactional
@ActiveProfiles("test")
class PriceHistorySyncTest {

    private static final int MOCK_PRODUCT_COUNT = 50;

    @Autowired
    private ProductDataSyncService syncService;
    @Autowired
    private PriceHistoryMapper priceHistoryMapper;
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

    // ===== 测试 1：产品首次出现价格时正确记录历史 =====

    @Test
    void firstSyncRecordsHistory() {
        Platform jd = platform("jd");
        syncService.syncPlatform("jd");
        Long productId = productSourceMapper.selectList(
                new LambdaQueryWrapper<ProductSource>().eq(ProductSource::getPlatformId, jd.getId()))
                .get(0).getProductId();
        long count = priceHistoryMapper.selectCount(
                new LambdaQueryWrapper<PriceHistory>()
                        .eq(PriceHistory::getProductId, productId)
                        .eq(PriceHistory::getPlatformId, jd.getId()));
        assertTrue(count > 0, "首次同步应记录价格历史");
    }

    // ===== 测试 2：价格不变 / 重复同步不产生重复历史 =====

    @Test
    void resyncDoesNotDuplicateHistory() {
        Platform jd = platform("jd");
        syncService.syncPlatform("jd");
        Long productId = productSourceMapper.selectList(
                new LambdaQueryWrapper<ProductSource>().eq(ProductSource::getPlatformId, jd.getId()))
                .get(0).getProductId();
        long before = priceHistoryMapper.selectCount(
                new LambdaQueryWrapper<PriceHistory>()
                        .eq(PriceHistory::getProductId, productId)
                        .eq(PriceHistory::getPlatformId, jd.getId()));

        syncService.syncPlatform("jd");

        long after = priceHistoryMapper.selectCount(
                new LambdaQueryWrapper<PriceHistory>()
                        .eq(PriceHistory::getProductId, productId)
                        .eq(PriceHistory::getPlatformId, jd.getId()));
        assertEquals(before, after, "价格不变时重复同步不应产生重复历史");
    }

    // ===== 测试 3：多平台价格历史彼此独立 =====

    @Test
    void multiPlatformHistoryIsolated() {
        syncService.syncAll();
        Long productId = productSourceMapper.selectList(null).get(0).getProductId();
        List<PriceHistory> history = priceHistoryMapper.selectList(
                new LambdaQueryWrapper<PriceHistory>().eq(PriceHistory::getProductId, productId));
        Set<Long> platformIds = history.stream()
                .map(PriceHistory::getPlatformId)
                .collect(Collectors.toSet());
        assertEquals(3, platformIds.size(), "三平台价格历史应彼此独立");
        for (Long platformId : platformIds) {
            assertTrue(priceHistoryMapper.selectCount(
                    new LambdaQueryWrapper<PriceHistory>()
                            .eq(PriceHistory::getProductId, productId)
                            .eq(PriceHistory::getPlatformId, platformId)) > 0,
                    "每平台都应有价格历史");
        }
    }

    // ===== 测试 4：精度一致 / 同日同价幂等 / 价格变化新增 / 非法负数跳过 =====

    @Test
    void precisionAndPriceChangeDedup() throws Exception {
        Platform jd = platform("jd");
        setCorruptMode(jdProvider, "CUSTOM_HISTORY");
        SyncResult r = syncService.syncPlatform("jd");

        assertEquals(MOCK_PRODUCT_COUNT, r.getSuccessCount(), "注入受控历史不应导致同步失败");
        assertEquals(0, r.getFailCount());

        // 用唯一标记价 88888 定位被注入的商品
        List<PriceHistory> markers = priceHistoryMapper.selectList(
                new LambdaQueryWrapper<PriceHistory>().eq(PriceHistory::getPrice, new BigDecimal("88888")));
        assertEquals(1, markers.size(), "价格变化点应恰好一条");
        Long productId = markers.get(0).getProductId();

        // 5999 与 5999.00 同日同价：只保留一条（精度一致）
        assertEquals(1, priceHistoryMapper.selectCount(
                new LambdaQueryWrapper<PriceHistory>()
                        .eq(PriceHistory::getProductId, productId)
                        .eq(PriceHistory::getPlatformId, jd.getId())
                        .eq(PriceHistory::getRecordDate, LocalDate.of(2000, 1, 1))),
                "5999 与 5999.00 同日同价应只记录一条");

        // 价格变化（5999 -> 88888）新增一条
        assertEquals(1, priceHistoryMapper.selectCount(
                new LambdaQueryWrapper<PriceHistory>()
                        .eq(PriceHistory::getProductId, productId)
                        .eq(PriceHistory::getPlatformId, jd.getId())
                        .eq(PriceHistory::getRecordDate, LocalDate.of(2000, 1, 2))),
                "价格变化应新增一条历史");

        // 负数 / 缺失价格 / 缺失日期 均不产生记录
        assertEquals(0, priceHistoryMapper.selectCount(
                new LambdaQueryWrapper<PriceHistory>()
                        .eq(PriceHistory::getProductId, productId)
                        .eq(PriceHistory::getPlatformId, jd.getId())
                        .lt(PriceHistory::getPrice, BigDecimal.ZERO)),
                "负数价格不应产生历史");
    }

    // ===== 测试 5：历史缺失不删除已有历史 =====

    @Test
    void missingHistoryPreservesExisting() throws Exception {
        Platform jd = platform("jd");
        syncService.syncPlatform("jd");
        long before = priceHistoryMapper.selectCount(
                new LambdaQueryWrapper<PriceHistory>().eq(PriceHistory::getPlatformId, jd.getId()));

        setCorruptMode(jdProvider, "NULL_HISTORY");
        SyncResult r = syncService.syncPlatform("jd");

        assertEquals(MOCK_PRODUCT_COUNT, r.getSuccessCount(), "历史缺失不应导致同步失败");
        assertEquals(before, priceHistoryMapper.selectCount(
                new LambdaQueryWrapper<PriceHistory>().eq(PriceHistory::getPlatformId, jd.getId())),
                "历史缺失不应删除已有历史");
    }
}
