package com.geekprice.config;

import com.geekprice.service.ProductDataSyncService;
import com.geekprice.service.ValueScoreService;
import com.geekprice.service.dto.SyncResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 数据同步定时任务（Step 9）。
 *
 * 每天凌晨 03:00（由 product.sync.cron 配置）自动执行一次全平台同步，
 * 同步完成后触发既有 valueScore 重算。开关 product.sync.enabled=false 时跳过。
 *
 * 同步核心逻辑复用 {@link ProductDataSyncService#syncAll()}，
 * 不另起一套 Provider / DTO / Standardizer / Writer 同步链路。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProductSyncScheduler {

    private final ProductDataSyncService syncService;
    private final ValueScoreService valueScoreService;
    private final ProductSyncProperties properties;

    /** 每日定时全平台同步；cron 从配置读取，禁止硬编码到注解 */
    @Scheduled(cron = "${product.sync.cron:0 0 3 * * ?}")
    public void scheduledSync() {
        if (!properties.isEnabled()) {
            log.info("自动同步已关闭（product.sync.enabled=false），跳过本次定时同步");
            return;
        }
        if (!properties.isMockEnabled()) {
            log.info("演示环境策略：product.sync.mock-enabled=false，跳过本次定时 Mock 同步");
            return;
        }
        log.info("定时同步任务开始");
        SyncResult result = syncService.syncAll();
        log.info("定时同步任务结束 total={} success={} fail={} skip={} busy={}",
                result.getTotal(), result.getSuccessCount(), result.getFailCount(),
                result.getSkipCount(), result.isBusy());
        // 同步确实执行了才触发性价比评分重算（并发冲突跳过时不重算）
        if (!result.isBusy()) {
            valueScoreService.recalculateAll();
        }
    }
}
