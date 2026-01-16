package com.lostark.raidchecker.repository;

import com.lostark.raidchecker.entity.GateCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GateCompletionRepository extends JpaRepository<GateCompletion, Long> {

  List<GateCompletion> findByWeeklyCompletionId(Long weeklyCompletionId);
}