package com.lostark.raidchecker.service;

import com.lostark.raidchecker.entity.*;
import com.lostark.raidchecker.entity.Character;
import com.lostark.raidchecker.repository.*;
import com.lostark.raidchecker.util.WeeklyResetUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WeeklyCompletionService {

  private final WeeklyCompletionRepository weeklyCompletionRepository;
  private final CharacterRepository characterRepository;
  private final RaidRepository raidRepository;
  private final RaidGateRepository raidGateRepository;
  private final GateCompletionRepository gateCompletionRepository;
  private final PartyCompletionRepository partyCompletionRepository;

  /**
   * ✅ 매주 수요일 06:00에 자동으로 지난 주 데이터 삭제 후 새 체크리스트 생성
   */
  @Scheduled(cron = "0 0 6 * * WED", zone = "Asia/Seoul")
  @Transactional
  public void weeklyReset() {
    System.out.println("=== 주간 초기화 시작: " + LocalDateTime.now() + " ===");

    // ✅ 1. 지난 주 완료 데이터 삭제 (순서 중요!)
    System.out.println("지난 주 완료 데이터 삭제 중...");
    long partyCount = partyCompletionRepository.count();
    long gateCount = gateCompletionRepository.count();
    long weeklyCount = weeklyCompletionRepository.count();

    // ✅ PartyCompletion은 Raid만 참조 → 먼저 삭제 가능
    partyCompletionRepository.deleteAll();
    gateCompletionRepository.deleteAll();
    weeklyCompletionRepository.deleteAll();

    System.out.println("삭제 완료 - PartyCompletion: " + partyCount
            + "개, GateCompletion: " + gateCount
            + "개, WeeklyCompletion: " + weeklyCount + "개");

    // ✅ 2. 모든 캐릭터에 대해 새 체크리스트 생성
    List<Character> allCharacters = characterRepository.findAll();
    System.out.println("총 " + allCharacters.size() + "개 캐릭터 체크리스트 생성 중...");

    int successCount = 0;
    for (Character character : allCharacters) {
      try {
        createWeeklyChecklist(character.getId());
        successCount++;
      } catch (Exception e) {
        System.err.println("캐릭터 " + character.getCharacterName()
                + " 체크리스트 생성 실패: " + e.getMessage());
      }
    }

    System.out.println("=== 주간 초기화 완료 - 성공: " + successCount + "개 ===");
  }

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

    // ✅ 이 레이드 그룹이 골드를 받을 수 있는지 확인
    // (이 그룹의 첫 관문을 깨기 전에 이미 3개 그룹을 완료했는지 확인)
    boolean canEarnGold = canRaidGroupEarnGold(character.getId(), raidGroup);

    // 관문 완료 처리
    gateCompletion.setCompleted(true);
    gateCompletion.setExtraReward(extraReward);

    // ✅ 골드 계산: 이 레이드 그룹이 골드를 받을 수 있는 상태라면 골드 지급
    int earnedGold = 0;
    if (canEarnGold) {
      earnedGold = gateCompletion.getRaidGate().getRewardGold();
      if (extraReward) {
        earnedGold -= gateCompletion.getRaidGate().getExtraCost();
      }
    }
    gateCompletion.setEarnedGold(earnedGold);

    gateCompletionRepository.save(gateCompletion);

    // WeeklyCompletion 업데이트
    updateWeeklyCompletion(weeklyCompletion);

    // ✅ 같은 레이드 그룹의 다른 난이도들도 완료 상태로 업데이트
    updateSameRaidGroupCompletions(character.getId(), raidGroup);

    return gateCompletion;
  }

  /**
   * ✅ 이 레이드 그룹이 골드를 받을 수 있는지 확인
   * - 이미 이 그룹을 시작했다면 (1관문이라도 완료) → 계속 골드 가능
   * - 아직 시작 안 했다면 → 3개 제한 확인
   */
  private boolean canRaidGroupEarnGold(Long characterId, String raidGroup) {
    LocalDateTime weekStart = WeeklyResetUtil.getCurrentWeekStart();

    List<WeeklyCompletion> completions = weeklyCompletionRepository
            .findByCharacterIdAndWeekStart(characterId, weekStart);

    // 이 레이드 그룹이 이미 시작되었는지 확인 (관문 1개라도 완료)
    boolean isThisGroupStarted = completions.stream()
            .filter(wc -> wc.getRaid().getRaidGroup().equals(raidGroup))
            .anyMatch(WeeklyCompletion::getCompleted);

    // 이미 시작한 그룹이면 무조건 골드 가능
    if (isThisGroupStarted) {
      return true;
    }

    // 아직 시작 안 한 그룹이면, 이미 완료한 다른 그룹이 3개 미만인지 확인
    long completedOtherGroups = completions.stream()
            .filter(WeeklyCompletion::getCompleted)
            .map(wc -> wc.getRaid().getRaidGroup())
            .distinct()
            .count();

    return completedOtherGroups < 3;
  }

  /**
   * ✅ 같은 레이드 그룹의 모든 난이도를 완료 상태로 표시
   * (한 난이도를 클리어하면 다른 난이도는 할 수 없으므로)
   */
  private void updateSameRaidGroupCompletions(Long characterId, String raidGroup) {
    LocalDateTime weekStart = WeeklyResetUtil.getCurrentWeekStart();

    List<WeeklyCompletion> sameGroupCompletions = weeklyCompletionRepository
            .findByCharacterIdAndWeekStart(characterId, weekStart).stream()
            .filter(wc -> wc.getRaid().getRaidGroup().equals(raidGroup))
            .toList();

    for (WeeklyCompletion wc : sameGroupCompletions) {
      if (!wc.getCompleted()) {
        wc.setCompleted(true);
        weeklyCompletionRepository.save(wc);
      }
    }
  }

  /**
   * ✅ 관문 완료 취소 - 필드만 초기화 (삭제/재생성 방식에서 변경)
   */
  @Transactional
  public GateCompletion uncompleteGate(Long gateCompletionId) {
    GateCompletion gateCompletion = gateCompletionRepository.findById(gateCompletionId)
            .orElseThrow(() -> new RuntimeException("관문 완료 기록을 찾을 수 없습니다."));

    WeeklyCompletion weeklyCompletion = gateCompletion.getWeeklyCompletion();
    String raidGroup = weeklyCompletion.getRaid().getRaidGroup();
    Long characterId = weeklyCompletion.getCharacter().getId();

    // ✅ 삭제 대신 필드만 초기화
    gateCompletion.setCompleted(false);
    gateCompletion.setExtraReward(false);
    gateCompletion.setEarnedGold(0);

    GateCompletion saved = gateCompletionRepository.save(gateCompletion);

    // WeeklyCompletion 업데이트
    updateWeeklyCompletion(weeklyCompletion);

    // ✅ 같은 레이드 그룹의 다른 난이도 완료 상태 재확인
    recheckSameRaidGroupCompletions(characterId, raidGroup);

    return saved;
  }

  /**
   * ✅ 같은 레이드 그룹의 완료 상태 재확인
   * (관문 취소 시 해당 그룹의 모든 난이도가 미완료 상태인지 확인)
   */
  private void recheckSameRaidGroupCompletions(Long characterId, String raidGroup) {
    LocalDateTime weekStart = WeeklyResetUtil.getCurrentWeekStart();

    List<WeeklyCompletion> sameGroupCompletions = weeklyCompletionRepository
            .findByCharacterIdAndWeekStart(characterId, weekStart).stream()
            .filter(wc -> wc.getRaid().getRaidGroup().equals(raidGroup))
            .toList();

    // 같은 그룹에서 하나라도 완료된 관문이 있는지 확인
    boolean hasAnyCompletedGate = sameGroupCompletions.stream()
            .anyMatch(wc -> wc.getGateCompletions().stream()
                    .anyMatch(GateCompletion::getCompleted));

    if (!hasAnyCompletedGate) {
      // 모든 관문이 미완료 상태라면 모든 난이도를 미완료로 설정
      for (WeeklyCompletion wc : sameGroupCompletions) {
        if (wc.getCompleted()) {
          wc.setCompleted(false);
          wc.setEarnedGold(0);
          weeklyCompletionRepository.save(wc);
        }
      }
    } else {
      // ✅ 일부 관문이 완료 상태라면, 실제 완료된 난이도의 골드를 다른 난이도에 동기화
      WeeklyCompletion actualCompleted = sameGroupCompletions.stream()
              .filter(wc -> wc.getGateCompletions().stream()
                      .anyMatch(GateCompletion::getCompleted))
              .findFirst()
              .orElse(null);

      if (actualCompleted != null) {
        int actualGold = actualCompleted.getEarnedGold();
        for (WeeklyCompletion wc : sameGroupCompletions) {
          if (wc.getId().equals(actualCompleted.getId())) {
            continue; // 실제 완료한 난이도는 이미 업데이트됨
          }
          wc.setCompleted(true);
          wc.setEarnedGold(actualGold);
          weeklyCompletionRepository.save(wc);
        }
      }
    }
  }

  // WeeklyCompletion 업데이트 (총 골드 계산 및 완료 여부)
  private void updateWeeklyCompletion(WeeklyCompletion weeklyCompletion) {
    List<GateCompletion> gateCompletions = weeklyCompletion.getGateCompletions();

    // 하나라도 완료된 관문이 있으면 완료로 표시
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

  // 레이드 그룹이 이미 완료되었는지 확인 (관문 1개라도 완료 시 true)
  public boolean isRaidGroupCompleted(Long characterId, String raidGroup) {
    LocalDateTime weekStart = WeeklyResetUtil.getCurrentWeekStart();

    List<WeeklyCompletion> completions = weeklyCompletionRepository
            .findByCharacterIdAndWeekStart(characterId, weekStart);

    return completions.stream()
            .filter(wc -> wc.getRaid().getRaidGroup().equals(raidGroup))
            .anyMatch(WeeklyCompletion::getCompleted);
  }

  // 특정 캐릭터의 이번 주 총 골드 계산
  public Integer getTotalEarnedGold(Long characterId) {
    List<WeeklyCompletion> completions = getCurrentWeekCompletions(characterId);
    return completions.stream()
            .mapToInt(WeeklyCompletion::getEarnedGold)
            .sum();
  }

  // 전체 완료된 레이드 그룹 개수 조회
  private int getTotalCompletedRaidGroups(Long characterId) {
    LocalDateTime weekStart = WeeklyResetUtil.getCurrentWeekStart();

    List<WeeklyCompletion> completions = weeklyCompletionRepository
            .findByCharacterIdAndWeekStart(characterId, weekStart);

    // 완료된 레이드들의 raidGroup을 중복 제거하여 개수 카운트
    return (int) completions.stream()
            .filter(WeeklyCompletion::getCompleted)
            .map(wc -> wc.getRaid().getRaidGroup())
            .distinct()
            .count();
  }
}