import { useEffect, useState } from 'react';
import { characterAPI } from './services/api';
import Login from './components/Login';
import CharacterList from './components/CharacterList';
import RaidChecklist from './components/RaidChecklist';
import RaidComparison from './components/RaidComparison';
import CharacterManagement from './components/CharacterManagement';
import './App.css'
import PartyMatching from './components/PartyMatching';

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

  return (
    <div className="App">
      <header style={{ 
        backgroundColor: '#282c34', 
        padding: '20px', 
        color: 'white',
        marginBottom: '20px'
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h1>로스트아크 레이드 체크리스트</h1>
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <span>{currentUser.username}님</span>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 탭 버튼 */}
        <div style={{marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
          <button
            onClick={() => setActiveTab('characters')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'characters' ? '#4CAF50' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',              
            }}
          >
            내 캐릭터
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            disabled={!selectedCharacter}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'checklist' ? '#4CAF50' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: selectedCharacter ? 'pointer' : 'not-allowed',
              opacity: selectedCharacter ? 1 : 0.5,
            }}
          >
            레이드 체크리스트 {selectedCharacter && `(${selectedCharacter.characterName})`}
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'comparison' ? '#4CAF50' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            레이드 비교
          </button>
          <button
            onClick={() => setActiveTab('management')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'management' ? '#4CAF50' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            캐릭터 관리
          </button>
          <button
            onClick={() => setActiveTab('party')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'party' ? '#4CAF50' : '#555',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            파티 매칭
          </button>
        </div>
      </header>
      
      <main>
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
      </main>
    </div>
  );
}

export default App
