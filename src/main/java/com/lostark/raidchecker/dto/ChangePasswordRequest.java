package com.lostark.raidchecker.dto;

import lombok.Data;

// 비밀번호 변경 요청
@Data
public class ChangePasswordRequest {
  private String currentPassword;
  private String newPassword;
}
