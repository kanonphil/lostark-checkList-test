package com.lostark.raidchecker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "gate_completions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"weeklyCompletion", "raidGate"})
public class GateCompletion {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "weekly_completion_id", nullable = false)
  private WeeklyCompletion weeklyCompletion;

  @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "raid"})  // ✅ 추가
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "raid_gate_id", nullable = false)
  private RaidGate raidGate;

  @Column(nullable = false)
  private Boolean completed = false;

  @Column(nullable = false)
  private Boolean extraReward = false;

  @Column(nullable = false)
  private Integer earnedGold = 0;
}