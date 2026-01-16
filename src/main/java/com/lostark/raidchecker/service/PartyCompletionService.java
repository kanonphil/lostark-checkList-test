package com.lostark.raidchecker.service;

import com.lostark.raidchecker.entity.Character;
import com.lostark.raidchecker.entity.GateCompletion;
import com.lostark.raidchecker.entity.RaidGate;
import com.lostark.raidchecker.entity.WeeklyCompletion;
import com.lostark.raidchecker.repository.CharacterRepository;
import com.lostark.raidchecker.repository.RaidGateRepository;
import com.lostark.raidchecker.repository.GateCompletionRepository;
import com.lostark.raidchecker.repository.WeeklyCompletionRepository;
import com.lostark.raidchecker.util.WeeklyResetUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PartyCompletionService {

  private final CharacterRepository characterRepository;
  private final RaidGateRepository raidGateRepository;
  private final WeeklyCompletionRepository weeklyCompletionRepository;
  private final GateCompletionRepository gateCompletionRepository;
  private final WeeklyCompletionService weeklyCompletionService;

  /**
   * 파티의 모든 캐릭터에 대해 레이드 완료 처리
   */
  @Transactional
  public void completePartyRaid(Long raidId, List<Long> characterIds, boolean extraReward) {
    LocalDateTime weekStart = WeeklyResetUtil.getCurrentWeekStart();

    // 해당 레이드의 모든 관문 조회
    List<RaidGate> gates = raidGateRepository.findByRaidIdOrderByGateNumberAsc(raidId);

    for (Long characterId : characterIds) {
      Character character = characterRepository.findById(characterId)
              .orElseThrow(() -> new RuntimeException("캐릭터를 찾을 수 없습니다: " + characterId));

      // WeeklyCompletion 조회 또는 생성
      WeeklyCompletion weeklyCompletion = weeklyCompletionRepository
              .findByCharacterIdAndWeekStart(characterId, weekStart)
              .stream()
              .filter(wc -> wc.getRaid().getId().equals(raidId))
              .findFirst()
              .orElse(null);

      if (weeklyCompletion == null) {
        // 체크리스트가 없으면 생성
        weeklyCompletionService.createWeeklyChecklist(characterId);

        weeklyCompletion = weeklyCompletionRepository
                .findByCharacterIdAndWeekStart(characterId, weekStart)
                .stream()
                .filter(wc -> wc.getRaid().getId().equals(raidId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("체크리스트 생성 실패"));
      }

      // 모든 관문 완료 처리
      List<GateCompletion> gateCompletions = gateCompletionRepository
              .findByWeeklyCompletionId(weeklyCompletion.getId());

      for (GateCompletion gateCompletion : gateCompletions) {
        if (!gateCompletion.getCompleted()) {
          weeklyCompletionService.completeGate(gateCompletion.getId(), extraReward);
        }
      }
    }
  }
}