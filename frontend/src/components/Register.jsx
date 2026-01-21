import { useState } from 'react';
import { userAPI } from '../services/api';
import { useTheme, getTheme } from '../hooks/useTheme';

function Register({ onBack, onRegisterSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  // 보안 질문 목록
  const securityQuestions = [
    '나의 출신 초등학교는?',
    '나의 첫 반려동물 이름은?',
    '어머니의 고향은?',
    '내가 태어난 도시는?',
    '가장 좋아하는 음식은?',
    '첫 직장의 이름은?',
  ];

  const handleRegister = async () => {
    if (!username || !password || !confirmPassword) {
      alert('모든 필드를 입력하세요');
      return;
    }

    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다');
      return;
    }

    if (password.length < 4) {
      alert('비밀번호는 4자 이상이어야 합니다');
      return;
    }

    if (!securityQuestion) {
      alert('보안 질문을 선택하세요');
      return;
    }

    if (!securityAnswer) {
      alert('보안 답변을 입력하세요');
      return;
    }

    try {
      setLoading(true);
      await userAPI.register(username, password, securityQuestion, securityAnswer);
      alert('회원가입 성공!');
      onRegisterSuccess();
    } catch (error) {
      alert(error.response?.data || '회원가입 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: theme.bg.primary,
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: theme.card.bg,
        padding: '40px',
        borderRadius: '10px',
        width: '100%',
        maxWidth: '400px',
        border: `1px solid ${theme.card.border}`,
      }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '30px', 
          color: theme.text.primary 
        }}>
          회원가입
        </h2>

        <input
          type="text"
          placeholder="사용자명"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '10px',
            border: `1px solid ${theme.border.primary}`,
            borderRadius: '5px',
            fontSize: '16px',
            backgroundColor: theme.bg.secondary,
            color: theme.text.primary,
          }}
        />

        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '10px',
            border: `1px solid ${theme.border.primary}`,
            borderRadius: '5px',
            fontSize: '16px',
            backgroundColor: theme.bg.secondary,
            color: theme.text.primary,
          }}
        />

        <input
          type="password"
          placeholder="비밀번호 확인"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '20px',
            border: `1px solid ${theme.border.primary}`,
            borderRadius: '5px',
            fontSize: '16px',
            backgroundColor: theme.bg.secondary,
            color: theme.text.primary,
          }}
        />

        <div style={{
          padding: '15px',
          backgroundColor: theme.bg.secondary,
          borderRadius: '8px',
          marginBottom: '20px',
          border: `1px solid ${theme.border.primary}`,
        }}>
          <h3 style={{ 
            margin: '0 0 10px 0', 
            fontSize: '14px', 
            color: theme.text.secondary 
          }}>
            🔒 비밀번호 찾기용 보안 질문
          </h3>
          
          <select
            value={securityQuestion}
            onChange={(e) => setSecurityQuestion(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '10px',
              border: `1px solid ${theme.border.primary}`,
              borderRadius: '5px',
              fontSize: '14px',
              backgroundColor: theme.bg.primary,
              color: theme.text.primary,
            }}
          >
            <option value="">보안 질문을 선택하세요</option>
            {securityQuestions.map((q, i) => (
              <option key={i} value={q}>{q}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="보안 답변"
            value={securityAnswer}
            onChange={(e) => setSecurityAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${theme.border.primary}`,
              borderRadius: '5px',
              fontSize: '14px',
              backgroundColor: theme.bg.primary,
              color: theme.text.primary,
            }}
          />
        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '10px',
          }}
        >
          {loading ? '가입 중...' : '회원가입'}
        </button>

        <button
          onClick={onBack}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'transparent',
            color: theme.text.secondary,
            border: `1px solid ${theme.border.primary}`,
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          로그인으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default Register;