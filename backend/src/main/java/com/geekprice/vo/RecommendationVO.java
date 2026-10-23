package com.geekprice.vo;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class RecommendationVO {

    private Long productId;

    private String name;

    private String image;

    private BigDecimal price;

    private Integer valueScore;

    /** 推荐分数（0-100） */
    private Double score;

    private String reason;

    /** 推荐类型：hybrid / value / hot / new / discount */
    private String type;
}
