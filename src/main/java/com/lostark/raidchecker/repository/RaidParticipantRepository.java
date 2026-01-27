package com.lostark.raidchecker.repository;

import com.lostark.raidchecker.entity.RaidParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RaidParticipantRepository extends JpaRepository<RaidParticipant, Long> {

  List<RaidParticipant> findByRecruitment_RecruitmentId(Long recruitmentId);

  Optional<RaidParticipant> findByRecruitment_RecruitmentIdAndCharacter_Id(
          Long recruitmentId,
          Long characterId
  );

  @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END " +
          "FROM RaidParticipant p " +
          "WHERE p.recruitment.recruitmentId = :recruitmentId " +
          "AND p.character.user.id = :userId")  // user.id로 수정
  boolean existsByRecruitmentIdAndUserId(
          @Param("recruitmentId") Long recruitmentId,
          @Param("userId") Long userId
  );

  void deleteByRecruitment_RecruitmentIdAndCharacter_Id(
          Long recruitmentId,
          Long characterId
  );
}