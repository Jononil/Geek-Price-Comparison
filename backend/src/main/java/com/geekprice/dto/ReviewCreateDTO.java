package com.geekprice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewCreateDTO {

    @NotNull(message = "产品不能为空")
    private Long productId;

    @NotNull(message = "星级不能为空")
    @Min(value = 1, message = "星级最小为 1")
    @Max(value = 5, message = "星级最大为 5")
    private Integer star;

    @NotBlank(message = "评论内容不能为空")
    private String content;
}
