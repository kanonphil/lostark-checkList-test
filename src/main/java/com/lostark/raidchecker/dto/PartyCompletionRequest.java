package com.lostark.raidchecker.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PartyCompletionRequest {
  private Long raidId;
  private List<Long> characterIds;
  private Boolean extraReward;
}
