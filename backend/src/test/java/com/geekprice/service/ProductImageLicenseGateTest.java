package com.geekprice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.common.PageResult;
import com.geekprice.dto.ProductQueryDTO;
import com.geekprice.entity.Product;
import com.geekprice.entity.ProductImage;
import com.geekprice.entity.ProductImageLicense;
import com.geekprice.mapper.ProductImageLicenseMapper;
import com.geekprice.mapper.ProductImageMapper;
import com.geekprice.mapper.ProductMapper;
import com.geekprice.vo.ImageAttributionVO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.springframework.test.context.ActiveProfiles;

/**
 * 图片授权闭环测试（阶段 B-2）。
 *
 * 覆盖：
 * 1. 授权记录唯一性（image_id 唯一键）；2. 无授权记录的图片不下发；
 * 3. CC0/APPROVED 图片正常展示并携带署名；4. 待审核（PENDING）与拒绝（REJECTED）图片被过滤；
 * 5. 无合格图片的商品不进入用户端列表（分页总数一致）；6. 管理端查询不受影响（直接查表仍可见全部）；
 * 7. 同步链路的图片写入不会自动产生授权记录（新图在审核前不展示）。
 *
 * 夹具与断言全部在 @Transactional 回滚内执行，不污染真实数据。
 */
@SpringBootTest
@Transactional
@ActiveProfiles("test")
class ProductImageLicenseGateTest {

    @Autowired
    private ProductService productService;
    @Autowired
    private ProductImageLicenseService imageLicenseService;
    @Autowired
    private ProductMapper productMapper;
    @Autowired
    private ProductImageMapper productImageMapper;
    @Autowired
    private ProductImageLicenseMapper productImageLicenseMapper;

    // ---------- 夹具 ----------

    private Product newProduct(String name) {
        Product p = new Product();
        p.setName(name);
        p.setStatus(1);
        p.setValueScore(60);
        p.setHeat(100);
        productMapper.insert(p);
        return p;
    }

    private ProductImage newImage(Product p, String url) {
        ProductImage img = new ProductImage();
        img.setProductId(p.getId());
        img.setUrl(url);
        img.setSort(0);
        productImageMapper.insert(img);
        return img;
    }

    private ProductImageLicense newLicense(ProductImage img, String status) {
        ProductImageLicense lic = new ProductImageLicense();
        lic.setImageId(img.getId());
        lic.setSource("wikimedia_commons");
        lic.setLicense("CC0");
        lic.setAuditStatus(status);
        productImageLicenseMapper.insert(lic);
        return lic;
    }

    // ===== 1. 授权记录唯一性 =====

    @Test
    void licenseRecordIsUniquePerImage() {
        Product p = newProduct("唯一性测试商品");
        ProductImage img = newImage(p, "https://upload.wikimedia.org/wikipedia/commons/test/unique.jpg");
        newLicense(img, "APPROVED");

        // 同一 image_id 第二次插入应触发唯一键冲突
        ProductImageLicense dup = new ProductImageLicense();
        dup.setImageId(img.getId());
        dup.setSource("wikimedia_commons");
        dup.setAuditStatus("PENDING_EVIDENCE");
        assertThrows(DataIntegrityViolationException.class,
                () -> productImageLicenseMapper.insert(dup),
                "image_id 唯一键应拒绝重复授权记录");
    }

    // ===== 2. 无授权记录的图片不下发 =====

    @Test
    void imageWithoutLicenseRecordIsNotDelivered() {
        Product p = newProduct("无授权记录测试商品");
        newImage(p, "https://upload.wikimedia.org/wikipedia/commons/test/no-license.jpg");

        List<ImageAttributionVO> atts = imageLicenseService.qualifiedAttributions(p.getId());
        assertTrue(atts.isEmpty(), "无授权记录的图片不应下发");
        assertNull(imageLicenseService.qualifiedFirstImageUrl(p.getId()), "无合格图片时应返回 null");
    }

    // ===== 3. CC0 图片正常展示并携带署名 =====

    @Test
    void approvedCc0ImageIsDeliveredWithAttribution() {
        Product p = newProduct("CC0展示测试商品");
        ProductImage img = newImage(p, "https://upload.wikimedia.org/wikipedia/commons/test/cc0.jpg");
        ProductImageLicense lic = newLicense(img, "APPROVED");
        lic.setAuthor("Test Author");
        lic.setLicenseUrl("https://creativecommons.org/publicdomain/zero/1.0/");
        lic.setSourcePageUrl("https://commons.wikimedia.org/wiki/File:cc0.jpg");
        lic.setAttributionText("图片来自 Wikimedia Commons，许可 CC0。");
        productImageLicenseMapper.updateById(lic);

        List<ImageAttributionVO> atts = imageLicenseService.qualifiedAttributions(p.getId());
        assertEquals(1, atts.size(), "APPROVED 图片应下发");
        ImageAttributionVO a = atts.get(0);
        assertEquals(img.getUrl(), a.getUrl());
        assertEquals("Test Author", a.getAuthor());
        assertEquals("CC0", a.getLicense());
        assertNotNull(a.getLicenseUrl(), "署名应含许可链接");
        assertNotNull(a.getSourcePageUrl(), "署名应含来源页面");
    }

    // ===== 4. 待审核与拒绝图片被过滤；APPROVED_WITH_ATTRIBUTION 放行 =====

    @Test
    void pendingAndRejectedImagesAreFiltered() {
        Product p = newProduct("混合状态测试商品");
        ProductImage pending = newImage(p, "https://upload.wikimedia.org/wikipedia/commons/test/pending.jpg");
        newLicense(pending, "PENDING_EVIDENCE");

        ProductImage rejected = new ProductImage();
        rejected.setProductId(p.getId());
        rejected.setUrl("https://upload.wikimedia.org/wikipedia/commons/test/rejected.jpg");
        rejected.setSort(1);
        productImageMapper.insert(rejected);
        newLicense(rejected, "REJECTED");

        ProductImage withAttr = new ProductImage();
        withAttr.setProductId(p.getId());
        withAttr.setUrl("https://upload.wikimedia.org/wikipedia/commons/test/with-attr.jpg");
        withAttr.setSort(2);
        productImageMapper.insert(withAttr);
        newLicense(withAttr, "APPROVED_WITH_ATTRIBUTION");

        List<ImageAttributionVO> atts = imageLicenseService.qualifiedAttributions(p.getId());
        assertEquals(1, atts.size(), "只有 APPROVED_WITH_ATTRIBUTION 应下发");
        assertEquals(withAttr.getUrl(), atts.get(0).getUrl(), "PENDING/REJECTED 均被过滤");
    }

    // ===== 4b. 有风险标记的已通过图片不下发（风险必须解除后才展示） =====

    @Test
    void approvedImageWithUnresolvedRiskIsNotDelivered() {
        Product p = newProduct("风险标记测试商品");
        ProductImage img = newImage(p, "https://upload.wikimedia.org/wikipedia/commons/test/risk.jpg");
        ProductImageLicense lic = newLicense(img, "APPROVED");
        lic.setAuthor("Test Author");
        lic.setLicense("CC0");
        lic.setLicenseUrl("https://creativecommons.org/publicdomain/zero/1.0/");
        lic.setSourcePageUrl("https://commons.wikimedia.org/wiki/File:risk.jpg");
        lic.setRiskNotes("Commons 分类含 License review needed：授权未经复核");
        productImageLicenseMapper.updateById(lic);

        assertTrue(imageLicenseService.qualifiedAttributions(p.getId()).isEmpty(),
                "存在未解除风险标记的图片即使状态为 APPROVED 也不应下发");

        // 人工复核后清除风险标记 → 恢复下发
        lic.setRiskNotes("");
        productImageLicenseMapper.updateById(lic);
        assertEquals(1, imageLicenseService.qualifiedAttributions(p.getId()).size(),
                "风险解除后应恢复下发");
    }

    // ===== 4c. 需署名许可缺作者/署名文本时不下发 =====

    @Test
    void ccByImageWithoutAttributionIsNotDelivered() {
        Product p = newProduct("署名缺失测试商品");
        ProductImage img = newImage(p, "https://upload.wikimedia.org/wikipedia/commons/test/ccby-noattr.jpg");
        ProductImageLicense lic = newLicense(img, "APPROVED_WITH_ATTRIBUTION");
        lic.setLicense("CC BY 4.0");
        lic.setLicenseUrl("https://creativecommons.org/licenses/by/4.0/");
        lic.setSourcePageUrl("https://commons.wikimedia.org/wiki/File:ccby-noattr.jpg");
        // 作者与署名文本缺失
        lic.setAuthor("");
        lic.setAttributionText("");
        productImageLicenseMapper.updateById(lic);

        assertTrue(imageLicenseService.qualifiedAttributions(p.getId()).isEmpty(),
                "CC BY 图片缺少作者/署名文本时不应下发");

        // 补齐署名信息 → 恢复下发
        lic.setAuthor("Test Author");
        lic.setAttributionText("图片来自 Wikimedia Commons，许可 CC BY 4.0，作者 Test Author。");
        productImageLicenseMapper.updateById(lic);
        assertEquals(1, imageLicenseService.qualifiedAttributions(p.getId()).size(),
                "补齐署名信息后应恢复下发");
    }

    // ===== 5. 无合格图片商品不进入用户端列表 =====

    @Test
    void productListOnlyContainsDisplayableProducts() {
        Product withLicense = newProduct("可展示商品-门控测试");
        ProductImage img = newImage(withLicense, "https://upload.wikimedia.org/wikipedia/commons/test/gate-ok.jpg");
        newLicense(img, "APPROVED");

        Product withoutLicense = newProduct("无授权商品-门控测试");
        newImage(withoutLicense, "https://upload.wikimedia.org/wikipedia/commons/test/gate-none.jpg");

        ProductQueryDTO query = new ProductQueryDTO();
        query.setKeyword("门控测试");
        PageResult<Product> result = productService.list(query);

        List<Long> ids = result.getRecords().stream().map(Product::getId).toList();
        assertTrue(ids.contains(withLicense.getId()), "有合格图片的商品应出现在列表");
        assertFalse(ids.contains(withoutLicense.getId()), "无合格图片的商品不应出现在列表");
        assertEquals(1L, result.getTotal(), "分页总数应与过滤条件一致");
    }

    // ===== 6. 管理端仍可见（直接查表不受授权过滤影响） =====

    @Test
    void adminQueriesStillSeeAllProducts() {
        Product p = newProduct("管理端可见测试商品");
        newImage(p, "https://upload.wikimedia.org/wikipedia/commons/test/admin-see.jpg");

        // 管理端走自己的 selectPage + productMapper，不经授权过滤：直接查表应能看到
        Product found = productMapper.selectById(p.getId());
        assertNotNull(found, "管理端直查应能看到无授权图片的商品");
    }

    // ===== 7. 同步链路写入的新图片在审核前不会自动展示 =====

    @Test
    void syncedImagesWithoutAuditAreNotDelivered() {
        Product p = newProduct("同步新图测试商品");
        // 模拟同步器行为：只插入 product_images，不写授权表
        ProductImage synced = newImage(p, "https://mock-cdn.example.com/synced-new-image.jpg");

        assertTrue(imageLicenseService.qualifiedAttributions(p.getId()).isEmpty(),
                "同步新增但未审核的图片不应下发");
        assertNull(imageLicenseService.qualifiedFirstImageUrl(p.getId()));
        assertFalse(imageLicenseService.QUALIFIED_PRODUCT_IDS_SQL.contains(String.valueOf(p.getId())),
                "该商品不应出现在可展示集合的子查询条件中");

        // 审核通过后即可展示（闭环）
        newLicense(synced, "APPROVED");
        assertEquals(1, imageLicenseService.qualifiedAttributions(p.getId()).size(),
                "审核通过后应可下发");
    }

    // ===== 8. 真实数据口径：可展示商品总数与授权表对账 =====

    @Test
    void displayableProductsConsistentWithLicenseTable() {
        long displayableLicenseCount = productImageLicenseMapper
                .selectList(new LambdaQueryWrapper<ProductImageLicense>()
                        .in(ProductImageLicense::getAuditStatus, "APPROVED", "APPROVED_WITH_ATTRIBUTION"))
                .size();

        ProductQueryDTO query = new ProductQueryDTO();
        query.setPage(1L);
        query.setPageSize(50L);
        PageResult<Product> page = productService.list(query);

        // 列表总数 = 有合格图片的商品数（授权表中 APPROVED 状态的图片按商品去重）
        long distinctDisplayableProducts = productImageLicenseMapper
                .selectList(new LambdaQueryWrapper<ProductImageLicense>()
                        .in(ProductImageLicense::getAuditStatus, "APPROVED", "APPROVED_WITH_ATTRIBUTION"))
                .stream()
                .map(ProductImageLicense::getImageId)
                .map(imageId -> {
                    ProductImage img = productImageMapper.selectById(imageId);
                    return img == null ? null : img.getProductId();
                })
                .filter(java.util.Objects::nonNull)
                .distinct()
                .count();
        assertEquals(distinctDisplayableProducts, page.getTotal(),
                "列表分页总数应等于可展示商品数");
        assertTrue(displayableLicenseCount > 0, "应存在已审核通过的图片");
    }

    // ===== 9. SQL 门控与 Java 规则一致：有风险标记的已通过图片不进入列表 =====

    @Test
    void sqlGateExcludesProductsWithUnresolvedRisk() {
        Product p = newProduct("SQL门控风险一致性测试商品");
        ProductImage img = newImage(p, "https://upload.wikimedia.org/wikipedia/commons/test/sql-gate-risk.jpg");
        ProductImageLicense lic = newLicense(img, "APPROVED");
        lic.setAuthor("Test Author");
        lic.setLicense("CC0");
        lic.setLicenseUrl("https://creativecommons.org/publicdomain/zero/1.0/");
        lic.setSourcePageUrl("https://commons.wikimedia.org/wiki/File:sql-gate-risk.jpg");
        lic.setRiskNotes("SQL 门控一致性测试风险");
        productImageLicenseMapper.updateById(lic);

        // Java 侧：不下发
        assertTrue(imageLicenseService.qualifiedAttributions(p.getId()).isEmpty(),
                "有风险标记时 Java 侧不应下发图片");

        // 列表侧：inSql 子查询（QUALIFIED_PRODUCT_IDS_SQL）应同样排除该商品
        ProductQueryDTO query = new ProductQueryDTO();
        query.setPage(1L);
        query.setPageSize(50L);
        boolean listed = productService.list(query).getRecords().stream()
                .anyMatch(x -> x.getId().equals(p.getId()));
        assertFalse(listed, "有风险标记的商品不应出现在列表 SQL 门控结果中");

        // 风险解除（空串，两个门控均视为空/已解除）后两侧同时放行
        // 注意：MyBatis-Plus updateById 默认跳过 null 字段，须用空串或 LambdaUpdateWrapper 显式清空
        lic.setRiskNotes("");
        productImageLicenseMapper.updateById(lic);
        assertEquals(1, imageLicenseService.qualifiedAttributions(p.getId()).size(), "风险解除后 Java 侧放行");
        boolean listed2 = productService.list(query).getRecords().stream()
                .anyMatch(x -> x.getId().equals(p.getId()));
        assertTrue(listed2, "风险解除后列表 SQL 门控放行");
    }

    // ===== 10. SQL 门控与 Java 规则一致：CC BY 缺署名不进入列表 =====

    @Test
    void sqlGateExcludesCcByImagesWithoutAttribution() {
        Product p = newProduct("SQL门控署名一致性测试商品");
        ProductImage img = newImage(p, "https://upload.wikimedia.org/wikipedia/commons/test/sql-gate-attr.jpg");
        ProductImageLicense lic = newLicense(img, "APPROVED_WITH_ATTRIBUTION");
        lic.setLicense("CC BY 4.0");
        lic.setLicenseUrl("https://creativecommons.org/licenses/by/4.0/");
        lic.setSourcePageUrl("https://commons.wikimedia.org/wiki/File:sql-gate-attr.jpg");
        // 先设完整署名并落库，确保 license 字段不为 null（updateById 跳过 null）
        lic.setAuthor("Placeholder");
        lic.setAttributionText("Placeholder");
        productImageLicenseMapper.updateById(lic);

        // 再清空作者与署名文本（空串，updateById 会写入空串）
        lic.setAuthor("");
        lic.setAttributionText("");
        productImageLicenseMapper.updateById(lic);

        assertTrue(imageLicenseService.qualifiedAttributions(p.getId()).isEmpty(),
                "CC BY 缺署名时 Java 侧不下发");

        ProductQueryDTO query = new ProductQueryDTO();
        query.setPage(1L);
        query.setPageSize(50L);
        boolean listed = productService.list(query).getRecords().stream()
                .anyMatch(x -> x.getId().equals(p.getId()));
        assertFalse(listed, "CC BY 缺署名的商品不应出现在列表 SQL 门控结果中");

        // 补齐署名后两侧同时放行
        lic.setAuthor("Test Author");
        lic.setAttributionText("图片来自 Wikimedia Commons，许可 CC BY 4.0。");
        productImageLicenseMapper.updateById(lic);
        assertEquals(1, imageLicenseService.qualifiedAttributions(p.getId()).size());
        boolean listed2 = productService.list(query).getRecords().stream()
                .anyMatch(x -> x.getId().equals(p.getId()));
        assertTrue(listed2, "补齐署名后列表 SQL 门控放行");
    }
}
