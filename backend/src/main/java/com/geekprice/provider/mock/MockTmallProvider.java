package com.geekprice.provider.mock;

import org.springframework.stereotype.Component;

/**
 * 天猫平台仿真 Provider。
 * 模拟天猫商品 API：数据来源为 mock-data/products.json 中 platforms.tmall 部分。
 */
@Component
public class MockTmallProvider extends MockProductProvider {

    @Override
    protected String getPlatformCode() {
        return "tmall";
    }

    @Override
    protected String getProviderName() {
        return "MOCK_TMALL";
    }
}
