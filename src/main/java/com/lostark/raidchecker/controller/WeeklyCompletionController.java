package com.lostark.raidchecker.controller;

import com.lostark.raidchecker.entity.GateCompletion;
import com.lostark.raidchecker.entity.WeeklyCompletion;
import com.lostark.raidchecker.service.WeeklyCompletionService;
import com.lostark.raidchecker.util.WeeklyResetUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/completions")
@RequiredArgsConstructor
public class WeeklyCompletionController {

  private final WeeklyCompletionService weeklyCompletionService;

  // 이번 주 완료 현황 조회
  @GetMapping("/character/{characterId}")
  public List<WeeklyCompletion> getCurrentWeekCompletions(@PathVariable Long characterId) {
    return weeklyCompletionService.getCurrentWeekCompletions(characterId);
  }

  // 이번 주 체크리스트 생성
  @PostMapping("/character/{characterId}/checklist")
  public List<WeeklyCompletion> createWeeklyChecklist(@PathVariable Long characterId) {
    return weeklyCompletionService.createWeeklyChecklist(characterId);
  }

  // ✅ 관문 완료 체크
  @PostMapping("/gate/{gateCompletionId}/complete")
  public ResponseEntity<GateCompletion> completeGate(
          @PathVariable Long gateCompletionId,
          @RequestBody Map<String, Boolean> request) {
    boolean extraReward = request.getOrDefault("extraReward", false);
    GateCompletion gateCompletion = weeklyCompletionService.completeGate(gateCompletionId, extraReward);
    return ResponseEntity.ok(gateCompletion);
  }

  // ✅ 관문 완료 취소
  @PostMapping("/gate/{gateCompletionId}/uncomplete")
  public ResponseEntity<GateCompletion> uncompleteGate(@PathVariable Long gateCompletionId) {
    GateCompletion gateCompletion = weeklyCompletionService.uncompleteGate(gateCompletionId);
    return ResponseEntity.ok(gateCompletion);
  }

  // 이번 주 총 획득 골드
  @GetMapping("/character/{characterId}/total-gold")
  public ResponseEntity<Integer> getTotalEarnedGold(@PathVariable Long characterId) {
    Integer totalGold = weeklyCompletionService.getTotalEarnedGold(characterId);
    return ResponseEntity.ok(totalGold);
  }

  // 다음 초기화까지 남은 시간
  @GetMapping("/reset-info")
  public ResponseEntity<Map<String, String>> getResetInfo() {
    String timeUntilReset = WeeklyResetUtil.getTimeUntilReset();
    String currentWeekStart = WeeklyResetUtil.getCurrentWeekStart().toString();

    return ResponseEntity.ok(Map.of(
            "currentWeekStart", currentWeekStart,
            "timeUntilReset", timeUntilReset
    ));
  }
}