package com.geekprice.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("product_specs")
public class ProductSpec {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long productId;

    private String specKey;

    private String specLabel;

    private String specValue;

    private Integer sort;

    /** 参数来源 URL（可为空；未核验参数不得填写官方来源） */
    private String sourceUrl;

    /** 来源类型：official / reference_db / internal_knowledge */
    private String sourceType;

    /** 核验状态：verified（已联网核验）/ reference（型号级参考资料·未复核）/ template（模板数据·禁止当作真实参数） */
    private String verifyStatus;
}
