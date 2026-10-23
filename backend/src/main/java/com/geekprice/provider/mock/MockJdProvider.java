package com.geekprice.provider.mock;

import org.springframework.stereotype.Component;

/**
 * 京东平台仿真 Provider。
 * 模拟京东商品 API：数据来源为 mock-data/products.json 中 platforms.jd 部分。
 */
@Component
public class MockJdProvider extends MockProductProvider {

    @Override
    protected String getPlatformCode() {
        return "jd";
    }

    @Override
    protected String getProviderName() {
        return "MOCK_JD";
    }
}
