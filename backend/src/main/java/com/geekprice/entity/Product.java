package com.geekprice.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@TableName("products")
public class Product {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;

    private Long brandId;

    private Long categoryId;

    private String description;

    private BigDecimal officialPrice;

    private BigDecimal currentPrice;

    private BigDecimal score;

    private Integer valueScore;

    private Integer performanceScore;

    private BigDecimal userRating;

    private Integer sales;

    private Integer heat;

    private LocalDate launchDate;

    private Integer status;

    private Integer isRecommend;

    private Integer isHot;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;

    // ---- 以下为非表字段，由 service 组装 ----

    @TableField(exist = false)
    private String brandName;

    @TableField(exist = false)
    private String categoryName;

    @TableField(exist = false)
    private List<String> tags;

    @TableField(exist = false)
    private List<ProductSpec> specs;

    @TableField(exist = false)
    private List<String> images;

    /** 图片署名信息（仅含审核通过的图片，与 images 按 url 对应） */
    @TableField(exist = false)
    private List<com.geekprice.vo.ImageAttributionVO> imagesAttribution;

    @TableField(exist = false)
    private List<Review> reviews;

    @TableField(exist = false)
    private List<ReviewArticle> articles;
}
