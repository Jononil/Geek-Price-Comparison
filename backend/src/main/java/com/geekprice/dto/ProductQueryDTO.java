package com.geekprice.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductQueryDTO {

    private String keyword;

    private Long categoryId;

    private Long brandId;

    private Long tagId;

    private BigDecimal minPrice;

    private BigDecimal maxPrice;

    private Integer minValueScore;

    private BigDecimal minRating;

    /** 排序：valueScore / priceAsc / priceDesc / rating / heat / newest */
    private String sort;

    private Long page = 1L;

    private Long pageSize = 12L;
}
