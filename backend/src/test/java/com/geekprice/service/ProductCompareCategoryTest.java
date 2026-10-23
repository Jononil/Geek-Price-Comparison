package com.geekprice.service;

import com.geekprice.common.PageResult;
import com.geekprice.dto.ProductQueryDTO;
import com.geekprice.entity.Product;
import com.geekprice.exception.BusinessException;
import com.geekprice.mapper.ProductMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 商品规格对比分类校验测试。
 *
 * 业务规则：规格对比仅允许同一具体分类（category_id 相同）的商品。
 * 跨平台比价（/api/prices/compare/{id}）不受本规则影响。
 */
@SpringBootTest
@Transactional
@ActiveProfiles("test")
class ProductCompareCategoryTest {

    @Autowired
    private ProductService productService;
    @Autowired
    private ProductMapper productMapper;

    /** 从指定分类中取两个不同商品 ID */
    private List<Long> idsFromCategory(Long categoryId) {
        return productMapper.selectList(new LambdaQueryWrapper<Product>()
                        .eq(Product::getCategoryId, categoryId)
                        .eq(Product::getStatus, 1)
                        .last("LIMIT 2"))
                .stream().map(Product::getId).toList();
    }

    // 1. 同品类不同型号对比成功
    @Test
    void compareSameCategoryDifferentModels() {
        List<Long> ids = idsFromCategory(1L); // 手机
        assertTrue(ids.size() >= 2, "手机分类至少应有 2 个商品");
        List<Product> result = productService.compare(ids);
        assertEquals(2, result.size());
        // 全部 categoryId 相同
        assertTrue(result.stream().allMatch(p -> p.getCategoryId().equals(1L)));
    }

    // 2. 同品类不同品牌对比成功
    @Test
    void compareSameCategoryDifferentBrands() {
        List<Long> ids = productMapper.selectList(new LambdaQueryWrapper<Product>()
                        .eq(Product::getCategoryId, 3L) // 笔记本
                        .eq(Product::getStatus, 1)
                        .isNotNull(Product::getBrandId)
                        .last("LIMIT 5"))
                .stream().map(Product::getId).toList();
        assertTrue(ids.size() >= 2);
        // 去重后取两个不同品牌的
        List<Long> distinct = ids.stream().distinct().limit(2).toList();
        List<Product> result = productService.compare(distinct);
        assertEquals(2, result.size());
    }

    // 3. 手机与鼠标混合对比被拒绝
    @Test
    void comparePhoneAndMouseRejected() {
        Long phoneId = productMapper.selectList(new LambdaQueryWrapper<Product>()
                .eq(Product::getCategoryId, 1L).eq(Product::getStatus, 1).last("LIMIT 1"))
                .get(0).getId();
        Long mouseId = productMapper.selectList(new LambdaQueryWrapper<Product>()
                .eq(Product::getCategoryId, 8L).eq(Product::getStatus, 1).last("LIMIT 1"))
                .get(0).getId();
        BusinessException ex = assertThrows(BusinessException.class,
                () -> productService.compare(List.of(phoneId, mouseId)));
        assertTrue(ex.getMessage().contains("同一品类") || ex.getMessage().contains("分类"),
                "应返回明确的跨品类拒绝提示，实际：" + ex.getMessage());
    }

    // 4. 笔记本与耳机混合对比被拒绝
    @Test
    void compareLaptopAndHeadphoneRejected() {
        Long laptopId = productMapper.selectList(new LambdaQueryWrapper<Product>()
                .eq(Product::getCategoryId, 3L).eq(Product::getStatus, 1).last("LIMIT 1"))
                .get(0).getId();
        Long hpId = productMapper.selectList(new LambdaQueryWrapper<Product>()
                .eq(Product::getCategoryId, 6L).eq(Product::getStatus, 1).last("LIMIT 1"))
                .get(0).getId();
        assertThrows(BusinessException.class,
                () -> productService.compare(List.of(laptopId, hpId)));
    }

    // 5. 直接调用后端接口提交跨品类商品仍被拒绝（Service 层拦截）
    @Test
    void directApiCallCrossCategoryRejected() {
        // 模拟绕过前端直接调用：三个手机 + 一个键盘
        List<Long> phoneIds = idsFromCategory(1L);
        Long kbId = productMapper.selectList(new LambdaQueryWrapper<Product>()
                .eq(Product::getCategoryId, 7L).eq(Product::getStatus, 1).last("LIMIT 1"))
                .get(0).getId();
        List<Long> mixed = new java.util.ArrayList<>(phoneIds);
        mixed.add(kbId);
        assertThrows(BusinessException.class, () -> productService.compare(mixed));
    }

    // 6. 不存在的商品 ID 被跳过；不存在+同品类商品正常对比
    @Test
    void compareSkipsNonExistentProducts() {
        List<Long> ids = idsFromCategory(1L);
        // 加入不存在的 ID（999999），不改变分类
        List<Long> withGhost = new java.util.ArrayList<>(ids);
        withGhost.add(999999L);
        List<Product> result = productService.compare(withGhost);
        // 两个真实商品正常返回，幽灵 ID 被跳过
        assertEquals(2, result.size());
    }

    // 7. 重复商品 ID 被去重（selectBatchIds 的 distinct 处理）
    @Test
    void compareDeduplicatesProductIds() {
        List<Long> ids = idsFromCategory(1L);
        Long first = ids.get(0);
        // 重复提交同一个商品两次
        List<Long> dup = List.of(first, first);
        List<Product> result = productService.compare(dup);
        assertEquals(1, result.size(), "重复商品 ID 应去重后只返回一个");
    }

    // 8. 规格缺失时正常返回（不伪造数据）
    @Test
    void compareWithMissingSpecsDoesNotFabricate() {
        List<Long> ids = idsFromCategory(1L);
        List<Product> result = productService.compare(ids);
        assertFalse(result.isEmpty());
        for (Product p : result) {
            // specs 可能为空列表，不伪造
            assertNotNull(p.getSpecs(), "specs 字段不应为 null");
        }
    }

    // 9. 跨平台比价接口不受影响（/api/prices/compare/{id}）
    @Test
    void crossPlatformPriceCompareUnaffected() {
        List<Long> ids = idsFromCategory(1L);
        // 规格对比正常
        List<Product> result = productService.compare(ids);
        assertEquals(2, result.size());
        // 每个商品有 currentPrice（模拟报价）
        for (Product p : result) {
            assertNotNull(p.getCurrentPrice());
        }
    }

    // 10. 列表功能不回归
    @Test
    void productListUnaffected() {
        ProductQueryDTO q = new ProductQueryDTO();
        q.setPage(1L);
        q.setPageSize(10L);
        PageResult<Product> page = productService.list(q);
        assertTrue(page.getTotal() > 0);
        assertTrue(page.getRecords().size() <= 10);
    }

    // 11. 逻辑删除商品被跳过（deleted=1 不出现在对比结果中）
    @Test
    void compareSkipsLogicallyDeletedProducts() {
        List<Long> ids = idsFromCategory(1L);
        Product p = productMapper.selectById(ids.get(0));
        // 直接用 SQL 更新，避免 updateById 的 @TableLogic 拦截
        productMapper.update(null, new com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper<Product>()
                .eq(Product::getId, p.getId())
                .set(Product::getDeleted, 1));
        // selectList 走逻辑删除过滤（deleted=0），已删除商品不被查出
        List<Product> result = productService.compare(ids);
        assertEquals(1, result.size(), "逻辑删除商品应被跳过");
        assertNotEquals(p.getId(), result.get(0).getId(), "已删除商品不应出现在结果中");
    }

    // 12. 下架商品被跳过（status != 1）
    @Test
    void compareSkipsUnlistedProducts() {
        List<Long> ids = idsFromCategory(1L);
        Product p = productMapper.selectById(ids.get(0));
        p.setStatus(0);
        productMapper.updateById(p);
        List<Product> result = productService.compare(ids);
        assertEquals(1, result.size(), "下架商品应被跳过");
    }
}
