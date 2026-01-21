package com.lostark.raidchecker.repository;

import com.lostark.raidchecker.entity.PartyCompletion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface PartyCompletionRepository extends JpaRepository<PartyCompletion, Long> {
  List<PartyCompletion> findByWeekStart(LocalDateTime weekStart);
  List<PartyCompletion> findByRaid_IdAndWeekStart(Long raidId, LocalDateTime weekStart);
  void deleteByWeekStartBefore(LocalDateTime weekStart);
  /**
   * 전체 공격대 완료 목록 (최신순)
   */
  List<PartyCompletion> findAllByOrderByCompletedAtDesc();
}
