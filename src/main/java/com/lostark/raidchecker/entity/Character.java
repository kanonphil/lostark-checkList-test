package com.lostark.raidchecker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "characters")
@Getter
@Setter
public class Character {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String characterName;

  private String serverName;
  private String className;
  private Double itemLevel;
  private String guildName;

  @Column(nullable = false)
  private Integer goldPriority = 6;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id")
  @JsonIgnore
  private User user;

  @Transient
  public Long getUserId() {
    return user != null ? user.getId() : null;
  }

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
  }
}