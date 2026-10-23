package com.geekprice.dto;

import lombok.Data;

/**
 * 管理端授权信息编辑（部分更新）。
 *
 * 规则：为 null 的字段不更新（保留原值），不会整条覆盖；
 * riskNotes 传空串表示"人工确认风险已解除"，传具体文本表示新增/替换风险说明。
 * 编辑任何证据字段后，记录将重新进入待审核状态。
 */
@Data
public class AdminImageLicenseUpdateDTO {

    /** 来源标识（如 wikimedia_commons） */
    private String source;

    /** 原始文件页面（须为 http/https 地址） */
    private String sourcePageUrl;

    /** 原始未缩放图片地址（须为 http/https 地址） */
    private String originalUrl;

    /** 含版本许可名（如 CC BY-SA 4.0） */
    private String license;

    /** 许可证链接（须为 http/https 地址） */
    private String licenseUrl;

    /** 作者/权利人（按证据原文照录，不得臆造） */
    private String author;

    /** 署名文本 */
    private String attributionText;

    /** 改动说明 */
    private String modifications;

    /** 型号匹配结论：EXACT_MATCH / SERIES_LEVEL / PARTIAL */
    private String matchType;

    /** 风险标记：空串=解除风险；非空=设置/替换风险说明 */
    private String riskNotes;
}
