package com.lostark.raidchecker.controller;

import com.lostark.raidchecker.entity.RaidRecruitment;
import com.lostark.raidchecker.entity.RaidParticipant;
import com.lostark.raidchecker.service.RecruitmentService;
import jakarta.servlet.http.HttpSession;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/recruitments")
@RequiredArgsConstructor
public class RecruitmentController {

  private final RecruitmentService recruitmentService;

  @PostMapping
  public ResponseEntity<?> createRecruitment(
          @RequestBody RaidRecruitment recruitment,
          HttpSession session) {

    System.out.println("세션 ID: " + session.getId()); // 디버깅용
    System.out.println("저장된 userId: " + session.getAttribute("userId"));

    Long userId = (Long) session.getAttribute("userId");
    if (userId == null) {
      return ResponseEntity.status(401).body("로그인이 필요합니다");
    }

    RaidRecruitment created = recruitmentService.createRecruitment(recruitment, userId);
    return ResponseEntity.ok(created);
  }

  @GetMapping
  public ResponseEntity<List<RaidRecruitment>> getRecruitments(
          @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
          @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

    List<RaidRecruitment> recruitments =
            recruitmentService.getRecruitmentsByDateRange(startDate, endDate);
    return ResponseEntity.ok(recruitments);
  }

  @GetMapping("/{recruitmentId}")
  public ResponseEntity<RecruitmentDetailResponse> getRecruitmentDetail(
          @PathVariable Long recruitmentId) {

    RaidRecruitment recruitment = recruitmentService.getRecruitmentById(recruitmentId);
    if (recruitment == null) {
      return ResponseEntity.notFound().build();
    }

    List<RaidParticipant> participants = recruitmentService.getParticipants(recruitmentId);

    RecruitmentDetailResponse response = new RecruitmentDetailResponse();
    response.setRecruitment(recruitment);
    response.setParticipants(participants);

    return ResponseEntity.ok(response);
  }

  @PostMapping("/{recruitmentId}/join")
  public ResponseEntity<?> joinRecruitment(
          @PathVariable Long recruitmentId,
          @RequestBody JoinRequest request,
          HttpSession session) {

    Long userId = (Long) session.getAttribute("userId");
    if (userId == null) {
      return ResponseEntity.status(401).body("로그인이 필요합니다");
    }

    try {
      recruitmentService.addParticipant(
              recruitmentId,
              request.getCharacterId(),
              request.getRole(),
              userId
      );
      return ResponseEntity.ok().build();
    } catch (IllegalStateException | IllegalArgumentException e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  @DeleteMapping("/{recruitmentId}/leave")
  public ResponseEntity<?> leaveRecruitment(
          @PathVariable Long recruitmentId,
          @RequestParam Long characterId,
          HttpSession session) {

    Long userId = (Long) session.getAttribute("userId");
    if (userId == null) {
      return ResponseEntity.status(401).body("로그인이 필요합니다");
    }

    try {
      recruitmentService.removeParticipant(recruitmentId, characterId, userId);
      return ResponseEntity.ok().build();
    } catch (IllegalStateException | IllegalArgumentException e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  @DeleteMapping("/{recruitmentId}")
  public ResponseEntity<?> deleteRecruitment(
          @PathVariable Long recruitmentId,
          HttpSession session) {

    Long userId = (Long) session.getAttribute("userId");
    if (userId == null) {
      return ResponseEntity.status(401).body("로그인이 필요합니다");
    }

    try {
      recruitmentService.deleteRecruitment(recruitmentId, userId);
      return ResponseEntity.ok().build();
    } catch (IllegalStateException e) {
      return ResponseEntity.status(403).body(e.getMessage());
    }
  }

  @Data
  static class JoinRequest {
    private Long characterId;
    private String role;
  }

  @Data
  static class RecruitmentDetailResponse {
    private RaidRecruitment recruitment;
    private List<RaidParticipant> participants;
  }
}