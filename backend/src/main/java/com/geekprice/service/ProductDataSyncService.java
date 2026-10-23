package com.geekprice.service;

import com.geekprice.service.dto.SyncResult;

/**
 * 商品数据同步服务。
 *
 * 从各数据源 Provider（京东 / 淘宝 / 天猫的 Mock 实现）分页拉取商品，
 * 依据 {@code ProductIdentityKey} 跨平台去重后写入系统商品库：
 * products / product_prices / product_source / product_specs / product_images / price_history。
 *
 * 同步原则：
 * 1. 跨平台同款商品（品牌 + 型号 + 核心规格一致）只保留一条 Product；
 * 2. Provider 失败（408 / 429 / 404 / 500）只记录不中断，且不删除本地已有数据；
 * 3. 每个商品一个事务，单个商品失败不影响其他商品。
 */
public interface ProductDataSyncService {

    /** 同步所有已注册的数据源平台，返回聚合结果。 */
    SyncResult syncAll();

    /** 同步指定平台（jd / taobao / tmall），返回该平台的同步结果。 */
    SyncResult syncPlatform(String platformCode);
}
