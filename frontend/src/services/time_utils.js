// 시간 포맷팅 유틸리티

/**
 * ISO 문자열 또는 Date 객체를 한국 시간으로 포맷
 * @param {string|Date} dateValue - ISO 문자열 또는 Date 객체
 * @returns {string} 포맷된 시간 문자열 (예: "2026. 1. 19. 오후 3:43:42")
 */
export const formatKoreanDateTime = (dateValue) => {
  if (!dateValue) return '';
  
  const date = new Date(dateValue);
  
  // 한국 시간대로 변환
  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

/**
 * 간단한 날짜/시간 포맷 (초 제외)
 * @param {string|Date} dateValue
 * @returns {string} 포맷된 시간 문자열 (예: "2026. 1. 19. 오후 3:43")
 */
export const formatKoreanDateTimeShort = (dateValue) => {
  if (!dateValue) return '';
  
  const date = new Date(dateValue);
  
  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};