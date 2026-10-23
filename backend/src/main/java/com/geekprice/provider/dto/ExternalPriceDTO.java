package com.geekprice.provider.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 外部价格点（历史价格）。
 *
 * 模拟第三方 API 返回的「某平台某商品在某个日期的价格」，
 * 后续由 ProductStandardizer 转换为 PriceHistory 实体。
 */
@Data
public class ExternalPriceDTO {

    /** 价格 */
    private BigDecimal price;

    /** 记录日期 */
    private LocalDate date;

    /** 促销节点：618 / 双11 / 双12 / 新品首发 / 春节促销 / 常规 */
    private String event;
}
