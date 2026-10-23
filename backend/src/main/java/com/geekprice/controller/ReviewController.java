package com.geekprice.controller;

import com.geekprice.common.PageResult;
import com.geekprice.common.Result;
import com.geekprice.dto.ReviewCommentDTO;
import com.geekprice.dto.ReviewCreateDTO;
import com.geekprice.entity.Review;
import com.geekprice.entity.ReviewComment;
import com.geekprice.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/product/{productId}")
    public Result<PageResult<Review>> listByProduct(@PathVariable Long productId,
                                                    @RequestParam(defaultValue = "1") Long page,
                                                    @RequestParam(defaultValue = "10") Long pageSize) {
        return Result.success(reviewService.listByProduct(productId, page, pageSize));
    }

    @PostMapping
    public Result<Void> create(@Valid @RequestBody ReviewCreateDTO dto) {
        reviewService.create(dto);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        reviewService.delete(id);
        return Result.success();
    }

    @PostMapping("/{id}/like")
    public Result<Void> like(@PathVariable Long id) {
        reviewService.like(id);
        return Result.success();
    }

    @GetMapping("/{id}/comments")
    public Result<List<ReviewComment>> comments(@PathVariable Long id) {
        return Result.success(reviewService.comments(id));
    }

    @PostMapping("/comment")
    public Result<Void> comment(@Valid @RequestBody ReviewCommentDTO dto) {
        reviewService.comment(dto);
        return Result.success();
    }
}
