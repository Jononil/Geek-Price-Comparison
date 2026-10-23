package com.geekprice.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.geekprice.common.PageResult;
import com.geekprice.common.Result;
import com.geekprice.entity.Review;
import com.geekprice.entity.User;
import com.geekprice.mapper.ReviewMapper;
import com.geekprice.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
public class AdminReviewController {

    private final ReviewMapper reviewMapper;
    private final UserMapper userMapper;

    @GetMapping
    public Result<PageResult<Review>> list(@RequestParam(defaultValue = "1") Long page,
                                           @RequestParam(defaultValue = "10") Long pageSize) {
        Page<Review> result = reviewMapper.selectPage(new Page<>(page, pageSize),
                new LambdaQueryWrapper<Review>().orderByDesc(Review::getCreatedAt));
        for (Review review : result.getRecords()) {
            User user = userMapper.selectById(review.getUserId());
            if (user != null) {
                review.setNickname(user.getNickname());
            }
        }
        return Result.success(PageResult.of(result));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        reviewMapper.deleteById(id);
        return Result.success();
    }
}
