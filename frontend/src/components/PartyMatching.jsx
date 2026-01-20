import { useEffect, useState } from "react";
import api from "../services/api";
import { getTheme, useTheme } from "../hooks/useTheme";

function PartyMatching() {
  const [groupedRaids, setGroupedRaids] = useState({});
  const [selectedRaid, setSelectedRaid] = useState(null);
  
  const [availableCharacters, setAvailableCharacters] = useState(null);
  const [partyRecommendations, setPartyRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const [manualParty, setManualParty] = useState(null);
  const [completing, setCompleting] = useState(false);

  const [allCompletedParties, setAllCompletedParties] = useState([]);
  const [activeTab, setActiveTab] = useState('select'); // 'select', 'party', 'completed'

  const { isDark } = useTheme()
  const theme = getTheme(isDark)

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    loadRaids();
    loadAllCompletedParties();
  }, []);

  const loadRaids = async () => {
    try {
      const response = await api.get('/raids');
      const allRaids = response.data;
      
      // 레이드 그룹별로 묶기
      const grouped = allRaids.reduce((acc, raid) => {
        if (!acc[raid.raidGroup]) {
          acc[raid.raidGroup] = [];
        }
        acc[raid.raidGroup].push(raid);
        return acc;
      }, {});
      
      // 난이도 정렬
      const difficultyOrder = { '노말': 1, '하드': 2, '나이트메어': 3 };
      Object.keys(grouped).forEach(group => {
        grouped[group].sort((a, b) => {
          return (difficultyOrder[a.difficulty] || 999) - (difficultyOrder[b.difficulty] || 999);
        });
      });
      
      setGroupedRaids(grouped);
    } catch (error) {
      console.error('레이드 로딩 실패:', error);
    }
  };

  const loadAllCompletedParties = async () => {
    try {
      const response = await api.get('/raids');
      const allRaids = response.data;
      
      const partiesPromises = allRaids.map(async (raid) => {
        try {
          const completedResponse = await api.get(`/party/completed/${raid.id}`);
          return completedResponse.data.map(party => ({
            ...party,
            raid: raid
          }));
        } catch (error) {
          console.error('failed:', error)
          return [];
        }
      });
      
      const partiesArrays = await Promise.all(partiesPromises);
      const allParties = partiesArrays.flat();
      
      setAllCompletedParties(allParties);
    } catch (error) {
      console.error('전체 완료된 파티 로딩 실패:', error);
    }
  };

  const handleRaidSelection = async (raidGroup, difficulty) => {
    const raid = groupedRaids[raidGroup].find(r => r.difficulty === difficulty);
    if (!raid) return;

    setSelectedRaid(raid);
    setLoading(true);

    try {
      const availableResponse = await api.get(`/party/available/${raid.id}`);
      setAvailableCharacters(availableResponse.data);

      const recommendResponse = await api.get(`/party/recommend/${raid.id}`);
      setPartyRecommendations(recommendResponse.data);

      setActiveTab('party');
    } catch (error) {
      console.error('파티 매칭 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCharacterSelection = (character) => {
    setSelectedCharacters(prev => {
      const isSelected = prev.find(c => c.id === character.id);
      if (isSelected) {
        return prev.filter(c => c.id !== character.id);
      } else {
        return [...prev, character];
      }
    });
  };

  const createManualParty = () => {
    if (selectedCharacters.length === 0) {
      alert('캐릭터를 선택해주세요');
      return;
    }

    const userIds = selectedCharacters.map(c => c.userId);
    const uniqueUserIds = new Set(userIds.filter(id => id != null));

    const validUserIds = userIds.filter(id => id != null);
    if (validUserIds.length !== uniqueUserIds.size) {
      alert('같은 계정의 캐릭터는 함께 선택할 수 없습니다 (다중 접속 불가)');
      return;
    }

    const dealers = selectedCharacters.filter(c => !isSupport(c.className));
    const supports = selectedCharacters.filter(c => isSupport(c.className));

    const party = {
      dealers,
      supports,
      total: selectedCharacters.length,
      dealerCount: dealers.length,
      supportCount: supports.length,
    };

    setManualParty(party);
  };

  const completeParty = async (party) => {
    if (!confirm('선택한 캐릭터들의 레이드를 완료 처리하시겠습니까?')) {
      return;
    }

    try {
      setCompleting(true);
      const characterIds = [...party.dealers, ...party.supports].map(c => c.id);

      console.log('파티 완료 요청:', {
        raidId: selectedRaid.id,
        characterIds,
        extraReward: false
      });

      const response = await api.post('/party/complete', {
        raidId: selectedRaid.id,
        characterIds,
        extraReward: false,
      });

      console.log('파티 완료 응답:', response.data);

      // 상태 초기화
      setSelectedCharacters([]);
      setManualParty(null);
      
      // 데이터 새로고침 - await 추가!
      await loadAllCompletedParties();
      
      const availableResponse = await api.get(`/party/available/${selectedRaid.id}`);
      console.log('사용 가능 캐릭터:', availableResponse.data);
      setAvailableCharacters(availableResponse.data);
      
      const recommendResponse = await api.get(`/party/recommend/${selectedRaid.id}`);
      console.log('추천 파티:', recommendResponse.data);
      setPartyRecommendations(recommendResponse.data);

      alert('파티 완료 처리되었습니다!');
    } catch (error) {
      console.error('파티 완료 처리 실패:', error);
      alert(error.response?.data || '완료 처리 실패');
    } finally {
      setCompleting(false);
    }
  };

  const cancelPartyCompletion = async (partyId, raidName, difficulty) => {
    if (!confirm(`${raidName} - ${difficulty} 파티의 완료를 취소하시겠습니까?`)) {
      return;
    }
  
    try {
      await api.delete(`/party/complete/${partyId}`);
      alert('파티 완료가 취소되었습니다!');
      
      loadAllCompletedParties();
      
      if (selectedRaid) {
        const availableResponse = await api.get(`/party/available/${selectedRaid.id}`);
        setAvailableCharacters(availableResponse.data);
        const recommendResponse = await api.get(`/party/recommend/${selectedRaid.id}`);
        setPartyRecommendations(recommendResponse.data);
      }
    } catch (error) {
      alert(error.response?.data || '취소 실패');
    }
  };

  const isSupport = (className) => {
    return ['바드', '홀리나이트', '도화가', '발키리'].includes(className);
  };

  const getPartyTypeLabel = (raid) => {
    if (raid.partyType === '카제로스') return '8인';
    if (raid.partyType === '그림자') return '4인';
    return '';
  };

  const groupedCompletedParties = allCompletedParties.reduce((acc, party) => {
    const key = party.raid.raidGroup;
    if (!acc[key]) {
      acc[key] = {};
    }
    if (!acc[key][party.raid.difficulty]) {
      acc[key][party.raid.difficulty] = [];
    }
    acc[key][party.raid.difficulty].push(party);
    return acc;
  }, {});

  return (
    <div style={{ 
      padding: isMobile ? '10px' : '20px', 
      maxWidth: '1400px', 
      margin: '0 auto',
      backgroundColor: theme.bg.primary,
      minHeight: '100vh'
    }}>
      {/* 상단 타이틀 */}
      <h2 style={{ 
        marginBottom: '20px',
        color: theme.text.primary,
        fontSize: isMobile ? '20px' : '24px'
      }}>
        파티 매칭
      </h2>

      {/* 탭 메뉴 */}
      <div style={{ 
        display: 'flex', 
        gap: isMobile ? '5px' : '10px', 
        marginBottom: '30px',
        borderBottom: `2px solid ${theme.border.primary}`,
        paddingBottom: '0',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <button
          onClick={() => setActiveTab('select')}
          style={{
            padding: isMobile ? '10px 16px' : '12px 24px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'select' ? '3px solid #4CAF50' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: activeTab === 'select' ? 'bold' : 'normal',
            color: activeTab === 'select' ? '#4CAF50' : theme.text.secondary,
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          레이드 선택
        </button>
        <button
          onClick={() => setActiveTab('party')}
          disabled={!selectedRaid}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'party' ? '3px solid #4CAF50' : '3px solid transparent',
            cursor: selectedRaid ? 'pointer' : 'not-allowed',
            fontSize: '16px',
            fontWeight: activeTab === 'party' ? 'bold' : 'normal',
            color: activeTab === 'party' ? '#4CAF50' : theme.text.secondary,
            opacity: selectedRaid ? 1 : 0.5,
            transition: 'all 0.2s'
          }}
        >
          {isMobile ? '파티' : `파티 구성 ${selectedRaid ? `(${selectedRaid.raidName} - ${selectedRaid.difficulty})` : ''}`}
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          style={{
            padding: isMobile ? '10px 16px' : '12px 24px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'completed' ? '3px solid #4CAF50' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: activeTab === 'completed' ? 'bold' : 'normal',
            color: activeTab === 'completed' ? '#4CAF50' : theme.text.secondary,
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          완료 ({allCompletedParties.length})
        </button>
      </div>

      {/* 탭 1: 레이드 선택 */}
      {activeTab === 'select' && (
        <div>
          <h3 style={{ 
            marginBottom: '20px' ,
            color: theme.text.primary,
            fontSize: isMobile ? '18px' : '20px'
          }}>
            레이드를 선택하세요
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: isMobile ? '15px' : '20px' 
          }}>
            {Object.entries(groupedRaids).map(([raidGroup, raidsInGroup]) => {
              const minLevel = Math.min(...raidsInGroup.map(r => r.requiredItemLevel));
              const maxLevel = Math.max(...raidsInGroup.map(r => r.requiredItemLevel));
              const levelRange = minLevel === maxLevel ? `레벨 ${minLevel}` : `레벨 ${minLevel}~${maxLevel}`;
              const firstRaid = raidsInGroup[0];
              
              return (
                <div 
                  key={raidGroup}
                  style={{
                    backgroundColor: theme.card.bg,
                    border: `2px solid ${theme.card.border}`,
                    borderRadius: '12px',
                    padding: isMobile ? '15px' : '20px',
                    transition: 'all 0.2s',
                    boxShadow: theme.card.shadow,
                  }}
                >
                  <h4 style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: isMobile ? '16px' : '18px', 
                    color: theme.text.primary
                  }}>
                    {raidGroup}
                  </h4>
                  <div style={{ 
                    fontSize: '13px', 
                    color: theme.text.secondary, 
                    marginBottom: '15px' 
                  }}>
                    {levelRange} · {getPartyTypeLabel(firstRaid)}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {raidsInGroup.map(raid => (
                      <button
                        key={raid.id}
                        onClick={() => handleRaidSelection(raidGroup, raid.difficulty)}
                        style={{
                          padding: isMobile ? '10px 14px' : '12px 16px',
                          backgroundColor: theme.bg.secondary,
                          border: `1px solid ${theme.border.primary}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: isMobile ? '13px' : '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s',
                          textAlign: 'left',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          color: theme.text.primary
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme.bg.secondary;
                          e.currentTarget.style.color = theme.text.primary;
                          e.currentTarget.style.borderColor = theme.border.primary;
                          const levelSpan = e.currentTarget.querySelector('span:last-child');
                          if (levelSpan) levelSpan.style.color = theme.text.tertiary;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                          e.currentTarget.style.color = 'black';
                          e.currentTarget.style.borderColor = '#ddd';
                          const levelSpan = e.currentTarget.querySelector('span:last-child');
                          if (levelSpan) levelSpan.style.color = '#999';
                        }}
                      >
                        <span>{raid.difficulty}</span>
                        <span style={{ 
                          fontSize: '12px', 
                          color: theme.text.tertiary, 
                          transition: 'color 0.2s' 
                        }}>
                          레벨 {raid.requiredItemLevel}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 탭 2: 파티 구성 */}
      {activeTab === 'party' && (
        <div>
          {loading && (
            <div style={{ 
              textAlign: 'center', 
              padding: isMobile ? '40px 20px' : '60px', 
              color: theme.text.secondary, 
              fontSize: isMobile ? '16px' : '18px' 
            }}>
              로딩 중...
            </div>
          )}

          {!loading && selectedRaid && availableCharacters && (
            <>
              {/* 선택된 레이드 정보 */}
              <div style={{ 
                backgroundColor: theme.completed.bg, 
                padding: isMobile ? '15px' : '20px', 
                borderRadius: '12px', 
                marginBottom: isMobile ? '20px' : '30px',
                border: `2px solid ${theme.completed.border}`
              }}>
                <h3 style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: isMobile ? '18px' : '20px',
                  color: theme.text.primary
                }}>
                  {selectedRaid.raidName} - {selectedRaid.difficulty}
                </h3>
                <div style={{ 
                  fontSize: isMobile ? '13px' : '14px', 
                  color: theme.text.secondary 
                }}>
                  레벨 {selectedRaid.requiredItemLevel} · {getPartyTypeLabel(selectedRaid)} · 
                  {selectedRaid.partyType === '카제로스' ? ' 딜러 6 + 서폿 2' : ' 딜러 3 + 서폿 1'}
                </div>
              </div>

              {/* 가능한 캐릭터 목록 */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ 
                  marginBottom: '15px',
                  color: theme.text.primary,
                  fontSize: isMobile ? '18px' : '20px'
                }}>
                  파티 구성 가능 캐릭터 (총 {availableCharacters.totalAvailable}명)
                </h3>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1if' : '1fr 1fr', 
                  gap: isMobile ? '15px' : '20px'
                }}>
                  {/* 딜러 */}
                  <div>
                    <h4 style={{ 
                      marginBottom: '12px',
                      color: theme.role.dealer.text,
                      fontSize: isMobile ? '15px' : '16px'
                    }}>
                      딜러 ({availableCharacters.dealers.length}명)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {availableCharacters.dealers.map(char => {
                        const isSelected = selectedCharacters.find(c => c.id === char.id);
                        return (
                          <div
                            key={char.id}
                            onClick={() => toggleCharacterSelection(char)}
                            style={{
                              padding: isMobile ? '10px' : '12px',
                              backgroundColor: isSelected 
                                ? (isDark ? theme.role.dealer.bgSelected : '#ffcdd2') 
                                : (isDark ? theme.role.dealer.bg : '#ffebee'),
                              border: isSelected 
                                ? `2px solid ${theme.role.dealer.border}` 
                                : `1px solid ${theme.border.primary}`,
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'all 0.2s',
                            }}
                          >
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ 
                                fontWeight: 'bold', 
                                fontSize: isMobile ? '13px' : '14px',
                                color: theme.text.primary
                              }}>
                                {char.characterName}
                              </div>
                              <div style={{ 
                                fontSize: isMobile ? '11px' : '12px', 
                                color: theme.text.secondary 
                              }}>
                                {char.className} · Lv.{char.itemLevel.toFixed(2)}
                              </div>
                            </div>
                            {isSelected && (
                              <span style={{ color: '#f44336', fontWeight: 'bold', fontSize: '18px' }}>✓</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 서폿 */}
                  <div>
                    <h4 style={{ 
                      marginBottom: '12px', 
                      color: theme.role.support.text,
                      fontSize: isMobile ? '15px' : '16px'
                    }}>
                      서폿 ({availableCharacters.supports.length}명)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {availableCharacters.supports.map(char => {
                        const isSelected = selectedCharacters.find(c => c.id === char.id);
                        return (
                          <div
                            key={char.id}
                            onClick={() => toggleCharacterSelection(char)}
                            style={{
                              padding: isMobile ? '10px' : '12px',
                              backgroundColor: isSelected 
                                ? (isDark ? theme.role.support.bgSelected : '#bbdefb') 
                                : (isDark ? theme.role.support.bg : '#e3f2fd'),
                              border: isSelected 
                                ? `2px solid ${theme.role.support.border}` 
                                : `1px solid ${theme.border.primary}`,
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'all 0.2s',
                            }}
                          >
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ 
                                fontWeight: 'bold', 
                                fontSize: isMobile ? '13px' : '14px',
                                color: theme.text.primary
                              }}>
                                {char.characterName}
                              </div>
                              <div style={{ 
                                fontSize: isMobile ? '11px' : '12px', 
                                color: theme.text.secondary 
                              }}>
                                {char.className} · Lv.{char.itemLevel.toFixed(2)}
                              </div>
                            </div>
                            {isSelected && (
                              <span style={{ color: '#2196F3', fontWeight: 'bold', fontSize: '18px' }}>✓</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <button
                    onClick={createManualParty}
                    disabled={selectedCharacters.length === 0}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: selectedCharacters.length === 0 ? '#ccc' : '#FF9800',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: selectedCharacters.length === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold',
                    }}
                  >
                    선택한 캐릭터로 파티 구성 ({selectedCharacters.length}명)
                  </button>
                </div>
              </div>

              {/* 구성된 파티 */}
              {manualParty && (
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ 
                    marginBottom: '15px',
                    color: theme.text.primary,
                    fontSize: isMobile ? '18px' : '20px'
                  }}>
                    구성된 파티
                  </h3>
                  <div style={{
                    backgroundColor: theme.card.bg,
                    padding: isMobile ? '15px' : '20px',
                    borderRadius: '12px',
                    border: `2px solid ${theme.manual.border}`,
                  }}>
                    <div style={{ 
                      marginBottom: '15px', 
                      fontSize: isMobile ? '16px' : '18px', 
                      fontWeight: 'bold',
                      color: theme.text.primary
                    }}>
                      파티 ({manualParty.total}명: 딜러 {manualParty.dealerCount} + 서폿 {manualParty.supportCount})
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                      {/* 딜러 */}
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#f44336' }}>
                          딜러 ({manualParty.dealerCount}명)
                        </div>
                        {manualParty.dealers.map(char => (
                          <div
                            key={char.id}
                            style={{
                              padding: '10px 12px',
                              backgroundColor: '#ffebee',
                              borderRadius: '8px',
                              marginBottom: '8px',
                              textAlign: 'left',
                            }}
                          >
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                              {char.characterName}
                            </div>
                            <div style={{ fontSize: '12px', color: theme.text.secondary }}>
                              {char.className} · Lv.{char.itemLevel.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 서폿 */}
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#2196F3' }}>
                          서폿 ({manualParty.supportCount}명)
                        </div>
                        {manualParty.supports.map(char => (
                          <div
                            key={char.id}
                            style={{
                              padding: '10px 12px',
                              backgroundColor: '#e3f2fd',
                              borderRadius: '8px',
                              marginBottom: '8px',
                              textAlign: 'left',
                            }}
                          >
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                              {char.characterName}
                            </div>
                            <div style={{ fontSize: '12px', color: theme.text.secondary }}>
                              {char.className} · Lv.{char.itemLevel.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => completeParty(manualParty)}
                      disabled={completing}
                      style={{
                        width: '100%',
                        padding: '16px',
                        backgroundColor: completing ? '#ccc' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: completing ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                      }}
                    >
                      {completing ? '처리 중...' : '파티 완료 처리'}
                    </button>
                  </div>
                </div>
              )}

              {/* 추천 파티 */}
              <div>
                <h3 style={{ 
                  marginBottom: '15px',
                  color: theme.text.primary,
                  fontSize: isMobile ? '18px' : '20px'
                }}>
                  추천 파티 구성
                </h3>
                
                {partyRecommendations.length === 0 ? (
                  <div style={{
                    backgroundColor: theme.card.bg,
                    padding: isMobile ? '30px 15px' : '40px',
                    borderRadius: '12px',
                    border: `1px solid ${theme.card.border}`,
                    textAlign: 'center',
                    color: theme.text.secondary,
                  }}>
                    파티를 구성할 수 없습니다.
                    <br />
                    {selectedRaid.partyType === '카제로스' 
                      ? '(딜러 6명, 서폿 2명 필요)'
                      : '(딜러 3명, 서폿 1명 필요)'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {partyRecommendations.map((party, index) => (
                      <div
                        key={index}
                        style={{
                          backgroundColor: theme.card.bg,
                          padding: isMobile ? '15px' : '20px',
                          borderRadius: '12px',
                          border: `1px solid ${theme.card.border}`,
                        }}
                      >
                        <h4 style={{ 
                          marginBottom: '15px',
                          color: theme.text.primary,
                          fontSize: isMobile? '16px' : '18px'
                        }}>
                          추천 파티 {index + 1} ({party.type} - {party.partySize}인)
                        </h4>
                        
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                          gap: isMobile ? '10px' : '15px', 
                          marginBottom: '15px' 
                        }}>
                          <div>
                            <div style={{ 
                              fontWeight: 'bold', 
                              marginBottom: '10px', 
                              color: theme.role.dealer.text,
                              fontSize: isMobile ? '14px' : '15px' 
                            }}>
                              딜러 ({party.dealerCount}명)
                            </div>
                            {party.dealers.map(char => (
                              <div
                                key={char.id}
                                style={{
                                  padding: isMobile ? '8px 10px' : '10px 12px',
                                  backgroundColor: isDark ? theme.role.dealer.bg : '#ffebee',
                                  borderRadius: '8px',
                                  marginBottom: '8px',
                                  textAlign: 'left',
                                }}
                              >
                                <div style={{ 
                                  fontWeight: 'bold', 
                                  marginBottom: '4px',
                                  color: theme.text.primary,
                                  fontSize: isMobile ? '13px' : '14px'
                                }}>
                                  {char.characterName}
                                </div>
                                <div style={{ 
                                  fontSize: isMobile ? '11px' : '12px', 
                                  color: theme.text.secondary
                                }}>
                                  {char.className} · Lv.{char.itemLevel.toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div>
                            <div style={{ 
                              fontWeight: 'bold', 
                              marginBottom: '10px', 
                              color: theme.role.support.text,
                              fontSize: isMobile ? '14px' : '15px'
                            }}>
                              서폿 ({party.supportCount}명)
                            </div>
                            {party.supports.map(char => (
                              <div
                                key={char.id}
                                style={{
                                  padding: isMobile ? '8px 10px' : '10px 12px',
                                  backgroundColor: isDark ? theme.role.support.bg : '#e3f2fd',
                                  borderRadius: '8px',
                                  marginBottom: '8px',
                                  textAlign: 'left',
                                }}
                              >
                                <div style={{ 
                                  fontWeight: 'bold', 
                                  marginBottom: '4px',
                                  color: theme.text.primary,
                                  fontSize: isMobile ? '13px' : '14px'
                                }}>
                                  {char.characterName}
                                </div>
                                <div style={{ 
                                  fontSize: isMobile ? '11px' : '12px', 
                                  color: theme.text.secondary
                                }}>
                                  {char.className} · Lv.{char.itemLevel.toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => completeParty(party)}
                          disabled={completing}
                          style={{
                            width: '100%',
                            padding: '14px',
                            backgroundColor: completing ? '#ccc' : '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: completing ? 'not-allowed' : 'pointer',
                            fontSize: '15px',
                            fontWeight: 'bold',
                          }}
                        >
                          {completing ? '처리 중...' : '이 파티로 완료 처리'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* 탭 3: 완료된 파티 */}
      {activeTab === 'completed' && (
        <div>
          <h3 style={{ 
            marginBottom: '20px',
            color: theme.text.primary,
            fontSize: isMobile ? '18px' : '20px'
          }}>
            완료된 파티 목록
          </h3>
          
          {allCompletedParties.length === 0 ? (
            <div style={{
              backgroundColor: theme.card.bg,
              padding: isMobile ? '40px 20px' : '60px',
              borderRadius: '12px',
              border: `1px solid ${theme.card.border}`,
              textAlign: 'center',
              color: theme.text.secondary,
              fontSize: isMobile ? '14px' : '16px'
            }}>
              완료된 파티가 없습니다.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {Object.entries(groupedCompletedParties).map(([raidGroup, difficulties]) => (
                <div key={raidGroup}>
                  <h4 style={{ 
                    margin: '0 0 15px 0', 
                    padding: isMobile ? '10px 12px' : '12px 16px', 
                    backgroundColor: theme.completed.bg, 
                    borderRadius: '8px',
                    fontSize: isMobile ? '16px' : '18px',
                    color: theme.text.primary
                  }}>
                    {raidGroup}
                  </h4>
                  
                  {Object.entries(difficulties).map(([difficulty, parties]) => (
                    <div key={difficulty} style={{ marginBottom: '20px' }}>
                      <div style={{ 
                        fontWeight: 'bold', 
                        marginBottom: '10px',
                        fontSize: isMobile ? '14px' : '15px',
                        color: theme.text.secondary
                      }}>
                        {difficulty} ({parties.length}개 파티)
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {parties.map((party, index) => (
                          <div
                            key={party.id}
                            style={{
                              backgroundColor: theme.card.bg,
                              padding: isMobile ? '12px' : '16px',
                              borderRadius: '8px',
                              border: `2px solid ${theme.completed.border}`,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <h5 style={{ 
                                margin: 0,
                                color: theme.text.primary,
                                fontSize: isMobile ? '14px' : '16px'
                              }}>
                                파티 {index + 1}
                              </h5>
                              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <span style={{ 
                                  fontSize: isMobile ? '11px' : '13px', 
                                  color: theme.text.secondary
                                }}>
                                  {new Date(party.completedAt).toLocaleString('ko-KR', { 
                                    timeZone: 'Asia/Seoul',
                                    year: 'numeric',
                                    month: 'numeric',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                  })}
                                </span>
                                <button
                                  onClick={() => cancelPartyCompletion(party.id, raidGroup, difficulty)}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                  }}
                                >
                                  취소
                                </button>
                              </div>
                            </div>

                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', 
                              gap: isMobile ? '8px' : '10px' 
                            }}>
                              {party.characters.map(char => (
                                <div
                                  key={char.id}
                                  style={{
                                    padding: isMobile ? '8px 10px' : '10px 12px',
                                    backgroundColor: isSupport(char.className) ? (isDark ? theme.role.support.bg : '#e3f2fd') : (isDark ? theme.role.dealer.bg : '#ffebee'),
                                    borderRadius: '8px',
                                    textAlign: 'left',
                                  }}
                                >
                                  <div style={{ 
                                    fontWeight: 'bold', 
                                    marginBottom: '4px',
                                    color: theme.text.primary,
                                    fontSize: isMobile ? '13px' : '14px'
                                  }}>
                                    {char.characterName}
                                  </div>
                                  <div style={{ 
                                    fontSize: isMobile ? '11px' : '12px', 
                                    color: theme.text.secondary 
                                  }}>
                                    {char.className} · Lv.{char.itemLevel.toFixed(2)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PartyMatching;