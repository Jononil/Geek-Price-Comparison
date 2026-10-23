package com.geekprice.service;

import com.geekprice.common.PageResult;
import com.geekprice.entity.ReviewArticle;

public interface ReviewArticleService {

    PageResult<ReviewArticle> list(Long page, Long pageSize, Long productId);

    ReviewArticle detail(Long id);

    void like(Long id);
}
