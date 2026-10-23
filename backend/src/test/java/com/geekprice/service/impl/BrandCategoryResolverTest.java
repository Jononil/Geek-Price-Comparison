package com.geekprice.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.entity.Brand;
import com.geekprice.entity.Category;
import com.geekprice.mapper.BrandMapper;
import com.geekprice.mapper.CategoryMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import org.springframework.test.context.ActiveProfiles;

/**
 * 品牌 / 分类标准化映射器测试（Step 7）。
 *
 * 验证品牌别名（中英文）、分类别名、未知品牌/分类返回 null 等核心规则，
 * 全部命中真实 MySQL 中的基础表数据（brands / categories）。
 */
@SpringBootTest
@ActiveProfiles("test")
class BrandCategoryResolverTest {

    @Autowired
    private BrandCategoryResolver resolver;
    @Autowired
    private BrandMapper brandMapper;
    @Autowired
    private CategoryMapper categoryMapper;

    private Long brandId(String name) {
        return brandMapper.selectOne(new LambdaQueryWrapper<Brand>().eq(Brand::getName, name)).getId();
    }

    private Long categoryId(String name) {
        return categoryMapper.selectOne(new LambdaQueryWrapper<Category>().eq(Category::getName, name)).getId();
    }

    /** 苹果 / Apple / APPLE 命中同一品牌 */
    @Test
    void appleAliasesResolveToSameBrand() {
        Long apple = resolver.resolveBrandId("Apple");
        Long chinese = resolver.resolveBrandId("苹果");
        Long upper = resolver.resolveBrandId("APPLE");
        assertNotNull(apple);
        assertEquals(apple, chinese);
        assertEquals(apple, upper);
        assertEquals(brandId("苹果"), apple);
    }

    /** 华为 / Huawei 命中同一品牌 */
    @Test
    void huaweiAliasesResolveToSameBrand() {
        Long huawei = resolver.resolveBrandId("Huawei");
        Long chinese = resolver.resolveBrandId("华为");
        assertNotNull(huawei);
        assertEquals(huawei, chinese);
        assertEquals(brandId("华为"), huawei);
    }

    /** 分类名及别名解析到分类主键（手机精确命中；平板 -> 平板电脑） */
    @Test
    void categoryResolvesToCategoryId() {
        assertEquals(categoryId("手机"), resolver.resolveCategoryId("手机"));
        assertEquals(categoryId("平板电脑"), resolver.resolveCategoryId("平板"));
        assertEquals(categoryId("固态硬盘"), resolver.resolveCategoryId("移动硬盘"));
        assertEquals(categoryId("游戏机"), resolver.resolveCategoryId("游戏设备"));
    }

    /** 未知品牌 / 分类返回 null，不抛异常 */
    @Test
    void unknownBrandAndCategoryReturnNull() {
        assertNull(resolver.resolveBrandId("不存在的品牌XYZ"));
        assertNull(resolver.resolveCategoryId("不存在的分类XYZ"));
    }
}
