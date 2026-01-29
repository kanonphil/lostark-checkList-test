import { useState, useEffect } from 'react';
import { recruitmentAPI, characterAPI } from '../services/api';
import { useTheme, getTheme } from '../hooks/useTheme';

function RecruitmentDetailModal({ recruitment, onClose, onUpdate }) {
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  const [detail, setDetail] = useState(null);
  const [myCharacters, setMyCharacters] = useState([]);
  const [selectedCharId, setSelectedCharId] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const userId = parseInt(localStorage.getItem('userId'));

  useEffect(() => {
    if (recruitment?.recruitmentId) {  // ✅ null 체크 추가
      loadDetail();
      loadMyCharacters();
    }
  }, [recruitment?.recruitmentId]);  // ✅ optional chaining 추가

  const loadDetail = async () => {
    if (!recruitment?.recruitmentId) {  // ✅ null 체크 추가
      setLoading(false);
      return;
    }
    
    try {
      const response = await recruitmentAPI.getDetail(recruitment.recruitmentId);
      setDetail(response.data);
    } catch (error) {
      console.error('모집 상세 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyCharacters = async () => {
    try {
      const userId = parseInt(localStorage.getItem('userId'));
      console.log('userId:', userId);
      
      const response = await characterAPI.getAll(userId);
      console.log('캐릭터 응답:', response.data);
      
      setMyCharacters(response.data || []);
    } catch (error) {
      console.error('캐릭터 조회 실패:', error);
    }
  };

  const handleCharacterSelect = (e) => {
    const charId = e.target.value;
    setSelectedCharId(charId);

    const char = myCharacters.find(c => c.id == charId);
    if (!char) {
      setSelectedRole('');
      return;
    }

    if (char.className === '바드' || char.className === '홀리나이트') {
      setSelectedRole('SUPPORT');
    } else if (char.className !== '발키리') {
      setSelectedRole('DPS');
    } else {
      setSelectedRole('');
    }
  };

  const handleJoin = async () => {
    if (!selectedCharId) {
      alert('캐릭터를 선택해주세요');
      return;
    }

    const char = myCharacters.find(c => c.id == selectedCharId);
    if (char.className === '발키리' && !selectedRole) {
      alert('발키리는 역할을 선택해야 합니다');
      return;
    }

    try {
      setJoining(true);
      await recruitmentAPI.join(recruitment.recruitmentId, selectedCharId, selectedRole);
      alert('참가 신청되었습니다!');
      await loadDetail();
      onUpdate();
    } catch (error) {
      alert(error.response?.data || '참가 신청 실패');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async (characterId) => {
    if (!confirm('참가를 취소하시겠습니까?')) return;

    try {
      await recruitmentAPI.leave(recruitment.recruitmentId, characterId);
      alert('참가가 취소되었습니다');
      await loadDetail();
      onUpdate();
    } catch (error) {
      alert(error.response?.data || '취소 실패');
    }
  };

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!confirm('정말 이 모집을 삭제하시겠습니까?\n참가 신청한 모든 정보가 함께 삭제됩니다.')) {
      return;
    }

    try {
      await recruitmentAPI.delete(recruitment.recruitmentId);
      alert('모집이 삭제되었습니다');
      onUpdate();
      onClose();
    } catch (error) {
      alert(error.response?.data || '삭제 실패');
    }
  };

  // 시간 포맷 함수
  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // ✅ 로딩 중이거나 detail이 없을 때
  if (loading || !detail) {
    return (
      <div style={{
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
      }}>
        <div style={{
          backgroundColor: theme.card.bg,
          padding: '30px',
          borderRadius: '10px',
          color: theme.text.primary,
        }}>
          {loading ? '로딩 중...' : '모집 정보를 불러올 수 없습니다.'}
        </div>
      </div>
    );
  }

  const isCreator = detail?.recruitment?.creatorUserId === userId;  // ✅ optional chaining

  const eligibleChars = myCharacters.filter(
    char => char.itemLevel >= detail.recruitment.requiredItemLevel
  );

  const myParticipant = detail.participants.find(
    p => myCharacters.some(c => c.id === p.character.id)
  );

  const selectedChar = myCharacters.find(c => c.id == selectedCharId);
  const isValkyrie = selectedChar?.className === '발키리';

  return (
    <div style={{
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
    }}>
      <div style={{
        backgroundColor: theme.card.bg,
        borderRadius: '10px',
        padding: '30px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* 헤더 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '10px' 
          }}>
            <h2 style={{ 
              margin: 0,
              color: theme.text.primary,
              flex: 1,
              textAlign: 'left',
            }}>
              {detail.recruitment.raidName}
            </h2>
            
            {isCreator && (
              <button
                onClick={handleDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginLeft: '10px',
                  flexShrink: 0,
                }}
              >
                모집 취소
              </button>
            )}
          </div>
          
          <div style={{ 
            color: theme.text.secondary, 
            fontSize: '14px',
            textAlign: 'left',
          }}>
            <div>일시: {formatDateTime(detail.recruitment.raidDateTime)}</div>
            <div>요구 레벨: {detail.recruitment.requiredItemLevel}</div>
            <div>인원: {detail.recruitment.currentParticipants}/{detail.recruitment.maxPartySize}</div>
            {detail.recruitment.description && (
              <div style={{ marginTop: '10px' }}>{detail.recruitment.description}</div>
            )}
          </div>
        </div>

        {/* 참가자 목록 */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ 
            marginBottom: '10px',
            color: theme.text.primary,
            fontSize: '16px',
            textAlign: 'left',
          }}>
            참가자 목록
          </h3>
          
          {detail.participants.length === 0 ? (
            <div style={{ 
              color: theme.text.secondary,
              textAlign: 'center',
              padding: '20px',
            }}>
              아직 참가자가 없습니다
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {detail.participants.map(participant => {
                const isMyChar = myCharacters.some(c => c.id === participant.character.id);
                
                return (
                  <div
                    key={participant.participantId}
                    style={{
                      padding: '10px',
                      backgroundColor: theme.bg.secondary,
                      borderRadius: '5px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{textAlign: 'left'}}>
                      <div style={{ 
                        fontWeight: 'bold',
                        color: theme.text.primary 
                      }}>
                        {participant.characterName} ({participant.className})
                      </div>
                      <div style={{ 
                        fontSize: '14px',
                        color: theme.text.secondary 
                      }}>
                        {participant.itemLevel} | {participant.role === 'DPS' ? '딜러' : '서폿'}
                      </div>
                    </div>
                    
                    {isMyChar && (
                      <button
                        onClick={() => handleLeave(participant.character.id)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          flexShrink: 0,
                        }}
                      >
                        취소
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 참가 신청 폼 */}
        {!myParticipant && detail.recruitment.status === 'RECRUITING' && (
          <div style={{ 
            marginBottom: '20px',
            padding: '20px',
            backgroundColor: theme.bg.secondary,
            borderRadius: '5px',
          }}>
            <h3 style={{ 
              marginBottom: '15px',
              color: theme.text.primary,
              fontSize: '16px',
            }}>
              참가 신청
            </h3>

            <div style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
                color: theme.text.primary,
                fontSize: '14px',
              }}>
                캐릭터 선택
              </label>
              <select
                value={selectedCharId}
                onChange={handleCharacterSelect}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: `1px solid ${theme.border.primary}`,
                  borderRadius: '5px',
                  backgroundColor: theme.card.bg,
                  color: theme.text.primary,
                }}
              >
                <option value="">캐릭터 선택</option>
                {eligibleChars.length === 0 ? (
                  <option disabled>조건을 만족하는 캐릭터가 없습니다</option>
                ) : (
                  eligibleChars.map(char => (
                    <option key={char.id} value={char.id}>
                      {char.characterName} ({char.className} / {char.itemLevel})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* 발키리 역할 선택 */}
            {isValkyrie && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: theme.text.primary,
                  fontSize: '14px',
                }}>
                  역할 선택
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <label style={{
                    flex: 1,
                    padding: '10px',
                    border: `2px solid ${selectedRole === 'DPS' ? '#4CAF50' : theme.border.primary}`,
                    borderRadius: '5px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: selectedRole === 'DPS' ? '#4CAF5020' : 'transparent',
                    color: theme.text.primary,
                  }}>
                    <input
                      type="radio"
                      name="role"
                      value="DPS"
                      checked={selectedRole === 'DPS'}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      style={{ marginRight: '5px' }}
                    />
                    딜러
                  </label>
                  <label style={{
                    flex: 1,
                    padding: '10px',
                    border: `2px solid ${selectedRole === 'SUPPORT' ? '#4CAF50' : theme.border.primary}`,
                    borderRadius: '5px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: selectedRole === 'SUPPORT' ? '#4CAF5020' : 'transparent',
                    color: theme.text.primary,
                  }}>
                    <input
                      type="radio"
                      name="role"
                      value="SUPPORT"
                      checked={selectedRole === 'SUPPORT'}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      style={{ marginRight: '5px' }}
                    />
                    서폿
                  </label>
                </div>
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={joining || !selectedCharId || (isValkyrie && !selectedRole)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: joining ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: joining ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
              }}
            >
              {joining ? '신청 중...' : '참가 신청'}
            </button>
          </div>
        )}

        {myParticipant && (
          <div style={{
            padding: '15px',
            backgroundColor: '#4CAF5020',
            borderRadius: '5px',
            marginBottom: '20px',
            color: theme.text.primary,
            textAlign: 'center',
          }}>
            ✓ {myParticipant.characterName}로 참가 중입니다
          </div>
        )}

        {detail.recruitment.status === 'FULL' && !myParticipant && (
          <div style={{
            padding: '15px',
            backgroundColor: '#f4433620',
            borderRadius: '5px',
            marginBottom: '20px',
            color: theme.text.primary,
            textAlign: 'center',
          }}>
            모집 인원이 가득 찼습니다
          </div>
        )}

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          style={{
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

export default RecruitmentDetailModal;