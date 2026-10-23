package com.geekprice.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.entity.Product;
import com.geekprice.entity.ProductImage;
import com.geekprice.entity.ProductImageLicense;
import com.geekprice.mapper.ProductImageMapper;
import com.geekprice.mapper.ProductImageLicenseMapper;
import com.geekprice.service.ProductImageLicenseService;
import com.geekprice.vo.ImageAttributionVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * 图片授权统一裁决实现。
 *
 * 数据来源：product_images INNER JOIN product_image_license（image_id 唯一关联）。
 * 只有审核通过且非占位图的图片会进入返回结果；调用方以返回结果为准过滤下发数据，
 * 保证列表/详情/推荐/收藏/历史等所有用户端出口使用同一套规则。
 */
@Service
@RequiredArgsConstructor
public class ProductImageLicenseServiceImpl implements ProductImageLicenseService {

    private final ProductImageMapper productImageMapper;
    private final ProductImageLicenseMapper productImageLicenseMapper;

    @Override
    public void applyProductVisibility(LambdaQueryWrapper<Product> wrapper) {
        wrapper.inSql(Product::getId, QUALIFIED_PRODUCT_IDS_SQL);
    }

    @Override
    public Map<Long, List<ImageAttributionVO>> qualifiedAttributions(List<Long> productIds) {
        Map<Long, List<ImageAttributionVO>> result = new HashMap<>();
        if (productIds == null || productIds.isEmpty()) {
            return result;
        }
        List<ProductImage> images = productImageMapper.selectList(new LambdaQueryWrapper<ProductImage>()
                .in(ProductImage::getProductId, productIds)
                .orderByAsc(ProductImage::getSort));
        if (images.isEmpty()) {
            return result;
        }
        // 一次性取出这些图片的授权记录（image_id 唯一，一图一条）
        List<ProductImageLicense> licenses = productImageLicenseMapper.selectList(
                new LambdaQueryWrapper<ProductImageLicense>()
                        .in(ProductImageLicense::getImageId,
                                images.stream().map(ProductImage::getId).toList()));
        Map<Long, ProductImageLicense> licenseByImageId = new HashMap<>();
        for (ProductImageLicense license : licenses) {
            licenseByImageId.put(license.getImageId(), license);
        }
        for (ProductImage image : images) {
            ProductImageLicense license = licenseByImageId.get(image.getId());
            // 无授权记录 或 未审核通过 或 仍是占位图：一律不下发
            if (license == null || !isQualifiedStatus(license.getAuditStatus())
                    || isPlaceholder(image.getUrl())) {
                continue;
            }
            // 风险标记未解除（如 Commons License review needed、主体为对比图）：不下发
            if (license.getRiskNotes() != null && !license.getRiskNotes().isBlank()) {
                continue;
            }
            // 需署名的许可（CC BY / CC BY-SA 家族）必须有作者与署名文本，否则不下发
            // （CC0/PD 无署名义务，不受此限制）
            String lic = license.getLicense() == null ? "" : license.getLicense().toLowerCase();
            if (lic.startsWith("cc by")
                    && (license.getAuthor() == null || license.getAuthor().isBlank()
                        || license.getAttributionText() == null || license.getAttributionText().isBlank())) {
                continue;
            }
            result.computeIfAbsent(image.getProductId(), k -> new ArrayList<>())
                    .add(toAttribution(image.getUrl(), license));
        }
        return result;
    }

    @Override
    public List<ImageAttributionVO> qualifiedAttributions(Long productId) {
        Map<Long, List<ImageAttributionVO>> map = qualifiedAttributions(List.of(productId));
        return map.getOrDefault(productId, new ArrayList<>());
    }

    @Override
    public String qualifiedFirstImageUrl(Long productId) {
        List<ImageAttributionVO> list = qualifiedAttributions(productId);
        return list.isEmpty() ? null : list.get(0).getUrl();
    }

    private boolean isQualifiedStatus(String auditStatus) {
        return "APPROVED".equals(auditStatus) || "APPROVED_WITH_ATTRIBUTION".equals(auditStatus);
    }

    private boolean isPlaceholder(String url) {
        return url == null || url.isBlank() || url.contains("placehold.co");
    }

    private ImageAttributionVO toAttribution(String url, ProductImageLicense license) {
        ImageAttributionVO vo = new ImageAttributionVO();
        vo.setUrl(url);
        vo.setAuthor(emptyToNull(license.getAuthor()));
        vo.setLicense(emptyToNull(license.getLicense()));
        vo.setLicenseUrl(emptyToNull(license.getLicenseUrl()));
        vo.setSourcePageUrl(emptyToNull(license.getSourcePageUrl()));
        vo.setAttributionText(emptyToNull(license.getAttributionText()));
        vo.setModifications(emptyToNull(license.getModifications()));
        vo.setMatchType(emptyToNull(license.getMatchType()));
        vo.setSource(emptyToNull(license.getSource()));
        return vo;
    }

    private String emptyToNull(String s) {
        return s == null || s.isBlank() || "null".equals(s) ? null : s;
    }

    /** 供测试/调试：统计当前可展示图片数（不做缓存，直接查库） */
    public long countQualifiedImages() {
        return productImageLicenseMapper.selectList(new LambdaQueryWrapper<ProductImageLicense>())
                .stream()
                .filter(l -> isQualifiedStatus(l.getAuditStatus()))
                .filter(l -> Objects.nonNull(l.getImageId()))
                .count();
    }
}
