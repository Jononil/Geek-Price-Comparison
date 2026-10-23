package com.geekprice.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.geekprice.common.PageResult;
import com.geekprice.common.ResultCode;
import com.geekprice.entity.Product;
import com.geekprice.entity.ReviewArticle;
import com.geekprice.exception.BusinessException;
import com.geekprice.mapper.ProductMapper;
import com.geekprice.mapper.ReviewArticleMapper;
import com.geekprice.service.ReviewArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReviewArticleServiceImpl implements ReviewArticleService {

    private final ReviewArticleMapper reviewArticleMapper;
    private final ProductMapper productMapper;

    @Override
    public PageResult<ReviewArticle> list(Long page, Long pageSize, Long productId) {
        LambdaQueryWrapper<ReviewArticle> wrapper = new LambdaQueryWrapper<ReviewArticle>()
                .eq(ReviewArticle::getStatus, 1)
                .orderByDesc(ReviewArticle::getPublishTime);
        if (productId != null) {
            wrapper.eq(ReviewArticle::getProductId, productId);
        }
        Page<ReviewArticle> result = reviewArticleMapper.selectPage(new Page<>(page, pageSize), wrapper);
        for (ReviewArticle article : result.getRecords()) {
            fillProductName(article);
        }
        return PageResult.of(result);
    }

    @Override
    public ReviewArticle detail(Long id) {
        ReviewArticle article = reviewArticleMapper.selectById(id);
        if (article == null || article.getStatus() == null || article.getStatus() != 1) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "测评不存在或已下架");
        }
        reviewArticleMapper.update(null, new LambdaUpdateWrapper<ReviewArticle>()
                .eq(ReviewArticle::getId, id).setSql("views = views + 1"));
        article.setViews(article.getViews() + 1);
        fillProductName(article);
        return article;
    }

    @Override
    public void like(Long id) {
        reviewArticleMapper.update(null, new LambdaUpdateWrapper<ReviewArticle>()
                .eq(ReviewArticle::getId, id).setSql("likes = likes + 1"));
    }

    private void fillProductName(ReviewArticle article) {
        if (article.getProductId() != null) {
            Product product = productMapper.selectById(article.getProductId());
            article.setProductName(product != null ? product.getName() : null);
        }
    }
}
