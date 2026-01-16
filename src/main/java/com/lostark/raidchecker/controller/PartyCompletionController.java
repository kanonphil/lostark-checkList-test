package com.lostark.raidchecker.controller;

import com.lostark.raidchecker.service.PartyCompletionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/party")
@RequiredArgsConstructor
public class PartyCompletionController {

  private final PartyCompletionService partyCompletionService;

  // 파티 일괄 완료 처리
  @PostMapping("/complete")
  public ResponseEntity<?> completeParty(@RequestBody Map<String, Object> request) {
    try {
      Long raidId = Long.parseLong(request.get("raidId").toString());
      @SuppressWarnings("unchecked")
      List<Long> characterIds = (List<Long>) request.get("characterIds");
      Boolean extraReward = (Boolean) request.getOrDefault("extraReward", false);

      partyCompletionService.completePartyRaid(raidId, characterIds, extraReward);
      return ResponseEntity.ok("파티 완료 처리되었습니다.");
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }
}