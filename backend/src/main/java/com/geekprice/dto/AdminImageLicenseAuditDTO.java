package com.geekprice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 管理端授权审核操作。
 *
 * action = APPROVE：后端执行完整性校验（来源/许可/署名/风险标记/匹配结论），
 * 全部满足才允许通过；否则抛出业务异常说明缺失项。
 * action = REJECT：必须填写拒绝原因，原因会追加进风险标记留痕。
 */
@Data
public class AdminImageLicenseAuditDTO {

    /** APPROVE / REJECT */
    @NotBlank(message = "审核动作不能为空")
    private String action;

    /** 拒绝原因（REJECT 时必填；APPROVE 时可选备注） */
    private String reason;
}
