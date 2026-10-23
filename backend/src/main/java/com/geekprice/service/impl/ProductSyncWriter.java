package com.geekprice.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.entity.Platform;
import com.geekprice.entity.PriceHistory;
import com.geekprice.entity.Product;
import com.geekprice.entity.ProductImage;
import com.geekprice.entity.ProductPrice;
import com.geekprice.entity.ProductSource;
import com.geekprice.entity.ProductSpec;
import com.geekprice.mapper.PriceHistoryMapper;
import com.geekprice.mapper.ProductImageMapper;
import com.geekprice.mapper.ProductMapper;
import com.geekprice.mapper.ProductPriceMapper;
import com.geekprice.mapper.ProductSourceMapper;
import com.geekprice.mapper.ProductSpecMapper;
import com.geekprice.provider.dto.ExternalProductDTO;
import com.geekprice.provider.standardizer.ProductIdentityKey;
import com.geekprice.provider.standardizer.ProductStandardizer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 单个商品的落库写入器。
 *
 * 独立成 Bean 的原因：Spring 的 {@code @Transactional} 依赖 AOP 代理生效，若在同一 Service
 * 内部自调用（this.syncOneProduct(...)），注解不会生效。把「单商品同步」抽为独立 Bean 后，
 * 可保证「每个商品一个事务」真正生效——某个商品落库失败只回滚该商品，不影响其他商品，
 * 也不会把整个 syncAll 变成一个长事务。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProductSyncWriter {

    private final ProductMapper productMapper;
    private final ProductPriceMapper productPriceMapper;
    private final PriceHistoryMapper priceHistoryMapper;
    private final ProductSpecMapper productSpecMapper;
    private final ProductImageMapper productImageMapper;
    private final ProductSourceMapper productSourceMapper;
    private final ProductStandardizer standardizer;
    private final BrandCategoryResolver resolver;

    /**
     * 同步单个商品（一个事务）。
     *
     * @param dto           外部商品数据
     * @param platform      平台记录（platforms 表）
     * @param providerName  数据源名称（MOCK_JD / MOCK_TAOBAO / MOCK_TMALL）
     * @param existingIndex 现有商品身份索引（normalizedKey -&gt; Product），用于跨平台去重
     */
    @Transactional(rollbackFor = Exception.class)
    public void syncOneProduct(ExternalProductDTO dto, Platform platform,
                               String providerName, Map<String, Product> existingIndex) {
        ProductIdentityKey key = standardizer.buildIdentityKey(dto);
        Product existing = existingIndex.get(key.getNormalizedKey());
        Product mapped = standardizer.toProduct(dto);
        // Step 7：解析品牌/分类主键。未知品牌/分类 -> null，不自动创建、不影响同步
        mapped.setBrandId(resolver.resolveBrandId(dto.getBrand()));
        mapped.setCategoryId(resolver.resolveCategoryId(dto.getCategory()));

        Long productId;
        if (existing == null) {
            // 新建商品：插入后回填 id，并登记到身份索引，供后续平台同款商品命中
            productMapper.insert(mapped);
            productId = mapped.getId();
            existingIndex.put(key.getNormalizedKey(), mapped);
        } else {
            // 已有商品：仅更新展示与营销类字段，不覆盖推荐分 / 性价比分
            productId = existing.getId();
            updateProduct(productId, mapped);
        }

        syncSpecs(dto, productId);
        syncImages(dto, productId);
        syncPrice(dto, productId, platform.getId());
        syncPriceHistory(dto, productId, platform.getId());
        syncProductSource(dto, productId, platform.getId(), providerName);
        // 最后统一刷新：当前参考价 = 该商品在各平台报价中的最低价
        refreshCurrentPrice(productId);
    }

    /** 更新已有商品：只更新同步来源的字段，score / valueScore / status / isRecommend / isHot 一律不动 */
    private void updateProduct(Long productId, Product mapped) {
        Product update = new Product();
        update.setId(productId);
        update.setName(mapped.getName());
        update.setDescription(mapped.getDescription());
        update.setOfficialPrice(mapped.getOfficialPrice());
        update.setPerformanceScore(mapped.getPerformanceScore());
        update.setUserRating(mapped.getUserRating());
        update.setSales(mapped.getSales());
        update.setHeat(mapped.getHeat());
        update.setLaunchDate(mapped.getLaunchDate());
        update.setBrandId(mapped.getBrandId());
        update.setCategoryId(mapped.getCategoryId());
        // currentPrice 由 refreshCurrentPrice 统一计算，此处不设置
        productMapper.updateById(update);
    }

    /** 同步规格：按 product_id + spec_key 匹配，存在则更新，不存在则插入 */
    private void syncSpecs(ExternalProductDTO dto, Long productId) {
        List<ProductSpec> fresh = standardizer.toSpecs(dto, productId);
        if (fresh.isEmpty()) {
            return;
        }
        List<ProductSpec> existing = productSpecMapper.selectList(
                new LambdaQueryWrapper<ProductSpec>().eq(ProductSpec::getProductId, productId));
        Map<String, ProductSpec> byKey = new HashMap<>();
        for (ProductSpec spec : existing) {
            byKey.put(spec.getSpecKey(), spec);
        }
        for (ProductSpec spec : fresh) {
            ProductSpec old = byKey.get(spec.getSpecKey());
            if (old == null) {
                productSpecMapper.insert(spec);
            } else {
                spec.setId(old.getId());
                productSpecMapper.updateById(spec);
            }
        }
    }

    /** 同步图片：按 product_id + url 匹配，不存在才插入；空/空白地址跳过，同一批内重复地址只插一次 */
    private void syncImages(ExternalProductDTO dto, Long productId) {
        List<String> urls = dto.getImages();
        if (urls == null || urls.isEmpty()) {
            // 图片缺失属正常情况：直接返回，不覆盖、不删除已有有效图片
            return;
        }
        List<ProductImage> existing = productImageMapper.selectList(
                new LambdaQueryWrapper<ProductImage>().eq(ProductImage::getProductId, productId));
        Set<String> existingUrls = existing.stream()
                .map(ProductImage::getUrl)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        int sort = 0;
        for (String url : urls) {
            String normalized = url == null ? null : url.trim();
            if (normalized != null && !normalized.isEmpty() && !existingUrls.contains(normalized)) {
                ProductImage image = new ProductImage();
                image.setProductId(productId);
                image.setUrl(normalized);
                image.setSort(sort);
                productImageMapper.insert(image);
                // 及时登记，避免同一批图片列表中重复地址被重复插入
                existingUrls.add(normalized);
            }
            sort++;
        }
    }

    /** 同步平台报价：按 product_id + platform_id 匹配，存在则更新，不存在则插入 */
    private void syncPrice(ExternalProductDTO dto, Long productId, Long platformId) {
        // 价格缺失或非法（null / 负数）：跳过报价同步，商品本身仍继续同步，不因此失败
        if (dto.getPrice() == null || dto.getPrice().signum() < 0) {
            log.warn("价格缺失或非法，跳过平台报价同步 productId={} platformId={}", productId, platformId);
            return;
        }
        ProductPrice existing = productPriceMapper.selectOne(
                new LambdaQueryWrapper<ProductPrice>()
                        .eq(ProductPrice::getProductId, productId)
                        .eq(ProductPrice::getPlatformId, platformId));
        ProductPrice fresh = standardizer.toProductPrice(dto, productId, platformId);
        if (existing == null) {
            productPriceMapper.insert(fresh);
        } else {
            fresh.setId(existing.getId());
            productPriceMapper.updateById(fresh);
        }
    }

    /** 同步来源映射：按 platform_id + external_product_id 匹配，存在则更新最近同步时间 */
    private void syncProductSource(ExternalProductDTO dto, Long productId, Long platformId, String providerName) {
        ProductSource existing = productSourceMapper.selectOne(
                new LambdaQueryWrapper<ProductSource>()
                        .eq(ProductSource::getPlatformId, platformId)
                        .eq(ProductSource::getExternalProductId, dto.getExternalProductId()));
        LocalDateTime now = LocalDateTime.now();
        if (existing == null) {
            ProductSource source = new ProductSource();
            source.setProductId(productId);
            source.setPlatformId(platformId);
            source.setExternalProductId(dto.getExternalProductId());
            source.setProvider(providerName);
            source.setLastSyncTime(now);
            productSourceMapper.insert(source);
        } else {
            existing.setProductId(productId);
            existing.setProvider(providerName);
            existing.setLastSyncTime(now);
            productSourceMapper.updateById(existing);
        }
    }

    /** 同步历史价格：按 product_id + platform_id + record_date + price 去重后插入 */
    private void syncPriceHistory(ExternalProductDTO dto, Long productId, Long platformId) {
        List<PriceHistory> fresh = standardizer.toPriceHistory(dto, productId, platformId);
        if (fresh.isEmpty()) {
            return;
        }
        List<PriceHistory> existing = priceHistoryMapper.selectList(
                new LambdaQueryWrapper<PriceHistory>()
                        .eq(PriceHistory::getProductId, productId)
                        .eq(PriceHistory::getPlatformId, platformId));
        Set<String> existingKeys = existing.stream()
                .map(this::historyKey)
                .collect(Collectors.toSet());
        for (PriceHistory history : fresh) {
            String key = historyKey(history);
            if (!existingKeys.contains(key)) {
                priceHistoryMapper.insert(history);
                // 及时登记，避免同一批历史中重复点被重复插入
                existingKeys.add(key);
            }
        }
    }

    /** 历史价格去重键：recordDate + 价格数值（归一化小数位，避免 5999 与 5999.00 误判为不同价格导致重复插入） */
    private String historyKey(PriceHistory history) {
        return history.getRecordDate() + "_" + history.getPrice().stripTrailingZeros().toPlainString();
    }

    /** 刷新商品当前参考价：取该商品在各平台报价中的最低价 */
    private void refreshCurrentPrice(Long productId) {
        List<ProductPrice> prices = productPriceMapper.selectList(
                new LambdaQueryWrapper<ProductPrice>().eq(ProductPrice::getProductId, productId));
        BigDecimal min = prices.stream()
                .map(ProductPrice::getPrice)
                .filter(Objects::nonNull)
                .min(BigDecimal::compareTo)
                .orElse(null);
        // 无任何报价（如价格缺失被跳过）：保持 currentPrice 为 null。
        // 若仍执行 updateById，MyBatis-Plus 的 NOT_NULL 策略会省略 null 字段，
        // 生成「UPDATE products SET WHERE id=?」的空 SET 语句导致 SQL 语法错误。
        if (min == null) {
            return;
        }
        Product update = new Product();
        update.setId(productId);
        update.setCurrentPrice(min);
        productMapper.updateById(update);
    }
}
