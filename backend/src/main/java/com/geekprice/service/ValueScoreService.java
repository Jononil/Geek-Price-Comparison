package com.geekprice.service;

public interface ValueScoreService {

    /**
     * 计算单个产品的性价比评分（0-100）。
     *
     * 数据治理规则（参数真实性治理）：
     * - 可信参数（verify_status = verified/reference）少于 3 项时返回 null——数据不足，不生成虚假评分；
     * - 维度缺数据时剔除该维度并按权重重新归一（不再用默认值 60/4.0 等填补）；
     * - 价格维度基于系统模拟报价，评分代表"基于模拟价格的相对性价比"。
     *
     * @return 0-100 的评分；数据不足或产品不存在时返回 null（不存在时为 0 以兼容既有调用约定）
     */
    Integer calculate(Long productId);

    /**
     * 重新计算所有上架产品的性价比评分；数据不足的产品写入 NULL（不伪造分数）
     */
    void recalculateAll();
}
