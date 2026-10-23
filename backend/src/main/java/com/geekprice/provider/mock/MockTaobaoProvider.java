package com.geekprice.provider.mock;

import org.springframework.stereotype.Component;

/**
 * 淘宝平台仿真 Provider。
 * 模拟淘宝商品 API：数据来源为 mock-data/products.json 中 platforms.taobao 部分。
 */
@Component
public class MockTaobaoProvider extends MockProductProvider {

    @Override
    protected String getPlatformCode() {
        return "taobao";
    }

    @Override
    protected String getProviderName() {
        return "MOCK_TAOBAO";
    }
}
