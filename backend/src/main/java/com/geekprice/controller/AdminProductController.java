package com.geekprice.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.geekprice.common.PageResult;
import com.geekprice.common.Result;
import com.geekprice.entity.Brand;
import com.geekprice.entity.Category;
import com.geekprice.entity.Product;
import com.geekprice.mapper.BrandMapper;
import com.geekprice.mapper.CategoryMapper;
import com.geekprice.mapper.ProductMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductMapper productMapper;
    private final BrandMapper brandMapper;
    private final CategoryMapper categoryMapper;

    @GetMapping
    public Result<PageResult<Product>> list(@RequestParam(defaultValue = "1") Long page,
                                            @RequestParam(defaultValue = "10") Long pageSize,
                                            @RequestParam(required = false) String keyword,
                                            @RequestParam(required = false) Long categoryId,
                                            @RequestParam(required = false) Integer status) {
        LambdaQueryWrapper<Product> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            wrapper.like(Product::getName, keyword);
        }
        if (categoryId != null) {
            wrapper.eq(Product::getCategoryId, categoryId);
        }
        if (status != null) {
            wrapper.eq(Product::getStatus, status);
        }
        wrapper.orderByDesc(Product::getCreatedAt);
        Page<Product> result = productMapper.selectPage(new Page<>(page, pageSize), wrapper);
        for (Product product : result.getRecords()) {
            fillName(product);
        }
        return Result.success(PageResult.of(result));
    }

    @PostMapping
    public Result<Void> create(@RequestBody Product product) {
        productMapper.insert(product);
        return Result.success();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Product product) {
        product.setId(id);
        productMapper.updateById(product);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        productMapper.deleteById(id);
        return Result.success();
    }

    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        Product product = new Product();
        product.setId(id);
        product.setStatus(status);
        productMapper.updateById(product);
        return Result.success();
    }

    @PutMapping("/{id}/recommend")
    public Result<Void> setRecommend(@PathVariable Long id, @RequestParam Integer isRecommend) {
        Product product = new Product();
        product.setId(id);
        product.setIsRecommend(isRecommend);
        productMapper.updateById(product);
        return Result.success();
    }

    @PutMapping("/{id}/hot")
    public Result<Void> setHot(@PathVariable Long id, @RequestParam Integer isHot) {
        Product product = new Product();
        product.setId(id);
        product.setIsHot(isHot);
        productMapper.updateById(product);
        return Result.success();
    }

    private void fillName(Product product) {
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
