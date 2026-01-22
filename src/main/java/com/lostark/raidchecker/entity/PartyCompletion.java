package com.lostark.raidchecker.entity;

import com.lostark.raidchecker.util.WeeklyResetUtil;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "party_completions")
@Getter
@Setter
public class PartyCompletion {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne
  @JoinColumn(name = "raid_id", nullable = false)
  private Raid raid;

  @Column(nullable = false)
  private String characterIds;

  @Column(nullable = false)
  private Boolean extraReward = false;

  @Column(nullable = false)
  private LocalDateTime completedAt;

  // 실제로 완료한 난이도인지 여부
  @Column(nullable = false)
  private Boolean actualCompleted = true;  // 기본값 true

  @Column(nullable = false)
  private LocalDateTime weekStart;

  @PrePersist
  public void prePersist() {
    // WeeklyResetUtil의 한국 시간 사용
    this.completedAt = WeeklyResetUtil.getCurrentKoreanTime();
    this.weekStart = WeeklyResetUtil.getCurrentWeekStart();
  }
}