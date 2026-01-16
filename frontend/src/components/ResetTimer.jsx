import { useState, useEffect } from "react";

function ResetTimer() {
  const [resetInfo, setResetInfo] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    // 즉시 한 번 실행
    calculateTimeLeft();

    // 그 다음 1초마다 업데이트
    const interval = setInterval(() => {
      calculateTimeLeft();
    }, 1000);

    return () => clearInterval(interval);
  }, []);


  const calculateTimeLeft = () => {
    // 다음 수요일 오전 6시 계산
    const now = new Date();
    const nextReset = new Date(now);

    // 오늘이 수요일(3)이고 6시 이전이면 오늘, 아니면 다음 수요일
    const dayOfWeek = now.getDay();
    const hour = now.getHours();

    if (dayOfWeek === 3 && hour < 6) {
      // 오늘 6시
      nextReset.setHours(6, 0, 0, 0);
    } else {
      // 다음 수요일
      const daysUntilWednesday = (3 - dayOfWeek + 7) % 7 || 7;
      nextReset.setDate(now.getDate() + daysUntilWednesday);
      nextReset.setHours(6, 0, 0, 0);
    }

    const diff = nextReset - now;

    if (diff <= 0) {
      setTimeLeft('초기화 완료! 새로고침하세요')
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeLeft(`${days}일 ${hours}시 ${minutes}분 ${seconds}초`);
  };

  return (
    <div style={{
      padding: '15px 20px',
      backgroundColor: '#fff3cd',
      borderLeft: '4px solid #ffc107',
      marginBottom: '20px',
      borderRadius: '5px',
    }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{textAlign: 'left'}}>
          <strong style={{fontSize: '16px'}}>⏰ 주간 초기화까지</strong>
          <p style={{margin: '5px 0 0 0', color: '#666', fontSize: '14px'}}>
            매주 수요일 오전 6시에 초기화됩니다
          </p>
        </div>
        <div style={{textAlign: 'right'}}>
          <p style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#ff6b6b',
          }}>
            {timeLeft || '계산 중...'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResetTimer;