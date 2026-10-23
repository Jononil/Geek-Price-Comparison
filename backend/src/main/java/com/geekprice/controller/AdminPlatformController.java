package com.geekprice.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.common.Result;
import com.geekprice.entity.Platform;
import com.geekprice.mapper.PlatformMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/platforms")
@RequiredArgsConstructor
public class AdminPlatformController {

    private final PlatformMapper platformMapper;

    @GetMapping
    public Result<List<Platform>> list() {
        return Result.success(platformMapper.selectList(
                new LambdaQueryWrapper<Platform>().orderByAsc(Platform::getId)));
    }

    @PostMapping
    public Result<Void> create(@RequestBody Platform platform) {
        platformMapper.insert(platform);
        return Result.success();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Platform platform) {
        platform.setId(id);
        platformMapper.updateById(platform);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        platformMapper.deleteById(id);
        return Result.success();
    }
}
