package com.lostark.raidchecker.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class LostArkCharacterResponse {

  @JsonProperty("CharacterName")
  private String characterName;

  @JsonProperty("ServerName")
  private String serverName;

  @JsonProperty("CharacterClassName")
  private String characterClassName;

  @JsonProperty("ItemAvgLevel")
  private String itemAvgLevel;

  @JsonProperty("GuildName")
  private String guildName;

  @JsonProperty("CharacterLevel")
  private Integer characterLevel;

  @JsonProperty("ExpeditionLevel")
  private Integer expeditionLevel;
}