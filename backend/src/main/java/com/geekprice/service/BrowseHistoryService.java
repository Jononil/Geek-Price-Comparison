package com.geekprice.service;

import com.geekprice.vo.BrowseHistoryVO;

import java.util.List;

public interface BrowseHistoryService {

    void record(Long productId);

    List<BrowseHistoryVO> listByUser(Integer limit);

    void clear();
}
