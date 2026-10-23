package com.geekprice.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("algorithm_configs")
public class AlgorithmConfig {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 分类ID，0 为全局默认 */
    private Long categoryId;

    private BigDecimal performanceWeight;

    private BigDecimal functionWeight;

    private BigDecimal userRatingWeight;

    private BigDecimal priceWeight;

    private BigDecimal heatWeight;

    private LocalDateTime updatedAt;
}
