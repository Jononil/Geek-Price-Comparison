package com.geekprice.service;

import com.geekprice.vo.PriceCompareVO;
import com.geekprice.vo.PriceHistoryVO;

public interface PriceService {

    PriceCompareVO compare(Long productId);

    PriceHistoryVO history(Long productId, Long platformId);
}
