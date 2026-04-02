import { getToken } from '../utils/session';

const BASE_URL = 'http://144.172.107.118';

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

  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

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
