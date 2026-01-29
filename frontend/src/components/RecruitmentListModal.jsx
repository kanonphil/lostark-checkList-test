// src/components/RecruitmentListModal.jsx
import { useTheme, getTheme } from '../hooks/useTheme';

function RecruitmentListModal({ date, recruitments, onClose, onSelectRecruitment }) {
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  const formatDateTime = (dateTime) => {
    const d = new Date(dateTime);
    return d.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: theme.card.bg,
          borderRadius: '10px',
          padding: '30px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ 
          marginBottom: '20px',
          color: theme.text.primary 
        }}>
          {date.getMonth() + 1}월 {date.getDate()}일 모집 목록
        </h2>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          {recruitments.map(recruitment => (
            <div
              key={recruitment.recruitmentId}
              onClick={() => {
                onSelectRecruitment(recruitment);
                onClose();
              }}
              style={{
                padding: '15px',
                backgroundColor: theme.bg.secondary,
                borderRadius: '5px',
                cursor: 'pointer',
                border: `1px solid ${theme.border.primary}`,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.bg.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.bg.secondary;
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '5px',
              }}>
                <span style={{
                  fontWeight: 'bold',
                  color: theme.text.primary,
                  fontSize: '16px',
                }}>
                  {recruitment.raidName}
                </span>
                <span style={{
                  padding: '3px 8px',
                  backgroundColor: recruitment.status === 'FULL' ? '#f44336' : '#4CAF50',
                  color: 'white',
                  borderRadius: '3px',
                  fontSize: '12px',
                }}>
                  {recruitment.currentParticipants}/{recruitment.maxPartySize}
                </span>
              </div>
              <div style={{
                fontSize: '14px',
                color: theme.text.secondary,
                textAlign: 'left',
              }}>
                {formatDateTime(recruitment.raidDateTime)} | 레벨 {recruitment.requiredItemLevel}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: '20px',
            width: '100%',
            padding: '10px',
            backgroundColor: theme.bg.secondary,
            color: theme.text.primary,
            border: `1px solid ${theme.border.primary}`,
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          닫기
        </button>
      </div>
    </div>
  );
}

export default RecruitmentListModal;