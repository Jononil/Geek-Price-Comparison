package com.geekprice.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("comparison_records")
public class ComparisonRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String productIds;

    private LocalDateTime createdAt;
}
