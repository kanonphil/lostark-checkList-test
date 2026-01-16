import { useState } from 'react';
import { userAPI } from '../services/api';

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
      backgroundColor: '#f5f5f5',
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
      }}>
        <h1 style={{textAlign: 'center', marginBottom: '30px'}}>
          로스트아크 레이드 체크리스트
        </h1>
        
        <h2 style={{textAlign: 'center', marginBottom: '30px', color: '#666'}}>
          {isRegister ? '회원가입' : '로그인'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
              아이디
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디 입력"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{marginBottom: '30px'}}>
            <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
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
              padding: '10px',
              fontSize: '14px',
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