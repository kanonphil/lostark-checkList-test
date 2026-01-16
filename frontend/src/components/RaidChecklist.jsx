import { useState, useEffect } from 'react';
import { completionAPI } from '../services/api';
import ResetTimer from './ResetTimer';

function RaidChecklist({ character }) {
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalGold, setTotalGold] = useState(0);
  const [processingGateId, setProcessingGateId] = useState(null);
  const [expandedRaids, setExpandedRaids] = useState({}); // ✅ 추가: 확장된 레이드 그룹
  const [selectedDifficulty, setSelectedDifficulty] = useState({}); // ✅ 추가: 선택된 난이도

  useEffect(() => {
    if (character) {
      loadChecklist();
    }
  }, [character]);

  const loadChecklist = async () => {
    try {
      setLoading(true);
      let response = await completionAPI.getCurrentWeek(character.id);
      
      if (response.data.length === 0) {
        await completionAPI.createChecklist(character.id);
        response = await completionAPI.getCurrentWeek(character.id);
      }
      
      setCompletions(response.data);
      loadTotalGold();
    } catch (error) {
      console.error('체크리스트 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTotalGold = async () => {
    try {
      const response = await completionAPI.getTotalGold(character.id);
      setTotalGold(response.data);
    } catch (error) {
      console.error('총 골드 조회 실패:', error);
    }
  };

  const refreshData = async () => {
    try {
      const response = await completionAPI.getCurrentWeek(character.id);
      setCompletions(response.data);
      loadTotalGold();
    } catch (error) {
      console.error('데이터 새로고침 실패:', error);
    }
  };

  const handleGateComplete = async (gateCompletionId, extraReward) => {
    try {
      setProcessingGateId(gateCompletionId);
      await completionAPI.completeGate(gateCompletionId, extraReward);
      await refreshData();
    } catch (error) {
      alert(error.response?.data || '완료 처리 실패');
    } finally {
      setProcessingGateId(null);
    }
  };

  const handleGateUncomplete = async (gateCompletionId) => {
    try {
      setProcessingGateId(gateCompletionId);
      await completionAPI.uncompleteGate(gateCompletionId);
      await refreshData();
    } catch (error) {
      console.error('완료 취소 실패:', error);
    } finally {
      setProcessingGateId(null);
    }
  };

  // ✅ 레이드 그룹별로 분류
  const groupedRaids = completions.reduce((acc, completion) => {
    const group = completion.raid.raidGroup;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(completion);
    return acc;
  }, {});

  // ✅ 레이드 그룹 토글
  const toggleRaidGroup = (raidGroup) => {
    setExpandedRaids(prev => ({
      ...prev,
      [raidGroup]: !prev[raidGroup]
    }));
  };

  // ✅ 난이도 선택
  const selectDifficulty = (raidGroup, difficulty) => {
    setSelectedDifficulty(prev => ({
      ...prev,
      [raidGroup]: difficulty
    }));
  };

  // 같은 레이드 그룹의 같은 관문이 완료되었는지
  const isGateCompleted = (raidGroup, gateNumber) => {
    return completions.some(c => 
      c.raid.raidGroup === raidGroup &&
      c.gateCompletions.some(gc => 
        gc.raidGate.gateNumber === gateNumber && gc.completed
      )
    );
  };

  if (!character) {
    return <div style={{padding: '20px'}}>캐릭터를 선택해주세요</div>;
  }

  if (loading) return <div style={{padding: '20px'}}>로딩 중...</div>;

  if (completions.length === 0) {
    return <div style={{padding: '20px'}}>레이드 데이터가 없습니다.</div>;
  }

  const completedGroups = new Set(
    completions.filter(c => c.completed).map(c => c.raid.raidGroup)
  ).size;

  const isGoldLimitReached = completedGroups >= 3;

  return (
    <div style={{padding: '20px'}}>
      <ResetTimer />
      
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <h2>{character.characterName}의 레이드 체크리스트</h2>
        <div style={{textAlign: 'right'}}>
          <p style={{margin: '5px 0', fontSize: '24px', fontWeight: 'bold', color: '#4CAF50'}}>
            총 골드: {totalGold.toLocaleString()}G
          </p>
          <p style={{margin: '5px 0', color: completedGroups >= 3 ? '#f44336' : '#666'}}>
            완료: {completedGroups}/3 레이드 {isGoldLimitReached && '(골드 획득 완료)'}
          </p>
        </div>
      </div>
      
      <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
        {Object.entries(groupedRaids).map(([raidGroup, raids]) => {
          const isExpanded = expandedRaids[raidGroup];
          const isGroupCompleted = raids.some(r => r.completed);
          const groupGold = raids.reduce((sum, r) => sum + r.earnedGold, 0);
          const isOverLimit = !isGroupCompleted && isGoldLimitReached;
          
          // 선택된 난이도의 레이드 찾기
          const selectedDiff = selectedDifficulty[raidGroup] || raids[0].raid.difficulty;
          const selectedRaid = raids.find(r => r.raid.difficulty === selectedDiff);

          return (
            <div
              key={raidGroup}
              style={{
                border: '2px solid ' + (isGroupCompleted ? '#4CAF50' : isOverLimit ? '#ffcccc' : '#ddd'),
                borderRadius: '8px',
                backgroundColor: isGroupCompleted ? '#f1f8f4' : isOverLimit ? '#fff5f5' : 'white',
              }}
            >
              {/* 레이드 그룹 헤더 */}
              <div
                onClick={() => toggleRaidGroup(raidGroup)}
                style={{
                  padding: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  userSelect: 'none',
                }}
              >
                <div style={{textAlign: 'left'}}>
                  <h3 style={{margin: '0 0 5px 0'}}>
                    {raidGroup}
                    {isOverLimit && (
                      <span style={{marginLeft: '10px', color: '#f44336', fontSize: '14px'}}>
                        (3회 골드 획득 완료)
                      </span>
                    )}
                  </h3>
                  <p style={{margin: '5px 0', color: '#666', fontSize: '14px'}}>
                    {isGroupCompleted ? '완료됨' : '미완료'} | 클릭하여 {isExpanded ? '접기' : '펼치기'}
                  </p>
                </div>
                <div style={{textAlign: 'right'}}>
                  <p style={{margin: '0', fontSize: '20px', fontWeight: 'bold', color: groupGold > 0 ? '#4CAF50' : '#999'}}>
                    {groupGold.toLocaleString()}G
                  </p>
                  <p style={{margin: '5px 0', fontSize: '24px'}}>
                    {isExpanded ? '▲' : '▼'}
                  </p>
                </div>
              </div>

              {/* 펼쳐진 내용 */}
              {isExpanded && (
                <div style={{padding: '0 15px 15px 15px', borderTop: '1px solid #ddd'}}>
                  {/* 난이도 선택 버튼 */}
                  <div style={{display: 'flex', gap: '10px', marginTop: '15px', marginBottom: '15px'}}>
                    {raids.map(raid => (
                      <button
                        key={raid.id}
                        onClick={() => selectDifficulty(raidGroup, raid.raid.difficulty)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: selectedDiff === raid.raid.difficulty ? '#2196F3' : '#f0f0f0',
                          color: selectedDiff === raid.raid.difficulty ? 'white' : 'black',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: selectedDiff === raid.raid.difficulty ? 'bold' : 'normal',
                        }}
                      >
                        {raid.raid.difficulty} (Lv.{raid.raid.requiredItemLevel})
                      </button>
                    ))}
                  </div>

                  {/* 선택된 난이도의 관문 목록 */}
                  {selectedRaid && (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                      {selectedRaid.gateCompletions.map((gate) => {
                        const isOtherGateCompleted = !gate.completed && 
                          isGateCompleted(raidGroup, gate.raidGate.gateNumber);
                        const isProcessing = processingGateId === gate.id;

                        return (
                          <div
                            key={gate.id}
                            style={{
                              border: '1px solid ' + (gate.completed ? '#4CAF50' : isOtherGateCompleted ? '#ffcccc' : '#ddd'),
                              padding: '10px',
                              borderRadius: '5px',
                              backgroundColor: gate.completed ? '#e8f5e9' : isOtherGateCompleted ? '#fff5f5' : 'white',
                              opacity: isOtherGateCompleted ? 0.6 : 1,
                            }}
                          >
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <div>
                                <strong>{gate.raidGate.gateNumber}관문</strong>
                                <span style={{marginLeft: '10px', color: '#666'}}>
                                  보상: {gate.raidGate.rewardGold.toLocaleString()}G
                                </span>
                                {gate.extraReward && (
                                  <span style={{marginLeft: '10px', color: '#f44336'}}>
                                    (더보기: -{gate.raidGate.extraCost.toLocaleString()}G)
                                  </span>
                                )}
                                {isOtherGateCompleted && (
                                  <span style={{marginLeft: '10px', color: '#f44336', fontSize: '12px'}}>
                                    (다른 난이도 완료됨)
                                  </span>
                                )}
                              </div>
                              <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                {!gate.completed ? (
                                  <>
                                    <label style={{cursor: isOtherGateCompleted ? 'not-allowed' : 'pointer'}}>
                                      <input
                                        type="checkbox"
                                        id={`extra-${gate.id}`}
                                        style={{marginRight: '5px'}}
                                        disabled={isOtherGateCompleted || isProcessing}
                                      />
                                      더보기
                                    </label>
                                    {isOverLimit && (
                                      <span style={{color: '#f44336', fontSize: '14px'}}>
                                        예상: 0G
                                      </span>
                                    )}
                                    <button
                                      onClick={() => {
                                        const extraCheckbox = document.getElementById(`extra-${gate.id}`);
                                        handleGateComplete(gate.id, extraCheckbox?.checked || false);
                                      }}
                                      disabled={isOtherGateCompleted || isProcessing}
                                      style={{
                                        padding: '5px 15px',
                                        backgroundColor: isOtherGateCompleted || isProcessing ? '#ccc' : '#4CAF50',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: isOtherGateCompleted || isProcessing ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                      }}
                                    >
                                      {isProcessing ? '처리중...' : '완료'}
                                    </button>
                                  </>
                                ) : (
                                  <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                    <span style={{color: '#4CAF50', fontWeight: 'bold'}}>
                                      획득: {gate.earnedGold.toLocaleString()}G
                                    </span>
                                    <button
                                      onClick={() => handleGateUncomplete(gate.id)}
                                      disabled={isProcessing}
                                      style={{
                                        padding: '5px 15px',
                                        backgroundColor: isProcessing ? '#ccc' : '#f44336',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                      }}
                                    >
                                      {isProcessing ? '처리중...' : '취소'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RaidChecklist;