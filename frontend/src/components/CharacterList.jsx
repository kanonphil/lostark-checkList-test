import { useState, useEffect } from "react";
import { characterAPI, completionAPI } from "../services/api";
import ResetTimer from "./ResetTimer";

function CharacterList({ onCharacterSelect, currentUserId }) {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [characterStats, setCharacterStats] = useState({});

  useEffect(() => {
    console.log('=== CharacterList useEffect 실행 ===');
    console.log('currentUserId:', currentUserId);
    loadData();
  }, [currentUserId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      console.log('API 호출 전 - currentUserId:', currentUserId);
      const charResponse = await characterAPI.getAll(currentUserId);
      console.log('API 응답:', charResponse.data);
      console.log('캐릭터 개수:', charResponse.data.length);
      
      setCharacters(charResponse.data);
      
      // 각 캐릭터의 완료 현황 불러오기
      const stats = {};
      for (const char of charResponse.data) {
        try {
          const completionsResponse = await completionAPI.getCurrentWeek(char.id);
          const completions = completionsResponse.data;
          
          const totalGold = completions.reduce((sum, c) => sum + (c.earnedGold || 0), 0);
          const completedCount = completions.filter(c => c.completed).length;
          const totalCount = completions.length;
          const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          
          stats[char.id] = {
            totalGold,
            completedCount,
            totalCount,
            completionRate
          };
        } catch (error) {
          console.error(`캐릭터 ${char.characterName} 완료 현황 로딩 실패:`, error);
          stats[char.id] = {
            totalGold: 0,
            completedCount: 0,
            totalCount: 0,
            completionRate: 0
          };
        }
      }
      
      setCharacterStats(stats);
      console.log('캐릭터 통계 로딩 완료:', stats);
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>로딩 중...</div>;

  const totalGold = Object.values(characterStats).reduce((sum, stat) => sum + stat.totalGold, 0);

  return (
    <div style={{ padding: '20px' }}>
      <ResetTimer />
      <h2>내 캐릭터 ({characters.length}개)</h2>

      {/* 계정 전체 통계 */}
      <div style={{
        backgroundColor: '#f0f0f0',
        padding: '15px',
        marginBottom: '20px',
        borderRadius: '8px'
      }}>
        <h3 style={{margin: 0}}>계정 전체 골드: {totalGold.toLocaleString()}G</h3>
      </div>

      {/* 캐릭터 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {characters.map((char) => {
          const stats = characterStats[char.id] || {
            totalGold: 0,
            completedCount: 0,
            totalCount: 0,
            completionRate: 0
          };

          return (
            <div 
              key={char.id}
              onClick={() => onCharacterSelect && onCharacterSelect(char)}
              style={{
                border: '1px solid #ddd',
                padding: '20px',
                borderRadius: '10px',
                backgroundColor: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9f9f9';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
              }}
            >
              {/* 왼쪽: 캐릭터 정보 */}
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>
                  {char.characterName || '이름없음'}
                </h3>
                <p style={{ margin: '5px 0', color: '#666', fontSize: '15px' }}>
                  {char.className || '?'} | 레벨: {char.itemLevel?.toFixed(2) || '?'}
                </p>
                <p style={{ margin: '5px 0', color: '#666', fontSize: '15px' }}>
                  서버: {char.serverName || '?'}
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                  골드 우선순위: <strong>{char.goldPriority || 6}</strong>
                  {(char.goldPriority || 6) <= 6 ? ' (골드 획득)' : ' (골드 미획득)'}
                </p>
              </div>

              {/* 오른쪽: 골드 정보 */}
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: 'bold', color: stats.totalGold > 0 ? '#4CAF50' : '#999' }}>
                  {stats.totalGold.toLocaleString()}G
                </p>
                <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                  완료: {stats.completedCount}/{stats.totalCount}
                </p>
                <p style={{ margin: '5px 0', color: '#999', fontSize: '13px' }}>
                  ({stats.completionRate}%)
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CharacterList;