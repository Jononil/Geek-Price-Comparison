package com.geekprice.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.common.Result;
import com.geekprice.entity.Brand;
import com.geekprice.mapper.BrandMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/brands")
@RequiredArgsConstructor
public class BrandController {

    private final BrandMapper brandMapper;

    @GetMapping
    public Result<List<Brand>> list() {
        List<Brand> list = brandMapper.selectList(new LambdaQueryWrapper<Brand>()
                .eq(Brand::getStatus, 1)
                .orderByAsc(Brand::getId));
        return Result.success(list);
    }
}
