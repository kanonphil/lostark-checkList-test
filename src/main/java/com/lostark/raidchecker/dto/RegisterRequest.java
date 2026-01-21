package com.lostark.raidchecker.dto;

import lombok.Data;

// 회원가입 요청
@Data
public class RegisterRequest {
  private String username;
  private String password;
  private String securityQuestion;
  private String securityAnswer;
}

