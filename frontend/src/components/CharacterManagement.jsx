import { useState, useEffect } from "react";
import { characterAPI } from "../services/api";
import { useTheme, getTheme } from "../hooks/useTheme";

function CharacterManagement({ characters, onUpdate, currentUserId }) {
  const [importName, setImportName] = useState('');
  const [importing, setImporting] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false)
  // 전체 동기화 상태
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 }) // 진행률

  // 다크모드
  const { isDark } = useTheme()
  const theme = getTheme(isDark)

  // 모바일
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

  // 전체 동기화 함수
  const handleSyncAll = async () => {
    if (characters.length === 0) {
      alert('동기화할 캐릭터가 없습니다.')
      return
    }

    if (!window.confirm(`${characters.length}개의 캐릭터를 모두 동기화하시겠습니까?`)) {
      return
    }

    try {
      setSyncingAll(true)
      setSyncProgress({ current: 0, total: characters.length })

      let successCount = 0
      let failCount = 0

      for (let i = 0; i < characters.length; i++) {
        const char = characters[i];
        setSyncProgress({ current: i + 1, total: characters.length })

        try {
          await characterAPI.syncCharacter(char.id)
          successCount++
        } catch (error) {
          console.error(`${char.characterName} 동기화 실패:`, error)
          failCount++
        }

        // 0.5초 대기 (API 부하 방지)
        if (i < characters.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      onUpdate()
      alert(`전체 동기화 완료!\n성공: ${successCount}개, 실패: ${failCount}개`)
    } catch (error) {
      alert('전체 동기화 중 오류 발생');
    } finally {
      setSyncingAll(false)
      setSyncProgress({ current: 0, total: 0 })
    }
  }

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
        padding: isMobile ? '15px' : '20px',
        backgroundColor: theme.bg.secondary,
        borderRadius: '8px',
        marginBottom: isMobile ? '15px' : '30px',
      }}>
        <h3 style={{
          marginTop: 0,
          color: theme.text.primary,
          fontSize: isMobile ? '16px' : '20px',
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
              padding: isMobile ? '8px' : '10px',
              fontSize: isMobile ? '14px' : '16px',
              border: `1px solid ${theme.border.primary}`,
              borderRadius: '5px',
              backgroundColor: theme.bg.secondary,
              color: theme.text.primary,
            }}
          />
          <button
            onClick={handleImport}
            disabled={importing || syncingAll}
            style={{
              padding: isMobile ? '8px 16px' : '10px 30px',
              backgroundColor: importing ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: (importing || syncingAll) ? 'not-allowed' : 'pointer',
              fontSize: isMobile ? '13px' : '16px',
              width: isMobile ? '100%' : 'auto',
            }}
          >
            {importing ? '추가 중...' : '추가'}
          </button>
        </div>
        <p style={{
          marginTop: '10px', 
          color: theme.text.secondary, 
          fontSize: isMobile ? '12px' : '14px'
        }}>
          로스트아크 공식 API에서 캐릭터 정보를 가져옵니다.
        </p>
      </div>

      {/* 전체 동기화 버튼 */}
      {characters.length > 0 && (
        <div style={{
          marginBottom: isMobile ? '15px' : '20px',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            type="button"
            onClick={handleSyncAll}
            disabled={syncingAll || importing}
            style={{
              padding: isMobile ? '8px 16px' : '10px 24px',
              backgroundColor: syncingAll ? '#999' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: (syncingAll || importing) ? 'not-allowed' : 'pointer',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: 'bold',
              width: isMobile ? '100%' : 'auto',
              boxShadow: syncingAll ? 'none' : '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            {syncingAll
              ? `🔄 동기화 중... (${syncProgress.current}/${syncProgress.total})`
              : `🔄 전체 동기화 (${characters.length}개)`
            }
          </button>
        </div>
      )}

      {/* 캐릭터 목록 */}
      <h3 style={{
        color: theme.text.primary,
        fontSize: isMobile ? '16px' : '20px',
      }}>
        내 캐릭터 ({characters.length}개)
      </h3>
      
      {characters.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: theme.text.secondary,
          backgroundColor: theme.card.bg,
          borderRadius: '8px',
        }}>
          <p>등록된 캐릭터가 없습니다.</p>
          <p>위에서 캐릭터를 추가해주세요.</p>
        </div>
      ) : (
        <div style={{
          display: 'flex', 
          flexDirection: 'column', 
          gap: isMobile ? '8px' : '10px'
        }}>
          {characters.map((char) => (
            <div
              key={char.id}
              style={{
                border: `1px solid ${theme.card.border}`,
                padding: isMobile ? '10px' : '16px',
                borderRadius: '8px',
                backgroundColor: theme.card.bg,
                opacity: syncingAll ? 0.6 : 1,
              }}
            >
              {/* 캐릭터 정보 */}
              <div style={{ marginBottom: isMobile ? '8px' : '0' }}>
                <h4 style={{
                  margin: '0 0 5px 0', 
                  textAlign: 'left',
                  color: theme.text.primary,
                  fontSize: isMobile ? '15px' : '17px',
                }}>
                  {char.characterName}
                </h4>
                <p style={{
                  margin: '3px 0', 
                  color: theme.text.secondary, 
                  fontSize: isMobile ? '12px' : '14px', 
                  textAlign: 'left'
                }}>
                  {char.className} | 레벨: {char.itemLevel} | 서버: {char.serverName}
                </p>
                <p style={{
                  margin: '3px 0', 
                  fontSize: isMobile ? '12px' : '13px', 
                  textAlign: 'left',
                  color: theme.text.secondary,
                }}>
                  골드 우선순위: <strong style={{ color: theme.text.primary }}>{char.goldPriority}</strong>
                  {char.goldPriority <= 6 ? ' (골드 획득)' : ' (골드 미획득)'}
                </p>
              </div>

              {/* 버튼들 */}
              <div style={{
                display: 'flex', 
                gap: isMobile ? '6px' : '8px',
                width: '100%',
                marginTop: isMobile ? '8px' : '0',
              }}>
                <button
                  onClick={() => handleSync(char.id, char.characterName)}
                  disabled={syncingAll}
                  style={{
                    flex: isMobile ? 1 : 0,
                    padding: isMobile ? '7px 8px' : '8px 16px',
                    backgroundColor: syncingAll ? '#ccc' : '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: syncingAll ? 'not-allowed' : 'pointer',
                    fontSize: isMobile ? '12px' : '13px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  동기화
                </button>
                <button
                  onClick={() => handleGoldPriorityChange(char.id, char.characterName, char.goldPriority)}
                  disabled={syncingAll}
                  style={{
                    flex: isMobile ? 1 : 0,
                    padding: isMobile ? '7px 8px' : '8px 16px',
                    backgroundColor: syncingAll ? '#ccc' : '#FF9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: syncingAll ? 'not-allowed' : 'pointer',
                    fontSize: isMobile ? '12px' : '13px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isMobile ? '우선순위' : '우선순위'}
                </button>
                <button
                  onClick={() => handleDelete(char.id, char.characterName)}
                  disabled={syncingAll}
                  style={{
                    flex: isMobile ? 1 : 0,
                    padding: isMobile ? '7px 8px' : '8px 16px',
                    backgroundColor: syncingAll ? '#ccc' : '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: syncingAll ? 'not-allowed' : 'pointer',
                    fontSize: isMobile ? '12px' : '13px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CharacterManagement;