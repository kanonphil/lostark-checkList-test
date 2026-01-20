import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { getTheme, useTheme } from '../hooks/useTheme';

function Settings({ currentUser }) {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const { isDark } = useTheme()
  const theme = getTheme(isDark)

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [])

  useEffect(() => {
    loadUserInfo();
  }, [currentUser]);

  const loadUserInfo = async () => {
    try {
      const response = await userAPI.getUser(currentUser.id);
      setUserInfo(response.data);
    } catch (error) {
      console.error('유저 정보 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: isMobile ? '30px 20px' : '40px',
        backgroundColor: theme.bg.primary,
        minHeight: '100vh',
        color: theme.text.secondary,
    }}>
        로딩 중...
      </div>
    )
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: isMobile ? '10px' : '20px',
      backgroundColor: theme.bg.primary,
      minHeight: '100vh',
    }}>
      <h2 style={{
        marginBottom: isMobile ? '20px' : '30px',
        color: theme.text.primary,
        fontSize: isMobile ? '20px' : '24px',
      }}>
        내 정보
      </h2>

      <div style={{
        backgroundColor: theme.card.bg,
        padding: isMobile ? '20px' : '30px',
        borderRadius: '10px',
        boxShadow: theme.card.shadow,
        border: `1px solid ${theme.card.border}`,
      }}>
        <div style={{marginBottom: '20px'}}>
          <label style={{
            display: 'block',
            marginBottom: '10px',
            fontWeight: 'bold',
            fontSize: isMobile ? '14px' : '16px',
            color: theme.text.primary,
          }}>
            아이디
          </label>
          <div style={{
            padding: isMobile ? '10px' : '12px',
            backgroundColor: theme.bg.secondary,
            borderRadius: '5px',
            fontSize: isMobile ? '14px' : '16px',
            color: theme.text.primary,
          }}>
            {userInfo?.username}
          </div>
        </div>

        <div style={{marginBottom: '20px'}}>
          <label style={{
            display: 'block',
            marginBottom: '10px',
            fontWeight: 'bold',
            fontSize: isMobile ? '14px' : '16px',
            color: theme.text.primary,
          }}>
            가입일
          </label>
          <div style={{
            padding: isMobile ? '10px' : '12px',
            backgroundColor: theme.bg.secondary,
            borderRadius: '5px',
            fontSize: isMobile ? '14px' : '16px',
            color: theme.text.primary,
          }}>
            {userInfo?.createdAt ? new Date(userInfo.createdAt).toLocaleDateString('ko-KR') : '-'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;