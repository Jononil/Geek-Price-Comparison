package com.geekprice.service;

import com.geekprice.common.PageResult;
import com.geekprice.dto.ProductQueryDTO;
import com.geekprice.entity.Product;

import java.util.List;

public interface ProductService {

    PageResult<Product> list(ProductQueryDTO query);

    Product detail(Long id);

    /**
     * 多产品对比：按给定 ID 顺序返回每个产品的对比详情（基础信息、品牌、分类、规格、当前价格）。
     * 不存在 / 已下架的产品正常跳过，不抛异常。
     */
    List<Product> compare(List<Long> productIds);
}
