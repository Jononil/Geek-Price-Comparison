package com.geekprice.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.geekprice.common.ResultCode;
import com.geekprice.dto.LoginDTO;
import com.geekprice.dto.RegisterDTO;
import com.geekprice.dto.UpdatePasswordDTO;
import com.geekprice.entity.User;
import com.geekprice.entity.UserRole;
import com.geekprice.exception.BusinessException;
import com.geekprice.mapper.UserMapper;
import com.geekprice.mapper.UserRoleMapper;
import com.geekprice.security.JwtUtil;
import com.geekprice.security.SecurityUtil;
import com.geekprice.service.UserService;
import com.geekprice.vo.LoginVO;
import com.geekprice.vo.UserVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    /** 普通用户角色 ID */
    private static final Long ROLE_USER_ID = 1L;

    private final UserMapper userMapper;
    private final UserRoleMapper userRoleMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public LoginVO register(RegisterDTO dto) {
        // 用户名唯一校验
        Long usernameCount = userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getUsername, dto.getUsername()));
        if (usernameCount > 0) {
            throw new BusinessException("用户名已被占用");
        }
        // 邮箱唯一校验
        if (StringUtils.hasText(dto.getEmail())) {
            Long emailCount = userMapper.selectCount(
                    new LambdaQueryWrapper<User>().eq(User::getEmail, dto.getEmail()));
            if (emailCount > 0) {
                throw new BusinessException("邮箱已注册");
            }
        }
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setNickname(dto.getNickname());
        user.setEmail(dto.getEmail());
        user.setStatus(1);
        userMapper.insert(user);

        // 分配普通用户角色
        UserRole userRole = new UserRole();
        userRole.setUserId(user.getId());
        userRole.setRoleId(ROLE_USER_ID);
        userRoleMapper.insert(userRole);

        // 重新查询获取完整字段（createdAt 等由数据库默认值填充）
        User savedUser = userMapper.selectById(user.getId());
        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getUsername(), List.of("USER"));
        return buildLoginVO(savedUser, token);
    }

    @Override
    public LoginVO login(LoginDTO dto) {
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getUsername, dto.getUsername()));
        if (user == null || !passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new BusinessException(ResultCode.UNAUTHORIZED.getCode(), "用户名或密码错误");
        }
        if (user.getStatus() == null || user.getStatus() != 1) {
            throw new BusinessException("账号已被禁用");
        }
        List<String> roles = userMapper.selectRoleCodes(user.getId());
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), roles);
        return buildLoginVO(user, token);
    }

    @Override
    public UserVO getCurrentUser() {
        Long userId = SecurityUtil.getCurrentUserId();
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }
        return toVO(user);
    }

    @Override
    public void updatePassword(UpdatePasswordDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        User user = userMapper.selectById(userId);
        if (!passwordEncoder.matches(dto.getOldPassword(), user.getPassword())) {
            throw new BusinessException("旧密码错误");
        }
        User update = new User();
        update.setId(userId);
        update.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userMapper.updateById(update);
    }

    @Override
    public UserVO toVO(User user) {
        UserVO vo = new UserVO();
        vo.setId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setNickname(user.getNickname());
        vo.setEmail(user.getEmail());
        vo.setPhone(user.getPhone());
        vo.setAvatar(user.getAvatar());
        vo.setRoles(userMapper.selectRoleCodes(user.getId()));
        vo.setCreatedAt(user.getCreatedAt());
        return vo;
    }

    private LoginVO buildLoginVO(User user, String token) {
        LoginVO vo = new LoginVO();
        vo.setToken(token);
        vo.setUser(toVO(user));
        return vo;
    }
}
