package com.geekprice.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.entity.Product;
import com.geekprice.entity.ReviewArticle;
import com.geekprice.mapper.ProductMapper;
import com.geekprice.mapper.ReviewArticleMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.context.ActiveProfiles;

/**
 * 专业测评管理 / 公开内容 集成测试（Step 14）。
 *
 * 验证：
 * 1. 管理员可发布 / 修改 / 删除专业测评；2. 普通用户无权管理测评（403）；
 * 3. 未登录用户可访问公开测评 / 评论内容。
 *
 * 管理员权限由 SecurityConfig 既有 .requestMatchers("/api/admin/**").hasRole("ADMIN") 控制，
 * 本测试仅验证测评管理接口纳入该权限范围，不重复实现登录 / 鉴权逻辑。
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
class AdminArticleControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ReviewArticleMapper reviewArticleMapper;
    @Autowired
    private ProductMapper productMapper;

    private Long newProductId() {
        Product p = new Product();
        p.setName("测评关联商品");
        p.setStatus(1);
        productMapper.insert(p);
        return p.getId();
    }

    private String articleJson(Long productId, String title) {
        return String.format(
                "{\"title\":\"%s\",\"author\":\"admin\",\"content\":\"测评正文\",\"productId\":%d,\"status\":1}",
                title, productId);
    }

    private long countByTitle(String title) {
        return reviewArticleMapper.selectCount(new LambdaQueryWrapper<ReviewArticle>()
                .eq(ReviewArticle::getTitle, title));
    }

    // ===== 测试 1：管理员发布测评 =====

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminPublishesArticle() throws Exception {
        Long productId = newProductId();
        mockMvc.perform(post("/api/admin/articles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJson(productId, "测试测评A")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        assertEquals(1, countByTitle("测试测评A"), "管理员发布后应写入测评");
    }

    // ===== 测试 2：管理员修改测评 =====

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminUpdatesArticle() throws Exception {
        Long productId = newProductId();
        mockMvc.perform(post("/api/admin/articles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJson(productId, "原始标题")))
                .andExpect(status().isOk());
        Long id = reviewArticleMapper.selectOne(new LambdaQueryWrapper<ReviewArticle>()
                .eq(ReviewArticle::getTitle, "原始标题")).getId();

        mockMvc.perform(put("/api/admin/articles/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJson(productId, "修改后标题")))
                .andExpect(status().isOk());

        assertEquals("修改后标题", reviewArticleMapper.selectById(id).getTitle(), "测评标题应被修改");
    }

    // ===== 测试 3：管理员删除测评 =====

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminDeletesArticle() throws Exception {
        Long productId = newProductId();
        mockMvc.perform(post("/api/admin/articles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJson(productId, "待删除测评")))
                .andExpect(status().isOk());
        Long id = reviewArticleMapper.selectOne(new LambdaQueryWrapper<ReviewArticle>()
                .eq(ReviewArticle::getTitle, "待删除测评")).getId();

        mockMvc.perform(delete("/api/admin/articles/" + id))
                .andExpect(status().isOk());

        assertEquals(0, countByTitle("待删除测评"), "测评应被逻辑删除");
    }

    // ===== 测试 4：普通用户无权管理测评 =====

    @Test
    @WithMockUser(roles = "USER")
    void normalUserCannotManageArticle() throws Exception {
        Long productId = newProductId();
        mockMvc.perform(post("/api/admin/articles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(articleJson(productId, "越权测评")))
                .andExpect(status().isForbidden());
    }

    // ===== 测试 5：未登录访问公开测评 =====

    @Test
    void anonymousCanReadPublicArticles() throws Exception {
        mockMvc.perform(get("/api/articles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    // ===== 测试 6：未登录访问公开评论列表 =====

    @Test
    void anonymousCanReadPublicReviews() throws Exception {
        Long productId = newProductId();
        mockMvc.perform(get("/api/reviews/product/" + productId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.records").isArray());
    }
}
