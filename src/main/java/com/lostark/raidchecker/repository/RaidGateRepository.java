package com.lostark.raidchecker.repository;

import com.lostark.raidchecker.entity.RaidGate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RaidGateRepository extends JpaRepository<RaidGate, Long> {
  List<RaidGate> findByRaidIdOrderByGateNumberAsc(Long raidId);
}
