package com.geekprice.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.geekprice.entity.ProductPrice;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ProductPriceMapper extends BaseMapper<ProductPrice> {
}
