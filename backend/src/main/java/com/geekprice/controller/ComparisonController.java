package com.geekprice.controller;

import com.geekprice.common.Result;
import com.geekprice.entity.ComparisonRecord;
import com.geekprice.service.ComparisonRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/comparison")
@RequiredArgsConstructor
public class ComparisonController {

    private final ComparisonRecordService comparisonRecordService;

    @PostMapping
    public Result<Void> record(@RequestBody List<Long> productIds) {
        comparisonRecordService.record(productIds);
        return Result.success();
    }

    @GetMapping
    public Result<List<ComparisonRecord>> list() {
        return Result.success(comparisonRecordService.listByUser());
    }
}
