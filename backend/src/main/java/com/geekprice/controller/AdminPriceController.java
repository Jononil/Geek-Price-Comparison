package com.geekprice.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.common.Result;
import com.geekprice.entity.Platform;
import com.geekprice.entity.PriceHistory;
import com.geekprice.entity.ProductPrice;
import com.geekprice.mapper.PlatformMapper;
import com.geekprice.mapper.PriceHistoryMapper;
import com.geekprice.mapper.ProductPriceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/prices")
@RequiredArgsConstructor
public class AdminPriceController {

    private final ProductPriceMapper productPriceMapper;
    private final PriceHistoryMapper priceHistoryMapper;
    private final PlatformMapper platformMapper;

    @GetMapping
    public Result<List<ProductPrice>> list(@RequestParam Long productId) {
        List<ProductPrice> prices = productPriceMapper.selectList(new LambdaQueryWrapper<ProductPrice>()
                .eq(ProductPrice::getProductId, productId)
                .orderByAsc(ProductPrice::getPrice));
        for (ProductPrice price : prices) {
            Platform platform = platformMapper.selectById(price.getPlatformId());
            price.setPlatformName(platform != null ? platform.getName() : null);
        }
        return Result.success(prices);
    }

    /**
     * 录入/更新价格：写入当前价格并自动生成一条历史价格记录
     */
    @PostMapping
    public Result<Void> create(@RequestBody ProductPrice price) {
        productPriceMapper.insert(price);

        PriceHistory history = new PriceHistory();
        history.setProductId(price.getProductId());
        history.setPlatformId(price.getPlatformId());
        history.setPrice(price.getPrice());
        history.setRecordDate(LocalDate.now());
        history.setSource("admin");
        priceHistoryMapper.insert(history);
        return Result.success();
    }
}
