package com.geekprice;

import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;

import javax.sql.DataSource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 测试数据库隔离实证：不靠注解声明，而是断言 Spring 实际解析后的
 * JDBC URL 指向 geek_price_test，防止任何配置/环境变量把测试悄悄
 * 切回开发库写入。
 */
@SpringBootTest
@ActiveProfiles("test")
class DataSourceUrlIsolationTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private Environment env;

    @Test
    void resolvedJdbcUrlPointsToTestDatabase() {
        // 1) 解析 HikariDataSource 的真实连接串
        assertTrue(dataSource instanceof HikariDataSource, "数据源应为 HikariDataSource");
        String jdbcUrl = ((HikariDataSource) dataSource).getJdbcUrl();
        assertNotNull(jdbcUrl);
        assertTrue(jdbcUrl.contains("/geek_price_test"),
                "实际连接的数据库必须是 geek_price_test，实际：" + mask(jdbcUrl));

        // 2) Environment 解析出的 spring.datasource.url 也必须指向测试库
        String configured = env.getProperty("spring.datasource.url");
        assertNotNull(configured, "spring.datasource.url 不应为空");
        assertTrue(configured.contains("/geek_price_test"),
                "spring.datasource.url 必须指向 geek_price_test，实际：" + mask(configured));

        // 3) 不允许任何覆盖把测试切回开发库
        assertFalse(jdbcUrl.contains("/geek_price?") || jdbcUrl.matches(".*/geek_price\\?.*"),
                "测试数据源不得指向开发库 geek_price");
    }

    /** 隐藏连接串中的密码等敏感参数后再输出 */
    private String mask(String url) {
        return url.replaceAll("password=[^&]*", "password=******");
    }
}
