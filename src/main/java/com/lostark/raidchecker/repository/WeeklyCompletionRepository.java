package com.lostark.raidchecker.repository;

import com.lostark.raidchecker.entity.Character;
import com.lostark.raidchecker.entity.Raid;
import com.lostark.raidchecker.entity.WeeklyCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WeeklyCompletionRepository extends JpaRepository<WeeklyCompletion, Long> {
  List<WeeklyCompletion> findByCharacterAndWeekStart(Character character, LocalDateTime weekStart);

  boolean existsByCharacterAndRaidAndWeekStart(Character character, Raid raid, LocalDateTime weekStart);

  List<WeeklyCompletion> findByCharacterIdAndWeekStart(Long characterId, LocalDateTime weekStart);

  @Query("SELECT wc FROM WeeklyCompletion wc WHERE wc.character.id = :characterId AND wc.weekStart = (SELECT MAX(w.weekStart) FROM WeeklyCompletion w WHERE w.character.id = :characterId)")
  Optional<WeeklyCompletion> findByCharacterIdAndCurrentWeek(@Param("characterId") Long characterId);
}