package com.geekprice.dto;

import lombok.Data;

/**
 * 管理端图片授权列表查询条件。
 * 全部条件可选，组合使用；未传时不过滤。
 */
@Data
public class AdminImageLicenseQueryDTO {

    private Long page = 1L;

    private Long pageSize = 10L;

    /** 审核状态精确匹配：APPROVED / APPROVED_WITH_ATTRIBUTION / PENDING_EVIDENCE / REJECTED */
    private String auditStatus;

    /** 商品名称模糊 或 商品ID精确（纯数字时按 ID 精确匹配） */
    private String keyword;

    /** 许可证类型模糊匹配（如 CC0 / CC BY / CC BY-SA） */
    private String licenseType;

    /** 仅看署名信息不完整（作者/许可/许可链接/来源页面 任一缺失） */
    private Boolean attributionIncomplete;

    /** 仅看待审核（PENDING_EVIDENCE） */
    private Boolean pendingOnly;

    /** 仅看有风险标记的记录 */
    private Boolean riskOnly;
}
