import { useEffect, useState } from "react"

/**
 * 시스템 다크모드 감지 훅
 */
export const useTheme = () => {
  // 초기값을 useState의 lazy initialization으로 설정
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  useEffect(() => {
    // 다크모드 변경 감지
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setIsDark(e.matches)

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return { isDark }
}

/**
 * 테마별 색상 정의
 */
export const getTheme = (isDark) => ({
  // 배경색
  bg: {
    primary: isDark ? '#121212' : '#ffffff',
    secondary: isDark ? '#1e1e1e' : '#f5f5f5',
    tertiary: isDark ? '#2d2d2d' : '#e8f5e9',
  },
  
  // 텍스트
  text: {
    primary: isDark ? '#ffffff' : '#000000',
    secondary: isDark ? '#b3b3b3' : '#666666',
    tertiary: isDark ? '#808080' : '#999999',
  },
  
  // 테두리
  border: {
    primary: isDark ? '#3d3d3d' : '#ddd',
    secondary: isDark ? '#4d4d4d' : '#ccc',
  },
  
  // 카드
  card: {
    bg: isDark ? '#1e1e1e' : '#ffffff',
    border: isDark ? '#3d3d3d' : '#ddd',
    shadow: isDark ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.1)',
  },
  
  // 액센트 컬러 (그대로 유지)
  accent: {
    green: '#4CAF50',
    red: '#f44336',
    blue: '#2196F3',
    orange: '#FF9800',
  },
  
  // 역할별 색상
  role: {
    dealer: {
      bg: isDark ? '#3d1f1f' : '#ffebee',
      bgSelected: isDark ? '#5d2f2f' : '#ffcdd2',
      border: '#f44336',
      text: '#f44336',
    },
    support: {
      bg: isDark ? '#1a2d3d' : '#e3f2fd',
      bgSelected: isDark ? '#2a3d5d' : '#bbdefb',
      border: '#2196F3',
      text: '#2196F3',
    },
  },
  
  // 상태별 배경
  completed: {
    bg: isDark ? '#1b2e1b' : '#e8f5e9',
    border: '#4CAF50',
  },
  manual: {
    bg: isDark ? '#3d2d1a' : '#ffffff',
    border: '#FF9800',
  },
})