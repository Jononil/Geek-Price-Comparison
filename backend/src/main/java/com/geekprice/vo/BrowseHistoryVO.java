package com.geekprice.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class BrowseHistoryVO {

    private Long id;

    private Long productId;

    private LocalDateTime viewedAt;

    private String productName;

    private String image;

    private BigDecimal price;

    private Integer valueScore;
}
