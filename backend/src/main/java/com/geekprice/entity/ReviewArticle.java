package com.geekprice.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("review_articles")
public class ReviewArticle {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String title;

    private String cover;

    private Long productId;

    private String author;

    private String summary;

    private String content;

    private BigDecimal score;

    private BigDecimal performanceScore;

    private BigDecimal appearanceScore;

    private BigDecimal screenScore;

    private BigDecimal batteryScore;

    private String experience;

    private String pros;

    private String cons;

    private Integer views;

    private Integer likes;

    private Integer status;

    private LocalDateTime publishTime;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;

    /** 产品名称（非表字段） */
    @TableField(exist = false)
    private String productName;
}
