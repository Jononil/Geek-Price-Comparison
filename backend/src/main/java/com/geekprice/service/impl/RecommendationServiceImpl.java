package com.geekprice.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.entity.BrowseHistory;
import com.geekprice.entity.Favorite;
import com.geekprice.entity.Product;
import com.geekprice.entity.Review;
import com.geekprice.mapper.BrowseHistoryMapper;
import com.geekprice.mapper.FavoriteMapper;
import com.geekprice.mapper.ProductMapper;
import com.geekprice.mapper.ReviewMapper;
import com.geekprice.service.RecommendationService;
import com.geekprice.vo.RecommendationVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 混合推荐算法实现。
 *
 * 核心思想：融合「用户行为 + 产品标签 + 价格区间 + 产品分类 + 性价比 + 热度 + 新鲜度」
 * 多个因素计算推荐分数。为什么采用混合而非单一策略？单一策略（如只看热度）会导致
 * 推荐结果千篇一律、无法个性化；混合多因素并归一化，能同时兼顾个性化与多样性，
 * 且每个因素的权重与贡献都可以在论文中解释。
 *
 * 推荐分数（0-100）：
 *   分类匹配度 × 25 + 标签匹配度 × 20 + 价格匹配度 × 15
 * + 性价比 × 20 + 热度 × 10 + 新鲜度 × 10
 */
@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

    private static final int TOP_N = 10;

    private final ProductMapper productMapper;
    private final BrowseHistoryMapper browseHistoryMapper;
    private final FavoriteMapper favoriteMapper;
    private final ReviewMapper reviewMapper;
    private final com.geekprice.service.ProductImageLicenseService imageLicenseService;

    @Override
    public List<RecommendationVO> recommend() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null || "anonymousUser".equals(auth.getPrincipal())) {
            // 未登录：冷启动推荐
            return coldStart();
        }
        Long userId = (Long) auth.getPrincipal();
        return recommend(userId);
    }

    /**
     * 个性化推荐主流程
     */
    private List<RecommendationVO> recommend(Long userId) {
        // 1. 收集用户行为涉及的产品
        Set<Long> behaviorProductIds = collectBehaviorProductIds(userId);
        if (behaviorProductIds.isEmpty()) {
            return coldStart();
        }
        List<Product> behaviorProducts = productMapper.selectBatchIds(behaviorProductIds).stream()
                .filter(Objects::nonNull).toList();

        // 2. 提取用户兴趣特征
        Set<Long> preferredCategories = behaviorProducts.stream()
                .map(Product::getCategoryId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<String> preferredTags = new HashSet<>();
        double priceSum = 0;
        int priceCount = 0;
        for (Product p : behaviorProducts) {
            preferredTags.addAll(productMapper.selectTagNames(p.getId()));
            if (p.getCurrentPrice() != null) {
                priceSum += p.getCurrentPrice().doubleValue();
                priceCount++;
            }
        }
        double avgPrice = priceCount > 0 ? priceSum / priceCount : 0;

        // 3. 候选产品（排除用户已浏览/收藏/评价过的；只推荐有可展示图片的商品，与列表口径一致）
        List<Product> candidates = productMapper.selectList(new LambdaQueryWrapper<Product>()
                .eq(Product::getStatus, 1)
                .inSql(Product::getId, com.geekprice.service.ProductImageLicenseService.QUALIFIED_PRODUCT_IDS_SQL)).stream()
                .filter(c -> !behaviorProductIds.contains(c.getId()))
                .toList();

        // 4. 逐个评分
        List<RecommendationVO> result = new ArrayList<>();
        for (Product candidate : candidates) {
            double score = scoreCandidate(candidate, preferredCategories, preferredTags, avgPrice);
            RecommendationVO vo = buildVO(candidate, score, "hybrid", "根据你的浏览与收藏偏好推荐");
            result.add(vo);
        }

        // 5. 按分数降序取前 N
        result.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));
        return result.stream().limit(TOP_N).toList();
    }

    /**
     * 计算单个候选产品的推荐分数（0-100）
     */
    private double scoreCandidate(Product product, Set<Long> preferredCategories,
                                  Set<String> preferredTags, double avgPrice) {
        // 分类匹配度：命中偏好分类记满分，否则给基础分
        double categoryMatch = preferredCategories.contains(product.getCategoryId()) ? 1.0 : 0.3;

        // 标签匹配度：候选标签与偏好标签的 Jaccard 相似度
        Set<String> candidateTags = new HashSet<>(productMapper.selectTagNames(product.getId()));
        double tagMatch = jaccard(preferredTags, candidateTags);

        // 价格匹配度：候选价格与用户偏好均价的接近程度
        double priceMatch = priceMatch(avgPrice, product.getCurrentPrice());

        // 性价比（0-1）
        double value = (product.getValueScore() == null ? 50 : product.getValueScore()) / 100.0;

        // 热度（0-1）
        double heat = Math.min(1.0, (product.getHeat() == null ? 0 : product.getHeat()) / 10000.0);

        // 新鲜度（0-1）
        double freshness = freshness(product.getLaunchDate());

        return categoryMatch * 25 + tagMatch * 20 + priceMatch * 15
                + value * 20 + heat * 10 + freshness * 10;
    }

    /**
     * 冷启动推荐：无行为用户返回高性价比、热门、最新、降价产品的混合结果
     */
    private List<RecommendationVO> coldStart() {
        List<RecommendationVO> result = new ArrayList<>();

        List<Product> valueProducts = productMapper.selectList(new LambdaQueryWrapper<Product>()
                .eq(Product::getStatus, 1)
                .inSql(Product::getId, com.geekprice.service.ProductImageLicenseService.QUALIFIED_PRODUCT_IDS_SQL)
                .orderByDesc(Product::getValueScore).last("LIMIT 6"));
        for (Product p : valueProducts) {
            result.add(buildVO(p, p.getValueScore() == null ? 50.0 : p.getValueScore().doubleValue(),
                    "value", "高性价比推荐"));
        }

        List<Product> hotProducts = productMapper.selectList(new LambdaQueryWrapper<Product>()
                .eq(Product::getStatus, 1)
                .inSql(Product::getId, com.geekprice.service.ProductImageLicenseService.QUALIFIED_PRODUCT_IDS_SQL)
                .orderByDesc(Product::getHeat).last("LIMIT 4"));
        for (Product p : hotProducts) {
            result.add(buildVO(p, Math.min(100, (p.getHeat() == null ? 0 : p.getHeat()) / 100.0),
                    "hot", "近期热门"));
        }
        return result;
    }

    /**
     * 收集用户行为（浏览、收藏、评价）涉及的产品 ID
     */
    private Set<Long> collectBehaviorProductIds(Long userId) {
        Set<Long> ids = new HashSet<>();
        for (BrowseHistory h : browseHistoryMapper.selectList(
                new LambdaQueryWrapper<BrowseHistory>().eq(BrowseHistory::getUserId, userId))) {
            ids.add(h.getProductId());
        }
        for (Favorite f : favoriteMapper.selectList(
                new LambdaQueryWrapper<Favorite>()
                        .eq(Favorite::getUserId, userId).eq(Favorite::getTargetType, 1))) {
            ids.add(f.getTargetId());
        }
        for (Review r : reviewMapper.selectList(
                new LambdaQueryWrapper<Review>().eq(Review::getUserId, userId))) {
            ids.add(r.getProductId());
        }
        return ids;
    }

    /**
     * Jaccard 相似度 = |交集| / |并集|，衡量标签集合的重叠程度
     */
    private double jaccard(Set<String> a, Set<String> b) {
        if (a.isEmpty() || b.isEmpty()) {
            return 0;
        }
        Set<String> union = new HashSet<>(a);
        union.addAll(b);
        Set<String> intersection = new HashSet<>(a);
        intersection.retainAll(b);
        return (double) intersection.size() / union.size();
    }

    /**
     * 价格匹配度：候选价格与偏好均价的相对偏差，偏差越小匹配度越高
     */
    private double priceMatch(double avgPrice, BigDecimal currentPrice) {
        if (currentPrice == null || avgPrice <= 0) {
            return 0.5;
        }
        double price = currentPrice.doubleValue();
        double ratio = Math.abs(price - avgPrice) / avgPrice;
        return Math.max(0, 1 - ratio);
    }

    /**
     * 新鲜度：上市时间越近越新鲜（30 天内满分，两年后归零）
     */
    private double freshness(LocalDate launchDate) {
        if (launchDate == null) {
            return 0.5;
        }
        long days = ChronoUnit.DAYS.between(launchDate, LocalDate.now());
        return Math.max(0, 1 - days / 730.0);
    }

    private RecommendationVO buildVO(Product product, double score, String type, String reason) {
        RecommendationVO vo = new RecommendationVO();
        vo.setProductId(product.getId());
        vo.setName(product.getName());
        vo.setImage(firstImage(product.getId()));
        vo.setPrice(product.getCurrentPrice());
        vo.setValueScore(product.getValueScore());
        vo.setScore(Math.round(score * 10) / 10.0);
        vo.setType(type);
        vo.setReason(reason);
        return vo;
    }

    private String firstImage(Long productId) {
        // 只取审核通过的真实图片；无合格图片时返回 null（前端走类别 SVG 兜底）
        return imageLicenseService.qualifiedFirstImageUrl(productId);
    }
}
