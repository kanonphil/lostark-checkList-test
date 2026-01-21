package com.lostark.raidchecker.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserStatsDTO {
  private Long id;
  private String username;
  private LocalDateTime createdAt;
  private int characterCount;
  private int weeklyGold;
}