package com.geekprice.service;

import com.geekprice.entity.BrowseHistory;
import com.geekprice.entity.Product;
import com.geekprice.entity.User;
import com.geekprice.mapper.BrowseHistoryMapper;
import com.geekprice.mapper.ProductMapper;
import com.geekprice.mapper.UserMapper;
import com.geekprice.vo.RecommendationVO;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.springframework.test.context.ActiveProfiles;

/**
 * 性价比评分 / 个性化推荐 集成测试（Step 15）。
 *
 * 验证：
 * 1. valueScore 正常计算 / 重算；2. 推荐包含有效（上架）产品；3. 下架产品不进入推荐；
 * 4. 用户行为影响推荐（走个性化混合推荐，且不重复推荐已浏览产品）；
 * 5. 无行为新用户冷启动 fallback；6. 性价比评分影响冷启动推荐；7. 异常数据不导致推荐失败。
 *
 * 复用既有 ValueScoreService.calculate/recalculateAll 与 RecommendationService.recommend，
 * 本测试不重复实现评分/推荐逻辑，仅验证其行为。
 */
@SpringBootTest
@Transactional
@ActiveProfiles("test")
class ValueScoreRecommendationTest {

    @Autowired
    private ValueScoreService valueScoreService;
    @Autowired
    private RecommendationService recommendationService;
    @Autowired
    private ProductMapper productMapper;
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private BrowseHistoryMapper browseHistoryMapper;
    @Autowired
    private com.geekprice.mapper.ProductImageMapper productImageMapper;
    @Autowired
    private com.geekprice.mapper.ProductImageLicenseMapper productImageLicenseMapper;
    @Autowired
    private com.geekprice.mapper.ProductSpecMapper productSpecMapper;

    /** 为商品写入可信参数（verified/reference），使评分达到可评分门槛（≥3 项可信参数） */
    private void trustedSpecsFor(Product p, int n) {
        for (int i = 1; i <= n; i++) {
            com.geekprice.entity.ProductSpec s = new com.geekprice.entity.ProductSpec();
            s.setProductId(p.getId());
            s.setSpecKey("spec_k" + i);
            s.setSpecLabel("参数" + i);
            s.setSpecValue("值" + i);
            s.setSort(i);
            s.setVerifyStatus("reference");
            s.setSourceType("internal_knowledge");
            productSpecMapper.insert(s);
        }
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ---------- 工具 ----------

    /**
     * 推荐候选集现在要求「至少一张审核通过的真实图片」，
     * 因此测试夹具在插入商品后同步插入图片 + APPROVED 授权记录（与真实闭环一致）。
     */
    private void approveImageFor(Product p) {
        com.geekprice.entity.ProductImage img = new com.geekprice.entity.ProductImage();
        img.setProductId(p.getId());
        img.setUrl("https://upload.wikimedia.org/wikipedia/commons/test/" + p.getId() + ".jpg");
        img.setSort(0);
        productImageMapper.insert(img);
        com.geekprice.entity.ProductImageLicense lic = new com.geekprice.entity.ProductImageLicense();
        lic.setImageId(img.getId());
        lic.setSource("test");
        lic.setLicense("CC0");
        lic.setAuditStatus("APPROVED");
        productImageLicenseMapper.insert(lic);
    }

    private Product insertProduct(String name, int status, Integer valueScore, Integer heat,
                                  BigDecimal currentPrice, LocalDate launchDate) {
        Product p = new Product();
        p.setName(name);
        p.setStatus(status);
        p.setValueScore(valueScore);
        p.setHeat(heat);
        p.setCurrentPrice(currentPrice);
        p.setLaunchDate(launchDate);
        p.setPerformanceScore(80);
        p.setUserRating(BigDecimal.valueOf(4.5));
        productMapper.insert(p);
        approveImageFor(p);
        return p;
    }

    private User newUser(String username) {
        User u = new User();
        u.setUsername(username);
        u.setPassword("test-pass");
        u.setNickname(username);
        u.setStatus(1);
        userMapper.insert(u);
        return u;
    }

    private void login(Long userId, String... roles) {
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        for (String role : roles) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
        }
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userId, null, authorities));
    }

    private void browse(User user, Product product) {
        BrowseHistory h = new BrowseHistory();
        h.setUserId(user.getId());
        h.setProductId(product.getId());
        browseHistoryMapper.insert(h);
    }

    private Set<Long> recommendedIds(List<RecommendationVO> list) {
        return list.stream().map(RecommendationVO::getProductId).collect(Collectors.toSet());
    }

    // ===== 测试 1：可信参数充足时评分在 0-100；参数不足时返回 null（不伪造评分） =====

    @Test
    void calculateValueScoreWithinRange() {
        Product p = insertProduct("评分测试商品", 1, null, 5000, BigDecimal.valueOf(5999), LocalDate.now());
        trustedSpecsFor(p, 4); // ≥3 项可信参数 → 可评分
        Integer score = valueScoreService.calculate(p.getId());
        assertNotNull(score, "可信参数充足时应给出评分");
        assertTrue(score >= 0 && score <= 100, "性价比评分应在 0-100 之间，实际 " + score);

        // 参数不足 → 数据不足，暂不评分
        Product poor = insertProduct("参数不足测试商品", 1, null, 5000, BigDecimal.valueOf(5999), LocalDate.now());
        assertNull(valueScoreService.calculate(poor.getId()), "可信参数不足时应返回 null（暂不评分）");
    }

    // ===== 测试 2：valueScore 重算（可信参数商品写分，参数不足商品写 NULL） =====

    @Test
    void recalculateAllUpdatesValueScore() {
        Product p = insertProduct("重算测试商品", 1, 0, 5000, BigDecimal.valueOf(5999), LocalDate.now());
        trustedSpecsFor(p, 4);
        Product poor = insertProduct("重算-参数不足商品", 1, 0, 5000, BigDecimal.valueOf(5999), LocalDate.now());
        valueScoreService.recalculateAll();
        Product reloaded = productMapper.selectById(p.getId());
        assertNotNull(reloaded.getValueScore(), "可信参数充足的商品重算后应写入 valueScore");
        assertTrue(reloaded.getValueScore() >= 0 && reloaded.getValueScore() <= 100);
        Product poorReloaded = productMapper.selectById(poor.getId());
        assertNull(poorReloaded.getValueScore(), "参数不足的商品重算后应写入 NULL（不伪造分数）");
    }

    // ===== 测试 3：不存在产品返回 0 不抛异常 =====

    @Test
    void calculateNonexistentProductReturnsZero() {
        assertEquals(0, valueScoreService.calculate(-999999L), "不存在产品应返回 0 而非抛异常");
    }

    // ===== 测试 4：推荐包含有效产品（均为上架） =====

    @Test
    void recommendReturnsValidOnShelfProducts() {
        insertProduct("上架商品1", 1, 80, 5000, BigDecimal.valueOf(5999), LocalDate.now());
        insertProduct("上架商品2", 1, 70, 4000, BigDecimal.valueOf(4999), LocalDate.now());
        insertProduct("上架商品3", 1, 60, 3000, BigDecimal.valueOf(3999), LocalDate.now());

        List<RecommendationVO> result = recommendationService.recommend();
        assertFalse(result.isEmpty(), "推荐应返回商品");
        for (RecommendationVO vo : result) {
            Product p = productMapper.selectById(vo.getProductId());
            assertNotNull(p, "推荐的产品应存在");
            assertEquals(1, p.getStatus(), "推荐的产品应为上架状态");
            assertNotNull(vo.getName(), "推荐应包含产品名称");
        }
    }

    // ===== 测试 5：下架产品不进入推荐 =====

    @Test
    void offShelfProductNotRecommended() {
        Product offShelf = insertProduct("下架商品", 0, 100, 99999, BigDecimal.valueOf(1), LocalDate.now());
        insertProduct("上架商品A", 1, 80, 5000, BigDecimal.valueOf(5999), LocalDate.now());

        List<RecommendationVO> result = recommendationService.recommend();
        assertFalse(result.isEmpty());
        assertFalse(recommendedIds(result).contains(offShelf.getId()), "下架产品不应出现在推荐中");
    }

    // ===== 测试 6：用户行为影响推荐结果 =====

    @Test
    void behaviorActivatesPersonalizedRecommendation() {
        User user = newUser("rec_user");
        Product viewed = insertProduct("已浏览商品", 1, 80, 5000, BigDecimal.valueOf(5999), LocalDate.now());
        insertProduct("候选商品1", 1, 75, 4000, BigDecimal.valueOf(4999), LocalDate.now());
        insertProduct("候选商品2", 1, 70, 3000, BigDecimal.valueOf(3999), LocalDate.now());
        browse(user, viewed);

        login(user.getId(), "USER");
        List<RecommendationVO> result = recommendationService.recommend();

        assertFalse(result.isEmpty(), "有个性化候选时应返回推荐");
        for (RecommendationVO vo : result) {
            assertEquals("hybrid", vo.getType(), "有行为用户应走个性化混合推荐");
        }
        assertFalse(recommendedIds(result).contains(viewed.getId()), "已浏览产品不应重复推荐");
    }

    // ===== 测试 7：无行为新用户 fallback（冷启动） =====

    @Test
    void newUserGetsColdStartFallback() {
        insertProduct("冷启动商品1", 1, 90, 8000, BigDecimal.valueOf(5999), LocalDate.now());
        insertProduct("冷启动商品2", 1, 85, 7000, BigDecimal.valueOf(4999), LocalDate.now());

        User user = newUser("rec_new_user");
        login(user.getId(), "USER");
        List<RecommendationVO> result = recommendationService.recommend();

        assertFalse(result.isEmpty(), "冷启动应返回推荐");
        for (RecommendationVO vo : result) {
            assertTrue("value".equals(vo.getType()) || "hot".equals(vo.getType()),
                    "无行为用户应走冷启动（value/hot），实际 " + vo.getType());
        }
    }

    // ===== 测试 8：性价比评分影响推荐 =====

    @Test
    void highValueScoreProductAppearsInColdStart() {
        Product high = insertProduct("高性价比商品", 1, 100, 0, BigDecimal.valueOf(2999), LocalDate.now());
        insertProduct("普通商品", 1, 10, 0, BigDecimal.valueOf(2999), LocalDate.now());

        List<RecommendationVO> result = recommendationService.recommend();
        assertTrue(recommendedIds(result).contains(high.getId()), "高 valueScore 商品应进入冷启动推荐");
    }

    // ===== 测试 9：异常数据保护（缺失字段不导致推荐失败） =====

    @Test
    void recommendHandlesAnomalousProductData() {
        // 价格 / 热度 / 上市时间 / 性价比 全部缺失的商品
        insertProduct("异常数据商品", 1, null, null, null, null);
        insertProduct("正常商品", 1, 70, 5000, BigDecimal.valueOf(3999), LocalDate.now());

        // 匿名冷启动不因异常数据失败
        assertNotNull(recommendationService.recommend(), "异常数据下匿名推荐不应返回 null");

        // 有行为用户走个性化路径，异常商品作为候选也不失败
        User user = newUser("rec_anomaly_user");
        browse(user, insertProduct("行为商品", 1, 70, 4000, BigDecimal.valueOf(3999), LocalDate.now()));
        login(user.getId(), "USER");
        assertNotNull(recommendationService.recommend(), "异常候选数据下个性化推荐不应返回 null");
    }
}
