import { useState, useEffect } from 'react';
import { masterAPI } from '../services/api';
import { useTheme, getTheme } from '../hooks/useTheme';

function MasterAdmin({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [partyCompletions, setPartyCompletions] = useState([]);
  const [showPartyList, setShowPartyList] = useState(false);
  const [loading, setLoading] = useState(true);

  const { isDark } = useTheme();
  const theme = getTheme(isDark);

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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        masterAPI.getAllUsers(currentUser.id),
        masterAPI.getStats(currentUser.id)
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      alert(error.response?.data || '데이터 로딩 실패');
    } finally {
      setLoading(false);
    }
  };

  // ✅ 공격대 완료 목록 로드
  const loadPartyCompletions = async () => {
    try {
      const response = await masterAPI.getAllPartyCompletions(currentUser.id);
      setPartyCompletions(response.data);
      setShowPartyList(true);
    } catch (error) {
      alert(error.response?.data || '공격대 목록 로딩 실패');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`정말 "${username}" 계정을 삭제하시겠습니까?\n\n모든 데이터가 삭제됩니다.`)) {
      return;
    }

    try {
      await masterAPI.deleteUser(userId, currentUser.id);
      alert('사용자가 삭제되었습니다.');
      loadData();
    } catch (error) {
      alert(error.response?.data || '삭제 실패');
    }
  };

  const handleForceChangePassword = async (userId, username) => {
    const newPassword = prompt(`"${username}" 계정의 새 비밀번호를 입력하세요:\n\n(4자 이상)`);
    
    if (!newPassword) return;

    if (newPassword.length < 4) {
      alert('비밀번호는 4자 이상이어야 합니다');
      return;
    }

    if (!window.confirm(`"${username}" 계정의 비밀번호를 변경하시겠습니까?\n\n새 비밀번호: ${newPassword}`)) {
      return;
    }

    try {
      await masterAPI.forceChangePassword(userId, currentUser.id, newPassword);
      alert('비밀번호가 변경되었습니다!');
    } catch (error) {
      alert(error.response?.data || '비밀번호 변경 실패');
    }
  };

  const handleResetWeekly = async () => {
    if (!window.confirm('전체 주간 데이터를 초기화하시겠습니까?\n\n모든 사용자의 완료 기록이 삭제됩니다.')) {
      return;
    }

    try {
      await masterAPI.resetWeeklyData(currentUser.id);
      alert('주간 데이터가 초기화되었습니다.');
      loadData();
    } catch (error) {
      alert(error.response?.data || '초기화 실패');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        color: theme.text.primary,
      }}>
        로딩 중...
      </div>
    );
  }

  // ✅ 공격대 목록 모달
  if (showPartyList) {
    return (
      <div style={{
        padding: isMobile ? '10px' : '20px',
        backgroundColor: theme.bg.primary,
        minHeight: '100vh',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h2 style={{
            color: theme.text.primary,
            fontSize: isMobile ? '18px' : '22px',
            margin: 0,
          }}>
            🎉 공격대 완료 목록
          </h2>
          <button
            onClick={() => setShowPartyList(false)}
            style={{
              padding: isMobile ? '6px 12px' : '8px 16px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px',
            }}
          >
            닫기
          </button>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '8px' : '10px',
        }}>
          {partyCompletions.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: theme.text.secondary,
              backgroundColor: theme.card.bg,
              borderRadius: '8px',
              border: `1px solid ${theme.card.border}`,
            }}>
              완료된 공격대가 없습니다
            </div>
          ) : (
            partyCompletions.map((pc) => (
              <div
                key={pc.id}
                style={{
                  border: `1px solid ${theme.card.border}`,
                  padding: isMobile ? '12px' : '15px',
                  borderRadius: '8px',
                  backgroundColor: theme.card.bg,
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '10px',
                }}>
                  <h3 style={{
                    margin: 0,
                    color: theme.text.primary,
                    fontSize: isMobile ? '16px' : '18px',
                  }}>
                    {pc.raidName}
                    {pc.extraReward && ' 💎'}
                  </h3>
                  <span style={{
                    fontSize: isMobile ? '11px' : '12px',
                    color: theme.text.tertiary,
                  }}>
                    {new Date(pc.completedAt).toLocaleString('ko-KR')}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}>
                  {pc.characterNames.map((name, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: theme.bg.secondary,
                        color: theme.text.primary,
                        borderRadius: '4px',
                        fontSize: isMobile ? '12px' : '13px',
                        border: `1px solid ${theme.border.primary}`,
                      }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: isMobile ? '10px' : '20px',
      backgroundColor: theme.bg.primary,
      minHeight: '100vh',
    }}>
      <h2 style={{
        color: theme.text.primary,
        fontSize: isMobile ? '20px' : '24px',
        marginBottom: '20px',
      }}>
        🔧 Master 관리자 페이지
      </h2>

      {/* 통계 대시보드 */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: isMobile ? '10px' : '15px',
          marginBottom: isMobile ? '15px' : '20px',
        }}>
          <div style={{
            padding: isMobile ? '12px' : '15px',
            backgroundColor: theme.card.bg,
            borderRadius: '8px',
            textAlign: 'center',
            border: `1px solid ${theme.card.border}`,
          }}>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              color: theme.text.secondary, 
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: 'normal',
            }}>
              총 사용자
            </h3>
            <p style={{ 
              margin: 0, 
              fontSize: isMobile ? '20px' : '28px', 
              fontWeight: 'bold', 
              color: '#4CAF50' 
            }}>
              {stats.totalUsers}
            </p>
          </div>
          <div style={{
            padding: isMobile ? '12px' : '15px',
            backgroundColor: theme.card.bg,
            borderRadius: '8px',
            textAlign: 'center',
            border: `1px solid ${theme.card.border}`,
          }}>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              color: theme.text.secondary, 
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: 'normal',
            }}>
              총 캐릭터
            </h3>
            <p style={{ 
              margin: 0, 
              fontSize: isMobile ? '20px' : '28px', 
              fontWeight: 'bold', 
              color: '#2196F3' 
            }}>
              {stats.totalCharacters}
            </p>
          </div>
          <div style={{
            padding: isMobile ? '12px' : '15px',
            backgroundColor: theme.card.bg,
            borderRadius: '8px',
            textAlign: 'center',
            border: `1px solid ${theme.card.border}`,
          }}>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              color: theme.text.secondary, 
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: 'normal',
            }}>
              주간 완료
            </h3>
            <p style={{ 
              margin: 0, 
              fontSize: isMobile ? '20px' : '28px', 
              fontWeight: 'bold', 
              color: '#FF9800' 
            }}>
              {stats.totalWeeklyCompletions}
            </p>
          </div>
          <div style={{
            padding: isMobile ? '12px' : '15px',
            backgroundColor: theme.card.bg,
            borderRadius: '8px',
            textAlign: 'center',
            border: `1px solid ${theme.card.border}`,
          }}>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              color: theme.text.secondary, 
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: 'normal',
            }}>
              관문 완료
            </h3>
            <p style={{ 
              margin: 0, 
              fontSize: isMobile ? '20px' : '28px', 
              fontWeight: 'bold', 
              color: '#9C27B0' 
            }}>
              {stats.totalGateCompletions}
            </p>
          </div>
        </div>
      )}

      {/* 관리 버튼 */}
      <div style={{
        marginBottom: isMobile ? '15px' : '20px',
        display: 'flex',
        gap: isMobile ? '8px' : '10px',
        flexDirection: isMobile ? 'column' : 'row',
      }}>
        <button
          onClick={handleResetWeekly}
          style={{
            padding: isMobile ? '8px 16px' : '10px 20px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: isMobile ? '13px' : '14px',
            fontWeight: 'bold',
            flex: isMobile ? 1 : 0,
          }}
        >
          🔄 전체 주간 데이터 초기화
        </button>

        {/* ✅ 공격대 목록 버튼 */}
        <button
          onClick={loadPartyCompletions}
          style={{
            padding: isMobile ? '8px 16px' : '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: isMobile ? '13px' : '14px',
            fontWeight: 'bold',
            flex: isMobile ? 1 : 0,
          }}
        >
          🎉 공격대 완료 목록
        </button>
      </div>

      {/* 사용자 목록 */}
      <h3 style={{
        color: theme.text.primary,
        fontSize: isMobile ? '16px' : '18px',
        marginBottom: '10px',
      }}>
        사용자 목록 ({users.length}명)
      </h3>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '8px' : '10px',
      }}>
        {users.map((user) => (
          <div
            key={user.id}
            style={{
              border: `1px solid ${theme.card.border}`,
              padding: isMobile ? '10px' : '15px',
              borderRadius: '8px',
              backgroundColor: theme.card.bg,
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: isMobile ? '10px' : '20px',
            }}
          >
            {/* 사용자 정보 */}
            <div style={{ 
              flex: isMobile ? 'none' : 1,
              marginBottom: isMobile ? '8px' : '0',
            }}>
              <h4 style={{ 
                margin: '0 0 5px 0', 
                color: theme.text.primary,
                fontSize: isMobile ? '15px' : '17px',
                textAlign: 'left',
              }}>
                {user.username}
                {user.username === 'master' && ' 👑'}
              </h4>
              <p style={{ 
                margin: '3px 0', 
                color: theme.text.secondary, 
                fontSize: isMobile ? '12px' : '13px',
                textAlign: 'left',
              }}>
                캐릭터: {user.characterCount}개 | 주간 골드: {user.weeklyGold.toLocaleString()}G
              </p>
              <p style={{ 
                margin: '3px 0', 
                color: theme.text.tertiary, 
                fontSize: isMobile ? '11px' : '12px',
                textAlign: 'left',
              }}>
                가입일: {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* 버튼들 */}
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'row' : 'row',
              gap: isMobile ? '6px' : '8px',
              width: isMobile ? '100%' : 'auto',
              flexShrink: 0,
            }}>
              <button
                onClick={() => handleForceChangePassword(user.id, user.username)}
                style={{
                  flex: isMobile ? 1 : 0,
                  padding: isMobile ? '7px 14px' : '8px 16px',
                  backgroundColor: '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '12px' : '13px',
                  whiteSpace: 'nowrap',
                }}
              >
                🔑 비밀번호
              </button>

              {user.username !== 'master' && (
                <button
                  onClick={() => handleDeleteUser(user.id, user.username)}
                  style={{
                    flex: isMobile ? 1 : 0,
                    padding: isMobile ? '7px 14px' : '8px 16px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: isMobile ? '12px' : '13px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MasterAdmin;