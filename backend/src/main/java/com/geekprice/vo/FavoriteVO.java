package com.geekprice.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class FavoriteVO {

    private Long id;

    private Integer targetType;

    private Long targetId;

    private LocalDateTime createdAt;

    /** 目标名称（产品名或测评标题） */
    private String name;

    private String image;

    private BigDecimal price;

    private Integer valueScore;
}
