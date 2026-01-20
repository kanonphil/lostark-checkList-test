import { useEffect, useState } from 'react';
import { userAPI } from '../services/api';
import { useTheme, getTheme } from '../hooks/useTheme';

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [isMobile, setIsMobile] = useState(false)

  const { isDark } = useTheme()
  const theme = getTheme(isDark)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      alert('아이디와 비밀번호를 입력하세요');
      return;
    }

    try {
      setLoading(true);
      
      if (isRegister) {
        // 회원가입
        await userAPI.register(username, password);
        alert('회원가입 완료! 로그인해주세요');
        setIsRegister(false);
        setPassword('');
      } else {
        // 로그인
        const response = await userAPI.login(username, password);
        localStorage.setItem('userId', response.data.id);
        localStorage.setItem('username', response.data.username);
        onLogin(response.data);
      }
    } catch (error) {
      alert(error.response?.data || (isRegister ? '회원가입 실패' : '로그인 실패'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.bg.primary,
      padding: isMobile ? '20px' : 0,
    }}>
      <div style={{
        backgroundColor: theme.card.bg,
        padding: isMobile ? '30px 20px' : '40px',
        borderRadius: '10px',
        boxShadow: theme.card.shadow,
        width: '100%',
        maxWidth: isMobile ? '90%' : '400px',
      }}>
        <h1 style={{
          textAlign: 'center', 
          marginBottom: isMobile ? '20px' : '30px',
          color: theme.text.primary,
          fontSize: isMobile ? '20px' : '24px',
        }}>
          로스트아크 레이드 체크리스트
        </h1>
        
        <h2 style={{
          textAlign: 'center', 
          marginBottom: isMobile ? '20px' : '30px', 
          color: theme.text.secondary,
          fontSize: isMobile ? '18px' : '20px',
        }}>
          {isRegister ? '회원가입' : '로그인'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: '20px'}}>
            <label style={{
              display: 'block', 
              marginBottom: '5px', 
              fontWeight: 'bold',
              color: theme.text.primary,
              fontSize: isMobile ? '14px' : '16px',
            }}>
              아이디
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디 입력"
              style={{
                width: '100%',
                padding: isMobile ? '8px' : '10px',
                fontSize: isMobile ? '14px' : '16px',
                border: `1px solid ${theme.border.primary}`,
                borderRadius: '5px',
                boxSizing: 'border-box',
                backgroundColor: theme.bg.secondary,
                color: theme.text.primary
              }}
            />
          </div>

          <div style={{marginBottom: isMobile ? '20px' : '30px'}}>
            <label style={{
              display: 'block', 
              marginBottom: '5px', 
              fontWeight: 'bold',
              color: theme.text.primary,
              fontSize: isMobile ? '14px' : '16px',
            }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              style={{
                width: '100%',
                padding: isMobile ? '8px' : '10px',
                fontSize: isMobile ? '14px' : '16px',
                border: `1px solid ${theme.border.primary}`,
                borderRadius: '5px',
                boxSizing: 'border-box',
                backgroundColor: theme.bg.secondary,
                color: theme.text.primary
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: isMobile ? '10px' : '12px',
              fontSize: isMobile ? '14px' : '16px',
              fontWeight: 'bold',
              backgroundColor: loading ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '15px',
            }}
          >
            {loading ? '처리 중...' : (isRegister ? '회원가입' : '로그인')}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setPassword('');
            }}
            style={{
              width: '100%',
              padding: isMobile ? '8px' : '10px',
              fontSize: isMobile ? '13px' : '14px',
              backgroundColor: 'transparent',
              color: '#2196F3',
              border: '1px solid #2196F3',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            {isRegister ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;