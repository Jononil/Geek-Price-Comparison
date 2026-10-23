package com.geekprice.controller;

import com.geekprice.common.PageResult;
import com.geekprice.common.Result;
import com.geekprice.entity.ReviewArticle;
import com.geekprice.service.ReviewArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/articles")
@RequiredArgsConstructor
public class ReviewArticleController {

    private final ReviewArticleService reviewArticleService;

    @GetMapping
    public Result<PageResult<ReviewArticle>> list(@RequestParam(defaultValue = "1") Long page,
                                                  @RequestParam(defaultValue = "10") Long pageSize,
                                                  @RequestParam(required = false) Long productId) {
        return Result.success(reviewArticleService.list(page, pageSize, productId));
    }

    @GetMapping("/{id}")
    public Result<ReviewArticle> detail(@PathVariable Long id) {
        return Result.success(reviewArticleService.detail(id));
    }

    @PostMapping("/{id}/like")
    public Result<Void> like(@PathVariable Long id) {
        reviewArticleService.like(id);
        return Result.success();
    }
}
