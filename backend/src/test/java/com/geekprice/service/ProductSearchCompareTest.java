package com.geekprice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.common.PageResult;
import com.geekprice.dto.ProductQueryDTO;
import com.geekprice.entity.Product;
import com.geekprice.entity.ProductPrice;
import com.geekprice.mapper.ProductMapper;
import com.geekprice.vo.PriceCompareVO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.springframework.test.context.ActiveProfiles;

/**
 * 搜索 / 比价 / 产品对比 集成测试（Step 13）。
 *
 * 覆盖：
 * 1. 关键词搜索；2. 无结果搜索；3. 分页与分类筛选；4. 多平台价格比较 + 最低价正确；
 * 5. 无价格 / 不存在产品的比价正常返回；6. 多产品对比；7. 对比跳过不存在产品。
 *
 * 复用 ProductService.list（搜索/分页/筛选）、PriceService.compare（比价）、
 * ProductService.compare（产品对比）三条既有/新增接口，不触碰同步逻辑。
 */
@SpringBootTest
@Transactional
@ActiveProfiles("test")
class ProductSearchCompareTest {

    @Autowired
    private ProductService productService;
    @Autowired
    private PriceService priceService;
    @Autowired
    private ProductDataSyncService syncService;
    @Autowired
    private ProductMapper productMapper;

    /** 同步全部平台后，取最新（id 最大）的上架商品 */
    private Product newestProduct() {
        return productMapper.selectList(new LambdaQueryWrapper<Product>()
                        .eq(Product::getStatus, 1)
                        .orderByDesc(Product::getId))
                .get(0);
    }

    // ===== 测试 1：关键词搜索 =====

    @Test
    void keywordSearchReturnsMatchingProducts() {
        syncService.syncAll();
        ProductQueryDTO query = new ProductQueryDTO();
        query.setKeyword("iPhone");

        PageResult<Product> result = productService.list(query);

        assertTrue(result.getTotal() > 0, "关键词搜索应命中商品");
        for (Product p : result.getRecords()) {
            assertTrue(p.getName().toLowerCase().contains("iphone"), "搜索结果名称应包含关键词");
        }
    }

    // ===== 测试 2：无结果搜索 =====

    @Test
    void searchNoResultReturnsEmpty() {
        syncService.syncAll();
        ProductQueryDTO query = new ProductQueryDTO();
        query.setKeyword("不存在的商品关键词xyz");

        PageResult<Product> result = productService.list(query);

        assertEquals(0L, result.getTotal(), "无匹配关键词应返回 0 条");
        assertTrue(result.getRecords().isEmpty(), "无匹配关键词应返回空列表");
    }

    // ===== 测试 3：分页与分类筛选 =====

    @Test
    void paginationAndCategoryFilter() {
        syncService.syncAll();

        ProductQueryDTO paged = new ProductQueryDTO();
        paged.setPage(1L);
        paged.setPageSize(5L);
        PageResult<Product> page = productService.list(paged);
        assertTrue(page.getTotal() > 0, "应有商品数据");
        assertTrue(page.getRecords().size() <= 5, "分页应遵守 pageSize 上限");
        assertEquals(1L, page.getPage());

        // 取一个「可展示」（有审核通过图片）且带分类的商品作为筛选样例——
        // 用户端列表现在只返回有合格图片的商品，样例也必须从可展示集合里取
        Product sample = productMapper.selectList(new LambdaQueryWrapper<Product>()
                        .eq(Product::getStatus, 1)
                        .isNotNull(Product::getCategoryId)
                        .inSql(Product::getId, com.geekprice.service.ProductImageLicenseService.QUALIFIED_PRODUCT_IDS_SQL)
                )
                .get(0);
        ProductQueryDTO filtered = new ProductQueryDTO();
        filtered.setCategoryId(sample.getCategoryId());
        PageResult<Product> result = productService.list(filtered);
        assertTrue(result.getTotal() > 0, "按分类筛选应有结果");
        for (Product p : result.getRecords()) {
            assertEquals(sample.getCategoryId(), p.getCategoryId(), "筛选结果分类应一致");
        }
    }

    // ===== 测试 4：多平台价格比较 + 最低价正确 =====

    @Test
    void multiPlatformCompareReturnsLowestPrice() {
        syncService.syncAll();
        Product product = newestProduct();

        PriceCompareVO vo = priceService.compare(product.getId());

        assertNotNull(vo.getPrices(), "比价应返回价格列表");
        assertTrue(vo.getPrices().size() >= 2, "同一产品应返回至少两个平台的报价");
        BigDecimal min = vo.getPrices().stream()
                .map(ProductPrice::getPrice)
                .min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
        assertEquals(0, vo.getLowestPrice().compareTo(min), "最低价应为各平台报价的最小值");
        assertNotNull(vo.getLowestPlatformName(), "最低价平台名不应为空");
    }

    // ===== 测试 5：无价格产品 / 不存在产品比价正常返回 =====

    @Test
    void compareMissingProductOrNoPriceReturnsGracefully() {
        // 不存在的产品：不抛异常，返回空价格列表与 0 最低价
        PriceCompareVO missing = priceService.compare(-999999L);
        assertNotNull(missing.getPrices());
        assertTrue(missing.getPrices().isEmpty(), "不存在产品应返回空价格列表");
        assertEquals(0, missing.getLowestPrice().compareTo(BigDecimal.ZERO), "不存在产品最低价应为 0");

        // 有产品但无任何平台报价：同样正常返回
        Product noPrice = new Product();
        noPrice.setName("测试无价格商品");
        noPrice.setStatus(1);
        productMapper.insert(noPrice);

        PriceCompareVO vo = priceService.compare(noPrice.getId());
        assertTrue(vo.getPrices().isEmpty(), "无价格产品应返回空价格列表");
        assertEquals(0, vo.getLowestPrice().compareTo(BigDecimal.ZERO), "无价格产品最低价应为 0");
    }

    // ===== 测试 6：多产品对比 =====

    @Test
    void multiProductCompareReturnsDetails() {
        syncService.syncAll();
        // 取同一分类的商品用于对比（compare 现在要求同品类）
        List<Product> all = productMapper.selectList(new LambdaQueryWrapper<Product>()
                .eq(Product::getStatus, 1)
                .orderByDesc(Product::getId));
        // 按分组找到至少有 2 个商品的分类
        Map<Long, List<Long>> byCat = all.stream()
                .collect(Collectors.groupingBy(Product::getCategoryId,
                        Collectors.mapping(Product::getId, Collectors.toList())));
        Long catId = byCat.entrySet().stream()
                .filter(e -> e.getValue().size() >= 2)
                .map(Map.Entry::getKey)
                .findFirst()
                .orElseThrow(() -> new AssertionError("应存在至少有2个商品的分类"));
        List<Long> ids = byCat.get(catId).stream().limit(2).toList();

        List<Product> result = productService.compare(ids);

        assertEquals(2, result.size(), "同品类的两个产品应全部返回");
        for (Product p : result) {
            assertNotNull(p.getName(), "对比应包含产品名称");
            assertNotNull(p.getSpecs(), "对比应包含规格参数");
            assertNotNull(p.getCurrentPrice(), "对比应包含当前价格");
        }
    }

    // ===== 测试 7：对比跳过不存在产品 =====

    @Test
    void compareSkipsMissingProduct() {
        syncService.syncAll();
        Product product = newestProduct();

        List<Product> result = productService.compare(List.of(product.getId(), -999999L));

        assertEquals(1, result.size(), "不存在的产品应被跳过");
        assertEquals(product.getId(), result.get(0).getId(), "返回的应为存在的产品");
    }
}
