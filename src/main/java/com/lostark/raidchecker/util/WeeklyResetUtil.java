package com.lostark.raidchecker.util;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.TemporalAdjusters;

public class WeeklyResetUtil {

  private static final ZoneId KOREA_ZONE = ZoneId.of("Asia/Seoul");

  /**
   * ✅ 이번 주 수요일 오전 6시 반환 (한국 시간 기준)
   * LocalDateTime이 아닌 ZonedDateTime으로 처리 후 LocalDateTime 변환
   */
  public static LocalDateTime getCurrentWeekStart() {
    // ✅ ZonedDateTime으로 한국 시간 가져오기
    ZonedDateTime now = ZonedDateTime.now(KOREA_ZONE);

    // 이번 주 수요일 찾기
    ZonedDateTime wednesday = now.with(TemporalAdjusters.previousOrSame(DayOfWeek.WEDNESDAY))
            .withHour(6)
            .withMinute(0)
            .withSecond(0)
            .withNano(0);

    // 현재 시각이 수요일 오전 6시 이전이면 지난주 수요일
    if (now.isBefore(wednesday)) {
      wednesday = wednesday.minusWeeks(1);
    }

    // ✅ LocalDateTime으로 변환 (시간대 정보 제거)
    return wednesday.toLocalDateTime();
  }

  /**
   * ✅ 현재 한국 시간 반환
   */
  public static LocalDateTime getCurrentKoreanTime() {
    // ✅ ZonedDateTime으로 변환 후 LocalDateTime 반환
    return ZonedDateTime.now(KOREA_ZONE).toLocalDateTime();
  }

  /**
   * 다음 초기화까지 남은 시간 (문자열)
   */
  public static String getTimeUntilReset() {
    ZonedDateTime now = ZonedDateTime.now(KOREA_ZONE);
    ZonedDateTime nextReset = ZonedDateTime.of(getCurrentWeekStart(), KOREA_ZONE).plusWeeks(1);

    long days = java.time.Duration.between(now, nextReset).toDays();
    long hours = java.time.Duration.between(now, nextReset).toHours() % 24;
    long minutes = java.time.Duration.between(now, nextReset).toMinutes() % 60;

    return String.format("%d일 %d시간 %d분", days, hours, minutes);
  }
}