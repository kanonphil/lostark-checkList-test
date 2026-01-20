import { useState, useEffect } from "react";
import { accountAPI } from "../services/api";
import { useTheme, getTheme } from "../hooks/useTheme";

function RaidComparison({ currentUserId }) {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);

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
    <div style={{
      padding: isMobile ? '10px' : '20px',
      maxWidth: '100%',
      overflowX: 'auto',
      backgroundColor: theme.bg.primary,
      minHeight: '100vh',
    }}>
      <h2 style={{
        color: theme.text.primary,
        fontSize: isMobile ? '20px' : '24px',
      }}>
        레이드 비교
      </h2>
      <p style={{color: theme.text.secondary, marginBottom: '20px'}}>
        내 캐릭터의 레이드 완료 현황을 한눈에 확인하세요
      </p>

      {/* ✅ 반응형 테이블 컨테이너 */}
      <div style={{
        overflowX: 'auto',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        backgroundColor: theme.card.bg
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: '800px',
          color: theme.text.primary,
        }}>
          <thead>
            <tr style={{backgroundColor: theme.bg.secondary}}>
              {/* ✅ 첫 번째 열 고정 */}
              <th style={{
                padding: isMobile ? '10px' : '15px',
                fontSize: isMobile ? '13px' : '14px',
                textAlign: 'center',
                borderBottom: '2px solid #ddd',
                position: 'sticky',
                left: 0,
                backgroundColor: theme.bg.secondary,
                color: theme.text.primary,
                zIndex: 10,
                minWidth: '200px'
              }}>
                레이드
              </th>
              {comparison.raids[0].characters.map((char) => (
                <th key={char.characterId} style={{
                  padding: '15px',
                  textAlign: 'center',
                  borderBottom: '2px solid #ddd',
                  minWidth: '130px',
                }}>
                  <div style={{fontWeight: 'bold', marginBottom: '5px'}}>
                    {char.characterName}
                  </div>
                  <div style={{fontSize: '12px', color: theme.text.secondary, fontWeight: 'normal'}}>
                    Lv.{char.itemLevel?.toFixed(2)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparison.raids.map((raid, index) => (
              <tr key={raid.raidId} style={{
                backgroundColor: index % 2 === 0 ? theme.card.bg : theme.bg.secondary,
              }}>
                {/* ✅ 첫 번째 열 고정 */}
                <td style={{
                  padding: '15px',
                  borderBottom: '1px solid #eee',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: index % 2 === 0 ? theme.card.bg : theme.bg.secondary,
                  zIndex: 5,
                  fontWeight: 'bold',
                }}>
                  <div style={{fontSize: '15px'}}>
                    {raid.raidName}
                  </div>
                  <div style={{fontSize: '13px', color: theme.text.secondary, marginTop: '5px', fontWeight: 'normal'}}>
                    {raid.difficulty} · Lv.{raid.requiredItemLevel}
                  </div>
                </td>
                {raid.characters.map((char) => (
                  <td key={char.characterId} style={{
                    padding: '15px',
                    textAlign: 'center',
                    borderBottom: '1px solid #eee',
                  }}>
                    {!char.available ? (
                      <span style={{color: '#ccc', fontSize: '14px'}}>레벨 부족</span>
                    ) : char.completed ? (
                      <div>
                        <div style={{
                          color: '#4CAF50',
                          fontWeight: 'bold',
                          fontSize: '16px',
                          marginBottom: '5px',
                        }}>
                          ✓ 완료
                        </div>
                        <div style={{fontSize: '13px', color: theme.text.secondary}}>
                          {char.earnedGold.toLocaleString()}G
                        </div>
                      </div>
                    ) : (
                      <span style={{color: theme.text.tertiary, fontSize: '14px'}}>미완료</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ 모바일 안내 */}
      <p style={{
        marginTop: '15px',
        fontSize: '13px',
        color: theme.text.tertiary,
        textAlign: 'center'
      }}>
        💡 테이블을 좌우로 스크롤할 수 있습니다
      </p>
    </div>
  );
}

export default RaidComparison;