package com.geekprice.controller;

import com.geekprice.common.Result;
import com.geekprice.service.PriceService;
import com.geekprice.vo.PriceCompareVO;
import com.geekprice.vo.PriceHistoryVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/prices")
@RequiredArgsConstructor
public class PriceController {

    private final PriceService priceService;

    @GetMapping("/compare/{productId}")
    public Result<PriceCompareVO> compare(@PathVariable Long productId) {
        return Result.success(priceService.compare(productId));
    }

    @GetMapping("/history/{productId}")
    public Result<PriceHistoryVO> history(@PathVariable Long productId,
                                          @RequestParam(required = false) Long platformId) {
        return Result.success(priceService.history(productId, platformId));
    }
}
