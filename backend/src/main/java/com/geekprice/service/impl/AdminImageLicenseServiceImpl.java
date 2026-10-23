package com.geekprice.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.geekprice.common.PageResult;
import com.geekprice.common.ResultCode;
import com.geekprice.dto.AdminImageLicenseAuditDTO;
import com.geekprice.dto.AdminImageLicenseQueryDTO;
import com.geekprice.dto.AdminImageLicenseUpdateDTO;
import com.geekprice.entity.Product;
import com.geekprice.entity.ProductImage;
import com.geekprice.entity.ProductImageLicense;
import com.geekprice.entity.User;
import com.geekprice.exception.BusinessException;
import com.geekprice.mapper.ProductImageLicenseMapper;
import com.geekprice.mapper.ProductImageMapper;
import com.geekprice.mapper.ProductMapper;
import com.geekprice.mapper.UserMapper;
import com.geekprice.security.SecurityUtil;
import com.geekprice.service.AdminImageLicenseService;
import com.geekprice.vo.AdminImageLicenseVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 管理端图片授权管理实现。
 *
 * 审核通过的完整性校验（缺一不可）：
 * 1. 无未解除的风险标记（如 Commons "License review needed"、主体为对比图）；
 * 2. 来源、来源页面、许可、许可链接齐全；
 * 3. 许可属于开放家族（CC0 / PD / CC BY / CC BY-SA，拒绝 NC/ND）；
 * 4. 需署名的许可（CC BY / CC BY-SA）必须有作者与署名文本；
 * 5. 型号匹配结论为 EXACT_MATCH 或 SERIES_LEVEL（PARTIAL 不得作为商品图通过）。
 * 任一不满足即抛业务异常，不允许"点按钮绕过"。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminImageLicenseServiceImpl implements AdminImageLicenseService {

    private final ProductImageLicenseMapper licenseMapper;
    private final ProductImageMapper productImageMapper;
    private final ProductMapper productMapper;
    private final UserMapper userMapper;

    @Override
    public PageResult<AdminImageLicenseVO> page(AdminImageLicenseQueryDTO query) {
        LambdaQueryWrapper<ProductImageLicense> wrapper = new LambdaQueryWrapper<>();

        // 1) 商品名称/ID 筛选：先解析出匹配的图片ID集合
        if (StringUtils.hasText(query.getKeyword())) {
            String kw = query.getKeyword().trim();
            LambdaQueryWrapper<ProductImage> imgWrapper = new LambdaQueryWrapper<>();
            if (kw.matches("\\d+")) {
                // 纯数字：商品ID精确 或 图片ID精确
                imgWrapper.eq(ProductImage::getProductId, Long.parseLong(kw))
                        .or().eq(ProductImage::getId, Long.parseLong(kw));
            } else {
                List<Long> productIds = productMapper.selectList(new LambdaQueryWrapper<Product>()
                                .like(Product::getName, kw))
                        .stream().map(Product::getId).toList();
                if (productIds.isEmpty()) {
                    return PageResult.of(new Page<>(query.getPage(), query.getPageSize(), 0));
                }
                imgWrapper.in(ProductImage::getProductId, productIds);
            }
            List<Long> imageIds = productImageMapper.selectList(imgWrapper)
                    .stream().map(ProductImage::getId).toList();
            if (imageIds.isEmpty()) {
                return PageResult.of(new Page<>(query.getPage(), query.getPageSize(), 0));
            }
            wrapper.in(ProductImageLicense::getImageId, imageIds);
        }

        // 2) 审核状态筛选
        if (StringUtils.hasText(query.getAuditStatus())) {
            wrapper.eq(ProductImageLicense::getAuditStatus, query.getAuditStatus());
        }
        if (Boolean.TRUE.equals(query.getPendingOnly())) {
            wrapper.eq(ProductImageLicense::getAuditStatus, "PENDING_EVIDENCE");
        }
        // 3) 许可证类型（模糊）
        if (StringUtils.hasText(query.getLicenseType())) {
            wrapper.like(ProductImageLicense::getLicense, query.getLicenseType().trim());
        }
        // 4) 署名不完整：作者/许可/许可链接/来源页面 任一缺失
        if (Boolean.TRUE.equals(query.getAttributionIncomplete())) {
            wrapper.and(w -> w.isNull(ProductImageLicense::getAuthor).or().eq(ProductImageLicense::getAuthor, "")
                    .or().isNull(ProductImageLicense::getLicense).or().eq(ProductImageLicense::getLicense, "")
                    .or().isNull(ProductImageLicense::getLicenseUrl).or().eq(ProductImageLicense::getLicenseUrl, "")
                    .or().isNull(ProductImageLicense::getSourcePageUrl).or().eq(ProductImageLicense::getSourcePageUrl, ""));
        }
        // 5) 有风险标记
        if (Boolean.TRUE.equals(query.getRiskOnly())) {
            wrapper.isNotNull(ProductImageLicense::getRiskNotes)
                    .and(w -> w.ne(ProductImageLicense::getRiskNotes, ""));
        }

        long page = query.getPage() == null || query.getPage() < 1 ? 1 : query.getPage();
        long pageSize = query.getPageSize() == null || query.getPageSize() < 1 ? 10 : query.getPageSize();
        pageSize = Math.min(pageSize, 50);
        wrapper.orderByDesc(ProductImageLicense::getId);

        Page<ProductImageLicense> result = licenseMapper.selectPage(new Page<>(page, pageSize), wrapper);
        List<AdminImageLicenseVO> records = result.getRecords().stream().map(this::toVO).toList();
        Page<AdminImageLicenseVO> voPage = new Page<>(result.getCurrent(), result.getSize(), result.getTotal());
        voPage.setRecords(records);
        return PageResult.of(voPage);
    }

    @Override
    public AdminImageLicenseVO detail(Long id) {
        ProductImageLicense license = requireLicense(id);
        return toVO(license);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AdminImageLicenseVO update(Long id, AdminImageLicenseUpdateDTO dto) {
        ProductImageLicense license = requireLicense(id);

        // URL 字段格式校验（非空时必须是 http/https，禁止拼接不存在的地址）
        checkUrl(dto.getSourcePageUrl(), "来源页面");
        checkUrl(dto.getOriginalUrl(), "原始图片地址");
        checkUrl(dto.getLicenseUrl(), "许可证链接");

        // 部分更新：null 字段保留原值，不做整条覆盖
        if (dto.getSource() != null) license.setSource(dto.getSource().trim());
        if (dto.getSourcePageUrl() != null) license.setSourcePageUrl(dto.getSourcePageUrl().trim());
        if (dto.getOriginalUrl() != null) license.setOriginalUrl(dto.getOriginalUrl().trim());
        if (dto.getLicense() != null) license.setLicense(dto.getLicense().trim());
        if (dto.getLicenseUrl() != null) license.setLicenseUrl(dto.getLicenseUrl().trim());
        if (dto.getAuthor() != null) license.setAuthor(dto.getAuthor().trim());
        if (dto.getAttributionText() != null) license.setAttributionText(dto.getAttributionText().trim());
        if (dto.getModifications() != null) license.setModifications(dto.getModifications().trim());
        if (dto.getMatchType() != null) license.setMatchType(dto.getMatchType().trim());
        if (dto.getRiskNotes() != null) {
            // 空串 = 人工确认风险已解除（存 NULL 保持数据一致，避免 '' 与 NULL 混用）；非空 = 设置/替换风险说明
            String trimmed = dto.getRiskNotes().trim();
            license.setRiskNotes(trimmed.isEmpty() ? null : trimmed);
        }

        // 证据变更后重新进入审核流程，并记录操作人与时间
        license.setAuditStatus("PENDING_EVIDENCE");
        license.setReviewer(currentUsername());
        license.setReviewedAt(LocalDateTime.now());
        licenseMapper.updateById(license);
        log.info("授权记录已更新并重置为待审核 id={} operator={}", id, license.getReviewer());
        return toVO(license);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AdminImageLicenseVO audit(Long id, AdminImageLicenseAuditDTO dto) {
        ProductImageLicense license = requireLicense(id);
        String action = dto.getAction() == null ? "" : dto.getAction().trim().toUpperCase();
        String operator = currentUsername();
        LocalDateTime now = LocalDateTime.now();

        if ("APPROVE".equals(action)) {
            List<String> problems = approveBlockers(license);
            if (!problems.isEmpty()) {
                throw new BusinessException(ResultCode.PARAM_ERROR.getCode(),
                        "无法通过审核：" + String.join("；", problems));
            }
            // 需署名的许可 → APPROVED_WITH_ATTRIBUTION；其余 → APPROVED
            license.setAuditStatus(requiresAttribution(license.getLicense())
                    ? "APPROVED_WITH_ATTRIBUTION" : "APPROVED");
        } else if ("REJECT".equals(action)) {
            if (!StringUtils.hasText(dto.getReason())) {
                throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "拒绝必须填写原因");
            }
            license.setAuditStatus("REJECTED");
            // 原因留痕到风险标记（保留既有内容）
            String note = "REJECTED[" + operator + " @ " + now + "]: " + dto.getReason().trim();
            license.setRiskNotes(license.getRiskNotes() == null || license.getRiskNotes().isBlank()
                    ? note : license.getRiskNotes() + " | " + note);
        } else {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), "未知的审核动作：" + action);
        }

        license.setReviewer(operator);
        license.setReviewedAt(now);
        licenseMapper.updateById(license);
        log.info("授权审核完成 id={} action={} status={} operator={}", id, action, license.getAuditStatus(), operator);
        return toVO(license);
    }

    // ==================== 校验与工具 ====================

    /** 审核通过的阻断项清单（空列表 = 允许通过） */
    private List<String> approveBlockers(ProductImageLicense license) {
        List<String> problems = new ArrayList<>();
        // 1. 风险标记未解除
        if (StringUtils.hasText(license.getRiskNotes())) {
            problems.add("存在未解除的风险标记【" + abbreviate(license.getRiskNotes()) + "】，请先人工复核证据并在编辑中解除");
        }
        // 2. 证据齐全
        if (!StringUtils.hasText(license.getSource())) problems.add("缺少来源");
        if (!StringUtils.hasText(license.getSourcePageUrl())) problems.add("缺少原始来源页面");
        if (!StringUtils.hasText(license.getLicense())) problems.add("缺少许可证名称");
        if (!StringUtils.hasText(license.getLicenseUrl())) problems.add("缺少许可证链接");
        // 3. 开放许可家族
        if (StringUtils.hasText(license.getLicense()) && !isOpenLicense(license.getLicense())) {
            problems.add("许可证【" + license.getLicense() + "】不属于可展示的开放许可（CC0/PD/CC BY/CC BY-SA）");
        }
        // 4. 需署名的许可必须有作者与署名文本
        if (requiresAttribution(license.getLicense())) {
            if (!StringUtils.hasText(license.getAuthor())) problems.add("需署名许可缺少作者");
            if (!StringUtils.hasText(license.getAttributionText())) problems.add("需署名许可缺少署名文本");
        }
        // 5. 型号匹配结论
        String matchType = license.getMatchType();
        if (!"EXACT_MATCH".equals(matchType) && !"SERIES_LEVEL".equals(matchType)) {
            problems.add("型号匹配结论为【" + (matchType == null ? "空" : matchType) + "】，仅 EXACT_MATCH / SERIES_LEVEL 可作为商品图通过");
        }
        return problems;
    }

    /** 是否属于允许展示的开放许可家族（CC0/PD/CC BY/CC BY-SA；拒绝 NC/ND 与其他） */
    private boolean isOpenLicense(String license) {
        String l = license.toLowerCase();
        if (l.contains("nc") || l.contains("nd")) return false;
        return l.startsWith("cc0") || l.contains("public domain") || l.startsWith("pd")
                || l.matches("cc by-sa.*") || l.matches("cc by(?!-sa).*");
    }

    /** 该许可是否要求署名（CC BY / CC BY-SA 家族） */
    private boolean requiresAttribution(String license) {
        if (license == null) return false;
        String l = license.toLowerCase();
        return l.startsWith("cc by");
    }

    private void checkUrl(String url, String label) {
        if (url == null) return;
        String v = url.trim();
        if (v.isEmpty()) return;
        if (!v.startsWith("http://") && !v.startsWith("https://")) {
            throw new BusinessException(ResultCode.PARAM_ERROR.getCode(), label + "必须是 http/https 地址");
        }
    }

    private ProductImageLicense requireLicense(Long id) {
        ProductImageLicense license = licenseMapper.selectById(id);
        if (license == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "授权记录不存在：" + id);
        }
        return license;
    }

    private String currentUsername() {
        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) return "unknown";
        User user = userMapper.selectById(userId);
        return user != null ? user.getUsername() : ("user#" + userId);
    }

    private String abbreviate(String s) {
        return s.length() > 60 ? s.substring(0, 60) + "…" : s;
    }

    /** 授权记录 → 管理端 VO（批量补齐图片/商品上下文） */
    private AdminImageLicenseVO toVO(ProductImageLicense license) {
        AdminImageLicenseVO vo = new AdminImageLicenseVO();
        vo.setLicense(license);
        vo.setImageId(license.getImageId());
        vo.setAttributionComplete(StringUtils.hasText(license.getAuthor())
                && StringUtils.hasText(license.getLicense())
                && StringUtils.hasText(license.getLicenseUrl())
                && StringUtils.hasText(license.getSourcePageUrl()));
        ProductImage image = productImageMapper.selectById(license.getImageId());
        if (image != null) {
            vo.setProductId(image.getProductId());
            vo.setImageUrl(image.getUrl());
            Product product = productMapper.selectById(image.getProductId());
            vo.setProductName(product != null ? product.getName() : null);
        }
        return vo;
    }
}
