package com.lostark.raidchecker.service;

import com.lostark.raidchecker.entity.*;
import com.lostark.raidchecker.entity.Character;
import com.lostark.raidchecker.repository.*;
import com.lostark.raidchecker.util.WeeklyResetUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WeeklyCompletionService {

  private final WeeklyCompletionRepository weeklyCompletionRepository;
  private final CharacterRepository characterRepository;
  private final RaidRepository raidRepository;
  private final RaidGateRepository raidGateRepository;
  private final GateCompletionRepository gateCompletionRepository;

  // 특정 캐릭터의 이번 주 완료 기록 조회
  public List<WeeklyCompletion> getCurrentWeekCompletions(Long characterId) {
    Character character = characterRepository.findById(characterId)
            .orElseThrow(() -> new RuntimeException("캐릭터를 찾을 수 없습니다."));

    LocalDateTime weekStart = WeeklyResetUtil.getCurrentWeekStart();
    return weeklyCompletionRepository.findByCharacterAndWeekStart(character, weekStart);
  }

  // 특정 캐릭터의 이번 주 체크리스트 생성
  @Transactional
  public List<WeeklyCompletion> createWeeklyChecklist(Long characterId) {
    Character character = characterRepository.findById(characterId)
            .orElseThrow(() -> new RuntimeException("캐릭터를 찾을 수 없습니다."));

    LocalDateTime weekStart = WeeklyResetUtil.getCurrentWeekStart();

    // 캐릭터 아이템 레벨에 맞는 레이드만 가져오기
    List<Raid> availableRaids = raidRepository.findByRequiredItemLevelLessThanEqualOrderByOrderIndexAsc(
            character.getItemLevel()
    );

    // 각 레이드에 대해 WeeklyCompletion 생성
    for (Raid raid : availableRaids) {
      boolean exists = weeklyCompletionRepository.existsByCharacterAndRaidAndWeekStart(
              character, raid, weekStart
      );

      if (!exists) {
        WeeklyCompletion completion = new WeeklyCompletion();
        completion.setCharacter(character);
        completion.setRaid(raid);
        completion.setWeekStart(weekStart);
        completion.setCompleted(false);
        completion.setEarnedGold(0);

        weeklyCompletionRepository.save(completion);

        // 각 관문에 대한 GateCompletion 생성
        List<RaidGate> gates = raidGateRepository.findByRaidIdOrderByGateNumberAsc(raid.getId());
        for (RaidGate gate : gates) {
          GateCompletion gateCompletion = new GateCompletion();
          gateCompletion.setWeeklyCompletion(completion);
          gateCompletion.setRaidGate(gate);
          gateCompletion.setCompleted(false);
          gateCompletion.setExtraReward(false);
          gateCompletion.setEarnedGold(0);

          gateCompletionRepository.save(gateCompletion);
        }
      }
    }

    return getCurrentWeekCompletions(characterId);
  }

  // 관문 완료 처리
  @Transactional
  public GateCompletion completeGate(Long gateCompletionId, boolean extraReward) {
    GateCompletion gateCompletion = gateCompletionRepository.findById(gateCompletionId)
            .orElseThrow(() -> new RuntimeException("관문 완료 기록을 찾을 수 없습니다."));

    WeeklyCompletion weeklyCompletion = gateCompletion.getWeeklyCompletion();
    Character character = weeklyCompletion.getCharacter();
    String raidGroup = weeklyCompletion.getRaid().getRaidGroup();

    // 이미 완료된 관문인지 확인
    if (gateCompletion.getCompleted()) {
      throw new RuntimeException("이미 완료된 관문입니다.");
    }

    // ✅ 이 레이드 그룹이 이미 완료되었는지 확인
    boolean isRaidGroupAlreadyCompleted = isRaidGroupCompleted(character.getId(), raidGroup);

    // ✅ 전체 완료된 레이드 그룹 개수 확인
    int totalCompletedRaidGroups = getTotalCompletedRaidGroups(character.getId());

    // ✅ 이 레이드 그룹이 아직 완료되지 않았고, 이미 3개 그룹이 완료되었으면 에러
    if (!isRaidGroupAlreadyCompleted && totalCompletedRaidGroups >= 3) {
      throw new RuntimeException("이미 3회 골드를 획득했습니다. (다른 레이드를 선택할 수 없습니다)");
    }

    // 관문 완료 처리
    gateCompletion.setCompleted(true);
    gateCompletion.setExtraReward(extraReward);

    // 골드 계산
    int earnedGold = gateCompletion.getRaidGate().getRewardGold();
    if (extraReward) {
      earnedGold -= gateCompletion.getRaidGate().getExtraCost();
    }
    gateCompletion.setEarnedGold(earnedGold);

    gateCompletionRepository.save(gateCompletion);

    // WeeklyCompletion 업데이트
    updateWeeklyCompletion(weeklyCompletion);

    return gateCompletion;
  }

  // 관문 완료 취소
  @Transactional
  public GateCompletion uncompleteGate(Long gateCompletionId) {
    GateCompletion gateCompletion = gateCompletionRepository.findById(gateCompletionId)
            .orElseThrow(() -> new RuntimeException("관문 완료 기록을 찾을 수 없습니다."));

    gateCompletion.setCompleted(false);
    gateCompletion.setExtraReward(false);
    gateCompletion.setEarnedGold(0);

    gateCompletionRepository.save(gateCompletion);

    // WeeklyCompletion 업데이트
    updateWeeklyCompletion(gateCompletion.getWeeklyCompletion());

    return gateCompletion;
  }

  // WeeklyCompletion 업데이트 (총 골드 계산 및 완료 여부)
  private void updateWeeklyCompletion(WeeklyCompletion weeklyCompletion) {
    List<GateCompletion> gateCompletions = weeklyCompletion.getGateCompletions();

    // ✅ 하나라도 완료된 관문이 있으면 완료로 표시
    boolean hasAnyCompleted = gateCompletions.stream()
            .anyMatch(GateCompletion::getCompleted);

    weeklyCompletion.setCompleted(hasAnyCompleted);

    // 완료된 관문들의 골드 합계
    int totalGold = gateCompletions.stream()
            .filter(GateCompletion::getCompleted)
            .mapToInt(GateCompletion::getEarnedGold)
            .sum();

    weeklyCompletion.setEarnedGold(totalGold);

    weeklyCompletionRepository.save(weeklyCompletion);
  }

  // ✅ 레이드 그룹이 이미 완료되었는지 확인 (관문 1개라도 완료 시 true)
  public boolean isRaidGroupCompleted(Long characterId, String raidGroup) {
    LocalDateTime weekStart = WeeklyResetUtil.getCurrentWeekStart();

    List<WeeklyCompletion> completions = weeklyCompletionRepository
            .findByCharacterIdAndWeekStart(characterId, weekStart);

    return completions.stream()
            .filter(wc -> wc.getRaid().getRaidGroup().equals(raidGroup))
            .anyMatch(WeeklyCompletion::getCompleted);
  }

  // ✅ 레이드 그룹에서 완료된 레이드 개수 조회 (크로스 클리어 고려)
  private int getCompletedRaidsCountInGroup(Long characterId, String raidGroup) {
    LocalDateTime weekStart = WeeklyResetUtil.getCurrentWeekStart();

    List<WeeklyCompletion> completions = weeklyCompletionRepository
            .findByCharacterIdAndWeekStart(characterId, weekStart);

    // ✅ 해당 그룹에서 관문 1개라도 완료된 레이드 개수
    return (int) completions.stream()
            .filter(wc -> wc.getRaid().getRaidGroup().equals(raidGroup))
            .filter(WeeklyCompletion::getCompleted)
            .count();
  }

  // 특정 캐릭터의 이번 주 총 골드 계산
  public Integer getTotalEarnedGold(Long characterId) {
    List<WeeklyCompletion> completions = getCurrentWeekCompletions(characterId);
    return completions.stream()
            .mapToInt(WeeklyCompletion::getEarnedGold)
            .sum();
  }

  // ✅ 전체 완료된 레이드 그룹 개수 조회
  private int getTotalCompletedRaidGroups(Long characterId) {
    LocalDateTime weekStart = WeeklyResetUtil.getCurrentWeekStart();

    List<WeeklyCompletion> completions = weeklyCompletionRepository
            .findByCharacterIdAndWeekStart(characterId, weekStart);

    // ✅ 완료된 레이드들의 raidGroup을 중복 제거하여 개수 카운트
    return (int) completions.stream()
            .filter(WeeklyCompletion::getCompleted)
            .map(wc -> wc.getRaid().getRaidGroup())
            .distinct()
            .count();
  }

  /**
   * 특정 레이드 완료 여부 확인
   */
  public boolean isRaidCompleted(Long characterId, Long raidId) {
    LocalDateTime weekStart = WeeklyResetUtil.getCurrentWeekStart();

    // ✅ 이번 주 완료 기록 조회
    List<WeeklyCompletion> completions = weeklyCompletionRepository
            .findByCharacterIdAndWeekStart(characterId, weekStart);

    // ✅ 해당 레이드의 완료 기록 찾기
    Optional<WeeklyCompletion> raidCompletion = completions.stream()
            .filter(wc -> wc.getRaid().getId().equals(raidId))
            .findFirst();

    if (raidCompletion.isEmpty()) {
      return false;
    }

    // ✅ 관문 하나라도 완료되었으면 true
    List<GateCompletion> gateCompletions = gateCompletionRepository
            .findByWeeklyCompletionId(raidCompletion.get().getId());

    return gateCompletions.stream()
            .anyMatch(GateCompletion::getCompleted);
  }
}