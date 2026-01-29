import { useEffect, useState } from 'react';
import { characterAPI } from './services/api';
import { useTheme, getTheme } from './hooks/useTheme';
import Login from './components/Login';
import CharacterList from './components/CharacterList';
import RaidChecklist from './components/RaidChecklist';
import RaidComparison from './components/RaidComparison';
import CharacterManagement from './components/CharacterManagement';
import './App.css'
import PartyMatching from './components/PartyMatching';
import MasterAdmin from './components/MasterAdmin';
import Calendar from './components/Calender';

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    if (userId && username) {
      return { id: parseInt(userId), username }
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState('characters');
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [characters, setCharacters] = useState([]);

  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
  if (currentUser) {
    const loadCharacters = async () => {
      try {
        const response = await characterAPI.getAll(currentUser.id);
        setCharacters(response.data);
        
        const lastCharacterId = localStorage.getItem('lastSelectedCharacterId');
        if (lastCharacterId) {
          const lastChar = response.data.find(c => c.id === parseInt(lastCharacterId));
          if (lastChar) {
            setSelectedCharacter(lastChar);
          }
        }
      } catch (error) {
        console.error('캐릭터 로딩 실패:', error);
      }
    };

    loadCharacters();
  }
}, [refreshKey, currentUser]);
  
  const handleLogin = (user) => {
    setCurrentUser(user);
  };  

  const handleLogout = () => {
    localStorage.clear();
    setCurrentUser(null);
    setCharacters([]);
    setSelectedCharacter(null);
    window.location.reload();
  };

  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
    localStorage.setItem('lastSelectedCharacterId', character.id);
    setActiveTab('checklist');
  };

  const handleCharacterUpdate = async () => {
    setRefreshKey(prev => prev + 1);

    try {
    const response = await characterAPI.getAll(currentUser.id);
    setCharacters(response.data);
  } catch (error) {
    console.error('캐릭터 로딩 실패:', error);
  }
  };

  // 로그인 안 되어 있으면 로그인 화면
  if (!currentUser) {
    return <Login onLogin={handleLogin} />
  }

  // Master 계정 전용 UI
  if (currentUser.username === 'master') {
    return (
      <div className="App">
        <header style={{ 
          backgroundColor: isDark ? '#1a1a1a' : '#282c34',
          padding: isMobile ? '15px' : '20px',
          color: 'white',
          marginBottom: '20px',
          borderBottom: '3px solid #f44336',
        }}>
          <div style={{
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '10px' : '0',
          }}>
            {/* 제목 */}
            <h1 style={{
              margin: 0,
              fontSize: isMobile ? '18px' : '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <span style={{ fontSize: isMobile ? '24px' : '32px' }}>🔧</span>
              Master 관리자 페널
            </h1>

            {/* 유저 정보 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
            }}>
              <span style={{ 
                fontSize: isMobile ? '14px' : '16px',
                color: '#ffd700',
                fontWeight: 'bold',
              }}>
                👑 {currentUser.username}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  padding: isMobile ? '6px 12px' : '8px 16px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '13px' : '14px',
                }}
              >
                로그아웃
              </button>
            </div>
          </div>
        </header>
        
        <main style={{
          backgroundColor: theme.bg.primary,
          minHeight: '100vh',
        }}>
          <MasterAdmin currentUser={currentUser} />
        </main>
      </div>
    )
  }

  return (
    <div className="App">
      <header style={{ 
        backgroundColor: isDark ? '#1a1a1a' : '#282c34',
        padding: isMobile ? '15px' : '20px',
        color: 'white',
        marginBottom: '20px'
      }}>
        {/* 제목과 유저정보 분리 */}
        <div style={{
          display: 'flex', 
          flexDirection: 'column',
          gap: isMobile ? '10px' : '15px'
        }}>
          {/* 제목 */}
          <h1 style={{
            margin: 0,
            fontSize: isMobile ? '18px' : '24px'
          }}>
            레이드 체크리스트
          </h1>

          {/* 유저 정보 */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: isMobile ? 'flex-start' : 'flex-end',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '8px' : '15px'
          }}>
            <span style={{ fontSize: isMobile ? '14px' : '16px' }}>
              {currentUser.username}님
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: isMobile ? '6px 12px' : '8px 16px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: isMobile ? '13px' : '14px',
              }}
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 탭 버튼 */}
        <div style={{
          marginTop: isMobile ? '10px' : '15px',
          display: 'flex',
          gap: isMobile ? '5px' : '10px',
          flexWrap: 'wrap',
          overflowX: isMobile ? 'auto' : 'visible',
          WebkitOverflowScrolling: 'touch',
        }}>
          <button
            onClick={() => setActiveTab('characters')}
            style={{
              padding: isMobile ? '8px 12px' : '10px 20px',
              backgroundColor: activeTab === 'characters' ? '#4CAF50' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: isMobile ? '13px' : '14px',
              whiteSpace: 'nowrap',
            }}
          >
            {isMobile ? '캐릭터' : '내 캐릭터'}
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            disabled={!selectedCharacter}
            style={{
              padding: isMobile ? '8px 12px' : '10px 20px',
              backgroundColor: activeTab === 'checklist' ? '#4CAF50' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: selectedCharacter ? 'pointer' : 'not-allowed',
              opacity: selectedCharacter ? 1 : 0.5,
              fontSize: isMobile ? '13px' : '14px',
              whiteSpace: 'nowrap',
            }}
          >
            {isMobile ? '체크리스트' : `레이드 체크리스트 ${selectedCharacter ? `(${selectedCharacter.characterName})` : ''}`}
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            style={{
              padding: isMobile ? '8px 12px' : '10px 20px',
              backgroundColor: activeTab === 'comparison' ? '#4CAF50' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: isMobile ? '13px' : '14px',
              whiteSpace: 'nowrap',
            }}
          >
            {isMobile ? '비교' : '레이드 비교'}
          </button>
          <button
            onClick={() => setActiveTab('management')}
            style={{
              padding: isMobile ? '8px 12px' : '10px 20px',
              backgroundColor: activeTab === 'management' ? '#4CAF50' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: isMobile ? '13px' : '14px',
              whiteSpace: 'nowrap',
            }}
          >
            {isMobile ? '관리' : '캐릭터 관리'}
          </button>
          <button
            onClick={() => setActiveTab('party')}
            style={{
              padding: isMobile ? '8px 12px' : '10px 20px',
              backgroundColor: activeTab === 'party' ? '#4CAF50' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: isMobile ? '13px' : '14px',
              whiteSpace: 'nowrap',
            }}
          >
            {isMobile ? '공격대' : '공격대 편성'}
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            style={{
              padding: isMobile ? '8px 12px' : '10px 20px',
              backgroundColor: activeTab === 'calendar' ? '#4CAF50' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: isMobile ? '13px' : '14px',
              whiteSpace: 'nowrap',
            }}
          >
            {isMobile ? '캘린더' : '공격대 캘린더'}
          </button>
        </div>
      </header>
      
      <main style={{
        backgroundColor: theme.bg.primary,
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1400px',  // 최대 너비 고정
          padding: '0 20px',   // 좌우 여백
          boxSizing: 'border-box',
        }}>
          {activeTab === 'characters' && (
            <CharacterList 
              key={refreshKey} 
              currentUserId={currentUser.id}
              onCharacterSelect={handleCharacterSelect}
            />
          )}
          {activeTab === 'checklist' && (
            <RaidChecklist character={selectedCharacter} />
          )}
          {activeTab === 'comparison' && (
            <RaidComparison key={refreshKey} currentUserId={currentUser.id} />
          )}
          {activeTab === 'management' && (
            <CharacterManagement 
              key={refreshKey} 
              characters={characters}
              currentUserId={currentUser.id}
              onUpdate={handleCharacterUpdate} 
            />
          )}
          {activeTab === 'party' && (
            <PartyMatching />
          )}
          {activeTab === 'calendar' && (
            <Calendar characters={characters} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App
