package com.lostark.raidchecker.service;

import com.lostark.raidchecker.dto.SystemStatsDTO;
import com.lostark.raidchecker.dto.UserStatsDTO;
import com.lostark.raidchecker.dto.PartyCompletionDTO;
import com.lostark.raidchecker.entity.PartyCompletion;
import com.lostark.raidchecker.entity.User;
import com.lostark.raidchecker.entity.Character;
import com.lostark.raidchecker.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MasterService {

  private final UserRepository userRepository;
  private final CharacterRepository characterRepository;
  private final WeeklyCompletionRepository weeklyCompletionRepository;
  private final GateCompletionRepository gateCompletionRepository;
  private final PartyCompletionRepository partyCompletionRepository;
  private final WeeklyCompletionService weeklyCompletionService;
  private final CharacterService characterService;  // ✅ 추가
  private final PasswordEncoder passwordEncoder;

  /**
   * Master 권한 확인
   */
  public void checkMasterAuth(Long userId) {
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

    if (!"master".equals(user.getUsername())) {
      throw new RuntimeException("관리자 권한이 필요합니다.");
    }
  }

  /**
   * 전체 사용자 + 통계 조회
   */
  public List<UserStatsDTO> getAllUsersWithStats() {
    List<User> users = userRepository.findAll();

    return users.stream().map(user -> {
      UserStatsDTO dto = new UserStatsDTO();
      dto.setId(user.getId());
      dto.setUsername(user.getUsername());
      dto.setCreatedAt(user.getCreatedAt());

      // 캐릭터 수
      int characterCount = characterRepository.countByUser_Id(user.getId());
      dto.setCharacterCount(characterCount);

      // 이번 주 총 골드 (모든 캐릭터 합산)
      int totalWeeklyGold = 0;
      List<Character> characters = characterRepository.findByUser_Id(user.getId());

      for (Character character : characters) {
        try {
          Integer gold = weeklyCompletionService.getTotalEarnedGold(character.getId());
          totalWeeklyGold += (gold != null ? gold : 0);
        } catch (Exception e) {
          // 에러 무시하고 계속 진행
        }
      }
      dto.setWeeklyGold(totalWeeklyGold);

      return dto;
    }).collect(Collectors.toList());
  }

  /**
   * 시스템 통계 조회
   */
  public SystemStatsDTO getSystemStats() {
    SystemStatsDTO stats = new SystemStatsDTO();

    stats.setTotalUsers(userRepository.count());
    stats.setTotalCharacters(characterRepository.count());
    stats.setTotalWeeklyCompletions(weeklyCompletionRepository.count());
    stats.setTotalGateCompletions(gateCompletionRepository.count());

    return stats;
  }

  /**
   * 전체 공격대 완료 목록 조회
   */
  public List<PartyCompletionDTO> getAllPartyCompletions() {
    List<PartyCompletion> completions = partyCompletionRepository.findAllByOrderByCompletedAtDesc();

    return completions.stream().map(pc -> {
      PartyCompletionDTO dto = new PartyCompletionDTO();
      dto.setId(pc.getId());
      dto.setRaidName(pc.getRaid().getRaidName() + " " + pc.getRaid().getDifficulty());
      dto.setExtraReward(pc.getExtraReward());
      dto.setCompletedAt(pc.getCompletedAt());
      dto.setWeekStart(pc.getWeekStart());

      // characterIds를 파싱하여 캐릭터 이름 가져오기
      List<String> characterNames = new ArrayList<>();
      if (pc.getCharacterIds() != null && !pc.getCharacterIds().isEmpty()) {
        List<Long> charIds = Arrays.stream(pc.getCharacterIds().split(","))
                .map(String::trim)
                .map(Long::parseLong)
                .collect(Collectors.toList());

        for (Long charId : charIds) {
          characterRepository.findById(charId).ifPresent(c ->
                  characterNames.add(c.getCharacterName())
          );
        }
      }
      dto.setCharacterNames(characterNames);

      return dto;
    }).collect(Collectors.toList());
  }

  /**
   * ✅ 특정 사용자의 모든 캐릭터 동기화
   */
  @Transactional
  public int syncAllUserCharacters(Long userId) {
    List<Character> characters = characterRepository.findByUser_Id(userId);

    int successCount = 0;
    for (Character character : characters) {
      try {
        characterService.syncCharacter(character.getId());
        successCount++;
      } catch (Exception e) {
        System.err.println("캐릭터 동기화 실패: " + character.getCharacterName() + " - " + e.getMessage());
      }
    }

    return successCount;
  }

  /**
   * 사용자 삭제 (CASCADE로 자동 삭제됨)
   */
  @Transactional
  public void deleteUser(Long userId) {
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

    // master 자신은 삭제 불가
    if ("master".equals(user.getUsername())) {
      throw new RuntimeException("master 계정은 삭제할 수 없습니다.");
    }

    userRepository.delete(user);
  }

  /**
   * 전체 주간 데이터 초기화
   */
  @Transactional
  public void resetAllWeeklyData() {
    // 순서 중요! (FK 제약 조건)
    partyCompletionRepository.deleteAll();
    gateCompletionRepository.deleteAll();
    weeklyCompletionRepository.deleteAll();
  }

  /**
   * 사용자 비밀번호 강제 변경 (Master 권한)
   */
  @Transactional
  public void forceChangePassword(Long userId, String newPassword) {
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

    // 비밀번호 변경
    user.setPassword(passwordEncoder.encode(newPassword));
    userRepository.save(user);
  }
}