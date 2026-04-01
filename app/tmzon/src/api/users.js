import { api } from './client';

export const usersApi = {
  getMe: () => api.get('/api/users/me'),
  updateMe: (data) => api.put('/api/users/me', data),
  getProfile: (username) => api.get(`/api/users/${username}`),
  toggleFollow: (username) => api.post(`/api/users/${username}/follow`),
};
