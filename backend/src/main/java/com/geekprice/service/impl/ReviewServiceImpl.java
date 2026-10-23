package com.geekprice.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.geekprice.common.PageResult;
import com.geekprice.common.ResultCode;
import com.geekprice.dto.ReviewCommentDTO;
import com.geekprice.dto.ReviewCreateDTO;
import com.geekprice.entity.Product;
import com.geekprice.entity.Review;
import com.geekprice.entity.ReviewComment;
import com.geekprice.entity.ReviewLike;
import com.geekprice.entity.User;
import com.geekprice.exception.BusinessException;
import com.geekprice.mapper.ProductMapper;
import com.geekprice.mapper.ReviewCommentMapper;
import com.geekprice.mapper.ReviewLikeMapper;
import com.geekprice.mapper.ReviewMapper;
import com.geekprice.mapper.UserMapper;
import com.geekprice.security.SecurityUtil;
import com.geekprice.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewMapper reviewMapper;
    private final ReviewLikeMapper reviewLikeMapper;
    private final ReviewCommentMapper reviewCommentMapper;
    private final UserMapper userMapper;
    private final ProductMapper productMapper;

    @Override
    public void create(ReviewCreateDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        // 空评论校验：不写入脏数据
        if (dto.getContent() == null || dto.getContent().isBlank()) {
            throw new BusinessException("评论内容不能为空");
        }
        // 无效产品校验：产品不存在或已下架时不写入
        Product product = productMapper.selectById(dto.getProductId());
        if (product == null || product.getStatus() == null || product.getStatus() != 1) {
            throw new BusinessException("产品不存在或已下架");
        }
        Review review = new Review();
        review.setProductId(dto.getProductId());
        review.setUserId(userId);
        review.setStar(dto.getStar());
        review.setContent(dto.getContent());
        review.setLikeCount(0);
        reviewMapper.insert(review);
    }

    @Override
    public PageResult<Review> listByProduct(Long productId, Long page, Long pageSize) {
        Page<Review> result = reviewMapper.selectPage(new Page<>(page, pageSize),
                new LambdaQueryWrapper<Review>()
                        .eq(Review::getProductId, productId)
                        .orderByDesc(Review::getCreatedAt));
        for (Review review : result.getRecords()) {
            User user = userMapper.selectById(review.getUserId());
            if (user != null) {
                review.setUsername(user.getUsername());
                review.setNickname(user.getNickname());
                review.setAvatar(user.getAvatar());
            }
        }
        return PageResult.of(result);
    }

    @Override
    public void delete(Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        Review review = reviewMapper.selectById(id);
        if (review == null) {
            throw new BusinessException("评价不存在");
        }
        if (!review.getUserId().equals(userId) && !SecurityUtil.isAdmin()) {
            throw new BusinessException(ResultCode.FORBIDDEN);
        }
        reviewMapper.deleteById(id);
    }

    @Override
    public void like(Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        ReviewLike existing = reviewLikeMapper.selectOne(new LambdaQueryWrapper<ReviewLike>()
                .eq(ReviewLike::getReviewId, id)
                .eq(ReviewLike::getUserId, userId));
        if (existing != null) {
            reviewLikeMapper.deleteById(existing.getId());
            reviewMapper.update(null, new LambdaUpdateWrapper<Review>()
                    .eq(Review::getId, id).setSql("like_count = like_count - 1"));
        } else {
            ReviewLike like = new ReviewLike();
            like.setReviewId(id);
            like.setUserId(userId);
            reviewLikeMapper.insert(like);
            reviewMapper.update(null, new LambdaUpdateWrapper<Review>()
                    .eq(Review::getId, id).setSql("like_count = like_count + 1"));
        }
    }

    @Override
    public List<ReviewComment> comments(Long reviewId) {
        return reviewCommentMapper.selectList(new LambdaQueryWrapper<ReviewComment>()
                .eq(ReviewComment::getReviewId, reviewId)
                .orderByAsc(ReviewComment::getCreatedAt));
    }

    @Override
    public void comment(ReviewCommentDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        ReviewComment comment = new ReviewComment();
        comment.setReviewId(dto.getReviewId());
        comment.setUserId(userId);
        comment.setContent(dto.getContent());
        reviewCommentMapper.insert(comment);
    }
}
