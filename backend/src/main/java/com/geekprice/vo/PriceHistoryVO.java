package com.geekprice.vo;

import com.geekprice.entity.PriceHistory;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class PriceHistoryVO {

    /** 历史价格记录 */
    private List<PriceHistory> history;

    /** 当前最低价 */
    private BigDecimal currentLowest;

    /** 历史最低价 */
    private BigDecimal historyLowest;

    /** 历史最高价 */
    private BigDecimal historyHighest;

    /** 平均价格 */
    private BigDecimal averagePrice;

    /** 近期降价金额 */
    private BigDecimal recentDrop;

    /** 近期降价幅度（百分比） */
    private BigDecimal recentDropRate;
}
