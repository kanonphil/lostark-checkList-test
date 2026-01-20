import { useState, useEffect } from "react";
import { characterAPI } from "../services/api";
import { useTheme, getTheme } from "../hooks/useTheme";

function CharacterManagement({ characters, onUpdate, currentUserId }) {
  const [importName, setImportName] = useState('');
  const [importing, setImporting] = useState(false);

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

  const handleImport = async () => {
    if (!importName.trim()) {
      alert('캐릭터 이름을 입력하세요');
      return;
    }
  
    try {
      setImporting(true);
      await characterAPI.importCharacter(currentUserId, importName);
      alert('캐릭터를 추가했습니다!');
      setImportName('');
      onUpdate();
    } catch (error) {
      alert(error.response?.data || '캐릭터 추가 실패');
    } finally {
      setImporting(false);
    }
  };

  const handleSync = async (id, characterName) => {
    try {
      await characterAPI.syncCharacter(id);
      alert(`${characterName} 정보를 동기화했습니다!`);
      onUpdate();
    } catch (error) {
      alert(error.response?.data || '동기화 실패')
    }
  };

  const handleGoldPriorityChange = async (id, characterName, currentPriority) => {
    const newPriority = prompt(
      `${characterName}의 골드 우선순위를 입력하세요 (1-10):\n\n1-6: 골드 획득\n7 이상: 골드 미획득`,
      currentPriority
    );

    if (newPriority === null) return;

    const priority = parseInt(newPriority);
    if (isNaN(priority) || priority < 1 || priority > 10) {
      alert('1-10 사이의 숫자를 입력하세요')
      return;
    }

    try {
      await characterAPI.updateGoldPriority(id, priority);
      alert('골드 우선순위를 변경했습니다!');
      onUpdate();
    } catch (error) {
      alert(error.response?.data || '변경 실패');
    }
  };

  const handleDelete = async (id, characterName) => {
    if (!window.confirm(`정말 "${characterName}" 캐릭터를 삭제하시겠습니까?\n\n완료 기록도 모두 삭제됩니다.`)) {
      return;
    }

    try {
      await characterAPI.deleteCharacter(id);
      alert('캐릭터를 삭제했습니다!');
      onUpdate();
    } catch (error) {
      alert(error.response?.data || '삭제 실패');
    }
  }

  return (
    <div style={{
      padding: isMobile ? '10px' : '20px',
      backgroundColor: theme.bg.primary,
      minHeight: '100vh',
    }}>
      <h2 style={{
        color: theme.text.primary,
        fontSize: isMobile ? '20px' : '24px',
      }}>
        캐릭터 관리
      </h2>

      {/* 캐릭터 추가 */}
      <div style={{
        padding: '20px',
        backgroundColor: theme.bg.secondary,
        borderRadius: '8px',
        marginBottom: '30px',
      }}>
        <h3 style={{
          marginTop: 0,
          color: theme.text.primary,
          fontSize: isMobile ? '18px' : '20px',
        }}>
          새 캐릭터 추가
        </h3>
        <div style={{
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: '10px', 
          alignItems: 'center'
        }}>
          <input 
            type="text"
            value={importName}
            onChange={(e) => setImportName(e.target.value)}
            placeholder="캐릭터 이름 입력"
            onKeyDown={(e) => e.key === 'Enter' && handleImport()}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '16px',
              border: `1px solid ${theme.border.primary}`,
              borderRadius: '5px',
            }}
          />
          <button
            onClick={handleImport}
            disabled={importing}
            style={{
              padding: isMobile ? '8px 16px' : '10px 30px',
              backgroundColor: importing ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: importing ? 'not-allowed' : 'pointer',
              fontSize: isMobile ? '14px' : '16px',
              width: isMobile ? '100%' : 'auto',
            }}
          >
            {importing ? '추가 중...' : '추가'}
          </button>
        </div>
        <p style={{marginTop: '10px', color: theme.text.secondary, fontSize: '14px'}}>
          로스트아크 공식 API에서 캐릭터 정보를 가져옵니다.
        </p>
      </div>

      {/* 캐릭터 목록 */}
      <h3 style={{
        color: theme.text.primary,
        fontSize: isMobile ? '18px' : '20px',
      }}>
        내 캐릭터 ({characters.length}개)
      </h3>
      <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
        {characters.map((char) => (
          <div
            key={char.id}
            style={{
              border: `1px solid ${theme.card.border}`,
              padding: isMobile ? '12px' : '15px',
              borderRadius: '8px',
              backgroundColor: theme.card.bg,
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '10px' : '0',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
            }}
          >
            {/* 캐릭터 정보 */}
            <div>
              <h4 style={{margin: '0 0 5px 0', textAlign: 'left'}}>{char.characterName}</h4>
              <p style={{margin: '5px 0', color: theme.text.secondary, fontSize: '14px', textAlign: 'left'}}>
                {char.className} | 레벨: {char.itemLevel} | 서버: {char.serverName}
              </p>
              <p style={{margin: '5px 0', fontSize: '14px', textAlign: 'left'}}>
                골드 우선순위: <strong>{char.goldPriority}</strong>
                {char.goldPriority <= 6 ? ' (골드 획득)' : ' (골드 미획득)'}
              </p>
            </div>

            {/* 버튼들 */}
            <div style={{
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: '10px',
              width: isMobile ? '100%' : 'auto',
            }}>
              <button
                onClick={() => handleSync(char.id, char.characterName)}
                style={{
                  padding: isMobile ? '8px 16px' : '10px 30px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '14px' : '16px',
                  width: isMobile ? '100%' : 'auto',
                }}
              >
                동기화
              </button>
              <button
                onClick={() => handleGoldPriorityChange(char.id, char.characterName, char.goldPriority)}
                style={{
                  padding: isMobile ? '8px 16px' : '10px 30px',
                  backgroundColor: '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '14px' : '16px',
                  width: isMobile ? '100%' : 'auto',
                }}
              >
                우선순위 변경
              </button>
              <button
                onClick={() => handleDelete(char.id, char.characterName)}
                style={{
                  padding: isMobile ? '8px 16px' : '10px 30px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '14px' : '16px',
                  width: isMobile ? '100%' : 'auto',
                }}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CharacterManagement;