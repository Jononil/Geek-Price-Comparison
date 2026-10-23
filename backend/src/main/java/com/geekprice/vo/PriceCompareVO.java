package com.geekprice.vo;

import com.geekprice.entity.ProductPrice;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class PriceCompareVO {

    /** 各平台价格列表 */
    private List<ProductPrice> prices;

    /** 全网最低价 */
    private BigDecimal lowestPrice;

    private Long lowestPlatformId;

    private String lowestPlatformName;

    /** 全网最高价 */
    private BigDecimal highestPrice;

    /** 价格差（最高 - 最低） */
    private BigDecimal priceDiff;

    /** 相比最高价节省金额 */
    private BigDecimal saveAmount;
}
