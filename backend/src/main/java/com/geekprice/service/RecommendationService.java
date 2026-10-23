package com.geekprice.service;

import com.geekprice.vo.RecommendationVO;

import java.util.List;

public interface RecommendationService {

    /**
     * 获取当前用户的个性化推荐（未登录走冷启动）
     */
    List<RecommendationVO> recommend();
}
