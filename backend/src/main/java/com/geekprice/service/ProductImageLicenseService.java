package com.geekprice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.entity.Product;
import com.geekprice.vo.ImageAttributionVO;

import java.util.List;
import java.util.Map;

/**
 * 商品图片授权统一服务（图片展示闭环的唯一裁决点）。
 *
 * 规则（唯一口径，所有用户端出口共用）：
 * 1. 商品进入用户端列表的条件：至少有一张「非占位图 + 审核通过」的图片；
 * 2. 下发给前端的图片：只含审核通过（APPROVED / APPROVED_WITH_ATTRIBUTION）的真实图片；
 * 3. 无授权记录的图片默认不展示（新同步/新导入的图在人工审核前不会自动上线）；
 * 4. 管理端不走本服务，仍可查看全部商品与待审核图片。
 */
public interface ProductImageLicenseService {

    /** 可展示的审核状态（APPROVED_WITH_ATTRIBUTION 在前端署名功能可用后开放） */
    String QUALIFIED_STATUS = "('APPROVED','APPROVED_WITH_ATTRIBUTION')";

    /** 「有可展示图片的商品」子查询，供 inSql 使用（与 qualifiedAttributions 的 Java 规则保持一致：占位图、未通过、风险未解除、需署名许可缺署名均排除） */
    String QUALIFIED_PRODUCT_IDS_SQL =
            "SELECT pi.product_id FROM product_images pi "
                    + "INNER JOIN product_image_license pil ON pil.image_id = pi.id "
                    + "WHERE pi.url NOT LIKE '%placehold.co%' AND pil.audit_status IN " + QUALIFIED_STATUS
                    + " AND (pil.risk_notes IS NULL OR pil.risk_notes = '')"
                    + " AND (LOWER(pil.license) NOT LIKE 'cc by%'"
                    + "       OR (pil.author IS NOT NULL AND pil.author <> ''"
                    + "           AND pil.attribution_text IS NOT NULL AND pil.attribution_text <> ''))";

    /**
     * 给商品查询追加「可展示」条件：只有至少一张合格图片的商品才会被查出。
     * 直接加在 wrapper 上（inSql），分页 count 与排序自然一致。
     */
    void applyProductVisibility(LambdaQueryWrapper<Product> wrapper);

    /**
     * 批量获取合格图片的署名信息（同时用于过滤下发图片：只有出现在返回 Map 中的图片 URL 才可下发）。
     */
    Map<Long, List<ImageAttributionVO>> qualifiedAttributions(List<Long> productIds);

    /** 单个商品的合格图片署名（含过滤后的图片 URL 顺序） */
    List<ImageAttributionVO> qualifiedAttributions(Long productId);

    /** 单个商品的第一张合格图片 URL（用于推荐/收藏/历史等只存单图地址的场景），无则 null */
    String qualifiedFirstImageUrl(Long productId);
}
