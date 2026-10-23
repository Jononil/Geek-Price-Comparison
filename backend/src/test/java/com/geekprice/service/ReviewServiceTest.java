package com.geekprice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.common.PageResult;
import com.geekprice.common.ResultCode;
import com.geekprice.dto.ReviewCreateDTO;
import com.geekprice.entity.Product;
import com.geekprice.entity.Review;
import com.geekprice.entity.ReviewArticle;
import com.geekprice.entity.User;
import com.geekprice.exception.BusinessException;
import com.geekprice.mapper.ProductMapper;
import com.geekprice.mapper.ReviewArticleMapper;
import com.geekprice.mapper.ReviewMapper;
import com.geekprice.mapper.UserMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.springframework.test.context.ActiveProfiles;

/**
 * 用户评论 / 专业测评 集成测试（Step 14）。
 *
 * 验证：
 * 1. 用户发表评论；2. 评论列表查询；3. 删除自己的评论；4. 不能删除他人评论；
 * 5. 管理员可管理评论；6. 空评论 / 无效产品校验；7. 未登录不可发表评论；
 * 8. 产品详情包含测评/评论（不存在时返回空列表）。
 *
 * 本系统 JWT 认证把 userId 作为 SecurityContext 的 principal，故此处直接构造
 * UsernamePasswordAuthenticationToken(userId, null, authorities) 模拟登录态，
 * 复用既有 SecurityUtil.getCurrentUserId() / isAdmin()，不重写认证逻辑。
 */
@SpringBootTest
@Transactional
@ActiveProfiles("test")
class ReviewServiceTest {

    @Autowired
    private ReviewService reviewService;
    @Autowired
    private ProductService productService;
    @Autowired
    private ReviewMapper reviewMapper;
    @Autowired
    private ReviewArticleMapper reviewArticleMapper;
    @Autowired
    private ProductMapper productMapper;
    @Autowired
    private UserMapper userMapper;

    private User user1;
    private User user2;
    private User admin;

    @BeforeEach
    void setUp() {
        user1 = newUser("review_user1");
        user2 = newUser("review_user2");
        admin = newUser("review_admin");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ---------- 工具 ----------

    private User newUser(String username) {
        User u = new User();
        u.setUsername(username);
        u.setPassword("test-pass");   // users.password 为 NOT NULL 且无默认值
        u.setNickname(username);
        u.setStatus(1);
        userMapper.insert(u);
        return u;
    }

    private Product newProduct(String name) {
        Product p = new Product();
        p.setName(name);
        p.setStatus(1);
        productMapper.insert(p);
        return p;
    }

    private void login(Long userId, String... roles) {
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        for (String role : roles) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
        }
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userId, null, authorities));
    }

    private ReviewCreateDTO dto(Long productId, String content) {
        ReviewCreateDTO d = new ReviewCreateDTO();
        d.setProductId(productId);
        d.setStar(5);
        d.setContent(content);
        return d;
    }

    private long countReviews(Long productId) {
        return reviewMapper.selectCount(new LambdaQueryWrapper<Review>()
                .eq(Review::getProductId, productId));
    }

    // ===== 测试 1/2：用户发表评论 + 评论列表查询 =====

    @Test
    void createReviewAndListByProduct() {
        login(user1.getId(), "USER");
        Product product = newProduct("测试商品A");
        reviewService.create(dto(product.getId(), "很好用"));

        assertEquals(1, countReviews(product.getId()), "评论应写入");

        PageResult<Review> result = reviewService.listByProduct(product.getId(), 1L, 10L);
        assertEquals(1, result.getTotal(), "评论列表应返回该产品评论");
        assertEquals("很好用", result.getRecords().get(0).getContent());
        assertEquals(user1.getNickname(), result.getRecords().get(0).getNickname(), "应填充评论人昵称");
    }

    // ===== 测试 3：用户删除自己的评论 =====

    @Test
    void userDeletesOwnReview() {
        login(user1.getId(), "USER");
        Product product = newProduct("测试商品B");
        reviewService.create(dto(product.getId(), "我的评论"));
        Long reviewId = reviewMapper.selectList(new LambdaQueryWrapper<Review>()
                .eq(Review::getProductId, product.getId())).get(0).getId();

        reviewService.delete(reviewId);

        assertEquals(0, countReviews(product.getId()), "删除自己的评论后应不存在");
    }

    // ===== 测试 4：用户不能删除其他用户评论 =====

    @Test
    void userCannotDeleteOthersReview() {
        login(user1.getId(), "USER");
        Product product = newProduct("测试商品C");
        reviewService.create(dto(product.getId(), "别人的评论"));
        Long reviewId = reviewMapper.selectList(new LambdaQueryWrapper<Review>()
                .eq(Review::getProductId, product.getId())).get(0).getId();

        login(user2.getId(), "USER");
        BusinessException ex = assertThrows(BusinessException.class,
                () -> reviewService.delete(reviewId));

        assertEquals(ResultCode.FORBIDDEN.getCode(), ex.getCode(), "删除他人评论应返回 403");
        assertEquals(1, countReviews(product.getId()), "他人评论不应被删除");
    }

    // ===== 测试 5：管理员评论管理 =====

    @Test
    void adminCanDeleteAnyReview() {
        login(user1.getId(), "USER");
        Product product = newProduct("测试商品D");
        reviewService.create(dto(product.getId(), "用户评论"));
        Long reviewId = reviewMapper.selectList(new LambdaQueryWrapper<Review>()
                .eq(Review::getProductId, product.getId())).get(0).getId();

        login(admin.getId(), "ADMIN");
        reviewService.delete(reviewId);

        assertEquals(0, countReviews(product.getId()), "管理员应能删除任意评论");
    }

    // ===== 测试 6：空评论 / 无效产品校验 =====

    @Test
    void emptyCommentRejected() {
        login(user1.getId(), "USER");
        Product product = newProduct("测试商品E");
        BusinessException ex = assertThrows(BusinessException.class,
                () -> reviewService.create(dto(product.getId(), "   ")));

        assertEquals(ResultCode.PARAM_ERROR.getCode(), ex.getCode(), "空评论应返回参数错误");
        assertEquals(0, countReviews(product.getId()), "空评论不应写入脏数据");
    }

    @Test
    void invalidProductRejected() {
        login(user1.getId(), "USER");
        BusinessException ex = assertThrows(BusinessException.class,
                () -> reviewService.create(dto(-999999L, "正常评论")));

        assertEquals(ResultCode.PARAM_ERROR.getCode(), ex.getCode(), "无效产品应返回参数错误");
        assertEquals(0, reviewMapper.selectCount(new LambdaQueryWrapper<Review>()
                .eq(Review::getProductId, -999999L)), "无效产品不应写入评论");
    }

    // ===== 测试 7：未登录不可发表评论 =====

    @Test
    void createRequiresLogin() {
        Product product = newProduct("测试商品F");
        BusinessException ex = assertThrows(BusinessException.class,
                () -> reviewService.create(dto(product.getId(), "未登录评论")));

        assertEquals(ResultCode.UNAUTHORIZED.getCode(), ex.getCode(), "未登录应返回 401");
    }

    // ===== 测试 8：产品详情包含测评/评论（不存在时返回空列表） =====

    @Test
    void productDetailIncludesReviewsAndArticles() {
        Product product = newProduct("测试商品G");
        login(user1.getId(), "USER");
        reviewService.create(dto(product.getId(), "很好用"));

        ReviewArticle article = new ReviewArticle();
        article.setTitle("测试测评");
        article.setAuthor("admin");
        article.setContent("测评正文");
        article.setProductId(product.getId());
        article.setStatus(1);
        article.setPublishTime(LocalDateTime.now());
        reviewArticleMapper.insert(article);

        Product detail = productService.detail(product.getId());
        assertNotNull(detail.getReviews(), "详情应包含评论列表");
        assertEquals(1, detail.getReviews().size(), "详情应返回该产品评论");
        assertNotNull(detail.getArticles(), "详情应包含测评列表");
        assertEquals(1, detail.getArticles().size(), "详情应返回该产品测评");
        assertEquals("测试测评", detail.getArticles().get(0).getTitle());
    }

    @Test
    void productDetailWithoutReviewsReturnsEmptyList() {
        Product product = newProduct("无评论商品");
        Product detail = productService.detail(product.getId());
        assertNotNull(detail.getReviews());
        assertTrue(detail.getReviews().isEmpty(), "无评论时返回空列表");
        assertNotNull(detail.getArticles());
        assertTrue(detail.getArticles().isEmpty(), "无测评时返回空列表");
    }
}
