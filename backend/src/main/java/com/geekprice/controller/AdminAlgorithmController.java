package com.geekprice.controller;

import com.geekprice.common.Result;
import com.geekprice.entity.AlgorithmConfig;
import com.geekprice.mapper.AlgorithmConfigMapper;
import com.geekprice.service.ValueScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/algorithm")
@RequiredArgsConstructor
public class AdminAlgorithmController {

    private final AlgorithmConfigMapper algorithmConfigMapper;
    private final ValueScoreService valueScoreService;

    @GetMapping
    public Result<List<AlgorithmConfig>> list() {
        return Result.success(algorithmConfigMapper.selectList(null));
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody AlgorithmConfig config) {
        config.setId(id);
        algorithmConfigMapper.updateById(config);
        return Result.success();
    }

    @PostMapping("/recalculate")
    public Result<Void> recalculate() {
        valueScoreService.recalculateAll();
        return Result.success();
    }
}
