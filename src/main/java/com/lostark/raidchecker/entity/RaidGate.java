package com.lostark.raidchecker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "raid_gates")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = "raid")
public class RaidGate {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "raid_id", nullable = false)
  private Raid raid;

  @Column(nullable = false)
  private Integer gateNumber;

  @Column(nullable = false)
  private Integer rewardGold;

  @Column(nullable = false)
  private Integer extraCost;

  // ✅ 편의 생성자 추가 (id 제외)
  public RaidGate(Raid raid, Integer gateNumber, Integer rewardGold, Integer extraCost) {
    this.raid = raid;
    this.gateNumber = gateNumber;
    this.rewardGold = rewardGold;
    this.extraCost = extraCost;
  }
}