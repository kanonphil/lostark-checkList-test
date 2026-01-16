import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';

function Settings({ currentUser }) {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserInfo();
  }, [currentUser]);

  const loadUserInfo = async () => {
    try {
      const response = await userAPI.getUser(currentUser.id);
      setUserInfo(response.data);
    } catch (error) {
      console.error('유저 정보 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{textAlign: 'center', padding: '40px'}}>로딩 중...</div>;

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
    }}>
      <h2 style={{marginBottom: '30px'}}>내 정보</h2>

      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      }}>
        <div style={{marginBottom: '20px'}}>
          <label style={{
            display: 'block',
            marginBottom: '10px',
            fontWeight: 'bold',
            fontSize: '16px',
          }}>
            아이디
          </label>
          <div style={{
            padding: '12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '5px',
            fontSize: '16px',
          }}>
            {userInfo?.username}
          </div>
        </div>

        <div style={{marginBottom: '20px'}}>
          <label style={{
            display: 'block',
            marginBottom: '10px',
            fontWeight: 'bold',
            fontSize: '16px',
          }}>
            가입일
          </label>
          <div style={{
            padding: '12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '5px',
            fontSize: '16px',
          }}>
            {userInfo?.createdAt ? new Date(userInfo.createdAt).toLocaleDateString('ko-KR') : '-'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;