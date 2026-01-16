import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 유저 API
export const userAPI = {
  register: (username, password) => api.post('/users/register', { username, password }),
  login: (username, password) => api.post('/users/login', { username, password }),
  getUser: (userId) => api.get(`/users/${userId}`),
};

// 캐릭터 API
export const characterAPI = {
  getAll: (userId) => api.get('/characters', {params: {userId}}),
  getAllForParty: () => api.get('/characters/all'),
  importCharacter: (userId, characterName) => api.post('/characters/import', null, { params: { userId, characterName } }),
  syncCharacter: (id) => api.post(`/characters/${id}/sync`),
  updateGoldPriority: (id, goldPriority) => api.put(`/characters/${id}/gold-priority`, { goldPriority }),
  deleteCharacter: (id) => api.delete(`/characters/${id}`),
};

// 레이드 API
export const raidAPI = {
  getAll: () => api.get('/raids'),
};

// 주간 완료 API
export const completionAPI = {
  getCurrentWeek: (characterId) => api.get(`/completions/character/${characterId}`),
  createChecklist: (characterId) => api.post(`/completions/character/${characterId}/checklist`),
  completeGate: (gateCompletionId, extraReward) => api.post(`/completions/gate/${gateCompletionId}/complete`, { extraReward }),
  uncompleteGate: (gateCompletionId) => api.post(`/completions/gate/${gateCompletionId}/uncomplete`),
  getTotalGold: (characterId) => api.get(`/completions/character/${characterId}/total-gold`),
  getResetInfo: () => api.get(`/completions/reset-info`),
};

// 계정 API
export const accountAPI = {
  getSummary: () => api.get('/account/summary'),
  getRaidComparison: (userId) => api.get('/account/raid-comparison', {params: {userId}}),
};

export default api;