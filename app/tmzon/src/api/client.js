import { getToken, getRefreshToken, getDeviceId, updateTokens, clearSession } from '../utils/session';

const BASE_URL = 'http://144.172.107.118';

let isRefreshing = false;
let refreshPromise = null;

async function tryRefreshToken() {
  if (isRefreshing) return refreshPromise;
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return false;
      const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      await updateTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.auth !== false) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let res = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && options.auth !== false && !options._retried) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newToken = await getToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url, {
        ...options,
        _retried: true,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
    }
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.error || 'Bir hata oluştu');
  }

  return data;
}

// Auth
export function login(email, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
}

export function register(username, email, password) {
  return request('/api/auth/register', {
    method: 'POST',
    body: { username, email, password },
    auth: false,
  });
}

export function refreshToken(token) {
  return request('/api/auth/refresh', {
    method: 'POST',
    body: { refreshToken: token },
    auth: false,
  });
}

export function logoutFromServer() {
  return request('/api/auth/logout', { method: 'POST' });
}

export function logoutAll() {
  return request('/api/auth/logout-all', { method: 'POST' });
}

export function forgotPassword(email) {
  return request('/api/auth/forgot-password', {
    method: 'POST',
    body: { email },
    auth: false,
  });
}

export function resetPassword(token, email, password) {
  return request('/api/auth/reset-password', {
    method: 'POST',
    body: { token, email, password },
    auth: false,
  });
}

export function changePassword(currentPassword, newPassword) {
  return request('/api/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  });
}

export function verifyEmail(code) {
  return request('/api/auth/verify-email', {
    method: 'POST',
    body: { code },
  });
}

export function resendVerification() {
  return request('/api/auth/resend-verification', { method: 'POST' });
}

export function getSessions() {
  return request('/api/auth/sessions');
}

export function revokeSession(sessionId) {
  return request(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' });
}

export function sendPhoneOTP(phone) {
  return request('/api/auth/phone/send-otp', {
    method: 'POST',
    body: { phone },
    auth: false,
  });
}

export function verifyPhoneOTP(phone, code) {
  return request('/api/auth/phone/verify-otp', {
    method: 'POST',
    body: { phone, code },
    auth: false,
  });
}

// Posts
export function getAllPosts() {
  return request('/api/posts');
}

export function getFeed() {
  return request('/api/posts/feed');
}

export function getPost(id) {
  return request(`/api/posts/${id}`);
}

export function createPost(content) {
  return request('/api/posts', {
    method: 'POST',
    body: { content },
  });
}

export function deletePost(id) {
  return request(`/api/posts/${id}`, { method: 'DELETE' });
}

export function getUserPosts(username) {
  return request(`/api/posts/user/${username}`);
}

export function toggleLike(postId) {
  return request(`/api/posts/${postId}/like`, { method: 'POST' });
}

export function addComment(postId, content) {
  return request(`/api/posts/${postId}/comments`, {
    method: 'POST',
    body: { content },
  });
}

export function deleteComment(postId, commentId) {
  return request(`/api/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
  });
}

// Users
export function getMe() {
  return request('/api/users/me');
}

export function updateProfile(data) {
  return request('/api/users/me', {
    method: 'PUT',
    body: data,
  });
}

export function getUserProfile(username) {
  return request(`/api/users/${username}`);
}

export function toggleFollow(username) {
  return request(`/api/users/${username}/follow`, { method: 'POST' });
}

// Messages
export function getConversations() {
  return request('/api/messages/conversations');
}

export function createConversation(participantId) {
  return request('/api/messages/conversations', {
    method: 'POST',
    body: { participantId },
  });
}

export function getMessages(conversationId, page = 1) {
  return request(`/api/messages/conversations/${conversationId}/messages?page=${page}`);
}

export function sendMessage(conversationId, content) {
  return request(`/api/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: { content },
  });
}

export function markAsRead(conversationId) {
  return request(`/api/messages/conversations/${conversationId}/read`, { method: 'POST' });
}

// Stories
export function getStories() {
  return request('/api/stories');
}

export function getUserStories(username) {
  return request(`/api/stories/user/${username}`);
}

export function createStory(content, backgroundColor, textColor) {
  return request('/api/stories', {
    method: 'POST',
    body: { content, backgroundColor, textColor },
  });
}

export function viewStory(storyId) {
  return request(`/api/stories/${storyId}/view`, { method: 'POST' });
}

export function deleteStory(storyId) {
  return request(`/api/stories/${storyId}`, { method: 'DELETE' });
}

// Explore
export function getExploreFeed(page = 1) {
  return request(`/api/explore?page=${page}`);
}

export function getTrending() {
  return request('/api/explore/trending');
}

export function searchExplore(query) {
  return request(`/api/explore/search?q=${encodeURIComponent(query)}`);
}
