package com.geekprice.common;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.Data;

import java.util.List;

/**
 * 统一分页结构：{ records, total, page, pageSize }
 */
@Data
public class PageResult<T> {

    private List<T> records;
    private Long total;
    private Long page;
    private Long pageSize;

    public static <T> PageResult<T> of(Page<T> page) {
        PageResult<T> result = new PageResult<>();
        result.setRecords(page.getRecords());
        result.setTotal(page.getTotal());
        result.setPage(page.getCurrent());
        result.setPageSize(page.getSize());
        return result;
    }
}
