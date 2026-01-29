import { useState, useEffect, useCallback } from 'react';
import { recruitmentAPI } from '../services/api';
import RecruitmentCreateModal from './RecruitmentCreateModal';
import RecruitmentDetailModal from './RecruitmentDetailModal';
import { useTheme, getTheme } from '../hooks/useTheme';

function Calendar({ characters }) {
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [recruitments, setRecruitments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedRecruitment, setSelectedRecruitment] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadRecruitments = useCallback(async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    try {
      const startDate = new Date(firstDay);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(lastDay);
      endDate.setHours(23, 59, 59, 999);
      
      const response = await recruitmentAPI.getByDateRange(startDate, endDate);
      setRecruitments(response.data || []);
    } catch (error) {
      console.error('모집 로드 실패:', error);
    }
  }, [currentDate]);

  useEffect(() => {
    loadRecruitments();
  }, [loadRecruitments]);

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startingDayOfWeek = firstDay.getDay();
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getRecruitmentsForDate = (date) => {
    if (!date) return [];
    
    return recruitments.filter(r => {
      const raidDate = new Date(r.raidDateTime);
      return raidDate.getDate() === date.getDate() &&
             raidDate.getMonth() === date.getMonth() &&
             raidDate.getFullYear() === date.getFullYear();
    });
  };

  const handleDateClick = (date) => {
    if (!date) return;
    
    // ✅ 새로운 Date 객체 생성 (타임존 문제 방지)
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    
    console.log('선택한 날짜:', localDate);  // 디버깅
    
    setSelectedDate(localDate);
    setShowCreateModal(true);
  };

  // 레이드 이름 짧게 포맷
  const formatRecruitmentName = (recruitment) => {
    // "카제로스 2막 카제로스 2막 (노말)" -> "카제로스 2막 (노말)"
    const raidName = recruitment.raidName.split('(')[0].trim();
    const difficulty = recruitment.raidName.match(/\(([^)]+)\)/)?.[1] || '';
    
    return `${raidName}${difficulty ? ` (${difficulty})` : ''} (${recruitment.currentParticipants}/${recruitment.maxPartySize})`;
  };

  const days = getDaysInMonth();
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div style={{ 
      padding: isMobile ? '10px' : '20px',
      backgroundColor: theme.bg.primary,
      minHeight: '100vh',
      maxWidth: '100%',
      overflow: 'hidden',
    }}>
      {/* 월 네비게이션 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        maxWidth: '100%',
      }}>
        <button
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
          style={{
            padding: isMobile ? '6px 12px' : '8px 15px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: isMobile ? '13px' : '14px',
          }}
        >
          ◀ 이전
        </button>
        
        <h2 style={{ 
          color: theme.text.primary,
          fontSize: isMobile ? '18px' : '22px',
          margin: 0,
        }}>
          {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
        </h2>
        
        <button
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
          style={{
            padding: isMobile ? '6px 12px' : '8px 15px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: isMobile ? '13px' : '14px',
          }}
        >
          다음 ▶
        </button>
      </div>

      {/* 요일 헤더 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '5px',
        marginBottom: '5px',
        maxWidth: '100px',
      }}>
        {weekDays.map(day => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontWeight: 'bold',
              padding: isMobile ? '8px' : '10px',
              color: theme.text.primary,
              fontSize: isMobile ? '13px' : '14px',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 - 고정 크기 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '5px',
        gridAutoRows: isMobile ? '100px' : '120px',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
      }}>
        {days.map((date, index) => {
          const dateRecruitments = getRecruitmentsForDate(date);
          
          return (
            <div
              key={index}
              onClick={() => handleDateClick(date)}
              style={{
                padding: isMobile ? '5px' : '8px',
                backgroundColor: date ? theme.card.bg : 'transparent',
                borderRadius: '5px',
                cursor: date ? 'pointer' : 'default',
                border: date ? `1px solid ${theme.border?.primary || theme.card.border}` : 'none',
                overflow: 'hidden',  // 넘치는 내용 숨김
                position: 'relative',
                minWidth: 0,
                maxWidth: '100%',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              {date && (
                <>
                  <div style={{
                    fontWeight: 'bold',
                    marginBottom: '5px',
                    color: theme.text.primary,
                    fontSize: isMobile ? '13px' : '14px',
                  }}>
                    {date.getDate()}
                  </div>
                  
                  {/* 모집 표시 - 전광판 애니메이션 */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                    overflow: 'hidden',
                    width: '100%',
                  }}>
                    {dateRecruitments.map(recruitment => (
                      <RecruitmentBadge
                        key={recruitment.recruitmentId}
                        recruitment={recruitment}
                        formatName={formatRecruitmentName}
                        theme={theme}
                        isMobile={isMobile}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecruitment(recruitment);
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* 모집 생성 모달 */}
      {showCreateModal && (
        <RecruitmentCreateModal
          selectedDate={selectedDate}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedDate(null);
          }}
          onCreated={() => {
            loadRecruitments();
          }}
        />
      )}

      {/* 모집 상세 모달 */}
      {selectedRecruitment && (
        <RecruitmentDetailModal
          recruitment={selectedRecruitment}
          characters={characters}
          onClose={() => setSelectedRecruitment(null)}
          onUpdate={() => {
            loadRecruitments();
          }}
        />
      )}
    </div>
  );
}

// ✅ 전광판 애니메이션 컴포넌트
function RecruitmentBadge({ recruitment, formatName, theme, isMobile, onClick }) {
  const text = formatName(recruitment);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  useEffect(() => {
    // 텍스트가 너무 길면 애니메이션 활성화
    const testElement = document.createElement('span');
    testElement.style.visibility = 'hidden';
    testElement.style.position = 'absolute';
    testElement.style.fontSize = isMobile ? '10px' : '12px';
    testElement.textContent = text;
    document.body.appendChild(testElement);
    
    const textWidth = testElement.offsetWidth;
    document.body.removeChild(testElement);
    
    // 칸 너비보다 길면 애니메이션
    setShouldAnimate(textWidth > (isMobile ? 70 : 100));
  }, [text, isMobile]);

  return (
    <div
      onClick={onClick}
      style={{
        fontSize: isMobile ? '10px' : '12px',
        padding: isMobile ? '3px 4px' : '4px 6px',
        backgroundColor: recruitment.status === 'FULL' ? '#f44336' : '#4CAF50',
        color: 'white',
        borderRadius: '3px',
        cursor: 'pointer',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
      title={text}
    >
      <span
        style={{
          display: 'inline-block',
          animation: shouldAnimate ? 'marquee 10s linear infinite' : 'none',
        }}
      >
        {text}
      </span>
      
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}

export default Calendar;