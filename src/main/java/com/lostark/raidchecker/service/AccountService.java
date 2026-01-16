package com.lostark.raidchecker.service;

import com.lostark.raidchecker.dto.AccountSummaryDTO;
import com.lostark.raidchecker.dto.RaidComparisonDTO;
import com.lostark.raidchecker.entity.Character;
import com.lostark.raidchecker.entity.Raid;
import com.lostark.raidchecker.entity.WeeklyCompletion;
import com.lostark.raidchecker.repository.CharacterRepository;
import com.lostark.raidchecker.repository.RaidRepository;
import com.lostark.raidchecker.repository.WeeklyCompletionRepository;
import com.lostark.raidchecker.util.WeeklyResetUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AccountService {
  private final CharacterRepository characterRepository;
  private final WeeklyCompletionRepository weeklyCompletionRepository;
  private final RaidRepository raidRepository;

  // 계정 전체 통계
  public AccountSummaryDTO getAccountSummary() {
    List<Character> characters = characterRepository.findAll();
    LocalDateTime weekStart = WeeklyResetUtil.getCurrentWeekStart();

    List<AccountSummaryDTO.CharacterSummary> summaries = new ArrayList<>();
    int totalGold = 0;

    for (Character character : characters) {
      List<WeeklyCompletion> completions = weeklyCompletionRepository
              .findByCharacterAndWeekStart(character, weekStart);

      int earnedGold = completions.stream()
              .filter(WeeklyCompletion::getCompleted)
              .mapToInt(WeeklyCompletion::getEarnedGold)
              .sum();

      long completedCount = completions.stream()
              .filter(WeeklyCompletion::getCompleted)
              .count();

      int totalRaidCount = completions.size();

      double completionRate = totalRaidCount > 0
              ? (completedCount * 100.0 / totalRaidCount)
              : 0.0;

      // goldPriority가 7 이상이면 골드 무시
      if (character.getGoldPriority() <= 6) {
        totalGold += earnedGold;
      }

      summaries.add(new AccountSummaryDTO.CharacterSummary(
              character.getId(),
              character.getCharacterName(),
              character.getClassName(),
              character.getItemLevel(),
              character.getGoldPriority(),
              earnedGold,
              (int) completedCount,
              totalRaidCount,
              Math.round(completionRate * 10) / 10.0  // 소수점 1자리
      ));
    }

    return new AccountSummaryDTO(summaries, totalGold);
  }

  /**
   * 특정 유저의 레이드 완료 비교
   */
  public Map<String, Object> getRaidComparison(Long userId) {
    List<Raid> allRaids = raidRepository.findAllByOrderByOrderIndexAsc();
    List<Character> characters = characterRepository.findByUser_Id(userId);  // ✅ 특정 유저만

    List<Map<String, Object>> raidComparisons = new ArrayList<>();

    for (Raid raid : allRaids) {
      Map<String, Object> raidInfo = new HashMap<>();
      raidInfo.put("raidId", raid.getId());
      raidInfo.put("raidName", raid.getRaidName());
      raidInfo.put("difficulty", raid.getDifficulty());
      raidInfo.put("requiredItemLevel", raid.getRequiredItemLevel());

      List<Map<String, Object>> characterStatuses = new ArrayList<>();

      for (Character character : characters) {
        Map<String, Object> charStatus = new HashMap<>();
        charStatus.put("characterId", character.getId());
        charStatus.put("characterName", character.getCharacterName());

        // 레벨 체크
        boolean available = character.getItemLevel() >= raid.getRequiredItemLevel();
        charStatus.put("available", available);

        if (available) {
          // 완료 여부 체크
          LocalDateTime weekStart = WeeklyResetUtil.getCurrentWeekStart();
          List<WeeklyCompletion> completions = weeklyCompletionRepository
                  .findByCharacterIdAndWeekStart(character.getId(), weekStart);

          Optional<WeeklyCompletion> raidCompletion = completions.stream()
                  .filter(wc -> wc.getRaid().getId().equals(raid.getId()))
                  .findFirst();

          if (raidCompletion.isPresent() && raidCompletion.get().getCompleted()) {
            charStatus.put("completed", true);
            charStatus.put("earnedGold", raidCompletion.get().getEarnedGold());
          } else {
            charStatus.put("completed", false);
            charStatus.put("earnedGold", 0);
          }
        } else {
          charStatus.put("completed", false);
          charStatus.put("earnedGold", 0);
        }

        characterStatuses.add(charStatus);
      }

      raidInfo.put("characters", characterStatuses);
      raidComparisons.add(raidInfo);
    }

    Map<String, Object> result = new HashMap<>();
    result.put("raids", raidComparisons);
    return result;
  }
}
