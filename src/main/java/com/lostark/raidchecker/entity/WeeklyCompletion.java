package com.lostark.raidchecker.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "weekly_completions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"character", "raid", "gateCompletions"})
public class WeeklyCompletion {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})  // ✅ 추가
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "character_id", nullable = false)
  private Character character;

  @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "gates"})  // ✅ 추가
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "raid_id", nullable = false)
  private Raid raid;

  @Column(nullable = false)
  private LocalDateTime weekStart;

  @Column(nullable = false)
  private Boolean completed = false;

  @Column(nullable = false)
  private Integer earnedGold = 0;

  @OneToMany(mappedBy = "weeklyCompletion", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)  // ✅ EAGER 추가
  private List<GateCompletion> gateCompletions = new ArrayList<>();

  // 골드 계산 메서드
  public void calculateEarnedGold(int currentGoldCount) {
    // 이미 3회 획득했으면 골드 0
    if (currentGoldCount >= 3) {
      this.earnedGold = 0;
      return;
    }

    // 정상 골드 계산
    int totalGold = raid.getRewardGold();
    for (GateCompletion gc : gateCompletions) {
      if (gc.getExtraReward()) {
        totalGold -= gc.getRaidGate().getExtraCost();
      }
    }
    this.earnedGold = totalGold;
  }
}