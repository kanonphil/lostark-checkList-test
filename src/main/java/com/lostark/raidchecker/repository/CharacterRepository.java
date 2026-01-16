package com.lostark.raidchecker.repository;

import com.lostark.raidchecker.entity.Character;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CharacterRepository extends JpaRepository<Character, Long> {
  Optional<Character> findByCharacterName(String characterName);
  boolean existsByCharacterName(String characterName);
  List<Character> findByUser_Id(Long userId);
}