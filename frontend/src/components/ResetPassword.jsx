import { useState } from 'react';
import { userAPI } from '../services/api';
import { useTheme, getTheme } from '../hooks/useTheme';

function ResetPassword({ onClose }) {
  const [step, setStep] = useState(1); // 1: 사용자명, 2: 보안질문, 3: 새 비밀번호
  const [username, setUsername] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  // Step 1: 사용자명 입력 → 보안 질문 조회
  const handleCheckUsername = async () => {
    if (!username.trim()) {
      alert('사용자명을 입력하세요');
      return;
    }

    try {
      setLoading(true);
      const response = await userAPI.getSecurityQuestion(username);
      setSecurityQuestion(response.data.securityQuestion);
      setStep(2);
    } catch (error) {
      alert(error.response?.data || '사용자를 찾을 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: 보안 답변 → 새 비밀번호 입력
  const handleCheckAnswer = () => {
    if (!securityAnswer.trim()) {
      alert('보안 답변을 입력하세요');
      return;
    }
    setStep(3);
  };

  // Step 3: 새 비밀번호 설정
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
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
      await userAPI.resetPassword(username, securityAnswer, newPassword);
      alert('비밀번호가 재설정되었습니다!\n새 비밀번호로 로그인하세요.');
      onClose();
    } catch (error) {
      alert(error.response?.data || '비밀번호 재설정 실패');
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
          비밀번호 찾기
        </h2>

        {/* Step 1: 사용자명 입력 */}
        {step === 1 && (
          <>
            <p style={{ 
              color: theme.text.secondary, 
              fontSize: '14px',
              marginBottom: '15px',
            }}>
              사용자명을 입력하세요
            </p>
            <input
              type="text"
              placeholder="사용자명"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheckUsername()}
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
                onClick={handleCheckUsername}
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
                {loading ? '확인 중...' : '다음'}
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
          </>
        )}

        {/* Step 2: 보안 질문 답변 */}
        {step === 2 && (
          <>
            <div style={{
              padding: '15px',
              backgroundColor: theme.bg.secondary,
              borderRadius: '8px',
              marginBottom: '15px',
            }}>
              <p style={{ 
                margin: '0',
                color: theme.text.secondary, 
                fontSize: '14px',
                marginBottom: '5px',
              }}>
                보안 질문:
              </p>
              <p style={{ 
                margin: '0',
                color: theme.text.primary, 
                fontSize: '16px',
                fontWeight: 'bold',
              }}>
                {securityQuestion}
              </p>
            </div>

            <input
              type="text"
              placeholder="보안 답변"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheckAnswer()}
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
                onClick={() => setStep(1)}
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
                이전
              </button>
              <button
                onClick={handleCheckAnswer}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                다음
              </button>
            </div>
          </>
        )}

        {/* Step 3: 새 비밀번호 설정 */}
        {step === 3 && (
          <>
            <p style={{ 
              color: theme.text.secondary, 
              fontSize: '14px',
              marginBottom: '15px',
            }}>
              새 비밀번호를 입력하세요
            </p>

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
              onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
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
                onClick={() => setStep(2)}
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
                이전
              </button>
              <button
                onClick={handleResetPassword}
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
                {loading ? '재설정 중...' : '완료'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;