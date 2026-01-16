import { useState, useEffect } from "react";
import { accountAPI } from "../services/api";

function RaidComparison({ currentUserId }) {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComparison();
  }, [currentUserId]);

  const loadComparison = async () => {
    try {
      setLoading(true);
      const response = await accountAPI.getRaidComparison(currentUserId);
      setComparison(response.data);
    } catch (error) {
      console.error('레이드 비교 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{padding: '20px'}}>로딩 중...</div>;

  if (!comparison || comparison.raids.length === 0) {
    return <div style={{padding: '20px'}}>데이터가 없습니다.</div>;
  }

  return (
    <div style={{padding: '20px'}}>
      <h2>레이드 비교</h2>
      <p style={{color: '#666', marginBottom: '20px'}}>
        내 캐릭터의 레이드 완료 현황을 한눈에 확인하세요
      </p>

      <div style={{overflowX: 'auto'}}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: '800px',
        }}>
          <thead>
            <tr style={{backgroundColor: '#f5f5f5'}}>
              <th style={{
                padding: '12px',
                textAlign: 'center',
                borderBottom: '2px solid #ddd',
                position: 'sticky',
                left: 0,
                backgroundColor: '#f5f5f5',
                zIndex: 2,
              }}>
                레이드
              </th>
              {comparison.raids[0].characters.map((char) => (
                <th key={char.characterId} style={{
                  padding: '12px',
                  textAlign: 'center',
                  borderBottom: '2px solid #ddd',
                  minWidth: '120px',
                }}>
                  {char.characterName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparison.raids.map((raid, index) => (
              <tr key={raid.raidId} style={{
                backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9',
              }}>
                <td style={{
                  padding: '12px',
                  borderBottom: '1px solid #ddd',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9',
                  zIndex: 1,
                  fontWeight: 'bold',
                }}>
                  <div>
                    {raid.raidName} ({raid.difficulty})
                  </div>
                  <div style={{fontSize: '12px', color: '#666', marginTop: '3px'}}>
                    Lv.{raid.requiredItemLevel}
                  </div>
                </td>
                {raid.characters.map((char) => (
                  <td key={char.characterId} style={{
                    padding: '12px',
                    textAlign: 'center',
                    borderBottom: '1px solid #ddd',
                  }}>
                    {!char.available ? (
                      <span style={{color: '#999'}}>레벨 부족</span>
                    ) : char.completed ? (
                      <div>
                        <div style={{
                          color: '#4CAF50',
                          fontWeight: 'bold',
                          marginBottom: '3px',
                        }}>
                          ✓ 완료
                        </div>
                        <div style={{fontSize: '12px', color: '#4CAF50'}}>
                          {char.earnedGold.toLocaleString()}G
                        </div>
                      </div>
                    ) : (
                      <span style={{color: '#999'}}>미완료</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RaidComparison;