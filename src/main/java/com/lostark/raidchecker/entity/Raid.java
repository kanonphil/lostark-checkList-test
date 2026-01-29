package com.lostark.raidchecker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "raids")
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = "gates")
public class Raid {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String raidName;  // "카제로스 2막", "카제로스 3막" 등

  @Column(nullable = false)
  private String difficulty;  // "노말" 또는 "하드"

  @Column(nullable = false)
  private Double requiredItemLevel;  // 필요 아이템 레벨

  @Column(name = "party_type")
  private String partyType;

  @Column(nullable = false)
  private Integer orderIndex; // 정렬 순서

  // 골드 관련 추가
  @Column(nullable = false)
  private Integer rewardGold; // 기본 보상 골드

  @Column(nullable = false, length = 100)
  private String raidGroup;  // ✅ 추가: 예) "카제로스 2막", "카제로스 3막"

  // 관문 정보는 별도 테이블로
  @OneToMany(mappedBy = "raid", cascade = CascadeType.ALL, orphanRemoval = true)
  @JsonIgnore
  private List<RaidGate> gates = new ArrayList<>();

  public Raid(String raidName, String difficulty, Double requiredItemLevel, Integer orderIndex, Integer rewardGold) {
    this.raidName = raidName;
    this.difficulty = difficulty;
    this.requiredItemLevel = requiredItemLevel;
    this.orderIndex = orderIndex;
    this.rewardGold = rewardGold;
    this.raidGroup = raidName;
  }

  // 편의 메서드: 관문 추가
  public void addGate(Integer gateNumber, Integer rewardGold, Integer extraCost) {
    RaidGate gate = new RaidGate(this, gateNumber, rewardGold, extraCost);
    gates.add(gate);
  }
}
