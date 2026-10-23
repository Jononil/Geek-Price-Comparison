package com.geekprice.service.impl;

import com.geekprice.entity.Brand;
import com.geekprice.entity.Category;
import com.geekprice.mapper.BrandMapper;
import com.geekprice.mapper.CategoryMapper;
import com.geekprice.provider.standardizer.ProductStandardizer;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 品牌与分类标准化映射器。
 *
 * 职责：把外部品牌名 / 分类名解析为系统基础表（brands / categories）的主键 ID。
 * 启动时一次性加载 brands / categories 到内存索引，同步过程中只做内存查询，避免逐商品查询数据库（N+1）。
 *
 * 匹配规则（Step 7 要求，按优先级）：
 * 1. 名称精确匹配；2. 中文别名映射；3. 英文别名映射；4. 归一化后比较。
 * 统一借助 {@link ProductStandardizer#normalizeBrand} / {@link ProductStandardizer#normalizeCategory}
 * 把两侧名称归一为同一标准后再比对，因此 苹果/Apple/APPLE、华为/Huawei、ASUS/华硕 均命中同一品牌。
 *
 * 未知品牌 / 分类返回 null：不自动创建、不抛异常、不影响同步（仅记录「未找到」日志）。
 * 本类只做「解析」，不做任何 INSERT / DELETE，也不改动表结构。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BrandCategoryResolver {

    private final BrandMapper brandMapper;
    private final CategoryMapper categoryMapper;
    private final ProductStandardizer standardizer;

    /** 归一化品牌名 -> 品牌主键 */
    private final Map<String, Long> brandIndex = new HashMap<>();
    /** 品牌主键 -> 品牌原名（用于按 brandId 重建商品身份） */
    private final Map<Long, String> brandIdToName = new HashMap<>();
    /** 归一化分类名 -> 分类主键 */
    private final Map<String, Long> categoryIndex = new HashMap<>();

    /** 启动时一次性加载基础表，建立归一化索引（品牌/分类为静态主数据，启动期加载即可） */
    @PostConstruct
    public void init() {
        List<Brand> brands = brandMapper.selectList(null);
        if (brands != null) {
            for (Brand brand : brands) {
                brandIndex.putIfAbsent(standardizer.normalizeBrand(brand.getName()), brand.getId());
                brandIdToName.put(brand.getId(), brand.getName());
            }
        }
        List<Category> categories = categoryMapper.selectList(null);
        if (categories != null) {
            for (Category category : categories) {
                categoryIndex.putIfAbsent(standardizer.normalizeCategory(category.getName()), category.getId());
            }
        }
        log.info("品牌/分类标准化索引加载完成：brands={} categories={}", brandIndex.size(), categoryIndex.size());
    }

    /** 解析品牌名 -> brandId；未知品牌返回 null（不抛异常、不自动创建） */
    public Long resolveBrandId(String brandName) {
        if (brandName == null || brandName.isBlank()) {
            return null;
        }
        Long id = brandIndex.get(standardizer.normalizeBrand(brandName));
        if (id == null) {
            log.warn("未找到品牌：{}", brandName);
        }
        return id;
    }

    /** 解析分类名 -> categoryId；未知分类返回 null */
    public Long resolveCategoryId(String categoryName) {
        if (categoryName == null || categoryName.isBlank()) {
            return null;
        }
        Long id = categoryIndex.get(standardizer.normalizeCategory(categoryName));
        if (id == null) {
            log.warn("未找到分类：{}", categoryName);
        }
        return id;
    }

    /** 品牌主键 -> 品牌原名；用于按 brandId 重建商品身份 Key */
    public String brandName(Long brandId) {
        return brandId == null ? null : brandIdToName.get(brandId);
    }
}
