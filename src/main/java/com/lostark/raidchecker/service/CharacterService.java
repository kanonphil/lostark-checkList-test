package com.lostark.raidchecker.service;

import com.lostark.raidchecker.dto.LostArkCharacterResponse;
import com.lostark.raidchecker.entity.Character;
import com.lostark.raidchecker.entity.User;
import com.lostark.raidchecker.repository.CharacterRepository;
import com.lostark.raidchecker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CharacterService {
  private final CharacterRepository characterRepository;
  private final LostArkApiService lostArkApiService;
  private final UserRepository userRepository;

  // 모든 캐릭터 조회
  public List<Character> getAllCharacters() {
    return characterRepository.findAll();
  }

  // ID로 캐릭터 조회
  public Character getCharacterById(Long id) {
    return characterRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("캐릭터를 찾을 수 없습니다."));
  }

  // 캐릭터명으로 조회
  public Character getCharacterByName(String characterName) {
    return characterRepository.findByCharacterName(characterName)
            .orElseThrow(() -> new RuntimeException("캐릭터를 찾을 수 없습니다: " + characterName));
  }

  // 캐릭터 삭제
  @Transactional
  public void deleteCharacter(Long id) {
    Character character = characterRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("캐릭터를 찾을 수 없습니다."));
    characterRepository.delete(character);
  }

  // 특정 유저의 캐릭터 조회
  public List<Character> getCharactersByUserId(Long userId) {
    return characterRepository.findByUser_Id(userId);
  }

  /**
   * 로스트아크 API로 캐릭터 정보 가져와서 등록
   */
  @Transactional
  public Character importCharacterFromApi(Long userId, String characterName) {
    // 유저 조회
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

    // 이미 존재하는지 확인
    if (characterRepository.existsByCharacterName(characterName)) {
      throw new RuntimeException("이미 등록된 캐릭터입니다.");
    }

    // API 호출
    LostArkCharacterResponse response = lostArkApiService.getCharacterInfo(characterName);

    if (response == null) {
      throw new RuntimeException("캐릭터 정보를 가져올 수 없습니다.");
    }

    // ✅ 직접 response에서 데이터 가져오기 (ArmoryProfile 없음)
    Character character = new Character();
    character.setUser(user);
    character.setCharacterName(response.getCharacterName());
    character.setServerName(response.getServerName());
    character.setClassName(response.getCharacterClassName());

    String itemLevel = response.getItemAvgLevel().replace(",", "");
    character.setItemLevel(Double.parseDouble(itemLevel));
    character.setGuildName(response.getGuildName());

    // 자동 우선순위 부여 (현재 캐릭터 수 + 1)
    int currentCharacterCount = characterRepository.countByUser_Id(userId);
    character.setGoldPriority(currentCharacterCount + 1);

    return characterRepository.save(character);
  }

  /**
   * 캐릭터 정보 동기화 (최신 정보로 업데이트)
   */
  @Transactional
  public Character syncCharacter(Long id) {
    Character character = characterRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("캐릭터를 찾을 수 없습니다."));

    // API 호출
    LostArkCharacterResponse response = lostArkApiService.getCharacterInfo(character.getCharacterName());

    if (response == null) {
      throw new RuntimeException("캐릭터 정보를 가져올 수 없습니다.");
    }

    // ✅ 직접 response에서 데이터 가져오기
    character.setServerName(response.getServerName());
    character.setClassName(response.getCharacterClassName());

    String itemLevel = response.getItemAvgLevel().replace(",", "");
    character.setItemLevel(Double.parseDouble(itemLevel));
    character.setGuildName(response.getGuildName());

    return characterRepository.save(character);
  }

  @Transactional
  public Character updateGoldPriority(Long id, Integer goldPriority) {
    Character character = characterRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("캐릭터를 찾을 수 없습니다."));

    if (goldPriority < 1 || goldPriority > 10) {
      throw new RuntimeException("goldPriority는 1~10 사이여야 합니다.");
    }

    character.setGoldPriority(goldPriority);
    return characterRepository.save(character);
  }
}