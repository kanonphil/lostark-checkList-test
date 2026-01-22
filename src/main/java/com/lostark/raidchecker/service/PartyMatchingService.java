package com.lostark.raidchecker.service;

import com.lostark.raidchecker.dto.PartyCompletionRequest;
import com.lostark.raidchecker.entity.Character;
import com.lostark.raidchecker.entity.PartyCompletion;
import com.lostark.raidchecker.entity.Raid;
import com.lostark.raidchecker.repository.CharacterRepository;
import com.lostark.raidchecker.repository.PartyCompletionRepository;
import com.lostark.raidchecker.repository.RaidRepository;
import com.lostark.raidchecker.util.WeeklyResetUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Collections;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PartyMatchingService {
  private final CharacterRepository characterRepository;
  private final RaidRepository raidRepository;
  private final WeeklyCompletionService completionService;
  private final PartyCompletionRepository partyCompletionRepository;

  // 서폿 클래스 목록
  private static final Set<String> SUPPORT_CLASSES = Set.of(
          "바드", "홀리나이트", "도화가", "발키리"
  );

  /**
   * 클래스가 서폿인지 확인
   */
  public boolean isSupport(String className) {
    return SUPPORT_CLASSES.contains(className);
  }

  /**
   * 특정 레이드의 미완료 캐릭터 목록 조회
   */
  public Map<String, Object> getAvailableCharactersForRaid(Long raidId) {
    Raid raid = raidRepository.findById(raidId)
            .orElseThrow(() -> new RuntimeException("레이드를 찾을 수 없습니다."));

    List<Character> allCharacters = characterRepository.findAll();

    // 이번 주 완료된 파티의 캐릭터 ID 수집
    List<PartyCompletion> completedParties = getCompletedParties(raidId);
    Set<Long> completedCharacterIds = completedParties.stream()
            .flatMap(party -> {
              String[] ids = party.getCharacterIds().split(",");
              return Arrays.stream(ids).map(Long::parseLong);
            })
            .collect(Collectors.toSet());

    // 미완료 캐릭터 필터링
    List<Character> availableCharacters = allCharacters.stream()
            .filter(character -> {
              // 파티 완료된 캐릭터 제외
              if (completedCharacterIds.contains(character.getId())) {
                return false;
              }

              // 아이템 레벨 체크
              if (character.getItemLevel() < raid.getRequiredItemLevel()) {
                return false;
              }

              return true;
            })
            .sorted(Comparator
                    .comparing(Character::getGoldPriority, Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparing(Character::getItemLevel, Comparator.reverseOrder()))
            .collect(Collectors.toList());

    // 딜러/서폿 분류
    List<Character> dealers = availableCharacters.stream()
            .filter(c -> !isSupport(c.getClassName()))
            .collect(Collectors.toList());

    List<Character> supports = availableCharacters.stream()
            .filter(c -> isSupport(c.getClassName()))
            .collect(Collectors.toList());

    Map<String, Object> result = new HashMap<>();
    result.put("raid", raid);
    result.put("dealers", dealers);
    result.put("supports", supports);
    result.put("totalAvailable", availableCharacters.size());

    return result;
  }

  /**
   * 레이드 타입별 파티 추천
   */
  public List<Map<String, Object>> recommendParty(Long raidId) {
    Raid raid = raidRepository.findById(raidId)
            .orElseThrow(() -> new RuntimeException("레이드를 찾을 수 없습니다."));

    if ("카제로스".equals(raid.getPartyType())) {
      return recommendKazerosParty(raidId);
    } else if ("그림자".equals(raid.getPartyType())) {
      return recommendShadowParty(raidId);
    }

    throw new RuntimeException("알 수 없는 파티 타입입니다: " + raid.getPartyType());
  }

  /**
   * 카제로스 레이드 파티 추천 (8인: 딜러 6, 서폿 2)
   * 같은 유저의 캐릭터는 같은 파티에 포함 안 함
   */
  private List<Map<String, Object>> recommendKazerosParty(Long raidId) {
    Map<String, Object> available = getAvailableCharactersForRaid(raidId);

    @SuppressWarnings("unchecked")
    List<Character> dealers = (List<Character>) available.get("dealers");
    @SuppressWarnings("unchecked")
    List<Character> supports = (List<Character>) available.get("supports");

    // ✅ 랜덤 섞기
    Collections.shuffle(dealers);
    Collections.shuffle(supports);

    List<Map<String, Object>> recommendations = new ArrayList<>();

    Set<Long> usedUserIds = new HashSet<>();
    List<Character> selectedDealers = new ArrayList<>();
    List<Character> selectedSupports = new ArrayList<>();

    // 딜러 6명 선택 (같은 유저 제외)
    for (Character dealer : dealers) {
      if (selectedDealers.size() >= 6) break;
      if (!usedUserIds.contains(dealer.getUser().getId())) {
        selectedDealers.add(dealer);
        usedUserIds.add(dealer.getUser().getId());
      }
    }

    // 서폿 2명 선택 (같은 유저 제외)
    for (Character support : supports) {
      if (selectedSupports.size() >= 2) break;
      if (!usedUserIds.contains(support.getUser().getId())) {
        selectedSupports.add(support);
        usedUserIds.add(support.getUser().getId());
      }
    }

    // 파티 구성 가능 여부 확인
    if (selectedDealers.size() >= 6 && selectedSupports.size() >= 2) {
      Map<String, Object> party = new HashMap<>();
      party.put("dealers", selectedDealers);
      party.put("supports", selectedSupports);
      party.put("type", "카제로스");
      party.put("partySize", 8);
      party.put("dealerCount", 6);
      party.put("supportCount", 2);
      recommendations.add(party);
    }

    return recommendations;
  }

  /**
   * 그림자 레이드 파티 추천 (4인: 딜러 3, 서폿 1)
   * 같은 유저의 캐릭터는 같은 파티에 포함 안 함
   */
  private List<Map<String, Object>> recommendShadowParty(Long raidId) {
    Map<String, Object> available = getAvailableCharactersForRaid(raidId);

    @SuppressWarnings("unchecked")
    List<Character> dealers = (List<Character>) available.get("dealers");
    @SuppressWarnings("unchecked")
    List<Character> supports = (List<Character>) available.get("supports");

    // ✅ 랜덤 섞기
    Collections.shuffle(dealers);
    Collections.shuffle(supports);

    List<Map<String, Object>> recommendations = new ArrayList<>();
    Set<Long> globalUsedUserIds = new HashSet<>();

    while (true) {
      Set<Long> partyUserIds = new HashSet<>();
      List<Character> selectedDealers = new ArrayList<>();
      List<Character> selectedSupports = new ArrayList<>();

      // 딜러 3명 선택
      for (Character dealer : dealers) {
        if (selectedDealers.size() >= 3) break;
        Long userId = dealer.getUser().getId();
        if (!globalUsedUserIds.contains(userId) && !partyUserIds.contains(userId)) {
          selectedDealers.add(dealer);
          partyUserIds.add(userId);
        }
      }

      // 서폿 1명 선택
      for (Character support : supports) {
        if (selectedSupports.size() >= 1) break;
        Long userId = support.getUser().getId();
        if (!globalUsedUserIds.contains(userId) && !partyUserIds.contains(userId)) {
          selectedSupports.add(support);
          partyUserIds.add(userId);
        }
      }

      // 파티 구성 불가능하면 종료
      if (selectedDealers.size() < 3 || selectedSupports.size() < 1) {
        break;
      }

      // 파티 추가
      Map<String, Object> party = new HashMap<>();
      party.put("dealers", selectedDealers);
      party.put("supports", selectedSupports);
      party.put("type", "그림자");
      party.put("partySize", 4);
      party.put("dealerCount", 3);
      party.put("supportCount", 1);
      recommendations.add(party);

      // 사용된 유저 ID 추가
      globalUsedUserIds.addAll(partyUserIds);
    }

    return recommendations;
  }

  /**
   * 모든 레이드의 파티 추천 조회
   */
  public Map<String, List<Map<String, Object>>> getAllPartyRecommendations() {
    List<Raid> allRaids = raidRepository.findAll();
    Map<String, List<Map<String, Object>>> result = new HashMap<>();

    for (Raid raid : allRaids) {
      try {
        List<Map<String, Object>> recommendations = recommendParty(raid.getId());
        if (!recommendations.isEmpty()) {
          result.put(raid.getRaidName(), recommendations);
        }
      } catch (Exception e) {
        // 파티를 구성할 수 없는 레이드는 건너뛰기
      }
    }

    return result;
  }

  /**
   * 파티 완료 처리 (파티 매칭 전용)
   * ✅ 같은 레이드 그룹의 모든 난이도에 대해 PartyCompletion 생성
   */
  @Transactional
  public void completeParty(PartyCompletionRequest request) {
    Raid raid = raidRepository.findById(request.getRaidId())
            .orElseThrow(() -> new RuntimeException("레이드를 찾을 수 없습니다."));

    // characterIds를 문자열로 변환
    String characterIdsStr = request.getCharacterIds().stream()
            .map(String::valueOf)
            .collect(Collectors.joining(","));

    // ✅ 같은 레이드 그룹의 모든 난이도 가져오기
    String raidGroup = raid.getRaidGroup();
    List<Raid> sameGroupRaids = raidRepository.findByRaidGroup(raidGroup);

    System.out.println("=== 공격대 완료 처리 ===");
    System.out.println("선택한 레이드: " + raid.getRaidName() + " - " + raid.getDifficulty());
    System.out.println("레이드 그룹: " + raidGroup);
    System.out.println("같은 그룹의 레이드 개수: " + sameGroupRaids.size());

    // ✅ 같은 그룹의 모든 난이도에 대해 PartyCompletion 생성
    for (Raid groupRaid : sameGroupRaids) {
      // ✅ 실제로 선택한 난이도인지 확인
      boolean isActualCompleted = groupRaid.getId().equals(raid.getId());

      System.out.println("  - PartyCompletion 생성: " + groupRaid.getRaidName() + " - "
              + groupRaid.getDifficulty() + " (실제완료: " + isActualCompleted + ")");

      PartyCompletion completion = new PartyCompletion();
      completion.setRaid(groupRaid);
      completion.setCharacterIds(characterIdsStr);
      completion.setExtraReward(
              request.getExtraReward() != null ? request.getExtraReward() : false
      );
      completion.setActualCompleted(isActualCompleted);  // ✅ 실제 완료 여부 설정
      partyCompletionRepository.save(completion);
    }

    System.out.println("=== 완료 처리 완료 ===");
  }

  /**
   * 특정 레이드의 이번 주 완료된 파티 목록
   */
  public List<PartyCompletion> getCompletedParties(Long raidId) {
    LocalDateTime weekStart = WeeklyResetUtil.getCurrentWeekStart();
    return partyCompletionRepository.findByRaid_IdAndWeekStart(raidId, weekStart);
  }


  /**
   * 완료된 파티 목록 (캐릭터 정보 포함)
   * ✅ 실제로 완료한 난이도만 반환
   */
  public List<Map<String, Object>> getCompletedPartiesWithCharacters(Long raidId) {
    List<PartyCompletion> completedParties = getCompletedParties(raidId);

    // ✅ actualCompleted=true인 것만 필터링
    return completedParties.stream()
            .filter(party -> party.getActualCompleted() != null && party.getActualCompleted())
            .map(party -> {
              // characterIds 문자열을 Long 리스트로 변환
              List<Long> charIds = Arrays.stream(party.getCharacterIds().split(","))
                      .map(Long::parseLong)
                      .collect(Collectors.toList());

              // 캐릭터 정보 조회
              List<Character> characters = characterRepository.findAllById(charIds);

              Map<String, Object> result = new HashMap<>();
              result.put("id", party.getId());
              result.put("completedAt", party.getCompletedAt());
              result.put("characters", characters);
              result.put("extraReward", party.getExtraReward());

              return result;
            }).collect(Collectors.toList());
  }

  /**
   * 파티 완료 취소
   */
  @Transactional
  public void cancelPartyCompletion(Long partyCompletionId) {
    PartyCompletion partyCompletion = partyCompletionRepository.findById(partyCompletionId)
            .orElseThrow(() -> new RuntimeException("완료 기록을 찾을 수 없습니다."));

    partyCompletionRepository.delete(partyCompletion);
  }
}