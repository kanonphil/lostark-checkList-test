package com.lostark.raidchecker.service;

import com.lostark.raidchecker.entity.Character;
import com.lostark.raidchecker.entity.RaidRecruitment;
import com.lostark.raidchecker.entity.RaidParticipant;
import com.lostark.raidchecker.repository.CharacterRepository;
import com.lostark.raidchecker.repository.RaidRecruitmentRepository;
import com.lostark.raidchecker.repository.RaidParticipantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecruitmentService {

  private final RaidRecruitmentRepository recruitmentRepository;
  private final RaidParticipantRepository participantRepository;
  private final CharacterRepository characterRepository;

  @Transactional
  public RaidRecruitment createRecruitment(RaidRecruitment recruitment, Long userId) {
    recruitment.setCreatorUserId(userId);
    recruitment.setStatus("RECRUITING");
    return recruitmentRepository.save(recruitment);
  }

  public List<RaidRecruitment> getRecruitmentsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
    return recruitmentRepository.findByRaidDateTimeBetweenOrderByRaidDateTime(startDate, endDate);
  }

  public RaidRecruitment getRecruitmentById(Long recruitmentId) {
    return recruitmentRepository.findById(recruitmentId).orElse(null);
  }

  @Transactional
  public void addParticipant(Long recruitmentId, Long characterId, String role, Long userId) {
    // 이미 참가했는지 확인
    if (participantRepository.existsByRecruitmentIdAndUserId(recruitmentId, userId)) {
      throw new IllegalStateException("이미 이 모집에 다른 캐릭터로 참가했습니다");
    }

    // 모집 정보 조회
    RaidRecruitment recruitment = recruitmentRepository.findById(recruitmentId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 모집입니다"));

    if (!"RECRUITING".equals(recruitment.getStatus())) {
      throw new IllegalStateException("모집이 마감되었습니다");
    }

    // 인원 확인
    if (recruitment.getCurrentParticipants() >= recruitment.getMaxPartySize()) {
      throw new IllegalStateException("모집 인원이 가득 찼습니다");
    }

    // 캐릭터 정보 조회
    Character character = characterRepository.findById(characterId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 캐릭터입니다"));

    if (!character.getUserId().equals(userId)) {
      throw new IllegalStateException("본인의 캐릭터가 아닙니다");
    }

    if (character.getItemLevel() < recruitment.getRequiredItemLevel()) {
      throw new IllegalStateException("아이템 레벨이 부족합니다");
    }

    // 역할 검증
    if (!isValidRole(character.getClassName(), role)) {
      throw new IllegalArgumentException("잘못된 역할입니다");
    }

    // 참가자 추가
    RaidParticipant participant = new RaidParticipant();
    participant.setRecruitment(recruitment);
    participant.setCharacter(character);
    participant.setCharacterName(character.getCharacterName());
    participant.setClassName(character.getClassName());
    participant.setItemLevel(character.getItemLevel());
    participant.setRole(role);

    participantRepository.save(participant);

    // 인원이 다 차면 상태 변경
    recruitment = recruitmentRepository.findById(recruitmentId).get();
    if (recruitment.getCurrentParticipants() >= recruitment.getMaxPartySize()) {
      recruitment.setStatus("FULL");
      recruitmentRepository.save(recruitment);
    }
  }

  private boolean isValidRole(String className, String role) {
    if ("발키리".equals(className)) {
      return "DPS".equals(role) || "SUPPORT".equals(role);
    } else if ("바드".equals(className) || "홀리나이트".equals(className)) {
      return "SUPPORT".equals(role);
    } else {
      return "DPS".equals(role);
    }
  }

  @Transactional
  public void removeParticipant(Long recruitmentId, Long characterId, Long userId) {
    // 캐릭터 소유권 확인
    Character character = characterRepository.findById(characterId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 캐릭터입니다"));

    if (!character.getUserId().equals(userId)) {
      throw new IllegalStateException("본인의 캐릭터가 아닙니다");
    }

    participantRepository.deleteByRecruitment_RecruitmentIdAndCharacter_Id(recruitmentId, characterId);

    // FULL 상태였으면 다시 RECRUITING으로
    RaidRecruitment recruitment = recruitmentRepository.findById(recruitmentId).get();
    if ("FULL".equals(recruitment.getStatus())) {
      recruitment.setStatus("RECRUITING");
      recruitmentRepository.save(recruitment);
    }
  }

  public List<RaidParticipant> getParticipants(Long recruitmentId) {
    return participantRepository.findByRecruitment_RecruitmentId(recruitmentId);
  }

  @Transactional
  public void deleteRecruitment(Long recruitmentId, Long userId) {
    RaidRecruitment recruitment = recruitmentRepository.findById(recruitmentId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 모집입니다"));

    // 모집 생성자만 삭제 가능
    if (!recruitment.getCreatorUserId().equals(userId)) {
      throw new IllegalStateException("모집을 삭제할 권한이 없습니다");
    }

    recruitmentRepository.delete(recruitment);
  }
}