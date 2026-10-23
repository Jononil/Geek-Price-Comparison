package com.geekprice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 数据同步定时任务配置项（对应 application.yml 的 product.sync.*）。
 *
 * - enabled：是否开启每日自动同步（false 时定时任务直接跳过）；
 * - cron：定时触发表达式（默认每天凌晨 03:00）；
 * - mock-enabled：是否允许 Mock 数据源写入/更新业务数据（默认开启）。
 *   演示环境（application-demo.yml）将其置为 false：定时同步与手动同步接口
 *   一律被后端策略拦截并返回明确错误，防止 Mock 数据污染演示库。
 *   该开关只约束 Mock 数据源；后续接入真实数据源时，真实 Provider 不应受此开关限制。
 *
 * cron 通过 {@code @Scheduled(cron = "${product.sync.cron:...}")} 从本配置读取，
 * 不硬编码到注解中。
 */
@Data
@Component
@ConfigurationProperties(prefix = "product.sync")
public class ProductSyncProperties {

    /** 是否开启自动同步（默认开启） */
    private boolean enabled = true;

    /** 定时触发 cron 表达式（默认每天凌晨 03:00） */
    private String cron = "0 0 3 * * ?";

    /** 是否允许 Mock 数据源同步写入业务数据（演示环境关闭） */
    private boolean mockEnabled = true;
}
