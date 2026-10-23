package com.geekprice.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.entity.BrowseHistory;
import com.geekprice.entity.Product;
import com.geekprice.mapper.BrowseHistoryMapper;
import com.geekprice.mapper.ProductMapper;
import com.geekprice.security.SecurityUtil;
import com.geekprice.service.BrowseHistoryService;
import com.geekprice.vo.BrowseHistoryVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BrowseHistoryServiceImpl implements BrowseHistoryService {

    private final BrowseHistoryMapper browseHistoryMapper;
    private final ProductMapper productMapper;
    private final com.geekprice.service.ProductImageLicenseService imageLicenseService;

    @Override
    public void record(Long productId) {
        Long userId = SecurityUtil.getCurrentUserId();
        // 删除同产品旧记录，保证每个产品只保留最新一次浏览
        browseHistoryMapper.delete(new LambdaQueryWrapper<BrowseHistory>()
                .eq(BrowseHistory::getUserId, userId)
                .eq(BrowseHistory::getProductId, productId));
        BrowseHistory history = new BrowseHistory();
        history.setUserId(userId);
        history.setProductId(productId);
        history.setViewedAt(LocalDateTime.now());
        browseHistoryMapper.insert(history);
    }

    @Override
    public List<BrowseHistoryVO> listByUser(Integer limit) {
        Long userId = SecurityUtil.getCurrentUserId();
        int size = limit == null || limit < 1 ? 20 : Math.min(limit, 50);
        List<BrowseHistory> list = browseHistoryMapper.selectList(new LambdaQueryWrapper<BrowseHistory>()
                .eq(BrowseHistory::getUserId, userId)
                .orderByDesc(BrowseHistory::getViewedAt)
                .last("LIMIT " + size));
        List<BrowseHistoryVO> vos = new ArrayList<>();
        for (BrowseHistory history : list) {
            BrowseHistoryVO vo = new BrowseHistoryVO();
            vo.setId(history.getId());
            vo.setProductId(history.getProductId());
            vo.setViewedAt(history.getViewedAt());
            Product product = productMapper.selectById(history.getProductId());
            if (product != null) {
                vo.setProductName(product.getName());
                vo.setImage(firstImage(product.getId()));
                vo.setPrice(product.getCurrentPrice());
                vo.setValueScore(product.getValueScore());
            }
            vos.add(vo);
        }
        return vos;
    }

    @Override
    public void clear() {
        Long userId = SecurityUtil.getCurrentUserId();
        browseHistoryMapper.delete(new LambdaQueryWrapper<BrowseHistory>()
                .eq(BrowseHistory::getUserId, userId));
    }

    private String firstImage(Long productId) {
        // 只取审核通过的真实图片；无合格图片时返回 null（前端走类别 SVG 兜底）
        return imageLicenseService.qualifiedFirstImageUrl(productId);
    }
}
