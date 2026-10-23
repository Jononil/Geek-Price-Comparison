package com.geekprice.controller;

import com.geekprice.common.Result;
import com.geekprice.service.BrowseHistoryService;
import com.geekprice.vo.BrowseHistoryVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class BrowseHistoryController {

    private final BrowseHistoryService browseHistoryService;

    @PostMapping("/{productId}")
    public Result<Void> record(@PathVariable Long productId) {
        browseHistoryService.record(productId);
        return Result.success();
    }

    @GetMapping
    public Result<List<BrowseHistoryVO>> list(@RequestParam(defaultValue = "20") Integer limit) {
        return Result.success(browseHistoryService.listByUser(limit));
    }

    @DeleteMapping
    public Result<Void> clear() {
        browseHistoryService.clear();
        return Result.success();
    }
}
