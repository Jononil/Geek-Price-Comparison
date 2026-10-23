package com.geekprice.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.geekprice.common.PageResult;
import com.geekprice.dto.AdminImageLicenseAuditDTO;
import com.geekprice.dto.AdminImageLicenseQueryDTO;
import com.geekprice.dto.AdminImageLicenseUpdateDTO;
import com.geekprice.vo.AdminImageLicenseVO;

/**
 * 管理端图片授权管理服务。
 *
 * 统一门控原则不变：本服务只维护 product_image_license 的证据与审核状态，
 * 用户端展示资格仍由 ProductImageLicenseService 依据 audit_status 实时裁决，
 * 状态变更立即对用户端生效，无需其他同步动作。
 */
public interface AdminImageLicenseService {

    /** 分页查询授权记录（含图片/商品上下文与筛选条件） */
    PageResult<AdminImageLicenseVO> page(AdminImageLicenseQueryDTO query);

    /** 单条授权记录详情（含商品名/图片URL） */
    AdminImageLicenseVO detail(Long id);

    /**
     * 编辑授权证据（部分更新：null 字段保留原值）。
     * 编辑后记录重新进入待审核（PENDING_EVIDENCE），并记录审核人/时间。
     */
    AdminImageLicenseVO update(Long id, AdminImageLicenseUpdateDTO dto);

    /**
     * 审核操作。
     * APPROVE：后端完整性校验（风险标记/来源/许可/署名/匹配结论）通过才允许；
     * REJECT：必须填写原因，原因留痕到风险标记。
     */
    AdminImageLicenseVO audit(Long id, AdminImageLicenseAuditDTO dto);
}
