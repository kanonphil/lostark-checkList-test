import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 유저 API
export const userAPI = {
  register: (username, password, securityQuestion, securityAnswer) => 
    api.post('/users/register', { username, password, securityQuestion, securityAnswer }),
  login: (username, password) => 
    api.post('/users/login', { username, password }),
  getUser: (userId) => 
    api.get(`/users/${userId}`),
  changePassword: (userId, currentPassword, newPassword) => 
    api.post(`/users/${userId}/change-password`, { currentPassword, newPassword }),
  getSecurityQuestion: (username) => 
    api.get('/users/security-question', { params: { username } }),
  resetPassword: (username, securityAnswer, newPassword) => 
    api.post('/users/reset-password', { username, securityAnswer, newPassword }),
};

// 캐릭터 API
export const characterAPI = {
  getAll: (userId) => 
    api.get('/characters', {params: {userId}}),
  getAllForParty: () => 
    api.get('/characters/all'),
  importCharacter: (userId, characterName) => 
    api.post('/characters/import', null, { params: { userId, characterName } }),
  syncCharacter: (id) => 
    api.post(`/characters/${id}/sync`),
  updateGoldPriority: (id, goldPriority) => 
    api.put(`/characters/${id}/gold-priority`, { goldPriority }),
  deleteCharacter: (id) => 
    api.delete(`/characters/${id}`),
};

// 레이드 API
export const raidAPI = {
  getAll: () => api.get('/raids'),
};

// 주간 완료 API
export const completionAPI = {
  getCurrentWeek: (characterId) => 
    api.get(`/completions/character/${characterId}`),
  createChecklist: (characterId) => 
    api.post(`/completions/character/${characterId}/checklist`),
  completeGate: (gateCompletionId, extraReward) => 
    api.post(`/completions/gate/${gateCompletionId}/complete`, { extraReward }),
  uncompleteGate: (gateCompletionId) => 
    api.post(`/completions/gate/${gateCompletionId}/uncomplete`),
  getTotalGold: (characterId) => 
    api.get(`/completions/character/${characterId}/total-gold`),
  getResetInfo: () => 
    api.get(`/completions/reset-info`),
};

// 계정 API
export const accountAPI = {
  getSummary: () => 
    api.get('/account/summary'),
  getRaidComparison: (userId) => 
    api.get('/account/raid-comparison', {params: {userId}}),
};

// Master 관리자 API
export const masterAPI = {
  getAllUsers: (masterUserId) => api.get('/master/users', { params: { masterUserId } }),
  getStats: (masterUserId) => api.get('/master/stats', { params: { masterUserId } }),
  deleteUser: (userId, masterUserId) => api.delete(`/master/users/${userId}`, { params: { masterUserId } }),
  resetWeeklyData: (masterUserId) => api.post('/master/reset-weekly', null, { params: { masterUserId } }),
  forceChangePassword: (userId, masterUserId, newPassword) => 
    api.post(`/master/users/${userId}/force-password`, 
      { newPassword }, 
      { params: { masterUserId } }
    ),
  // ✅ 공격대 완료 목록 조회
  getAllPartyCompletions: (masterUserId) => api.get('/master/party-completions', { params: { masterUserId } }),
};

export default api;