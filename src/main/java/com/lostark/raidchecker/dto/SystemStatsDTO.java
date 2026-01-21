package com.lostark.raidchecker.dto;

import lombok.Data;

@Data
public class SystemStatsDTO {
  private long totalUsers;
  private long totalCharacters;
  private long totalWeeklyCompletions;
  private long totalGateCompletions;
}
