package com.lostark.raidchecker.controller;

import com.lostark.raidchecker.entity.RaidRecruitment;
import com.lostark.raidchecker.entity.RaidParticipant;
import com.lostark.raidchecker.service.RecruitmentService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/recruitments")
@RequiredArgsConstructor
public class RecruitmentController {

  private final RecruitmentService recruitmentService;

  @PostMapping
  public ResponseEntity<?> createRecruitment(
          @RequestBody RaidRecruitment recruitment,
          HttpSession session) {

    Long userId = (Long) session.getAttribute("userId");
    if (userId == null) {
      return ResponseEntity.status(401).body("로그인이 필요합니다");
    }

    RaidRecruitment created = recruitmentService.createRecruitment(recruitment, userId);

    // DTO로 변환
    return ResponseEntity.ok(toRecruitmentDTO(created, 0));
  }

  @GetMapping
  public ResponseEntity<List<Map<String, Object>>> getRecruitments(
          @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
          @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

    List<RaidRecruitment> recruitments =
            recruitmentService.getRecruitmentsByDateRange(startDate, endDate);

    // DTO로 변환
    List<Map<String, Object>> dtoList = recruitments.stream()
            .map(r -> {
              int participantCount = recruitmentService.getParticipants(r.getRecruitmentId()).size();
              return toRecruitmentDTO(r, participantCount);
            })
            .collect(Collectors.toList());

    return ResponseEntity.ok(dtoList);
  }

  @GetMapping("/{recruitmentId}")
  public ResponseEntity<Map<String, Object>> getRecruitmentDetail(
          @PathVariable Long recruitmentId) {

    RaidRecruitment recruitment = recruitmentService.getRecruitmentById(recruitmentId);
    if (recruitment == null) {
      return ResponseEntity.notFound().build();
    }

    List<RaidParticipant> participants = recruitmentService.getParticipants(recruitmentId);

    Map<String, Object> response = new HashMap<>();
    response.put("recruitment", toRecruitmentDTO(recruitment, participants.size()));
    response.put("participants", participants.stream()
            .map(this::toParticipantDTO)
            .collect(Collectors.toList()));

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
      return ResponseEntity.ok(Map.of("message", "참가 신청되었습니다"));
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

  // DTO 변환 메서드
  private Map<String, Object> toRecruitmentDTO(RaidRecruitment r, int participantCount) {
    Map<String, Object> dto = new HashMap<>();
    dto.put("recruitmentId", r.getRecruitmentId());
    dto.put("raidId", r.getRaidId());
    dto.put("raidName", r.getRaidName());
    dto.put("requiredItemLevel", r.getRequiredItemLevel());
    dto.put("raidDateTime", r.getRaidDateTime());
    dto.put("creatorUserId", r.getCreatorUserId());
    dto.put("createdAt", r.getCreatedAt());
    dto.put("status", r.getStatus());
    dto.put("maxPartySize", r.getMaxPartySize());
    dto.put("description", r.getDescription());
    dto.put("currentParticipants", participantCount);
    return dto;
  }

  private Map<String, Object> toParticipantDTO(RaidParticipant p) {
    Map<String, Object> dto = new HashMap<>();
    dto.put("participantId", p.getParticipantId());
    dto.put("characterName", p.getCharacterName());
    dto.put("className", p.getClassName());
    dto.put("itemLevel", p.getItemLevel());
    dto.put("role", p.getRole());
    dto.put("joinedAt", p.getJoinedAt());

    Map<String, Object> charData = new HashMap<>();
    charData.put("id", p.getCharacterIdValue());
    dto.put("character", charData);

    return dto;
  }

  @Data
  static class JoinRequest {
    private Long characterId;
    private String role;
  }
}