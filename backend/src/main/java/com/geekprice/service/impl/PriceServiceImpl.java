package com.geekprice.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.entity.Platform;
import com.geekprice.entity.PriceHistory;
import com.geekprice.entity.ProductPrice;
import com.geekprice.mapper.PlatformMapper;
import com.geekprice.mapper.PriceHistoryMapper;
import com.geekprice.mapper.ProductPriceMapper;
import com.geekprice.service.PriceService;
import com.geekprice.vo.PriceCompareVO;
import com.geekprice.vo.PriceHistoryVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PriceServiceImpl implements PriceService {

    private final ProductPriceMapper productPriceMapper;
    private final PriceHistoryMapper priceHistoryMapper;
    private final PlatformMapper platformMapper;

    @Override
    public PriceCompareVO compare(Long productId) {
        List<ProductPrice> prices = productPriceMapper.selectList(new LambdaQueryWrapper<ProductPrice>()
                .eq(ProductPrice::getProductId, productId)
                .isNotNull(ProductPrice::getPrice)
                .orderByAsc(ProductPrice::getPrice));
        for (ProductPrice p : prices) {
            Platform platform = platformMapper.selectById(p.getPlatformId());
            p.setPlatformName(platform != null ? platform.getName() : null);
        }

        PriceCompareVO vo = new PriceCompareVO();
        vo.setPrices(prices);
        if (prices.isEmpty()) {
            vo.setLowestPrice(BigDecimal.ZERO);
            vo.setHighestPrice(BigDecimal.ZERO);
            vo.setPriceDiff(BigDecimal.ZERO);
            vo.setSaveAmount(BigDecimal.ZERO);
            return vo;
        }
        ProductPrice lowest = prices.get(0);
        ProductPrice highest = prices.get(prices.size() - 1);
        vo.setLowestPrice(lowest.getPrice());
        vo.setLowestPlatformId(lowest.getPlatformId());
        vo.setLowestPlatformName(lowest.getPlatformName());
        vo.setHighestPrice(highest.getPrice());
        vo.setPriceDiff(highest.getPrice().subtract(lowest.getPrice()));
        vo.setSaveAmount(highest.getPrice().subtract(lowest.getPrice()));
        return vo;
    }

    @Override
    public PriceHistoryVO history(Long productId, Long platformId) {
        LambdaQueryWrapper<PriceHistory> wrapper = new LambdaQueryWrapper<PriceHistory>()
                .eq(PriceHistory::getProductId, productId)
                .orderByAsc(PriceHistory::getRecordDate);
        if (platformId != null) {
            wrapper.eq(PriceHistory::getPlatformId, platformId);
        }
        List<PriceHistory> historyList = priceHistoryMapper.selectList(wrapper);
        for (PriceHistory h : historyList) {
            Platform platform = platformMapper.selectById(h.getPlatformId());
            h.setPlatformName(platform != null ? platform.getName() : null);
        }

        PriceHistoryVO vo = new PriceHistoryVO();
        vo.setHistory(historyList);
        if (historyList.isEmpty()) {
            vo.setCurrentLowest(BigDecimal.ZERO);
            vo.setHistoryLowest(BigDecimal.ZERO);
            vo.setHistoryHighest(BigDecimal.ZERO);
            vo.setAveragePrice(BigDecimal.ZERO);
            vo.setRecentDrop(BigDecimal.ZERO);
            vo.setRecentDropRate(BigDecimal.ZERO);
            return vo;
        }

        BigDecimal historyLowest = historyList.stream().map(PriceHistory::getPrice)
                .min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        BigDecimal historyHighest = historyList.stream().map(PriceHistory::getPrice)
                .max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        BigDecimal total = historyList.stream().map(PriceHistory::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal average = total.divide(BigDecimal.valueOf(historyList.size()), 2, RoundingMode.HALF_UP);

        // 当前最低价（各平台当前价格的最低值）
        List<ProductPrice> currentPrices = productPriceMapper.selectList(new LambdaQueryWrapper<ProductPrice>()
                .eq(ProductPrice::getProductId, productId));
        BigDecimal currentLowest = currentPrices.stream().map(ProductPrice::getPrice)
                .min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);

        vo.setCurrentLowest(currentLowest);
        vo.setHistoryLowest(historyLowest);
        vo.setHistoryHighest(historyHighest);
        vo.setAveragePrice(average);

        // 近期降价 = 历史最高 - 当前最低（若当前低于历史最高）
        BigDecimal drop = historyHighest.subtract(currentLowest);
        if (drop.compareTo(BigDecimal.ZERO) > 0) {
            vo.setRecentDrop(drop);
            vo.setRecentDropRate(drop.divide(historyHighest, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP));
        } else {
            vo.setRecentDrop(BigDecimal.ZERO);
            vo.setRecentDropRate(BigDecimal.ZERO);
        }
        return vo;
    }
}
