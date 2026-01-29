package com.lostark.raidchecker.dto;

import lombok.Data;

@Data
public class CreateRecruitmentRequest {
  private Long raidId;
  private String raidName;
  private Double requiredItemLevel;
  private String raidDateTime;  // "2026-01-28T20:00:00"
  private Integer maxPartySize;
  private String description;
}