package com.geekprice.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.common.Result;
import com.geekprice.entity.Category;
import com.geekprice.entity.Product;
import com.geekprice.mapper.BrowseHistoryMapper;
import com.geekprice.mapper.CategoryMapper;
import com.geekprice.mapper.FavoriteMapper;
import com.geekprice.mapper.ProductMapper;
import com.geekprice.mapper.ReviewArticleMapper;
import com.geekprice.mapper.ReviewMapper;
import com.geekprice.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final UserMapper userMapper;
    private final ProductMapper productMapper;
    private final ReviewArticleMapper reviewArticleMapper;
    private final ReviewMapper reviewMapper;
    private final FavoriteMapper favoriteMapper;
    private final BrowseHistoryMapper browseHistoryMapper;
    private final CategoryMapper categoryMapper;

    @GetMapping("/stats")
    public Result<Map<String, Object>> stats() {
        Map<String, Object> data = new HashMap<>();
        data.put("userCount", userMapper.selectCount(null));
        data.put("productCount", productMapper.selectCount(null));
        data.put("articleCount", reviewArticleMapper.selectCount(null));
        data.put("reviewCount", reviewMapper.selectCount(null));
        data.put("favoriteCount", favoriteMapper.selectCount(null));
        data.put("browseCount", browseHistoryMapper.selectCount(null));
        return Result.success(data);
    }

    @GetMapping("/category-stats")
    public Result<List<Map<String, Object>>> categoryStats() {
        List<Map<String, Object>> result = new ArrayList<>();
        List<Category> categories = categoryMapper.selectList(
                new LambdaQueryWrapper<Category>().orderByAsc(Category::getSort));
        for (Category category : categories) {
            Long count = productMapper.selectCount(new LambdaQueryWrapper<Product>()
                    .eq(Product::getCategoryId, category.getId())
                    .eq(Product::getStatus, 1));
            Map<String, Object> item = new HashMap<>();
            item.put("name", category.getName());
            item.put("count", count);
            result.add(item);
        }
        return Result.success(result);
    }

    @GetMapping("/hot-products")
    public Result<List<Product>> hotProducts() {
        return Result.success(productMapper.selectList(new LambdaQueryWrapper<Product>()
                .eq(Product::getStatus, 1)
                .orderByDesc(Product::getHeat)
                .last("LIMIT 10")));
    }
}
