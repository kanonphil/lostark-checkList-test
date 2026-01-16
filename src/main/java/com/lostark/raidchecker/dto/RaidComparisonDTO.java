package com.lostark.raidchecker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class RaidComparisonDTO {
  private List<RaidRow> raids;

  @Data
  @AllArgsConstructor
  public static class RaidRow {
    private Long raidId;
    private String raidName;
    private String difficulty;
    private Double requiredItemLevel;
    private Integer rewardGold;
    private List<CharacterCompletion> characters;
  }

  @Data
  @AllArgsConstructor
  public static class CharacterCompletion {
    private Long characterId;
    private String characterName;
    private Boolean completed;
    private Integer earnedGold;
    private Boolean available;  // 아이템 레벨 충족 여부
  }
}
