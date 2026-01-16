package com.lostark.raidchecker.controller;

import com.lostark.raidchecker.service.PartyMatchingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/party")
@RequiredArgsConstructor
public class PartyMatchingController {

  private final PartyMatchingService partyMatchingService;

  // 특정 레이드의 가능한 캐릭터 목록
  @GetMapping("/available/{raidId}")
  public ResponseEntity<Map<String, Object>> getAvailableCharacters(@PathVariable Long raidId) {
    Map<String, Object> result = partyMatchingService.getAvailableCharactersForRaid(raidId);
    return ResponseEntity.ok(result);
  }

  // 특정 레이드의 파티 추천 (partyType 자동 판단)
  @GetMapping("/recommend/{raidId}")
  public ResponseEntity<List<Map<String, Object>>> recommendParty(@PathVariable Long raidId) {
    List<Map<String, Object>> recommendations = partyMatchingService.recommendParty(raidId);
    return ResponseEntity.ok(recommendations);
  }

  // 모든 레이드의 파티 추천 조회
  @GetMapping("/recommend/all")
  public ResponseEntity<Map<String, List<Map<String, Object>>>> getAllRecommendations() {
    Map<String, List<Map<String, Object>>> result = partyMatchingService.getAllPartyRecommendations();
    return ResponseEntity.ok(result);
  }
}