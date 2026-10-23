package com.geekprice.service;

import com.geekprice.dto.LoginDTO;
import com.geekprice.dto.RegisterDTO;
import com.geekprice.dto.UpdatePasswordDTO;
import com.geekprice.entity.User;
import com.geekprice.vo.LoginVO;
import com.geekprice.vo.UserVO;

public interface UserService {

    LoginVO register(RegisterDTO dto);

    LoginVO login(LoginDTO dto);

    UserVO getCurrentUser();

    void updatePassword(UpdatePasswordDTO dto);

    UserVO toVO(User user);
}
