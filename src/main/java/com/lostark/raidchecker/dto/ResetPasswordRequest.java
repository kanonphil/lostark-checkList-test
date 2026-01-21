package com.lostark.raidchecker.dto;

import lombok.Data;

// 비밀번호 재설정 요청
@Data
public class ResetPasswordRequest {
  private String username;
  private String securityAnswer;
  private String newPassword;
}
