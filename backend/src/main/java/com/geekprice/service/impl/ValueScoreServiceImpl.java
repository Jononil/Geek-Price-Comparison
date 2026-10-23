package com.geekprice.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.entity.AlgorithmConfig;
import com.geekprice.entity.PriceHistory;
import com.geekprice.entity.Product;
import com.geekprice.entity.ProductPrice;
import com.geekprice.entity.ProductSpec;
import com.geekprice.mapper.AlgorithmConfigMapper;
import com.geekprice.mapper.PriceHistoryMapper;
import com.geekprice.mapper.ProductMapper;
import com.geekprice.mapper.ProductPriceMapper;
import com.geekprice.mapper.ProductSpecMapper;
import com.geekprice.service.ValueScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Objects;

/**
 * 性价比评分算法实现。
 *
 * 核心思想：综合「性能、功能、用户评分、价格优势、热度」五个维度，
 * 全部归一化到 0-100 后做加权求和，得到性价比评分（ValueScore）。
 *
 * 为什么不用简单的「性能/价格」？
 * 单一比值会忽略用户口碑（评分）、功能丰富度与价格是否处于历史低位等
 * 重要信息，容易让「便宜但口碑差」或「高价但接近史低」的产品被误判。
 * 多维加权能够在论文中解释每一个维度的贡献，具备可解释性。
 */
@Service
@RequiredArgsConstructor
public class ValueScoreServiceImpl implements ValueScoreService {

    private final ProductMapper productMapper;
    private final ProductSpecMapper productSpecMapper;
    private final ProductPriceMapper productPriceMapper;
    private final PriceHistoryMapper priceHistoryMapper;
    private final AlgorithmConfigMapper algorithmConfigMapper;

    @Override
    public Integer calculate(Long productId) {
        Product product = productMapper.selectById(productId);
        if (product == null) {
            return 0;
        }

        // ===== 数据治理：可信参数不足时不生成虚假评分 =====
        long trustedSpecs = productSpecMapper.selectCount(new LambdaQueryWrapper<ProductSpec>()
                .eq(ProductSpec::getProductId, productId)
                .in(ProductSpec::getVerifyStatus, "verified", "reference"));
        if (trustedSpecs < 3) {
            return null; // 数据不足，暂不评分
        }

        // 读取权重（按分类配置，找不到用全局配置）
        AlgorithmConfig config = getConfig(product.getCategoryId());

        // 各维度得分与权重：缺数据的维度剔除，不再用默认值填补
        double weightedSum = 0;
        double weightSum = 0;

        // 1. 性能得分（仅当有人工/核验录入的性能分才参与；模板随机分已清空）
        if (product.getPerformanceScore() != null) {
            weightedSum += product.getPerformanceScore() * config.getPerformanceWeight().doubleValue();
            weightSum += config.getPerformanceWeight().doubleValue();
        }
        // 2. 功能得分（基于可信参数条数——模板参数不参与）
        weightedSum += calcFunctionScore(productId) * config.getFunctionWeight().doubleValue();
        weightSum += config.getFunctionWeight().doubleValue();
        // 3. 用户评分（有真实评分才参与，不再默认 4.0）
        if (product.getUserRating() != null) {
            int userScore = (int) Math.round(product.getUserRating().doubleValue() * 20);
            weightedSum += userScore * config.getUserRatingWeight().doubleValue();
            weightSum += config.getUserRatingWeight().doubleValue();
        }
        // 4. 价格优势（基于系统模拟报价——评分含义为"基于模拟价格的相对性价比"）
        if (currentLowestPrice(productId) != null) {
            weightedSum += calcPriceAdvantage(product) * config.getPriceWeight().doubleValue();
            weightSum += config.getPriceWeight().doubleValue();
        }
        // 5. 热度
        if (product.getHeat() != null) {
            weightedSum += calcHeatScore(product.getHeat()) * config.getHeatWeight().doubleValue();
            weightSum += config.getHeatWeight().doubleValue();
        }

        if (weightSum <= 0) {
            return null; // 无任何可用维度
        }
        int result = (int) Math.round(weightedSum / weightSum);
        return Math.max(0, Math.min(100, result));
    }

    @Override
    public void recalculateAll() {
        List<Product> products = productMapper.selectList(new LambdaQueryWrapper<Product>()
                .eq(Product::getStatus, 1));
        for (Product product : products) {
            Integer valueScore = calculate(product.getId());
            // updateById 跳过 null 字段，须用显式 UpdateWrapper 写入/清空 NULL
            productMapper.update(null, new com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper<Product>()
                    .eq(Product::getId, product.getId())
                    .set(Product::getValueScore, valueScore));
        }
    }

    /**
     * 功能得分：仅统计可信参数（verified/reference）条数。
     * 模板参数（template）不代表真实功能，不参与评分。每 12 条视为满分（100 分）。
     */
    private int calcFunctionScore(Long productId) {
        Long count = productSpecMapper.selectCount(new LambdaQueryWrapper<ProductSpec>()
                .eq(ProductSpec::getProductId, productId)
                .in(ProductSpec::getVerifyStatus, "verified", "reference"));
        return (int) Math.min(100, count * 8);
    }

    /**
     * 价格优势：衡量「当前价格是否划算」，满分 100，基准 50 分。
     *
     * 为什么基准是 50？价格优势应围绕中性值上下浮动：
     * - 越接近历史最低价，说明当前是好价，加分（最多 +25）；
     * - 低于同类产品均价，说明相对便宜，再加分（最多 +25）。
     * 这样价格优势严格限定在 [0,100] 区间内，且两个加分项互相独立、可解释。
     */
    private int calcPriceAdvantage(Product product) {
        BigDecimal currentLowest = currentLowestPrice(product.getId());
        if (currentLowest == null || currentLowest.compareTo(BigDecimal.ZERO) <= 0) {
            return 50;
        }

        double score = 50;

        // 加分项一：历史最低接近度（当前价 / 历史最低价，越接近 1 越好）
        BigDecimal historyLowest = historyLowestPrice(product.getId());
        if (historyLowest != null && historyLowest.compareTo(BigDecimal.ZERO) > 0) {
            double ratio = currentLowest.divide(historyLowest, 4, RoundingMode.HALF_UP).doubleValue();
            // ratio = 1.0 时 +25，ratio = 1.5 时归零
            score += Math.max(0, 25 - (ratio - 1) * 50);
        }

        // 加分项二：同类均价优势（同类均价 / 当前价，当前价越低加分越多）
        BigDecimal categoryAvg = categoryAvgPrice(product.getCategoryId());
        if (categoryAvg != null && categoryAvg.compareTo(BigDecimal.ZERO) > 0) {
            double ratio = categoryAvg.divide(currentLowest, 4, RoundingMode.HALF_UP).doubleValue();
            // 当前价 = 均价时 +0，当前价 = 均价的 0.67 倍时 +25
            score += Math.min(25, Math.max(0, (ratio - 1) * 50));
        }

        return (int) Math.max(0, Math.min(100, score));
    }

    /**
     * 热度得分：热度值线性映射到 0-100（10000 视为满分）。
     */
    private int calcHeatScore(Integer heat) {
        if (heat == null) {
            return 50;
        }
        return (int) Math.min(100, heat / 100.0);
    }

    /**
     * 当前全网最低价（各平台当前价格中的最小值）
     */
    private BigDecimal currentLowestPrice(Long productId) {
        List<ProductPrice> prices = productPriceMapper.selectList(new LambdaQueryWrapper<ProductPrice>()
                .eq(ProductPrice::getProductId, productId));
        return prices.stream().map(ProductPrice::getPrice)
                .filter(Objects::nonNull)
                .min(BigDecimal::compareTo).orElse(null);
    }

    /**
     * 历史最低价（价格历史记录中的最小值）
     */
    private BigDecimal historyLowestPrice(Long productId) {
        List<PriceHistory> history = priceHistoryMapper.selectList(new LambdaQueryWrapper<PriceHistory>()
                .eq(PriceHistory::getProductId, productId));
        return history.stream().map(PriceHistory::getPrice)
                .min(BigDecimal::compareTo).orElse(null);
    }

    /**
     * 同类产品均价（同分类所有在售产品的当前价格平均值）
     */
    private BigDecimal categoryAvgPrice(Long categoryId) {
        if (categoryId == null) {
            return null;
        }
        List<Product> products = productMapper.selectList(new LambdaQueryWrapper<Product>()
                .eq(Product::getCategoryId, categoryId)
                .eq(Product::getStatus, 1));
        List<BigDecimal> prices = products.stream().map(Product::getCurrentPrice)
                .filter(Objects::nonNull).toList();
        if (prices.isEmpty()) {
            return null;
        }
        BigDecimal total = prices.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.divide(BigDecimal.valueOf(prices.size()), 2, RoundingMode.HALF_UP);
    }

    /**
     * 获取算法权重配置：优先按分类取，取不到则用全局（categoryId=0）
     */
    private AlgorithmConfig getConfig(Long categoryId) {
        if (categoryId != null) {
            AlgorithmConfig byCategory = algorithmConfigMapper.selectOne(
                    new LambdaQueryWrapper<AlgorithmConfig>().eq(AlgorithmConfig::getCategoryId, categoryId));
            if (byCategory != null) {
                return byCategory;
            }
        }
        AlgorithmConfig global = algorithmConfigMapper.selectOne(
                new LambdaQueryWrapper<AlgorithmConfig>().eq(AlgorithmConfig::getCategoryId, 0L));
        return global;
    }
}
