package com.lostark.raidchecker.controller;

import com.lostark.raidchecker.entity.Character;
import com.lostark.raidchecker.service.CharacterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/characters")
@RequiredArgsConstructor
public class CharacterController {

  private final CharacterService characterService;

  // ✅ 모든 캐릭터 조회 (파라미터 제거)
  /*@GetMapping
  public List<Character> getAllCharacters() {
    return characterService.getAllCharacters();
  }*/

  @GetMapping("/{id}")
  public ResponseEntity<Character> getCharacterById(@PathVariable Long id) {
    Character character = characterService.getCharacterById(id);
    return ResponseEntity.ok(character);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteCharacter(@PathVariable Long id) {
    characterService.deleteCharacter(id);
    return ResponseEntity.ok().build();
  }

  // 특정 유저의 캐릭터만 조회
  @GetMapping
  public List<Character> getCharactersByUserId(@RequestParam Long userId) {
    return characterService.getCharactersByUserId(userId);
  }

  // 길드 전체 캐릭터 조회 (파티 매칭용)
  @GetMapping("/all")
  public List<Character> getAllCharacters() {
    return characterService.getAllCharacters();
  }

  // ✅ 캐릭터 추가 (userId 제거)
  @PostMapping("/import")
  public ResponseEntity<?> importCharacter(
          @RequestParam Long userId,
          @RequestParam String characterName) {
    try {
      Character character = characterService.importCharacterFromApi(userId, characterName);
      return ResponseEntity.ok(character);
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  @PostMapping("/{id}/sync")
  public ResponseEntity<?> syncCharacter(@PathVariable Long id) {
    try {
      Character synced = characterService.syncCharacter(id);
      return ResponseEntity.ok(synced);
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }

  @PutMapping("/{id}/gold-priority")
  public ResponseEntity<?> updateGoldPriority(
          @PathVariable Long id,
          @RequestBody Map<String, Integer> request) {
    try {
      Character character = characterService.updateGoldPriority(id, request.get("goldPriority"));
      return ResponseEntity.ok(character);
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(e.getMessage());
    }
  }
}