package com.lostark.raidchecker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class AccountSummaryDTO {
  private List<CharacterSummary> characters;
  private Integer totalGold;

  @Data
  @AllArgsConstructor
  public static class CharacterSummary {
    private Long id;
    private String characterName;
    private String className;
    private Double itemLevel;
    private Integer goldPriority;
    private Integer earnedGold;
    private Integer completedCount;
    private Integer totalRaidCount;
    private Double completionRate;
  }
}
