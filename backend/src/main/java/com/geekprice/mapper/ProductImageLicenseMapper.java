package com.geekprice.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.geekprice.entity.ProductImageLicense;
import org.apache.ibatis.annotations.Mapper;

/** 商品图片授权元数据 Mapper（复用 MyBatis-Plus BaseMapper，无自定义 SQL） */
@Mapper
public interface ProductImageLicenseMapper extends BaseMapper<ProductImageLicense> {
}
