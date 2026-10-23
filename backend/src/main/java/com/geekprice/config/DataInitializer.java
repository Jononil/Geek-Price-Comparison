package com.geekprice.config;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.entity.User;
import com.geekprice.entity.UserRole;
import com.geekprice.mapper.UserMapper;
import com.geekprice.mapper.UserRoleMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * 默认账号初始化器：admin / editor / user（密码均为 123456）
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final String DEFAULT_PASSWORD = "123456";

    private final UserMapper userMapper;
    private final UserRoleMapper userRoleMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        createUserIfAbsent("admin", "系统管理员", 3L);
        createUserIfAbsent("editor", "测评编辑", 2L);
        createUserIfAbsent("user", "普通用户", 1L);
    }

    private void createUserIfAbsent(String username, String nickname, Long roleId) {
        Long count = userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getUsername, username));
        if (count > 0) {
            return;
        }
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
        user.setNickname(nickname);
        user.setEmail(username + "@geekprice.com");
        user.setStatus(1);
        userMapper.insert(user);

        UserRole userRole = new UserRole();
        userRole.setUserId(user.getId());
        userRole.setRoleId(roleId);
        userRoleMapper.insert(userRole);

        log.info("初始化默认账号：{} / {}", username, DEFAULT_PASSWORD);
    }
}
