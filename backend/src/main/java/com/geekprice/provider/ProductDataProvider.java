package com.geekprice.provider;

import com.geekprice.provider.dto.ExternalProductResponse;

/**
 * 商品数据源统一接口。
 *
 * 抽象「一个外部电商平台的商品 API」。未来接入真实平台（京东/淘宝/天猫）时，
 * 只需新增对应的 Provider 实现（HTTP 调用返回相同结构），核心业务代码无需改动。
 *
 * 第一阶段使用 Mock 实现（MockJdProvider / MockTaobaoProvider / MockTmallProvider），
 * 模拟真实 API 的数据结构、调用流程与异常情况，不接入任何真实第三方接口。
 */
public interface ProductDataProvider {

    /**
     * 平台编码，与 platforms.code 一致（jd / taobao / tmall）。
     * 用于关联平台表，并写入 product_source 的 provider 字段。
     */
    String platformCode();

    /**
     * 关键词搜索商品（模拟第三方搜索接口）。
     *
     * @param keyword  搜索关键词
     * @param page     页码，从 1 开始
     * @param pageSize 每页数量
     * @return 统一外部响应；code=200 成功，其余为模拟异常码
     */
    ExternalProductResponse search(String keyword, int page, int pageSize);

    /**
     * 获取单个商品详情（模拟第三方详情接口）。
     *
     * @param externalProductId 外部平台商品 ID（如 JD-100001）
     * @return 统一外部响应
     */
    ExternalProductResponse getDetail(String externalProductId);

    /**
     * 全量分页拉取商品（定时同步任务使用）。
     *
     * @param page     页码，从 1 开始
     * @param pageSize 每页数量
     * @return 统一外部响应
     */
    ExternalProductResponse fetchProducts(int page, int pageSize);
}
