package com.geekprice.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 商品数据来源映射（ProductSource）。
 *
 * 记录「外部平台商品 → 系统商品」的映射关系，是跨平台比价的基础：
 * 京东 / 淘宝 / 天猫三个平台的同款商品，通过各自的 ProductSource 记录指向同一个
 * systemProduct（product_id），从而支持后续聚合三家价格。
 *
 * 本实体只定义映射结构，数据由 ProductDataSyncService 依据
 * ProductIdentityKey + externalProductId + platformId 动态建立，不在初始化 SQL 中写死。
 */
@Data
@TableName("product_source")
public class ProductSource {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 系统商品 ID（products.id） */
    private Long productId;

    /** 平台 ID（platforms.id） */
    private Long platformId;

    /** 外部平台商品 ID（如 JD-100001 / TB-200001 / TM-300001） */
    private String externalProductId;

    /** 数据源 Provider 名称（MOCK_JD / MOCK_TAOBAO / MOCK_TMALL） */
    private String provider;

    /** 最近同步时间 */
    private LocalDateTime lastSyncTime;

    /** 创建时间 */
    private LocalDateTime createdAt;

    /** 更新时间 */
    private LocalDateTime updatedAt;

    /** 逻辑删除 */
    @TableLogic
    private Integer deleted;
}
