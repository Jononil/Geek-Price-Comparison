package com.geekprice.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.geekprice.common.PageResult;
import com.geekprice.entity.Favorite;
import com.geekprice.entity.Product;
import com.geekprice.entity.ReviewArticle;
import com.geekprice.mapper.FavoriteMapper;
import com.geekprice.mapper.ProductMapper;
import com.geekprice.mapper.ReviewArticleMapper;
import com.geekprice.security.SecurityUtil;
import com.geekprice.service.FavoriteService;
import com.geekprice.vo.FavoriteVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoriteServiceImpl implements FavoriteService {

    private final FavoriteMapper favoriteMapper;
    private final ProductMapper productMapper;
    private final ReviewArticleMapper reviewArticleMapper;
    private final com.geekprice.service.ProductImageLicenseService imageLicenseService;

    @Override
    public void add(Integer targetType, Long targetId) {
        Long userId = SecurityUtil.getCurrentUserId();
        Long count = favoriteMapper.selectCount(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getUserId, userId)
                .eq(Favorite::getTargetType, targetType)
                .eq(Favorite::getTargetId, targetId));
        if (count > 0) {
            return; // 已收藏，幂等
        }
        Favorite favorite = new Favorite();
        favorite.setUserId(userId);
        favorite.setTargetType(targetType);
        favorite.setTargetId(targetId);
        favoriteMapper.insert(favorite);
    }

    @Override
    public void remove(Integer targetType, Long targetId) {
        Long userId = SecurityUtil.getCurrentUserId();
        favoriteMapper.delete(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getUserId, userId)
                .eq(Favorite::getTargetType, targetType)
                .eq(Favorite::getTargetId, targetId));
    }

    @Override
    public PageResult<FavoriteVO> listByUser(Long page, Long pageSize) {
        Long userId = SecurityUtil.getCurrentUserId();
        Page<Favorite> result = favoriteMapper.selectPage(new Page<>(page, pageSize),
                new LambdaQueryWrapper<Favorite>()
                        .eq(Favorite::getUserId, userId)
                        .orderByDesc(Favorite::getCreatedAt));

        List<FavoriteVO> vos = new ArrayList<>();
        for (Favorite favorite : result.getRecords()) {
            vos.add(toVO(favorite));
        }
        PageResult<FavoriteVO> pageResult = new PageResult<>();
        pageResult.setRecords(vos);
        pageResult.setTotal(result.getTotal());
        pageResult.setPage(result.getCurrent());
        pageResult.setPageSize(result.getSize());
        return pageResult;
    }

    private FavoriteVO toVO(Favorite favorite) {
        FavoriteVO vo = new FavoriteVO();
        vo.setId(favorite.getId());
        vo.setTargetType(favorite.getTargetType());
        vo.setTargetId(favorite.getTargetId());
        vo.setCreatedAt(favorite.getCreatedAt());
        if (favorite.getTargetType() != null && favorite.getTargetType() == 1) {
            Product product = productMapper.selectById(favorite.getTargetId());
            if (product != null) {
                vo.setName(product.getName());
                vo.setImage(firstImage(product.getId()));
                vo.setPrice(product.getCurrentPrice());
                vo.setValueScore(product.getValueScore());
            }
        } else {
            ReviewArticle article = reviewArticleMapper.selectById(favorite.getTargetId());
            if (article != null) {
                vo.setName(article.getTitle());
                vo.setImage(article.getCover());
            }
        }
        return vo;
    }

    private String firstImage(Long productId) {
        // 只取审核通过的真实图片；无合格图片时返回 null（前端走类别 SVG 兜底）
        return imageLicenseService.qualifiedFirstImageUrl(productId);
    }
}
