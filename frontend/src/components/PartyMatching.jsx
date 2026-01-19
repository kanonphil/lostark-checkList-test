import { useEffect, useState } from "react";
import api from "../services/api";

function PartyMatching() {
  const [raids, setRaids] = useState([]);
  const [selectedRaid, setSelectedRaid] = useState(null)
  const [availableCharacters, setAvailableCharacters] = useState(null)
  const [partyRecommendations, setPartyRecommendations] = useState([])
  const [loading, setLoading] = useState(false)

  const [selectedCharacters, setSelectedCharacters] = useState([])
  const [manualParty, setManualParty] = useState(null)
  const [completing, setCompleting] = useState(false)

  // 완료된 파티 상태 추가
  const [completedParties, setCompletedParties] = useState([])
  const [showCompletedParties, setShowCompletedParties] = useState(false)

  useEffect(() => {
    loadRaids();
  }, [])

  const loadRaids = async () => {
    try {
      const response = await api.get('/raids')
      setRaids(response.data)
    } catch (error) {
      console.error('레이드 로딩 실패:', error)
    }
  }

  const handleRaidSelect = async (raid) => {
    // ✅ 같은 레이드를 다시 클릭하면 선택 취소
    if (selectedRaid?.id === raid.id) {
      setSelectedRaid(null)
      setAvailableCharacters(null)
      setPartyRecommendations([])
      setCompletedParties([])
      setSelectedCharacters([])
      setManualParty(null)
      return
    }

    setSelectedRaid(raid)
    setSelectedCharacters([])
    setManualParty(null)
    setLoading(true)

    try {
      // 가능한 캐릭터 목록 조회
      const availableResponse = await api.get(`/party/available/${raid.id}`)
      setAvailableCharacters(availableResponse.data)

      // 파티 추천 조회
      const recommendResponse = await api.get(`/party/recommend/${raid.id}`)
      setPartyRecommendations(recommendResponse.data)

      // 완료된 파티 조회
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

  // 캐릭터 선택 토글
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

  // 수동 파티 구성
  const createManualParty = () => {
    if (selectedCharacters.length === 0) {
      alert('캐릭터를 선택해주세요')
      return;
    }

    // 같은 유저 체크
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

  // 파티 완료 처리
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

      // 새로고침
      handleRaidSelect(selectedRaid)
      setSelectedCharacters([])
      setManualParty(null)
    } catch (error) {
      alert(error.response?.data || '완료 처리 실패')
    } finally {
      setCompleting(false)
    }
  }

  // ✅ 취소 함수 추가
  const cancelPartyCompletion = async (partyId, index) => {
    if (!confirm(`파티 ${index + 1}의 완료를 취소하시겠습니까?`)) {
      return;
    }
  
    try {
      await api.delete(`/party/complete/${partyId}`);
      alert('파티 완료가 취소되었습니다!');
      
      // 새로고침
      handleRaidSelect(selectedRaid);
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

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>파티 매칭</h2>

      {/* 레이드 선택 */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px' }}>레이드 선택 {selectedRaid && <span style={{fontSize: '14px', color: '#666'}}>(다시 클릭하면 취소)</span>}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {raids.map(raid => (
            <button
              key={raid.id}
              onClick={() => handleRaidSelect(raid)}
              style={{
                padding: '15px',
                backgroundColor: selectedRaid?.id === raid.id ? '#4CAF50' : 'white',
                color: selectedRaid?.id === raid.id ? 'white' : 'black',
                border: '2px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{raid.raidName}</div>
              <div style={{ fontSize: '12px', color: selectedRaid?.id === raid.id ? '#e8f5e9' : '#666' }}>
                {raid.difficulty} · 레벨 {raid.requiredItemLevel}
              </div>
              <div style={{ fontSize: '11px', marginTop: '5px', color: selectedRaid?.id === raid.id ? '#e8f5e9' : '#999' }}>
                {getPartyTypeLabel(raid)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          로딩 중...
        </div>
      )}

      {!loading && selectedRaid && availableCharacters && (
        <>
          {/* 완료된 파티 목록 (접기 / 펼치기) */}
          {completedParties.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <button
                onClick={() => setShowCompletedParties(!showCompletedParties)}
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>완료된 파티 ({completedParties.length}개)</span>
                <span>{showCompletedParties ? '▲' : '▼'}</span>
              </button>

              {showCompletedParties && (
                <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {completedParties.map((party, index) => (
                    <div
                      key={party.id}
                      style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '10px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        border: '2px solid #4CAF50',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h4 style={{ margin: 0 }}>파티 {index + 1}</h4>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: '#666' }}>
                            {new Date(party.completedAt).toLocaleString('ko-KR')}
                          </span>
                          <button
                            onClick={() => cancelPartyCompletion(party.id, index)}
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

                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {party.characters.map(char => (
                          <div
                            key={char.id}
                            style={{
                              padding: '10px 12px',
                              backgroundColor: isSupport(char.className) ? '#e3f2fd' : '#ffebee',
                              borderRadius: '5px',
                              minWidth: '150px',
                            }}
                          >
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                              {char.characterName}
                            </div>
                            <div style={{ fontSize: '13px', color: '#666' }}>
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
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '15px' }}>
              파티 구성 가능 캐릭터 (총 {availableCharacters.totalAvailable}명)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* 딜러 */}
              <div>
                <h4 style={{ marginBottom: '10px', color: '#f44336' }}>
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
                          padding: '12px',
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
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{char.characterName}</div>
                          <div style={{ fontSize: '13px', color: '#666' }}>
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
                <h4 style={{ marginBottom: '10px', color: '#2196F3' }}>
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
                          padding: '12px',
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
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{char.characterName}</div>
                          <div style={{ fontSize: '13px', color: '#666' }}>
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

            {/* 선택한 캐릭터로 파티 구성 버튼 */}
            <div style={{ marginTop: '20px' }}>
              <button
                onClick={createManualParty}
                disabled={selectedCharacters.length === 0}
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: selectedCharacters.length === 0 ? '#ccc' : '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: selectedCharacters.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                선택한 캐릭터로 파티 구성 ({selectedCharacters.length}명)
              </button>
            </div>
          </div>

          {/* ✅ 구성된 수동 파티 표시 */}
          {manualParty && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ marginBottom: '15px' }}>구성된 파티</h3>
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              }}>
                <div style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>
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
                          borderRadius: '5px',
                          marginBottom: '5px',
                        }}
                      >
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          {char.characterName}
                        </div>
                        <div style={{ fontSize: '13px', color: '#666' }}>
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
                          borderRadius: '5px',
                          marginBottom: '5px',
                        }}
                      >
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          {char.characterName}
                        </div>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          {char.className} · Lv.{char.itemLevel.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 완료 처리 버튼 */}
                <button
                  onClick={() => completeParty(manualParty)}
                  disabled={completing}
                  style={{
                    width: '100%',
                    padding: '15px',
                    backgroundColor: completing ? '#ccc' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
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

          {/* 추천 파티 (기존) */}
          <div>
            <h3 style={{ marginBottom: '15px' }}>추천 파티 구성</h3>
            
            {partyRecommendations.length === 0 ? (
              <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {partyRecommendations.map((party, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: 'white',
                      padding: '20px',
                      borderRadius: '10px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    }}
                  >
                    <h4 style={{ marginBottom: '15px' }}>
                      추천 파티 {index + 1} ({party.type} - {party.partySize}인)
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      {/* 딜러 */}
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#f44336' }}>
                          딜러 ({party.dealerCount}명)
                        </div>
                        {party.dealers.map(char => (
                          <div
                            key={char.id}
                            style={{
                              padding: '10px 12px',
                              backgroundColor: '#ffebee',
                              borderRadius: '5px',
                              marginBottom: '5px',
                            }}
                          >
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                              {char.characterName}
                            </div>
                            <div style={{ fontSize: '13px', color: '#666' }}>
                              {char.className} · Lv.{char.itemLevel.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 서폿 */}
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#2196F3' }}>
                          서폿 ({party.supportCount}명)
                        </div>
                        {party.supports.map(char => (
                          <div
                            key={char.id}
                            style={{
                              padding: '10px 12px',
                              backgroundColor: '#e3f2fd',
                              borderRadius: '5px',
                              marginBottom: '5px',
                            }}
                          >
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                              {char.characterName}
                            </div>
                            <div style={{ fontSize: '13px', color: '#666' }}>
                              {char.className} · Lv.{char.itemLevel.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ✅ 추천 파티도 완료 처리 가능 */}
                    <button
                      onClick={() => completeParty(party)}
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
  )
}

export default PartyMatching