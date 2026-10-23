package com.geekprice.service.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 商品数据同步结果。
 *
 * 记录一次同步（全量或单平台）的执行统计，供定时任务日志与接口返回使用。
 * total / successCount / failCount / syncTime 为 Step 6 要求的核心字段，
 * skipCount 为 Step 8 新增（缺少必要字段被跳过的商品数），
 * platformCode / message 用于定位平台与描述失败原因。
 */
@Data
public class SyncResult {

    /** 平台编码（syncPlatform 单平台同步时填充；syncAll 聚合时为 null） */
    private String platformCode;

    /** 本次拉取到的商品总数 */
    private int total;

    /** 成功同步（新建或更新）的商品数 */
    private int successCount;

    /** 失败的商品数（平台级拉取失败记 1） */
    private int failCount;

    /** 跳过的商品数（缺少必要字段无法建立商品身份，如 externalId / 型号缺失） */
    private int skipCount;

    /** 并发保护标记：true 表示已有同步任务正在执行，本次调用未实际执行同步 */
    private boolean busy;

    /** 结果描述（成功 / 失败原因） */
    private String message;

    /** 同步时间 */
    private LocalDateTime syncTime;
}
