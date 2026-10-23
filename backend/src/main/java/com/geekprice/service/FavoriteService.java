package com.geekprice.service;

import com.geekprice.common.PageResult;
import com.geekprice.vo.FavoriteVO;

public interface FavoriteService {

    void add(Integer targetType, Long targetId);

    void remove(Integer targetType, Long targetId);

    PageResult<FavoriteVO> listByUser(Long page, Long pageSize);
}
