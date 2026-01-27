import { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadRecruitments();
  }, [currentDate]);

  const loadRecruitments = async () => {
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
  };

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
    setSelectedDate(date);
    setShowCreateModal(true);
  };

  const days = getDaysInMonth();
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div style={{ 
      padding: isMobile ? '10px' : '20px',
      backgroundColor: theme.bg.primary,
      minHeight: '100vh',
    }}>
      {/* 월 네비게이션 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <button
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
          style={{
            padding: isMobile ? '6px 12px' : '8px 15px',
            backgroundColor: theme.button?.bg || '#4CAF50',
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
            backgroundColor: theme.button?.bg || '#4CAF50',
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

      {/* 날짜 그리드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '5px',
      }}>
        {days.map((date, index) => {
          const dateRecruitments = getRecruitmentsForDate(date);
          
          return (
            <div
              key={index}
              onClick={() => handleDateClick(date)}
              style={{
                minHeight: isMobile ? '80px' : '100px',
                padding: isMobile ? '5px' : '10px',
                backgroundColor: date ? theme.card.bg : 'transparent',
                borderRadius: '5px',
                cursor: date ? 'pointer' : 'default',
                border: date ? `1px solid ${theme.border?.primary || theme.card.border}` : 'none',
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
                  
                  {/* 모집 표시 */}
                  {dateRecruitments.map(recruitment => (
                    <div
                      key={recruitment.recruitmentId}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRecruitment(recruitment);
                      }}
                      style={{
                        fontSize: isMobile ? '10px' : '12px',
                        padding: isMobile ? '3px 4px' : '4px 6px',
                        backgroundColor: recruitment.status === 'FULL' ? '#f44336' : '#4CAF50',
                        color: 'white',
                        borderRadius: '3px',
                        marginBottom: '3px',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={`${recruitment.raidName} (${recruitment.currentParticipants}/${recruitment.maxPartySize})`}
                    >
                      {recruitment.raidName} ({recruitment.currentParticipants}/{recruitment.maxPartySize})
                    </div>
                  ))}
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
          onClose={() => setSelectedRecruitment(null)}
          onUpdate={() => {
            loadRecruitments();
          }}
        />
      )}
    </div>
  );
}

export default Calendar;