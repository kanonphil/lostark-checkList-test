import { useState, useEffect } from 'react';
import { completionAPI } from '../services/api';
import ResetTimer from './ResetTimer';
import { useTheme, getTheme } from '../hooks/useTheme';

function RaidChecklist({ character, onUpdate }) {
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalGold, setTotalGold] = useState(0);
  const [processingGateId, setProcessingGateId] = useState(null);
  const [expandedRaids, setExpandedRaids] = useState({});
  const [selectedDifficulty, setSelectedDifficulty] = useState({});

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
      await loadTotalGold();
    } catch (error) {
      console.error('체크리스트 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTotalGold = async () => {
    try {
      const response = await completionAPI.getTotalGold(character.id);
      console.log('총 골드 조회:', response.data);
      setTotalGold(response.data);
    } catch (error) {
      console.error('총 골드 조회 실패:', error);
    }
  };

  const refreshData = async () => {
    try {
      console.log('데이터 새로고침 시작...');
      
      // ✅ 강제로 새로운 데이터 가져오기 (캐시 무시)
      const response = await completionAPI.getCurrentWeek(character.id);
      console.log('완료 데이터 조회 완료:', response.data);
      
      // ✅ 상태를 완전히 새로 설정 (이전 상태 무시)
      setCompletions([...response.data]); // 새 배열로 복사하여 React가 변경 감지하도록
      
      // ✅ 총 골드도 새로 조회
      const goldResponse = await completionAPI.getTotalGold(character.id);
      console.log('총 골드 조회 완료:', goldResponse.data);
      setTotalGold(goldResponse.data);
      
      console.log('데이터 새로고침 완료!');
    } catch (error) {
      console.error('데이터 새로고침 실패:', error);
    }
  };

  const handleGateComplete = async (gateCompletionId, extraReward) => {
    try {
      setProcessingGateId(gateCompletionId);
      console.log('관문 완료 요청:', gateCompletionId, '더보기:', extraReward);
      
      await completionAPI.completeGate(gateCompletionId, extraReward);
      console.log('관문 완료 성공');
      
      await refreshData();
      
      // ✅ 부모 컴포넌트에 업데이트 알림
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('완료 처리 실패:', error);
      alert(error.response?.data || '완료 처리 실패');
    } finally {
      setProcessingGateId(null);
    }
  };

  const handleGateUncomplete = async (gateCompletionId) => {
    try {
      setProcessingGateId(gateCompletionId);
      console.log('=== 완료 취소 시작 ===');
      console.log('취소할 관문 ID:', gateCompletionId);
      
      // ✅ 취소 API 호출
      const response = await completionAPI.uncompleteGate(gateCompletionId);
      console.log('취소 API 응답:', response.data);
      
      // ✅ 데이터 완전히 새로고침
      await refreshData();
      
      console.log('=== 완료 취소 완료 ===');
    } catch (error) {
      console.error('완료 취소 실패:', error);
      alert('완료 취소에 실패했습니다: ' + (error.response?.data || error.message));
    } finally {
      setProcessingGateId(null);
    }
  };

  // 레이드 그룹별로 분류
  const groupedRaids = completions.reduce((acc, completion) => {
    const group = completion.raid.raidGroup;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(completion);
    return acc;
  }, {});

  // 레이드 그룹 토글
  const toggleRaidGroup = (raidGroup) => {
    setExpandedRaids(prev => ({
      ...prev,
      [raidGroup]: !prev[raidGroup]
    }));
  };

  // 난이도 선택
  const selectDifficulty = (raidGroup, difficulty) => {
    setSelectedDifficulty(prev => ({
      ...prev,
      [raidGroup]: difficulty
    }));
  };

  // 같은 레이드 그룹의 같은 관문이 완료되었는지
  const isGateCompleted = (raidGroup, gateNumber) => {
    // 같은 레이드 그룹의 WeeklyCompletion들 찾기
    const sameGroupCompletions = completions.filter(c => 
      c.raid.raidGroup === raidGroup
    );
    
    // 같은 그룹에서 하나라도 completed=true인 것이 있는지 확인
    const isGroupCompleted = sameGroupCompletions.some(c => c.completed);
    
    if (!isGroupCompleted) {
      return false; // 그룹이 완료 안 됨 → 이 관문도 완료 안 됨
    }
    
    // 그룹이 완료되었으면, 이 관문 번호가 실제로 완료되었는지 확인
    return sameGroupCompletions.some(c => 
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
    <div style={{
      padding: isMobile ? '10px' : '20px',
      backgroundColor: theme.bg.primary,
      minHeight: '100vh',
    }}>
      <ResetTimer />
      
      <div style={{
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        gap: isMobile ? '10px' : '0',
        marginBottom: '20px'
      }}>
        <h2 style={{
          color: theme.text.primary,
          fontSize: isMobile ? '20px' : '24px',
        }}>
          {character.characterName}의 레이드 체크리스트
        </h2>
        <div style={{textAlign: isMobile ? 'left' : 'right'}}>
          <p style={{
            margin: '5px 0', 
            fontSize: isMobile ? '20px' : '24px', 
            fontWeight: 'bold', 
            color: '#4CAF50'
          }}>
            총 골드: {totalGold.toLocaleString()}G
          </p>
          <p style={{
            margin: '5px 0', 
            color: completedGroups >= 3 ? '#f44336' : theme.text.secondary
          }}>
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
          
          // ✅ 완료된 관문 개수 계산
          const completedGatesCount = raids.reduce((total, raid) => {
            return total + raid.gateCompletions.filter(gc => gc.completed).length;
          }, 0);
          const totalGatesCount = raids.reduce((total, raid) => {
            return total + raid.gateCompletions.length;
          }, 0);
          
          // 선택된 난이도의 레이드 찾기
          const selectedDiff = selectedDifficulty[raidGroup] || raids[0].raid.difficulty;
          const selectedRaid = raids.find(r => r.raid.difficulty === selectedDiff);

          return (
            <div
              key={raidGroup}
              style={{
                border: `2px solid ${isGroupCompleted ? '#4CAF50' : isOverLimit ? '#ffcccc' : theme.card.border}`,
                borderRadius: '8px',
                backgroundColor: isGroupCompleted 
                  ? (isDark ? '#1b2e1b' : '#f1f8f4')
                  : isOverLimit 
                    ? (isDark ? '#3d1f1f' : '#fff5f5') 
                    : theme.card.bg,
              }}
            >
              {/* 레이드 그룹 헤더 */}
              <div
                onClick={() => toggleRaidGroup(raidGroup)}
                style={{
                  padding: isMobile ? '12px' : '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  userSelect: 'none',
                  gap: isMobile ? '10px' : '0',
                }}
              >
                <div style={{textAlign: 'left'}}>
                  <h3 style={{
                    margin: '0 0 5px 0',
                    color: theme.text.primary,
                    fontSize: isMobile ? '18px' : '20px',
                  }}>
                    {raidGroup}
                    {isOverLimit && (
                      <span style={{marginLeft: '10px', color: '#f44336', fontSize: '14px'}}>
                        (3회 골드 획득 완료)
                      </span>
                    )}
                  </h3>
                  <p style={{margin: '5px 0', color: theme.text.secondary, fontSize: '14px'}}>
                    {completedGatesCount > 0 
                      ? `${completedGatesCount}/${totalGatesCount} 관문 완료` 
                      : '미완료'} | 클릭하여 {isExpanded ? '접기' : '펼치기'}
                  </p>
                </div>
                <div style={{textAlign: 'right'}}>
                  <p style={{
                    margin: '0', 
                    fontSize: isMobile ? '18px' : '20px', 
                    fontWeight: 'bold', 
                    color: groupGold > 0 ? '#4CAF50' : theme.text.tertiary
                  }}>
                    {groupGold.toLocaleString()}G
                  </p>
                  <p style={{margin: '5px 0', fontSize: '24px'}}>
                    {isExpanded ? '▲' : '▼'}
                  </p>
                </div>
              </div>

              {/* 펼쳐진 내용 */}
              {isExpanded && (
                <div style={{
                  padding: '0 15px 15px 15px', 
                  borderTop: `1px solid ${theme.border.primary}`
                }}>
                  {/* 난이도 선택 버튼 */}
                  <div style={{display: 'flex', gap: '10px', marginTop: '15px', marginBottom: '15px'}}>
                    {raids.map(raid => (
                      <button
                        key={raid.id}
                        onClick={() => selectDifficulty(raidGroup, raid.raid.difficulty)}
                        style={{
                          padding: isMobile ? '6px 12px' : '8px 16px',
                          backgroundColor: selectedDiff === raid.raid.difficulty ? '#2196F3' : theme.bg.secondary,
                          color: selectedDiff === raid.raid.difficulty ? 'white' : theme.text.primary,
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: isMobile ? '13px' : '14px',
                          fontWeight: selectedDiff === raid.raid.difficulty ? 'bold' : 'normal',
                        }}
                      >
                        {raid.raid.difficulty} (Lv.{raid.raid.requiredItemLevel})
                      </button>
                    ))}
                  </div>

                  {/* 선택된 난이도의 관문 목록 */}
                  {selectedRaid && (
                    <div style={{
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '10px'
                    }}>
                      {selectedRaid.gateCompletions.map((gate) => {
                        const isOtherGateCompleted = !gate.completed && 
                          isGateCompleted(raidGroup, gate.raidGate.gateNumber);
                        const isProcessing = processingGateId === gate.id;

                        return (
                          <div
                            key={gate.id}
                            style={{
                              border: `1px solid ${gate.completed ? '#4CAF50' : isOtherGateCompleted ? '#ffcccc' : theme.border.primary}`,
                              padding: isMobile ? '8px' : '10px',
                              borderRadius: '5px',
                              backgroundColor: gate.completed 
                                ? (isDark ? '#1b2e1b' : '#e8f5e9') 
                                : isOtherGateCompleted 
                                  ? (isDark ? '#3d1f1f' : '#fff5f5')
                                  : theme.card.bg,
                              opacity: isOtherGateCompleted ? 0.6 : 1,
                            }}
                          >
                            <div style={{
                              display: 'flex', 
                              flexDirection: isMobile ? 'column' : 'row',
                              justifyContent: 'space-between', 
                              alignItems: isMobile ? 'flex-start' : 'center',
                              gap: isMobile ? '10px' : '0',
                            }}>
                              <div>
                                <strong style={{ color: theme.text.primary }}>{gate.raidGate.gateNumber}관문</strong>
                                <span style={{marginLeft: '10px', color: theme.text.secondary}}>
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
                                        padding: isMobile ? '4px 12px' : '5px 15px',
                                        backgroundColor: isOtherGateCompleted || isProcessing ? '#ccc' : '#4CAF50',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: isOtherGateCompleted || isProcessing ? 'not-allowed' : 'pointer',
                                        fontSize: isMobile ? '13px' : '14px',
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