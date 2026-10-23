package com.geekprice.service;

import com.geekprice.config.ProductSyncProperties;
import com.geekprice.config.ProductSyncScheduler;
import com.geekprice.service.dto.SyncResult;
import com.geekprice.service.ValueScoreService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import org.springframework.test.context.ActiveProfiles;

/**
 * 数据同步定时任务测试（Step 9 修订版）。
 *
 * 根因修复：原测试直接调用真实 syncService.syncPlatform()，导致写入真实开发库
 * 且外层事务无法回滚（ProductSyncWriter.syncOneProduct 有独立事务边界）。
 * 现在改用 Mockito 模拟 ProductDataSyncService，只验证调度器行为：
 *
 * 1. enabled=true 时调度器调用 syncService.syncAll()；
 * 2. enabled=false 时调度器跳过，不调用 syncService；
 * 3. cron 从配置读取（@Scheduled 占位符非硬编码）；
 * 4. 同步完成后触发 valueScore 重算；
 * 5. mock-enabled=false 时调度器跳过，不调用 syncService；
 * 6. mock-enabled=true 时调度器调用 syncService。
 *
 * 本测试不写入任何业务数据，可安全在开发库上运行。
 */
@SpringBootTest
@Transactional
@TestPropertySource(properties = "product.sync.mock-enabled=true")
@ActiveProfiles("test")
class ProductSyncSchedulerTest {

    @Autowired
    private ProductSyncScheduler scheduler;
    @Autowired
    private ProductSyncProperties properties;

    @MockBean
    private ProductDataSyncService syncService;
    @MockBean
    private ValueScoreService valueScoreService;

    private SyncResult okResult() {
        SyncResult r = new SyncResult();
        r.setTotal(150); r.setSuccessCount(150); r.setFailCount(0); r.setSkipCount(0);
        r.setBusy(false);
        return r;
    }

    // ===== 测试 1：enabled=true 时定时同步调用 syncAll =====

    @Test
    void scheduledSyncRunsWhenEnabled() {
        properties.setEnabled(true);
        properties.setMockEnabled(true);
        when(syncService.syncAll()).thenReturn(okResult());

        scheduler.scheduledSync();

        verify(syncService, times(1)).syncAll();
        verify(valueScoreService, times(1)).recalculateAll();
    }

    // ===== 测试 2：enabled=false 时定时同步跳过，不调用 syncService =====

    @Test
    void scheduledSyncSkipsWhenDisabled() {
        properties.setEnabled(false);

        scheduler.scheduledSync();

        verify(syncService, never()).syncAll();
        verify(valueScoreService, never()).recalculateAll();
    }

    // ===== 测试 3：cron 从配置读取，不硬编码 =====

    @Test
    void cronIsConfigDriven() throws Exception {
        assertTrue(properties.isEnabled(), "enabled 应从配置绑定为 true");
        assertEquals("0 0 3 * * ?", properties.getCron(), "cron 应从配置绑定");

        Method method = ProductSyncScheduler.class.getDeclaredMethod("scheduledSync");
        Scheduled scheduled = method.getAnnotation(Scheduled.class);
        assertNotNull(scheduled, "scheduledSync 应标注 @Scheduled");
        assertTrue(scheduled.cron().contains("${"),
                "@Scheduled 的 cron 应使用配置占位符而非硬编码");
    }

    // ===== 测试 4：同步完成后触发 valueScore 重算 =====

    @Test
    void valueScoreRecalculatedAfterSync() {
        properties.setEnabled(true);
        properties.setMockEnabled(true);
        when(syncService.syncAll()).thenReturn(okResult());

        scheduler.scheduledSync();

        verify(valueScoreService, times(1)).recalculateAll();
    }

    // ===== 测试 5：mock-enabled=false 时调度器跳过 =====

    @Test
    void scheduledSyncSkipsWhenMockDisabled() {
        properties.setEnabled(true);
        properties.setMockEnabled(false);

        scheduler.scheduledSync();

        verify(syncService, never()).syncAll();
        verify(valueScoreService, never()).recalculateAll();
    }

    // ===== 测试 6：mock-enabled=true 时调度器正常调用 =====

    @Test
    void scheduledSyncRunsWhenMockEnabled() {
        properties.setEnabled(true);
        properties.setMockEnabled(true);
        when(syncService.syncAll()).thenReturn(okResult());

        scheduler.scheduledSync();

        verify(syncService, times(1)).syncAll();
    }
}
