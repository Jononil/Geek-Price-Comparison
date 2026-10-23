package com.geekprice.controller;

import com.geekprice.common.PageResult;
import com.geekprice.common.Result;
import com.geekprice.service.FavoriteService;
import com.geekprice.vo.FavoriteVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @PostMapping("/{targetType}/{targetId}")
    public Result<Void> add(@PathVariable Integer targetType, @PathVariable Long targetId) {
        favoriteService.add(targetType, targetId);
        return Result.success();
    }

    @DeleteMapping("/{targetType}/{targetId}")
    public Result<Void> remove(@PathVariable Integer targetType, @PathVariable Long targetId) {
        favoriteService.remove(targetType, targetId);
        return Result.success();
    }

    @GetMapping
    public Result<PageResult<FavoriteVO>> list(@RequestParam(defaultValue = "1") Long page,
                                               @RequestParam(defaultValue = "10") Long pageSize) {
        return Result.success(favoriteService.listByUser(page, pageSize));
    }
}
