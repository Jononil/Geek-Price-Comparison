package com.geekprice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.entity.Platform;
import com.geekprice.entity.ProductSource;
import com.geekprice.entity.ProductSpec;
import com.geekprice.mapper.PlatformMapper;
import com.geekprice.mapper.ProductSourceMapper;
import com.geekprice.mapper.ProductSpecMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.springframework.test.context.ActiveProfiles;

/**
 * 规格参数标准化 集成测试（Step 10）。
 *
 * 验证标准化贯穿同步链路（ProductStandardizer -> ProductSyncWriter -> 同步服务）：
 * 1. 同步后笔记本「CPU」键被统一为「处理器」（字段名统一落地到数据库）；
 * 2. 重复同步不产生重复规格数据（syncSpecs 按 product_id + spec_key 去重）。
 */
@SpringBootTest
@Transactional
@ActiveProfiles("test")
class ProductSpecSyncTest {

    @Autowired
    private ProductDataSyncService syncService;
    @Autowired
    private ProductSpecMapper productSpecMapper;
    @Autowired
    private ProductSourceMapper productSourceMapper;
    @Autowired
    private PlatformMapper platformMapper;

    private Platform platform(String code) {
        return platformMapper.selectOne(new LambdaQueryWrapper<Platform>().eq(Platform::getCode, code));
    }

    // ===== 测试 1：同步后规格键被标准化（CPU -> 处理器） =====

    @Test
    void syncedSpecKeysAreStandardized() {
        syncService.syncPlatform("jd");

        // 这三个值仅存在于「CPU」键下（笔记本类商品），同步后应统一到「处理器」键
        for (String cpu : List.of("酷睿i9-14900HX", "锐龙7 8845H", "酷睿i7-14650HX")) {
            long normalized = productSpecMapper.selectCount(
                    new LambdaQueryWrapper<ProductSpec>()
                            .eq(ProductSpec::getSpecKey, "处理器")
                            .eq(ProductSpec::getSpecValue, cpu));
            assertTrue(normalized > 0, "CPU 值「" + cpu + "」应标准化为 处理器 键");
        }
    }

    // ===== 测试 2：重复同步不产生重复规格数据 =====

    @Test
    void resyncDoesNotDuplicateSpecs() {
        Platform jd = platform("jd");
        syncService.syncPlatform("jd");
        ProductSource source = productSourceMapper.selectList(
                new LambdaQueryWrapper<ProductSource>().eq(ProductSource::getPlatformId, jd.getId())).get(0);
        Long productId = source.getProductId();
        long before = productSpecMapper.selectCount(
                new LambdaQueryWrapper<ProductSpec>().eq(ProductSpec::getProductId, productId));

        // 价格 / 规格均不变，重同步
        syncService.syncPlatform("jd");

        long after = productSpecMapper.selectCount(
                new LambdaQueryWrapper<ProductSpec>().eq(ProductSpec::getProductId, productId));
        assertEquals(before, after, "重复同步不应产生重复规格数据");
    }
}
