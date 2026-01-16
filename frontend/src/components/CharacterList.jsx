import { useState, useEffect } from "react";
import { characterAPI } from "../services/api";
import ResetTimer from "./ResetTimer";

function CharacterList({ onCharacterSelect, currentUserId }) {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

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
      console.log('setCharacters 완료');
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>로딩 중...</div>;

  // ✅ 총 골드 계산
  const totalGold = 0;  // 나중에 구현

  return (
    <div style={{ padding: '20px' }}>
      <ResetTimer />
      <h2>내 캐릭터</h2>

      {/* 계정 전체 통계 */}
      <div style={{
        backgroundColor: '#f0f0f0',
        padding: '15px',
        marginBottom: '20px',
        borderRadius: '8px'
      }}>
        <h3>계정 전체 골드: {totalGold.toLocaleString()}G</h3>
      </div>

      {/* ✅ 캐릭터 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {characters.map((char) => (
          <div 
            key={char.id}
            onClick={() => onCharacterSelect && onCharacterSelect(char)}
            style={{
              border: '1px solid #ddd',
              padding: '15px',
              borderRadius: '8px',
              backgroundColor: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            {/* 왼쪽: 캐릭터 정보 */}
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ margin: '0 0 5px 0' }}>{char.characterName || '이름없음'}</h3>
              <p style={{ margin: '5px 0' }}>
                {char.className || '?'} | 레벨: {char.itemLevel?.toFixed(2) || '?'}
              </p>
              <p style={{ margin: '5px 0' }}>
                골드 우선순위: {char.goldPriority || 6}
              </p>
            </div>

            {/* 오른쪽: 골드 정보 */}
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '5px 0', fontSize: '18px', fontWeight: 'bold' }}>
                0G
              </p>
              <p style={{ margin: '5px 0', color: '#666' }}>
                완료: 0/0 (0%)
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CharacterList;