package com.lostark.raidchecker.controller;

import com.lostark.raidchecker.dto.AccountSummaryDTO;
import com.lostark.raidchecker.dto.RaidComparisonDTO;
import com.lostark.raidchecker.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {
  private final AccountService accountService;

  // 계정 전체 통계
  @GetMapping("/summary")
  public ResponseEntity<AccountSummaryDTO> getAccountSummary() {
    return ResponseEntity.ok(accountService.getAccountSummary());
  }

  // 레이드 비교 뷰
  @GetMapping("/raid-comparison")
  public ResponseEntity<Map<String, Object>> getRaidComparison(@RequestParam Long userId) {
    Map<String, Object> comparison = accountService.getRaidComparison(userId);
    return ResponseEntity.ok(comparison);
  }
}
