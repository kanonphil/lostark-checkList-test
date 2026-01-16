package com.lostark.raidchecker.repository;

import com.lostark.raidchecker.entity.Raid;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RaidRepository extends JpaRepository<Raid, Long> {
  // Double 타입으로 변경
  List<Raid> findByRequiredItemLevelLessThanEqualOrderByOrderIndexAsc(Double itemLevel);

  // ✅ 추가: orderIndex 순서로 전체 조회
  List<Raid> findAllByOrderByOrderIndexAsc();
}