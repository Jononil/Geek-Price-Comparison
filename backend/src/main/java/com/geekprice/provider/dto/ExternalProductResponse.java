package com.geekprice.provider.dto;

import lombok.Data;

import java.util.List;

/**
 * 统一外部响应包裹。
 *
 * 模拟第三方 API 的统一返回结构 { code, message, data, total }。
 * code 约定：
 *   200 成功；408 超时；429 限流；404 未找到；500 服务器错误。
 * 异常码用于测试 fallback：Provider 失败 → 读 MySQL 本地缓存 → 返回已有商品。
 */
@Data
public class ExternalProductResponse {

    /** 响应码：200 成功，其余为模拟异常码 */
    private Integer code;

    /** 响应消息 */
    private String message;

    /** 商品列表（单商品场景时长度为 1） */
    private List<ExternalProductDTO> data;

    /** 总数（搜索场景使用） */
    private Integer total;
}
