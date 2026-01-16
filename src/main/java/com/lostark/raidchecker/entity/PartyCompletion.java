package com.lostark.raidchecker.entity;

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
  private Boolean extraReward;

  @Column(nullable = false)
  private LocalDateTime completedAt;

  @Column(nullable = false)
  private LocalDateTime weekStart;

  @PrePersist
  public void prePersist() {
    this.completedAt = LocalDateTime.now();
    this.weekStart = calculateWeekStart();
  }

  private LocalDateTime calculateWeekStart() {
    LocalDateTime now = LocalDateTime.now();
    int dayOfWeek = now.getDayOfWeek().getValue();
    int daysToSubtract = (dayOfWeek + 2) % 7;
    return now.minusDays(daysToSubtract).toLocalDate().atStartOfDay();
  }
}
