package com.lostark.raidchecker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;

@Getter
@Setter
@ToString(exclude = {"recruitment", "character"})
@Entity
@Table(name = "raid_participants",
        uniqueConstraints = @UniqueConstraint(columnNames = {"recruitment_id", "character_id"})
)
public class RaidParticipant {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "participant_id")
  private Long participantId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "recruitment_id", nullable = false)
  @JsonIgnore
  private RaidRecruitment recruitment;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "character_id", nullable = false)
  @JsonIgnore
  private Character character;

  @Column(name = "character_name", nullable = false, length = 50)
  private String characterName;

  @Column(name = "class_name", nullable = false, length = 20)
  private String className;

  @Column(name = "item_level", nullable = false)
  private Double itemLevel;

  @Column(name = "role", nullable = false, length = 10)
  private String role;

  @Column(name = "joined_at")
  private LocalDateTime joinedAt;

  @PrePersist
  protected void onCreate() {
    joinedAt = LocalDateTime.now();
  }
}
