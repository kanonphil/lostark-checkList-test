package com.lostark.raidchecker.util;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;

public class WeeklyResetUtil {

  // 이번 주 수요일 오전 6시 반환 (LocalDateTime으로 변경)
  public static LocalDateTime getCurrentWeekStart() {
    LocalDate today = LocalDate.now();
    LocalDate wednesday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.WEDNESDAY));

    // 현재 시각이 수요일 오전 6시 이전이면 지난주 수요일
    if (today.equals(wednesday) && LocalTime.now().isBefore(LocalTime.of(6, 0))) {
      wednesday = wednesday.minusWeeks(1);
    } else if (today.isBefore(wednesday)) {
      wednesday = wednesday.minusWeeks(1);
    }

    return LocalDateTime.of(wednesday, LocalTime.of(6, 0)); // ✅ LocalDateTime으로 반환
  }

  // 다음 초기화까지 남은 시간 (문자열)
  public static String getTimeUntilReset() {
    LocalDateTime now = LocalDateTime.now();
    LocalDateTime nextReset = getCurrentWeekStart().plusWeeks(1);

    long days = java.time.Duration.between(now, nextReset).toDays();
    long hours = java.time.Duration.between(now, nextReset).toHours() % 24;
    long minutes = java.time.Duration.between(now, nextReset).toMinutes() % 60;

    return String.format("%d일 %d시간 %d분", days, hours, minutes);
  }
}