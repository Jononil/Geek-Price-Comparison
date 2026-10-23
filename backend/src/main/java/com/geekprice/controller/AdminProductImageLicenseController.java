package com.geekprice.controller;

import com.geekprice.common.PageResult;
import com.geekprice.common.Result;
import com.geekprice.dto.AdminImageLicenseAuditDTO;
import com.geekprice.dto.AdminImageLicenseQueryDTO;
import com.geekprice.dto.AdminImageLicenseUpdateDTO;
import com.geekprice.service.AdminImageLicenseService;
import com.geekprice.vo.AdminImageLicenseVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 管理端图片授权管理接口。
 *
 * 路径位于 /api/admin/** 下，SecurityConfig 已统一要求 ADMIN 角色，
 * 普通用户调用返回未授权；本控制器不单独实现权限判断。
 *
 * 状态变更即时生效：用户端展示资格由 ProductImageLicenseService
 * 依据 audit_status 实时查询，无需额外同步。
 */
@RestController
@RequestMapping("/api/admin/image-licenses")
@RequiredArgsConstructor
public class AdminProductImageLicenseController {

    private final AdminImageLicenseService adminImageLicenseService;

    /** 分页查询授权记录（支持状态/商品/许可类型/署名缺失/待审核/风险筛选） */
    @GetMapping
    public Result<PageResult<AdminImageLicenseVO>> page(AdminImageLicenseQueryDTO query) {
        return Result.success(adminImageLicenseService.page(query));
    }

    /** 单条授权详情 */
    @GetMapping("/{id}")
    public Result<AdminImageLicenseVO> detail(@PathVariable Long id) {
        return Result.success(adminImageLicenseService.detail(id));
    }

    /** 编辑授权证据（部分更新；编辑后重新进入待审核） */
    @PutMapping("/{id}")
    public Result<AdminImageLicenseVO> update(@PathVariable Long id,
                                              @RequestBody AdminImageLicenseUpdateDTO dto) {
        return Result.success(adminImageLicenseService.update(id, dto));
    }

    /** 审核操作：APPROVE（后端完整性校验）/ REJECT（必须填原因） */
    @PostMapping("/{id}/audit")
    public Result<AdminImageLicenseVO> audit(@PathVariable Long id,
                                             @Valid @RequestBody AdminImageLicenseAuditDTO dto) {
        return Result.success(adminImageLicenseService.audit(id, dto));
    }
}
