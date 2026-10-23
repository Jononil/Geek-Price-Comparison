package com.geekprice.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("price_history")
public class PriceHistory {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long productId;

    private Long platformId;

    private BigDecimal price;

    private LocalDate recordDate;

    private String source;

    private LocalDateTime createdAt;

    /** 平台名称（非表字段） */
    @TableField(exist = false)
    private String platformName;
}
