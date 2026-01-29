import { useState, useEffect } from 'react';
import { recruitmentAPI, raidAPI } from '../services/api';
import { useTheme, getTheme } from '../hooks/useTheme';

function RecruitmentCreateModal({ onClose, onCreated, selectedDate }) {
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  const [formData, setFormData] = useState({
    raidId: '',
    raidName: '',
    requiredItemLevel: '',
    raidDate: selectedDate ? selectedDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    raidHour: '20',
    raidMinute: '00',
    maxPartySize: 4,
    description: ''
  });

  const [raids, setRaids] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRaids();
  }, []);

  const loadRaids = async () => {
    try {
      const response = await raidAPI.getAll();
      setRaids(response.data || []);
    } catch (error) {
      console.error('레이드 목록 로드 실패:', error);
    }
  };

  const handleRaidSelect = (e) => {
    const selectedRaid = raids.find(r => r.id == e.target.value);
    if (selectedRaid) {
      setFormData({
        ...formData,
        raidId: selectedRaid.id,
        raidName: `${selectedRaid.raidGroup} ${selectedRaid.raidName} (${selectedRaid.difficulty})`,
        requiredItemLevel: selectedRaid.requiredItemLevel,
        maxPartySize: selectedRaid.partyType === '싱글' ? 4 : 8
      });
    } else {
      setFormData({
        ...formData,
        raidId: '',
        raidName: '',
        requiredItemLevel: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.raidName || !formData.requiredItemLevel || !formData.raidDate) {
      alert('필수 항목을 모두 입력해주세요');
      return;
    }
  
    try {
      setLoading(true);
      
      // ✅ 한국 시간으로 변환
      const localDateTime = `${formData.raidDate}T${formData.raidHour}:${formData.raidMinute}:00`;
      const date = new Date(localDateTime);
      
      // UTC+9를 UTC로 변환하지 않고 그대로 전송
      const koreaDateTime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      const isoString = koreaDateTime.toISOString();
      
      const response = await recruitmentAPI.create({
        raidId: formData.raidId,
        raidName: formData.raidName,
        requiredItemLevel: parseFloat(formData.requiredItemLevel),
        raidDateTime: isoString,
        maxPartySize: formData.maxPartySize,
        description: formData.description
      });
      
      alert('공격대 모집이 등록되었습니다!');
      onCreated(response.data);
      onClose();
    } catch (error) {
      console.error('모집 등록 실패:', error);
      alert(error.response?.data || '모집 등록 실패');
    } finally {
      setLoading(false);
    }
  };
  // 레이드 그룹별로 묶기
  const groupedRaids = raids.reduce((acc, raid) => {
    if (!acc[raid.raidGroup]) {
      acc[raid.raidGroup] = [];
    }
    acc[raid.raidGroup].push(raid);
    return acc;
  }, {});

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: theme.card.bg,
        borderRadius: '10px',
        padding: '30px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <h2 style={{ 
          marginBottom: '20px',
          color: theme.text.primary 
        }}>
          공격대 모집하기
        </h2>

        <form onSubmit={handleSubmit}>
          {/* 레이드 선택 */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
              color: theme.text.primary
            }}>
              레이드 *
            </label>
            <select
              value={formData.raidId}
              onChange={handleRaidSelect}
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${theme.border.primary}`,
                borderRadius: '5px',
                backgroundColor: theme.bg.secondary,
                color: theme.text.primary,
              }}
            >
              <option value="">레이드 선택</option>
              {Object.entries(groupedRaids).map(([group, groupRaids]) => (
                <optgroup key={group} label={group}>
                  {groupRaids.map(raid => (
                    <option key={raid.id} value={raid.id}>
                      {raid.raidName} ({raid.difficulty}) - {raid.requiredItemLevel}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* 요구 아이템 레벨 */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
              color: theme.text.primary
            }}>
              요구 아이템 레벨 *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.requiredItemLevel}
              onChange={(e) => setFormData({
                ...formData,
                requiredItemLevel: e.target.value
              })}
              placeholder="1680.00"
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${theme.border.primary}`,
                borderRadius: '5px',
                backgroundColor: theme.bg.secondary,
                color: theme.text.primary,
              }}
            />
          </div>

          {/* 날짜 */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
              color: theme.text.primary
            }}>
              레이드 날짜 *
            </label>
            <input
              type="date"
              value={formData.raidDate}
              onChange={(e) => setFormData({
                ...formData,
                raidDate: e.target.value
              })}
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${theme.border.primary}`,
                borderRadius: '5px',
                backgroundColor: theme.bg.secondary,
                color: theme.text.primary,
              }}
            />
          </div>

          {/* 시간 (시 + 분) */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
              color: theme.text.primary
            }}>
              레이드 시간 *
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* 시 */}
              <select
                value={formData.raidHour}
                onChange={(e) => setFormData({
                  ...formData,
                  raidHour: e.target.value
                })}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: `1px solid ${theme.border.primary}`,
                  borderRadius: '5px',
                  backgroundColor: theme.bg.secondary,
                  color: theme.text.primary,
                }}
              >
                {Array.from({length: 24}, (_, i) => {
                  const hour = i.toString().padStart(2, '0');
                  return (
                    <option key={i} value={hour}>
                      {hour}시
                    </option>
                  );
                })}
              </select>
          
              <span style={{ color: theme.text.primary }}>:</span>
          
              {/* 분 (5분 단위) */}
              <select
                value={formData.raidMinute}
                onChange={(e) => setFormData({
                  ...formData,
                  raidMinute: e.target.value
                })}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: `1px solid ${theme.border.primary}`,
                  borderRadius: '5px',
                  backgroundColor: theme.bg.secondary,
                  color: theme.text.primary,
                }}
              >
                {Array.from({length: 12}, (_, i) => {
                  const minute = (i * 5).toString().padStart(2, '0');
                  return (
                    <option key={i} value={minute}>
                      {minute}분
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* 인원 */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
              color: theme.text.primary
            }}>
              모집 인원
            </label>
            <select
              value={formData.maxPartySize}
              onChange={(e) => setFormData({
                ...formData,
                maxPartySize: parseInt(e.target.value)
              })}
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${theme.border.primary}`,
                borderRadius: '5px',
                backgroundColor: theme.bg.secondary,
                color: theme.text.primary,
              }}
            >
              <option value={4}>4인</option>
              <option value={8}>8인</option>
            </select>
          </div>

          {/* 설명 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
              color: theme.text.primary
            }}>
              설명 (선택)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({
                ...formData,
                description: e.target.value
              })}
              placeholder="모집 설명을 입력하세요"
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${theme.border.primary}`,
                borderRadius: '5px',
                backgroundColor: theme.bg.secondary,
                color: theme.text.primary,
                resize: 'vertical',
              }}
            />
          </div>

          {/* 버튼 */}
          <div style={{ 
            display: 'flex', 
            gap: '10px',
            justifyContent: 'flex-end' 
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: `1px solid ${theme.border.primary}`,
                borderRadius: '5px',
                backgroundColor: 'transparent',
                color: theme.text.primary,
                cursor: 'pointer',
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                backgroundColor: loading ? '#ccc' : '#4CAF50',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
              }}
            >
              {loading ? '등록 중...' : '모집 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RecruitmentCreateModal;