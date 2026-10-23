package com.geekprice.controller;

import com.geekprice.common.PageResult;
import com.geekprice.common.Result;
import com.geekprice.dto.ProductQueryDTO;
import com.geekprice.entity.Product;
import com.geekprice.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public Result<PageResult<Product>> list(ProductQueryDTO query) {
        return Result.success(productService.list(query));
    }

    @GetMapping("/{id}")
    public Result<Product> detail(@PathVariable Long id) {
        return Result.success(productService.detail(id));
    }

    @GetMapping("/compare")
    public Result<List<Product>> compare(@RequestParam List<Long> ids) {
        return Result.success(productService.compare(ids));
    }
}
