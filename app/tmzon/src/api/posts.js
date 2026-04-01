import { api } from './client';

export const postsApi = {
  getAll: () => api.get('/api/posts'),
  getFeed: () => api.get('/api/posts/feed'),
  getByUser: (username) => api.get(`/api/posts/user/${username}`),
  getById: (id) => api.get(`/api/posts/${id}`),
  create: (data) => api.post('/api/posts', data),
  delete: (id) => api.delete(`/api/posts/${id}`),
  toggleLike: (id) => api.post(`/api/posts/${id}/like`),
  addComment: (id, data) => api.post(`/api/posts/${id}/comments`, data),
  deleteComment: (postId, commentId) => api.delete(`/api/posts/${postId}/comments/${commentId}`),
};
