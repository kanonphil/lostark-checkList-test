import { useState, useEffect } from "react";
import { characterAPI, completionAPI } from "../services/api";
import ResetTimer from "./ResetTimer";
import { useTheme, getTheme } from "../hooks/useTheme";

function CharacterList({ onCharacterSelect, currentUserId, refreshTrigger }) {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [characterStats, setCharacterStats] = useState({});

  const { isDark } = useTheme()
  const theme = getTheme(isDark)

  const [isMobile, setIsMobile] = useState(false)

  const hoverBg = isDark ? '#2d2d2d' : '#f9f9f9';
  const normalBg = theme.card.bg;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // console.log('=== CharacterList useEffect 실행 ===');
    // console.log('currentUserId:', currentUserId);
    loadData();
  }, [currentUserId, refreshTrigger]); // ✅ refreshTrigger 추가

  const loadData = async () => {
    try {
      setLoading(true);
      
      // console.log('API 호출 전 - currentUserId:', currentUserId);
      const charResponse = await characterAPI.getAll(currentUserId);
      // console.log('API 응답:', charResponse.data);
      // console.log('캐릭터 개수:', charResponse.data.length);
      
      setCharacters(charResponse.data);
      
      // ✅ 각 캐릭터의 완료 현황 불러오기 (강제 새로고침)
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
          
          // console.log(`캐릭터 ${char.characterName} 통계:`, stats[char.id]);
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
      // console.log('=== 전체 캐릭터 통계 로딩 완료 ===');
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>로딩 중...</div>;

  const totalGold = Object.values(characterStats).reduce((sum, stat) => sum + stat.totalGold, 0);

  return (
    <div style={{ 
      padding: isMobile ? '10px' : '20px',
      backgroundColor: theme.bg.primary,
      minHeight: '100vh',
    }}>
      <ResetTimer />
      <h2 style={{
        color: theme.text.primary,
        fontSize: isMobile ? '20px' : '24px',
      }}>내 캐릭터 ({characters.length}개)</h2>

      {/* 계정 전체 통계 */}
      <div style={{
        backgroundColor: theme.bg.secondary,
        padding: '15px',
        marginBottom: '20px',
        borderRadius: '8px'
      }}>
        <h3 style={{
          margin: 0,
          color: theme.text.primary,
          fontSize: isMobile ? '18px' : '20px',
        }}>
          계정 전체 골드: {totalGold.toLocaleString()}G
        </h3>
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
                border: `1px solid ${theme.card.border}`,
                padding: isMobile ? '15px' : '20px',
                borderRadius: '10px',
                backgroundColor: theme.card.bg,
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: isMobile ? '10px' : '0',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hoverBg;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = normalBg;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
              }}
            >
              {/* 왼쪽: 캐릭터 정보 */}
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ 
                  margin: '0 0 10px 0', 
                  color: theme.text.primary,
                  fontSize: isMobile ? '18px' : '20px',
                }}>
                  {char.characterName || '이름없음'}
                </h3>
                <p style={{ margin: '5px 0', color: theme.text.secondary, fontSize: '15px' }}>
                  {char.className || '?'} | 레벨: {char.itemLevel?.toFixed(2) || '?'}
                </p>
                <p style={{ margin: '5px 0', color: theme.text.secondary, fontSize: '15px' }}>
                  서버: {char.serverName || '?'}
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                  골드 우선순위: <strong>{char.goldPriority || 6}</strong>
                  {(char.goldPriority || 6) <= 6 ? ' (골드 획득)' : ' (골드 미획득)'}
                </p>
              </div>

              {/* 오른쪽: 골드 정보 */}
              <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                <p style={{ 
                  margin: '0 0 10px 0', 
                  fontSize: isMobile ? '20px' : '24px', 
                  fontWeight: 'bold', 
                  color: stats.totalGold > 0 ? '#4CAF50' : theme.text.tertiary 
                }}>
                  {stats.totalGold.toLocaleString()}G
                </p>
                <p style={{ margin: '5px 0', color: theme.text.secondary, fontSize: '14px' }}>
                  완료: {stats.completedCount}/{stats.totalCount}
                </p>
                <p style={{ margin: '5px 0', color: theme.text.tertiary, fontSize: '13px' }}>
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