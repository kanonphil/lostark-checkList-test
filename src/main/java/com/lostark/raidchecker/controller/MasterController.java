package com.lostark.raidchecker.controller;

import com.lostark.raidchecker.dto.ForcePasswordRequest;
import com.lostark.raidchecker.dto.UserStatsDTO;
import com.lostark.raidchecker.dto.SystemStatsDTO;
import com.lostark.raidchecker.service.MasterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/master")
@RequiredArgsConstructor
public class MasterController {

  private final MasterService masterService;

  /**
   * 전체 사용자 목록 조회 (통계 포함)
   */
  @GetMapping("/users")
  public ResponseEntity<List<UserStatsDTO>> getAllUsers(@RequestParam Long masterUserId) {
    masterService.checkMasterAuth(masterUserId);
    List<UserStatsDTO> users = masterService.getAllUsersWithStats();
    return ResponseEntity.ok(users);
  }

  /**
   * 시스템 통계 조회
   */
  @GetMapping("/stats")
  public ResponseEntity<SystemStatsDTO> getSystemStats(@RequestParam Long masterUserId) {
    masterService.checkMasterAuth(masterUserId);
    SystemStatsDTO stats = masterService.getSystemStats();
    return ResponseEntity.ok(stats);
  }

  /**
   * 사용자 삭제 (CASCADE로 모든 관련 데이터 삭제)
   */
  @DeleteMapping("/users/{userId}")
  public ResponseEntity<Void> deleteUser(
          @PathVariable Long userId,
          @RequestParam Long masterUserId
  ) {
    masterService.checkMasterAuth(masterUserId);
    masterService.deleteUser(userId);
    return ResponseEntity.ok().build();
  }

  /**
   * 전체 주간 데이터 초기화
   */
  @PostMapping("/reset-weekly")
  public ResponseEntity<Void> resetWeeklyData(@RequestParam Long masterUserId) {
    masterService.checkMasterAuth(masterUserId);
    masterService.resetAllWeeklyData();
    return ResponseEntity.ok().build();
  }

  /**
   * 사용자 비밀번호 강제 변경
   */
  @PostMapping("/master/users/{userId}/force-password")
  public ResponseEntity<Void> forceChangePassword(
          @PathVariable Long userId,
          @RequestParam Long masterUserId,
          @RequestBody ForcePasswordRequest request
  ) {
    masterService.checkMasterAuth(masterUserId);
    masterService.forceChangePassword(userId, request.getNewPassword());
    return ResponseEntity.ok().build();
  }
}