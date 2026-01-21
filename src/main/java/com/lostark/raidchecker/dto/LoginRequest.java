package com.lostark.raidchecker.dto;

import lombok.Data;

// 로그인 요청
@Data
public class LoginRequest {
  private String username;
  private String password;
}
