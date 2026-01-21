package com.lostark.raidchecker.controller;

import com.lostark.raidchecker.dto.UserStatsDTO;
import com.lostark.raidchecker.dto.SystemStatsDTO;
import com.lostark.raidchecker.dto.PartyCompletionDTO;
import com.lostark.raidchecker.service.MasterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/master")
@RequiredArgsConstructor
public class MasterController {

  private final MasterService masterService;

  /**
   * 전체 사용자 목록 조회 (통계 포함)
   */
  @GetMapping("/users")
  public ResponseEntity<?> getAllUsers(@RequestParam Long masterUserId) {
    try {
      masterService.checkMasterAuth(masterUserId);
      List<UserStatsDTO> users = masterService.getAllUsersWithStats();
      return ResponseEntity.ok(users);
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  /**
   * 시스템 통계 조회
   */
  @GetMapping("/stats")
  public ResponseEntity<?> getSystemStats(@RequestParam Long masterUserId) {
    try {
      masterService.checkMasterAuth(masterUserId);
      SystemStatsDTO stats = masterService.getSystemStats();
      return ResponseEntity.ok(stats);
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  /**
   * 전체 공격대 완료 목록 조회
   */
  @GetMapping("/party-completions")
  public ResponseEntity<?> getAllPartyCompletions(@RequestParam Long masterUserId) {
    try {
      masterService.checkMasterAuth(masterUserId);
      List<PartyCompletionDTO> completions = masterService.getAllPartyCompletions();
      return ResponseEntity.ok(completions);
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  /**
   * ✅ 특정 사용자의 모든 캐릭터 동기화
   */
  @PostMapping("/users/{userId}/sync-all")
  public ResponseEntity<?> syncAllUserCharacters(
          @PathVariable Long userId,
          @RequestParam Long masterUserId
  ) {
    try {
      masterService.checkMasterAuth(masterUserId);
      int successCount = masterService.syncAllUserCharacters(userId);

      Map<String, Object> response = new HashMap<>();
      response.put("success", true);
      response.put("syncedCount", successCount);
      response.put("message", successCount + "개 캐릭터 동기화 완료");

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  /**
   * 사용자 삭제 (CASCADE로 모든 관련 데이터 삭제)
   */
  @DeleteMapping("/users/{userId}")
  public ResponseEntity<?> deleteUser(
          @PathVariable Long userId,
          @RequestParam Long masterUserId
  ) {
    try {
      masterService.checkMasterAuth(masterUserId);
      masterService.deleteUser(userId);
      return ResponseEntity.ok().build();
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  /**
   * 전체 주간 데이터 초기화
   */
  @PostMapping("/reset-weekly")
  public ResponseEntity<?> resetWeeklyData(@RequestParam Long masterUserId) {
    try {
      masterService.checkMasterAuth(masterUserId);
      masterService.resetAllWeeklyData();
      return ResponseEntity.ok().build();
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  /**
   * 사용자 비밀번호 강제 변경
   */
  @PostMapping("/users/{userId}/force-password")
  public ResponseEntity<?> forceChangePassword(
          @PathVariable Long userId,
          @RequestParam Long masterUserId,
          @RequestBody Map<String, String> request
  ) {
    try {
      masterService.checkMasterAuth(masterUserId);
      String newPassword = request.get("newPassword");
      masterService.forceChangePassword(userId, newPassword);
      return ResponseEntity.ok().build();
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }
}