import { useEffect, useState } from "react";
import api from "../services/api";

function PartyMatching() {
  const [raids, setRaids] = useState([]);
  const [groupedRaids, setGroupedRaids] = useState({});
  const [selectedRaidGroup, setSelectedRaidGroup] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [selectedRaid, setSelectedRaid] = useState(null);
  
  const [availableCharacters, setAvailableCharacters] = useState(null)
  const [partyRecommendations, setPartyRecommendations] = useState([])
  const [loading, setLoading] = useState(false)

  const [selectedCharacters, setSelectedCharacters] = useState([])
  const [manualParty, setManualParty] = useState(null)
  const [completing, setCompleting] = useState(false)

  const [completedParties, setCompletedParties] = useState([])
  const [showCompletedParties, setShowCompletedParties] = useState(false)
  
  const [allCompletedParties, setAllCompletedParties] = useState([])
  const [showAllCompletedParties, setShowAllCompletedParties] = useState(false)

  useEffect(() => {
    loadRaids();
    loadAllCompletedParties();
  }, [])

  const loadRaids = async () => {
    try {
      const response = await api.get('/raids')
      const allRaids = response.data
      setRaids(allRaids)
      
      // ✅ 레이드 그룹별로 묶기
      const grouped = allRaids.reduce((acc, raid) => {
        if (!acc[raid.raidGroup]) {
          acc[raid.raidGroup] = []
        }
        acc[raid.raidGroup].push(raid)
        return acc
      }, {})
      
      // ✅ 각 그룹 내에서 난이도 순서 정렬 (노말 -> 하드 -> 나이트메어)
      const difficultyOrder = { '노말': 1, '하드': 2, '나이트메어': 3 }
      Object.keys(grouped).forEach(group => {
        grouped[group].sort((a, b) => {
          return (difficultyOrder[a.difficulty] || 999) - (difficultyOrder[b.difficulty] || 999)
        })
      })
      
      setGroupedRaids(grouped)
    } catch (error) {
      console.error('레이드 로딩 실패:', error)
    }
  }

  const loadAllCompletedParties = async () => {
    try {
      const response = await api.get('/raids')
      const allRaids = response.data
      
      const partiesPromises = allRaids.map(async (raid) => {
        try {
          const completedResponse = await api.get(`/party/completed/${raid.id}`)
          return completedResponse.data.map(party => ({
            ...party,
            raid: raid
          }))
        } catch (error) {
          console.error('loading failed:', error);
          return []
        }
      })
      
      const partiesArrays = await Promise.all(partiesPromises)
      const allParties = partiesArrays.flat()
      
      setAllCompletedParties(allParties)
    } catch (error) {
      console.error('전체 완료된 파티 로딩 실패:', error)
    }
  }

  // ✅ 레이드 그룹 선택
  const handleRaidGroupSelect = (raidGroup) => {
    setSelectedRaidGroup(raidGroup)
    // 첫 번째 난이도를 자동 선택
    const firstRaid = groupedRaids[raidGroup][0]
    setSelectedDifficulty(firstRaid.difficulty)
    handleRaidSelect(firstRaid)
  }

  // ✅ 난이도 선택
  const handleDifficultySelect = (difficulty) => {
    setSelectedDifficulty(difficulty)
    const raid = groupedRaids[selectedRaidGroup].find(r => r.difficulty === difficulty)
    if (raid) {
      handleRaidSelect(raid)
    }
  }

  const handleRaidSelect = async (raid) => {
    setSelectedRaid(raid)
    setSelectedCharacters([])
    setManualParty(null)
    setLoading(true)

    try {
      const availableResponse = await api.get(`/party/available/${raid.id}`)
      setAvailableCharacters(availableResponse.data)

      const recommendResponse = await api.get(`/party/recommend/${raid.id}`)
      setPartyRecommendations(recommendResponse.data)

      try {
        const completedResponse = await api.get(`/party/completed/${raid.id}`)
        setCompletedParties(completedResponse.data)
      } catch (error) {
        console.error('완료된 파티 없음:', error)
        setCompletedParties([])
      }
    } catch (error) {
      console.error('파티 매칭 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCharacterSelection = (character) => {
    setSelectedCharacters(prev => {
      const isSelected = prev.find(c => c.id === character.id)
      if (isSelected) {
        return prev.filter(c => c.id !== character.id)
      } else {
        return [...prev, character]
      }
    })
  }

  const createManualParty = () => {
    if (selectedCharacters.length === 0) {
      alert('캐릭터를 선택해주세요')
      return;
    }

    const userIds = selectedCharacters.map(c => c.userId);
    const uniqueUserIds = new Set(userIds.filter(id => id != null))

    const validUserIds = userIds.filter(id => id != null)
    if (validUserIds.length !== uniqueUserIds.size) {
      alert('같은 계정의 캐릭터는 함께 선택할 수 없습니다 (다중 접속 불가)')
      return;
    }

    const dealers = selectedCharacters.filter(c => !isSupport(c.className))
    const supports = selectedCharacters.filter(c => isSupport(c.className))

    const party = {
      dealers,
      supports,
      total: selectedCharacters.length,
      dealerCount: dealers.length,
      supportCount: supports.length,
    }

    setManualParty(party);
  }

  const completeParty = async (party) => {
    if (!confirm('선택한 캐릭터들의 레이드를 완료 처리하시겠습니까?')) {
      return;
    }

    try {
      setCompleting(true)
      const characterIds = [...party.dealers, ...party.supports].map(c => c.id)

      await api.post('/party/complete', {
        raidId: selectedRaid.id,
        characterIds,
        extraRwward: false,
      })

      alert('파티 완료 처리되었습니다!')

      handleRaidSelect(selectedRaid)
      setSelectedCharacters([])
      setManualParty(null)
      loadAllCompletedParties()
    } catch (error) {
      alert(error.response?.data || '완료 처리 실패')
    } finally {
      setCompleting(false)
    }
  }

  const cancelPartyCompletion = async (partyId, raidName, difficulty, index) => {
    if (!confirm(`${raidName} - ${difficulty} 파티 ${index + 1}의 완료를 취소하시겠습니까?`)) {
      return;
    }
  
    try {
      await api.delete(`/party/complete/${partyId}`);
      alert('파티 완료가 취소되었습니다!');
      
      if (selectedRaid) {
        handleRaidSelect(selectedRaid);
      }
      loadAllCompletedParties();
    } catch (error) {
      alert(error.response?.data || '취소 실패');
    }
  };

  const isSupport = (className) => {
    return ['바드', '홀리나이트', '도화가', '발키리'].includes(className);
  };

  const getPartyTypeLabel = (raid) => {
    if (raid.partyType === '카제로스') {
      return '8인 (딜러 6 + 서폿 2)'
    } else if (raid.partyType === '그림자') {
      return '4인 (딜러 3 + 서폿 1)'
    }
    return '';
  }

  const groupedCompletedParties = allCompletedParties.reduce((acc, party) => {
    const key = `${party.raid.raidName}-${party.raid.difficulty}`;
    if (!acc[key]) {
      acc[key] = {
        raid: party.raid,
        parties: []
      };
    }
    acc[key].parties.push(party);
    return acc;
  }, {});

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* 상단 고정 타이틀 */}
      <div style={{ 
        position: 'sticky', 
        top: 0, 
        backgroundColor: 'white', 
        zIndex: 100, 
        paddingBottom: '20px',
        borderBottom: '2px solid #ddd',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0 }}>파티 매칭</h2>
      </div>

      {/* 2-column 레이아웃 */}
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* ========== 왼쪽 컬럼 ========== */}
        <div style={{ position: 'sticky', top: '80px' }}>
          
          {/* ✅ 레이드 그룹 선택 */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>레이드 선택</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(groupedRaids).map(([raidGroup, raidsInGroup]) => {
                const isSelected = selectedRaidGroup === raidGroup
                const firstRaid = raidsInGroup[0]
                
                return (
                  <div key={raidGroup}>
                    {/* 레이드 그룹 버튼 */}
                    <button
                      onClick={() => handleRaidGroupSelect(raidGroup)}
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        backgroundColor: isSelected ? '#4CAF50' : 'white',
                        color: isSelected ? 'white' : 'black',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{raidGroup}</div>
                      <div style={{ fontSize: '11px', color: isSelected ? '#e8f5e9' : '#666' }}>
                        레벨 {firstRaid.requiredItemLevel} · {getPartyTypeLabel(firstRaid)}
                      </div>
                    </button>

                    {/* ✅ 난이도 선택 (선택된 그룹만 표시) */}
                    {isSelected && (
                      <div style={{ 
                        marginTop: '8px', 
                        marginLeft: '10px',
                        display: 'flex', 
                        gap: '6px',
                        flexWrap: 'wrap'
                      }}>
                        {raidsInGroup.map(raid => (
                          <button
                            key={raid.id}
                            onClick={() => handleDifficultySelect(raid.difficulty)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: selectedDifficulty === raid.difficulty ? '#2196F3' : 'white',
                              color: selectedDifficulty === raid.difficulty ? 'white' : 'black',
                              border: '1px solid #ddd',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: selectedDifficulty === raid.difficulty ? 'bold' : 'normal',
                              transition: 'all 0.2s',
                            }}
                          >
                            {raid.difficulty}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 전체 완료된 파티 */}
          {allCompletedParties.length > 0 && (
            <div>
              <button
                onClick={() => setShowAllCompletedParties(!showAllCompletedParties)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}
              >
                <span>완료된 파티 ({allCompletedParties.length}개)</span>
                <span>{showAllCompletedParties ? '▲' : '▼'}</span>
              </button>

              {showAllCompletedParties && (
                <div style={{ 
                  maxHeight: '500px', 
                  overflowY: 'auto',
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '15px',
                  padding: '10px',
                  backgroundColor: '#fafafa',
                  borderRadius: '8px'
                }}>
                  {Object.entries(groupedCompletedParties).map(([key, { raid, parties }]) => (
                    <div key={key}>
                      <div style={{ 
                        padding: '8px', 
                        backgroundColor: '#e3f2fd', 
                        borderRadius: '5px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        marginBottom: '8px'
                      }}>
                        {raid.raidName} - {raid.difficulty} ({parties.length}개)
                      </div>
                      {parties.map((party, index) => (
                        <div
                          key={party.id}
                          style={{
                            backgroundColor: 'white',
                            padding: '10px',
                            borderRadius: '5px',
                            border: '1px solid #4CAF50',
                            marginBottom: '8px',
                            fontSize: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 'bold' }}>파티 {index + 1}</span>
                            <button
                              onClick={() => cancelPartyCompletion(party.id, raid.raidName, raid.difficulty, index)}
                              style={{
                                padding: '3px 8px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '11px',
                              }}
                            >
                              취소
                            </button>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                            {party.characters.map(char => (
                              <div
                                key={char.id}
                                style={{
                                  padding: '4px 8px',
                                  backgroundColor: isSupport(char.className) ? '#e3f2fd' : '#ffebee',
                                  borderRadius: '3px',
                                  fontSize: '11px',
                                }}
                              >
                                {char.characterName}
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

        {/* ========== 오른쪽 컬럼 ========== */}
        <div>
          {!selectedRaid && (
            <div style={{
              backgroundColor: '#f5f5f5',
              padding: '60px',
              borderRadius: '10px',
              textAlign: 'center',
              color: '#999',
              fontSize: '18px'
            }}>
              왼쪽에서 레이드와 난이도를 선택해주세요
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#666', fontSize: '18px' }}>
              로딩 중...
            </div>
          )}

          {!loading && selectedRaid && availableCharacters && (
            <>
              {/* 선택된 레이드 정보 */}
              <div style={{ 
                backgroundColor: '#e8f5e9', 
                padding: '15px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                border: '2px solid #4CAF50'
              }}>
                <h3 style={{ margin: '0 0 5px 0' }}>
                  {selectedRaid.raidName} - {selectedRaid.difficulty}
                </h3>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  레벨 {selectedRaid.requiredItemLevel} · {getPartyTypeLabel(selectedRaid)}
                </div>
              </div>

              {/* 완료된 파티 목록 */}
              {completedParties.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <button
                    onClick={() => setShowCompletedParties(!showCompletedParties)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>이 레이드의 완료된 파티 ({completedParties.length}개)</span>
                    <span>{showCompletedParties ? '▲' : '▼'}</span>
                  </button>

                  {showCompletedParties && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {completedParties.map((party, index) => (
                        <div
                          key={party.id}
                          style={{
                            backgroundColor: 'white',
                            padding: '15px',
                            borderRadius: '8px',
                            border: '2px solid #4CAF50',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h4 style={{ margin: 0 }}>파티 {index + 1}</h4>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', color: '#666' }}>
                                {new Date(party.completedAt).toLocaleString('ko-KR')}
                              </span>
                              <button
                                onClick={() => cancelPartyCompletion(party.id, selectedRaid.raidName, selectedRaid.difficulty, index)}
                                style={{
                                  padding: '5px 10px',
                                  backgroundColor: '#f44336',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                }}
                              >
                                취소
                              </button>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {party.characters.map(char => (
                              <div
                                key={char.id}
                                style={{
                                  padding: '8px 10px',
                                  backgroundColor: isSupport(char.className) ? '#e3f2fd' : '#ffebee',
                                  borderRadius: '5px',
                                  textAlign: 'left',
                                }}
                              >
                                <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '3px' }}>
                                  {char.characterName}
                                </div>
                                <div style={{ fontSize: '11px', color: '#666' }}>
                                  {char.className} · Lv.{char.itemLevel.toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 가능한 캐릭터 목록 */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '10px' }}>
                  파티 구성 가능 캐릭터 (총 {availableCharacters.totalAvailable}명)
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  {/* 딜러 */}
                  <div>
                    <h4 style={{ marginBottom: '8px', color: '#f44336', fontSize: '14px' }}>
                      딜러 ({availableCharacters.dealers.length}명)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {availableCharacters.dealers.map(char => {
                        const isSelected = selectedCharacters.find(c => c.id === char.id);
                        return (
                          <div
                            key={char.id}
                            onClick={() => toggleCharacterSelection(char)}
                            style={{
                              padding: '10px',
                              backgroundColor: isSelected ? '#ffcdd2' : '#ffebee',
                              border: isSelected ? '2px solid #f44336' : '1px solid #ddd',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'all 0.2s',
                            }}
                          >
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{char.characterName}</div>
                              <div style={{ fontSize: '11px', color: '#666' }}>
                                {char.className} · Lv.{char.itemLevel.toFixed(2)}
                              </div>
                            </div>
                            {isSelected && (
                              <span style={{ color: '#f44336', fontWeight: 'bold' }}>✓</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 서폿 */}
                  <div>
                    <h4 style={{ marginBottom: '8px', color: '#2196F3', fontSize: '14px' }}>
                      서폿 ({availableCharacters.supports.length}명)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {availableCharacters.supports.map(char => {
                        const isSelected = selectedCharacters.find(c => c.id === char.id);
                        return (
                          <div
                            key={char.id}
                            onClick={() => toggleCharacterSelection(char)}
                            style={{
                              padding: '10px',
                              backgroundColor: isSelected ? '#bbdefb' : '#e3f2fd',
                              border: isSelected ? '2px solid #2196F3' : '1px solid #ddd',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'all 0.2s',
                            }}
                          >
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{char.characterName}</div>
                              <div style={{ fontSize: '11px', color: '#666' }}>
                                {char.className} · Lv.{char.itemLevel.toFixed(2)}
                              </div>
                            </div>
                            {isSelected && (
                              <span style={{ color: '#2196F3', fontWeight: 'bold' }}>✓</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '15px' }}>
                  <button
                    onClick={createManualParty}
                    disabled={selectedCharacters.length === 0}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: selectedCharacters.length === 0 ? '#ccc' : '#FF9800',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: selectedCharacters.length === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    선택한 캐릭터로 파티 구성 ({selectedCharacters.length}명)
                  </button>
                </div>
              </div>

              {/* 구성된 파티 */}
              {manualParty && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ marginBottom: '10px' }}>구성된 파티</h3>
                  <div style={{
                    backgroundColor: 'white',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '2px solid #FF9800',
                  }}>
                    <div style={{ marginBottom: '10px', fontSize: '16px', fontWeight: 'bold' }}>
                      파티 ({manualParty.total}명: 딜러 {manualParty.dealerCount} + 서폿 {manualParty.supportCount})
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                      {/* 딜러 */}
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#f44336', fontSize: '13px' }}>
                          딜러 ({manualParty.dealerCount}명)
                        </div>
                        {manualParty.dealers.map(char => (
                          <div
                            key={char.id}
                            style={{
                              padding: '8px 10px',
                              backgroundColor: '#ffebee',
                              borderRadius: '5px',
                              marginBottom: '5px',
                              textAlign: 'left',
                            }}
                          >
                            <div style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: '13px' }}>
                              {char.characterName}
                            </div>
                            <div style={{ fontSize: '11px', color: '#666' }}>
                              {char.className} · Lv.{char.itemLevel.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 서폿 */}
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#2196F3', fontSize: '13px' }}>
                          서폿 ({manualParty.supportCount}명)
                        </div>
                        {manualParty.supports.map(char => (
                          <div
                            key={char.id}
                            style={{
                              padding: '8px 10px',
                              backgroundColor: '#e3f2fd',
                              borderRadius: '5px',
                              marginBottom: '5px',
                              textAlign: 'left',
                            }}
                          >
                            <div style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: '13px' }}>
                              {char.characterName}
                            </div>
                            <div style={{ fontSize: '11px', color: '#666' }}>
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
                        padding: '12px',
                        backgroundColor: completing ? '#ccc' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: completing ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
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
                <h3 style={{ marginBottom: '10px' }}>추천 파티 구성</h3>
                
                {partyRecommendations.length === 0 ? (
                  <div style={{
                    backgroundColor: 'white',
                    padding: '30px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    textAlign: 'center',
                    color: '#999',
                  }}>
                    파티를 구성할 수 없습니다.
                    <br />
                    {selectedRaid.partyType === '카제로스' 
                      ? '(딜러 6명, 서폿 2명 필요)'
                      : '(딜러 3명, 서폿 1명 필요)'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {partyRecommendations.map((party, index) => (
                      <div
                        key={index}
                        style={{
                          backgroundColor: 'white',
                          padding: '15px',
                          borderRadius: '8px',
                          border: '1px solid #ddd',
                        }}
                      >
                        <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>
                          추천 파티 {index + 1} ({party.type} - {party.partySize}인)
                        </h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#f44336', fontSize: '13px' }}>
                              딜러 ({party.dealerCount}명)
                            </div>
                            {party.dealers.map(char => (
                              <div
                                key={char.id}
                                style={{
                                  padding: '8px 10px',
                                  backgroundColor: '#ffebee',
                                  borderRadius: '5px',
                                  marginBottom: '5px',
                                  textAlign: 'left',
                                }}
                              >
                                <div style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: '13px' }}>
                                  {char.characterName}
                                </div>
                                <div style={{ fontSize: '11px', color: '#666' }}>
                                  {char.className} · Lv.{char.itemLevel.toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#2196F3', fontSize: '13px' }}>
                              서폿 ({party.supportCount}명)
                            </div>
                            {party.supports.map(char => (
                              <div
                                key={char.id}
                                style={{
                                  padding: '8px 10px',
                                  backgroundColor: '#e3f2fd',
                                  borderRadius: '5px',
                                  marginBottom: '5px',
                                  textAlign: 'left',
                                }}
                              >
                                <div style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: '13px' }}>
                                  {char.characterName}
                                </div>
                                <div style={{ fontSize: '11px', color: '#666' }}>
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
                            padding: '10px',
                            backgroundColor: completing ? '#ccc' : '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: completing ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
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
      </div>
    </div>
  )
}

export default PartyMatching