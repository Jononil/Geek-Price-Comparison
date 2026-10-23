package com.geekprice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewCommentDTO {

    @NotNull(message = "评价不能为空")
    private Long reviewId;

    @NotBlank(message = "评论内容不能为空")
    private String content;
}
