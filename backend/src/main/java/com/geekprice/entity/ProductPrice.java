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
@TableName("product_prices")
public class ProductPrice {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long productId;

    private Long platformId;

    private String title;

    private String url;

    private BigDecimal price;

    private BigDecimal originalPrice;

    private BigDecimal discount;

    private String shopName;

    private Integer isOfficial;

    private Integer stockStatus;

    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;

    /** 平台名称（非表字段） */
    @TableField(exist = false)
    private String platformName;
}
