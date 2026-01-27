package com.lostark.raidchecker.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "raid_recruitments")
public class RaidRecruitment {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "recruitment_id")
  private Long recruitmentId;

  @Column(name = "raid_id", nullable = false)
  private Long raidId;

  @Column(name = "raid_name", nullable = false, length = 50)
  private String raidName;

  @Column(name = "required_item_level", nullable = false)
  private Double requiredItemLevel;

  @Column(name = "raid_date_time", nullable = false)
  private LocalDateTime raidDateTime;

  @Column(name = "creator_user_id", nullable = false)
  private Long creatorUserId;

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  @Column(name = "status", length = 20)
  private String status = "RECRUITING";

  @Column(name = "max_party_size")
  private Integer maxPartySize = 4;

  @Column(name = "description", columnDefinition = "TEXT")
  private String description;

  @OneToMany(mappedBy = "recruitment", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<RaidParticipant> participants;

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
    if (status == null) {
      status = "RECRUITING";
    }
    if (maxPartySize == null) {
      maxPartySize = 4;
    }
  }

  @Transient
  public Integer getCurrentParticipants() {
    return participants != null ? participants.size() : 0;
  }
}
