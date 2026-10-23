package com.geekprice.service;

import com.geekprice.common.PageResult;
import com.geekprice.dto.ReviewCommentDTO;
import com.geekprice.dto.ReviewCreateDTO;
import com.geekprice.entity.Review;
import com.geekprice.entity.ReviewComment;

import java.util.List;

public interface ReviewService {

    void create(ReviewCreateDTO dto);

    PageResult<Review> listByProduct(Long productId, Long page, Long pageSize);

    void delete(Long id);

    void like(Long id);

    List<ReviewComment> comments(Long reviewId);

    void comment(ReviewCommentDTO dto);
}
