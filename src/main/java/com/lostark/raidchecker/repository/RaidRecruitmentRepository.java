package com.lostark.raidchecker.repository;

import com.lostark.raidchecker.entity.RaidRecruitment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RaidRecruitmentRepository extends JpaRepository<RaidRecruitment, Long> {

  List<RaidRecruitment> findByRaidDateTimeBetweenOrderByRaidDateTime(
          LocalDateTime startDate,
          LocalDateTime endDate
  );

  List<RaidRecruitment> findByCreatorUserId(Long userId);

  List<RaidRecruitment> findByStatus(String status);
}
