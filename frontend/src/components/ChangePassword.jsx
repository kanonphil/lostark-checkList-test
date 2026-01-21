import { useState } from 'react';
import { userAPI } from '../services/api';
import { useTheme, getTheme } from '../hooks/useTheme';

function ChangePassword({ currentUser, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('모든 필드를 입력하세요');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다');
      return;
    }

    if (newPassword.length < 4) {
      alert('비밀번호는 4자 이상이어야 합니다');
      return;
    }

    try {
      setLoading(true);
      await userAPI.changePassword(currentUser.id, currentPassword, newPassword);
      alert('비밀번호가 변경되었습니다!');
      onClose();
    } catch (error) {
      alert(error.response?.data || '비밀번호 변경 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: theme.card.bg,
        padding: '30px',
        borderRadius: '10px',
        width: '90%',
        maxWidth: '400px',
        border: `1px solid ${theme.card.border}`,
      }}>
        <h2 style={{ 
          margin: '0 0 20px 0', 
          color: theme.text.primary 
        }}>
          비밀번호 변경
        </h2>

        <input
          type="password"
          placeholder="현재 비밀번호"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            border: `1px solid ${theme.border.primary}`,
            borderRadius: '5px',
            backgroundColor: theme.bg.secondary,
            color: theme.text.primary,
          }}
        />

        <input
          type="password"
          placeholder="새 비밀번호"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            border: `1px solid ${theme.border.primary}`,
            borderRadius: '5px',
            backgroundColor: theme.bg.secondary,
            color: theme.text.primary,
          }}
        />

        <input
          type="password"
          placeholder="새 비밀번호 확인"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '20px',
            border: `1px solid ${theme.border.primary}`,
            borderRadius: '5px',
            backgroundColor: theme.bg.secondary,
            color: theme.text.primary,
          }}
        />

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: loading ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '변경 중...' : '변경'}
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;