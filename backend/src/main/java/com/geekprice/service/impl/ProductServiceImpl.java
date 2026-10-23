package com.geekprice.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.geekprice.common.PageResult;
import com.geekprice.common.ResultCode;
import com.geekprice.dto.ProductQueryDTO;
import com.geekprice.entity.Brand;
import com.geekprice.entity.Category;
import com.geekprice.entity.Product;
import com.geekprice.entity.ProductSpec;
import com.geekprice.entity.Review;
import com.geekprice.entity.ReviewArticle;
import com.geekprice.entity.User;
import com.geekprice.exception.BusinessException;
import com.geekprice.mapper.BrandMapper;
import com.geekprice.mapper.CategoryMapper;
import com.geekprice.mapper.ProductMapper;
import com.geekprice.mapper.ProductSpecMapper;
import com.geekprice.mapper.ReviewArticleMapper;
import com.geekprice.mapper.ReviewMapper;
import com.geekprice.mapper.UserMapper;
import com.geekprice.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private static final long MAX_PAGE_SIZE = 50L;

    private final ProductMapper productMapper;
    private final BrandMapper brandMapper;
    private final CategoryMapper categoryMapper;
    private final ProductSpecMapper productSpecMapper;
    private final ReviewMapper reviewMapper;
    private final ReviewArticleMapper reviewArticleMapper;
    private final UserMapper userMapper;
    private final com.geekprice.service.ProductImageLicenseService imageLicenseService;

    @Override
    public PageResult<Product> list(ProductQueryDTO query) {
        LambdaQueryWrapper<Product> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Product::getStatus, 1);

        if (StringUtils.hasText(query.getKeyword())) {
            String kw = query.getKeyword().trim();
            // 除了商品名，也支持按品牌名搜索（如「苹果」「红米」）。
            // 这里先查品牌 id 再拼 in 条件，避免把用户输入直接拼进 SQL。
            List<Long> brandIds = brandMapper.selectList(
                            new LambdaQueryWrapper<Brand>().like(Brand::getName, kw))
                    .stream().map(Brand::getId).toList();
            if (brandIds.isEmpty()) {
                wrapper.like(Product::getName, kw);
            } else {
                wrapper.and(w -> w.like(Product::getName, kw).or().in(Product::getBrandId, brandIds));
            }
        }
        if (query.getCategoryId() != null) {
            wrapper.eq(Product::getCategoryId, query.getCategoryId());
        }
        if (query.getBrandId() != null) {
            wrapper.eq(Product::getBrandId, query.getBrandId());
        }
        if (query.getMinPrice() != null) {
            wrapper.ge(Product::getCurrentPrice, query.getMinPrice());
        }
        if (query.getMaxPrice() != null) {
            wrapper.le(Product::getCurrentPrice, query.getMaxPrice());
        }
        if (query.getMinValueScore() != null) {
            wrapper.ge(Product::getValueScore, query.getMinValueScore());
        }
        if (query.getMinRating() != null) {
            wrapper.ge(Product::getUserRating, query.getMinRating());
        }
        if (query.getTagId() != null) {
            wrapper.inSql(Product::getId,
                    "SELECT product_id FROM product_tags WHERE tag_id = " + query.getTagId());
        }

        // 用户端列表统一过滤：只有至少一张「审核通过的真实图片」的商品才可展示（分页总数/排序随之一致）
        imageLicenseService.applyProductVisibility(wrapper);

        applySort(wrapper, query.getSort());

        long page = query.getPage() == null || query.getPage() < 1 ? 1 : query.getPage();
        long pageSize = query.getPageSize() == null || query.getPageSize() < 1 ? 12 : query.getPageSize();
        pageSize = Math.min(pageSize, MAX_PAGE_SIZE);

        Page<Product> result = productMapper.selectPage(new Page<>(page, pageSize), wrapper);
        fillProductsForList(result.getRecords());
        return PageResult.of(result);
    }

    @Override
    public Product detail(Long id) {
        Product product = productMapper.selectById(id);
        if (product == null || product.getStatus() == null || product.getStatus() != 1) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "产品不存在或已下架");
        }
        fillProductForDetail(product);
        // 与列表口径保持一致：没有「审核通过的真实图片」的商品同样视为不可见，
        // 否则拿到 id 就能绕过审核门控直接访问。
        if (product.getImages() == null || product.getImages().isEmpty()) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "产品不存在或已下架");
        }
        return product;
    }

    @Override
    public List<Product> compare(List<Long> productIds) {
        List<Product> result = new ArrayList<>();
        if (productIds == null || productIds.isEmpty()) {
            return result;
        }
        List<Long> ids = productIds.stream().filter(java.util.Objects::nonNull).distinct().toList();
        // selectList 走 MyBatis-Plus 逻辑删除过滤（deleted=0），selectBatchIds 不走
        List<Product> products = productMapper.selectList(
                new LambdaQueryWrapper<Product>().in(Product::getId, ids));
        // 分类一致性校验（在规格对比前完成，防止绕过前端）
        Long categoryRef = null;
        for (Product p : products) {
            if (p.getStatus() == null || p.getStatus() != 1) {
                continue; // 不存在/已下架：跳过不计入
            }
            if (categoryRef == null) {
                categoryRef = p.getCategoryId();
            } else if (!categoryRef.equals(p.getCategoryId())) {
                throw new BusinessException(ResultCode.PARAM_ERROR.getCode(),
                        "商品规格对比仅支持同一品类，当前商品分类不一致");
            }
            fillProductForDetail(p);
            // 同 detail：没有合格图片的商品不参与对比，避免绕过审核门控
            if (p.getImages() == null || p.getImages().isEmpty()) {
                continue;
            }
            result.add(p);
        }
        return result;
    }

    private void applySort(LambdaQueryWrapper<Product> wrapper, String sort) {
        if (sort == null) {
            wrapper.orderByDesc(Product::getValueScore).orderByDesc(Product::getHeat);
            return;
        }
        switch (sort) {
            case "valueScore" -> wrapper.orderByDesc(Product::getValueScore);
            case "priceAsc" -> wrapper.orderByAsc(Product::getCurrentPrice);
            case "priceDesc" -> wrapper.orderByDesc(Product::getCurrentPrice);
            case "rating" -> wrapper.orderByDesc(Product::getUserRating);
            case "heat" -> wrapper.orderByDesc(Product::getHeat);
            case "newest" -> wrapper.orderByDesc(Product::getLaunchDate);
            default -> wrapper.orderByDesc(Product::getValueScore).orderByDesc(Product::getHeat);
        }
    }

    /**
     * 列表页填充品牌名、分类名、标签、图片。
     *
     * 图片与署名一次性批量查询，避免逐条查询造成的 N+1。
     * 下发的图片只含「审核通过的真实图片」（经授权统一服务裁决），
     * 未授权/待审核/被拒绝的图片不会出现在返回结果中。
     */
    private void fillProductsForList(List<Product> products) {
        if (products.isEmpty()) {
            return;
        }
        List<Long> productIds = products.stream().map(Product::getId).toList();
        Map<Long, List<com.geekprice.vo.ImageAttributionVO>> attributions =
                imageLicenseService.qualifiedAttributions(productIds);
        for (Product product : products) {
            fillBrandAndCategory(product);
            product.setTags(productMapper.selectTagNames(product.getId()));
            List<com.geekprice.vo.ImageAttributionVO> atts = attributions.getOrDefault(product.getId(), new ArrayList<>());
            product.setImages(atts.stream().map(com.geekprice.vo.ImageAttributionVO::getUrl).toList());
            product.setImagesAttribution(atts);
        }
    }

    /**
     * 详情页填充完整信息
     */
    private void fillProductForDetail(Product product) {
        fillBrandAndCategory(product);
        product.setTags(productMapper.selectTagNames(product.getId()));

        List<ProductSpec> specs = specMapperSelect(product.getId());
        product.setSpecs(specs);

        // 图片：只下发审核通过的真实图片，并附带署名信息
        List<com.geekprice.vo.ImageAttributionVO> atts =
                imageLicenseService.qualifiedAttributions(product.getId());
        product.setImages(atts.stream().map(com.geekprice.vo.ImageAttributionVO::getUrl).toList());
        product.setImagesAttribution(atts);

        // 测评 / 评论数据（不存在时返回空列表）
        product.setReviews(fillReviews(product.getId()));
        product.setArticles(fillArticles(product.getId()));
    }

    /** 规格查询（详情与对比共用） */
    private List<ProductSpec> specMapperSelect(Long productId) {
        return productSpecMapper.selectList(new LambdaQueryWrapper<ProductSpec>()
                .eq(ProductSpec::getProductId, productId)
                .orderByAsc(ProductSpec::getSort));
    }

    /** 填充产品评论（最新 10 条，含评论人昵称） */
    private List<Review> fillReviews(Long productId) {
        List<Review> reviews = reviewMapper.selectList(new LambdaQueryWrapper<Review>()
                .eq(Review::getProductId, productId)
                .orderByDesc(Review::getCreatedAt)
                .last("LIMIT 10"));
        for (Review review : reviews) {
            User user = userMapper.selectById(review.getUserId());
            if (user != null) {
                review.setNickname(user.getNickname());
            }
        }
        return reviews;
    }

    /** 填充产品专业测评（已发布，最新 5 条） */
    private List<ReviewArticle> fillArticles(Long productId) {
        return reviewArticleMapper.selectList(new LambdaQueryWrapper<ReviewArticle>()
                .eq(ReviewArticle::getProductId, productId)
                .eq(ReviewArticle::getStatus, 1)
                .orderByDesc(ReviewArticle::getPublishTime)
                .last("LIMIT 5"));
    }

    private void fillBrandAndCategory(Product product) {
        if (product.getBrandId() != null) {
            Brand brand = brandMapper.selectById(product.getBrandId());
            product.setBrandName(brand != null ? brand.getName() : null);
        }
        if (product.getCategoryId() != null) {
            Category category = categoryMapper.selectById(product.getCategoryId());
            product.setCategoryName(category != null ? category.getName() : null);
        }
    }
}
