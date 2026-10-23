package com.geekprice;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 极客比价系统启动类
 */
@SpringBootApplication
@MapperScan("com.geekprice.mapper")
@EnableScheduling
public class GeekPriceApplication {

    public static void main(String[] args) {
        SpringApplication.run(GeekPriceApplication.class, args);
    }
}
