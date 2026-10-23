package com.geekprice.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.context.ActiveProfiles;

/**
 * 数据源手动同步接口 集成测试（Step 9）。
 *
 * 验证：
 * 1. 管理员可手动全平台同步 / 指定平台同步；
 * 2. 普通用户访问 /api/admin/data-source/** 被拒绝（403）；
 * 3. 手动同步复用 ProductDataSyncService，返回标准 SyncResult。
 *
 * 权限由 SecurityConfig 既有的 .requestMatchers("/api/admin/**").hasRole("ADMIN") 控制，
 * 本测试仅验证新接口纳入该权限范围，不重复实现登录 / 鉴权逻辑。
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
class AdminDataSourceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // ===== 测试 1：管理员手动全平台同步 =====

    @Test
    @WithMockUser(roles = "ADMIN")
    void manualSyncAllAsAdmin() throws Exception {
        mockMvc.perform(post("/api/admin/data-source/sync"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.total").value(150))
                .andExpect(jsonPath("$.data.busy").value(false));
    }

    // ===== 测试 2：管理员手动指定平台同步 =====

    @Test
    @WithMockUser(roles = "ADMIN")
    void manualSyncPlatformAsAdmin() throws Exception {
        mockMvc.perform(post("/api/admin/data-source/sync/jd"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.platformCode").value("jd"))
                .andExpect(jsonPath("$.data.total").value(50));
    }

    // ===== 测试 3：普通用户手动全平台同步被拒绝 =====

    @Test
    @WithMockUser(roles = "USER")
    void manualSyncAllDeniedForNormalUser() throws Exception {
        mockMvc.perform(post("/api/admin/data-source/sync"))
                .andExpect(status().isForbidden());
    }

    // ===== 测试 4：普通用户指定平台同步被拒绝 =====

    @Test
    @WithMockUser(roles = "USER")
    void manualSyncPlatformDeniedForNormalUser() throws Exception {
        mockMvc.perform(post("/api/admin/data-source/sync/jd"))
                .andExpect(status().isForbidden());
    }
}
