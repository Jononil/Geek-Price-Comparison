package com.geekprice.controller;

import com.geekprice.common.Result;
import com.geekprice.service.ProductDataSyncService;
import com.geekprice.service.ValueScoreService;
import com.geekprice.service.dto.SyncResult;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 数据源手动同步接口（Step 9）。
 *
 * 仅管理员可访问（SecurityConfig 已对 /api/admin/** 配置 hasRole("ADMIN")）。
 * Controller 只负责「请求 → Service → 返回结果」，不直接操作数据库。
 * 手动同步复用 {@link ProductDataSyncService}，同步后触发性价比评分重算。
 */
@RestController
@RequestMapping("/api/admin/data-source")
@RequiredArgsConstructor
public class AdminDataSourceController {

    private final ProductDataSyncService syncService;
    private final ValueScoreService valueScoreService;

    /** 手动执行全平台同步 */
    @PostMapping("/sync")
    public Result<SyncResult> syncAll() {
        SyncResult result = syncService.syncAll();
        recalculateIfExecuted(result);
        return Result.success(result);
    }

    /** 手动执行指定平台同步（jd / taobao / tmall） */
    @PostMapping("/sync/{platform}")
    public Result<SyncResult> syncPlatform(@PathVariable String platform) {
        SyncResult result = syncService.syncPlatform(platform);
        recalculateIfExecuted(result);
        return Result.success(result);
    }

    /** 同步确实执行（非并发冲突跳过）时，触发既有 valueScore 重算 */
    private void recalculateIfExecuted(SyncResult result) {
        if (result != null && !result.isBusy()) {
            valueScoreService.recalculateAll();
        }
    }
}
