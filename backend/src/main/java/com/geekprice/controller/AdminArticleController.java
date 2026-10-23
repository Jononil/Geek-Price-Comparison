package com.geekprice.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.geekprice.common.PageResult;
import com.geekprice.common.Result;
import com.geekprice.entity.ReviewArticle;
import com.geekprice.mapper.ReviewArticleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/articles")
@RequiredArgsConstructor
public class AdminArticleController {

    private final ReviewArticleMapper reviewArticleMapper;

    @GetMapping
    public Result<PageResult<ReviewArticle>> list(@RequestParam(defaultValue = "1") Long page,
                                                  @RequestParam(defaultValue = "10") Long pageSize,
                                                  @RequestParam(required = false) String keyword) {
        LambdaQueryWrapper<ReviewArticle> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            wrapper.like(ReviewArticle::getTitle, keyword);
        }
        wrapper.orderByDesc(ReviewArticle::getCreatedAt);
        Page<ReviewArticle> result = reviewArticleMapper.selectPage(new Page<>(page, pageSize), wrapper);
        return Result.success(PageResult.of(result));
    }

    @PostMapping
    public Result<Void> create(@RequestBody ReviewArticle article) {
        if (article.getPublishTime() == null) {
            article.setPublishTime(LocalDateTime.now());
        }
        reviewArticleMapper.insert(article);
        return Result.success();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody ReviewArticle article) {
        article.setId(id);
        reviewArticleMapper.updateById(article);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        reviewArticleMapper.deleteById(id);
        return Result.success();
    }

    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        ReviewArticle article = new ReviewArticle();
        article.setId(id);
        article.setStatus(status);
        reviewArticleMapper.updateById(article);
        return Result.success();
    }
}
