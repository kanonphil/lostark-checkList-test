package com.lostark.raidchecker.controller;

import com.lostark.raidchecker.entity.Raid;
import com.lostark.raidchecker.service.RaidService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/raids")
@RequiredArgsConstructor
public class RaidController {

  private final RaidService raidService;

  // 모든 레이드 조회
  @GetMapping
  public List<Raid> getAllRaids() {
    return raidService.getAllRaids();
  }

  // 특정 레이드 조회
  @GetMapping("/{id}")
  public ResponseEntity<Raid> getRaidById(@PathVariable Long id) {
    Raid raid = raidService.getRaidById(id);
    return ResponseEntity.ok(raid);
  }

  // 아이템 레벨에 맞는 레이드 조회
  @GetMapping("/available")
  public List<Raid> getAvailableRaids(@RequestParam Double itemLevel) {
    return raidService.getAvailableRaids(itemLevel);
  }
}