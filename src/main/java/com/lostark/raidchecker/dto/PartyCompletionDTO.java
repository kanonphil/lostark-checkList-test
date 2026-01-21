package com.lostark.raidchecker.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PartyCompletionDTO {
  private Long id;
  private String raidName;
  private List<String> characterNames;
  private Boolean extraReward;
  private LocalDateTime completedAt;
  private LocalDateTime weekStart;
}