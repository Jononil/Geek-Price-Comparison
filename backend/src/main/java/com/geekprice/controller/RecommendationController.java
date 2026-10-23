package com.geekprice.controller;

import com.geekprice.common.Result;
import com.geekprice.service.RecommendationService;
import com.geekprice.vo.RecommendationVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping
    public Result<List<RecommendationVO>> recommend() {
        return Result.success(recommendationService.recommend());
    }
}
