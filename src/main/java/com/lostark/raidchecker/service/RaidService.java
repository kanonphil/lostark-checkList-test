package com.lostark.raidchecker.service;

import com.lostark.raidchecker.entity.Raid;
import com.lostark.raidchecker.repository.RaidRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RaidService {
  private final RaidRepository raidRepository;

  // 모든 레이드 조회
  public List<Raid> getAllRaids() {
    return raidRepository.findAll();
  }

  // ID로 레이드 조회
  public Raid getRaidById(Long id) {
    return raidRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("레이드를 찾을 수 없습니다."));
  }

  // 아이템 레벨에 맞는 레이드 조회
  public List<Raid> getAvailableRaids(Double itemLevel) {
    return raidRepository.findByRequiredItemLevelLessThanEqualOrderByOrderIndexAsc(itemLevel);
  }
}
