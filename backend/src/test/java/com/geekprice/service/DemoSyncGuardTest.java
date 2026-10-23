package com.geekprice.service;

import com.geekprice.exception.BusinessException;
import com.geekprice.mapper.ProductMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.springframework.test.context.ActiveProfiles;

/**
 * 演示环境保护测试：product.sync.mock-enabled=false 时，
 * 后端在服务层拦截一切 Mock 数据源同步（定时 + 手动全平台 + 手动单平台），
 * 返回明确业务异常（403）而非伪装成功；开发环境能力由既有
 * ProductDataSyncServiceTest / ProductSyncSchedulerTest 覆盖（默认开启）。
 */
@SpringBootTest
@Transactional
@TestPropertySource(properties = "product.sync.mock-enabled=false")
@ActiveProfiles("test")
class DemoSyncGuardTest {

    @Autowired
    private ProductDataSyncService syncService;

    @Autowired
    private ProductMapper productMapper;

    @Test
    void mockSyncAllBlockedInDemoMode() {
        BusinessException ex = assertThrows(BusinessException.class, syncService::syncAll,
                "mock-enabled=false 时全平台同步应被后端拦截");
        assertEquals(403, ex.getCode(), "拦截应返回 403 语义");
        assertTrue(ex.getMessage().contains("演示环境已禁用 Mock 数据同步"),
                "错误信息应说明被演示环境策略拦截，实际：" + ex.getMessage());
    }

    @Test
    void mockSyncPlatformBlockedInDemoMode() {
        BusinessException ex = assertThrows(BusinessException.class,
                () -> syncService.syncPlatform("jd"),
                "mock-enabled=false 时单平台同步也应被后端拦截");
        assertEquals(403, ex.getCode());
        assertTrue(ex.getMessage().contains("演示环境已禁用 Mock 数据同步"));
    }

    @Test
    void guardBlocksAllPlatformsWithoutAnyDataWrite() {
        // 拦截发生在服务层入口：即使管理员（ADMIN 角色）调用接口也无法绕过
        // （接口层无额外放行逻辑；此测试验证服务层是最终防线）
        long before = productMapper.selectCount(null);
        assertThrows(BusinessException.class, syncService::syncAll);
        assertThrows(BusinessException.class, () -> syncService.syncPlatform("jd"));
        assertThrows(BusinessException.class, () -> syncService.syncPlatform("taobao"));
        assertThrows(BusinessException.class, () -> syncService.syncPlatform("tmall"));
        assertEquals(before, productMapper.selectCount(null), "拦截后商品数量不应变化");
    }
}
