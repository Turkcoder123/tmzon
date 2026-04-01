import { getToken } from '../utils/session';

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.message || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return data;
}

// Auth
export const login = (email, password) =>
  request('POST', '/api/auth/login', { email, password });

export const register = (username, email, password) =>
  request('POST', '/api/auth/register', { username, email, password });

// Posts
export const getAllPosts = () =>
  request('GET', '/api/posts');

export const getFeed = () =>
  request('GET', '/api/posts/feed');

export const getUserPosts = (username) =>
  request('GET', `/api/posts/user/${encodeURIComponent(username)}`);

export const getPost = (id) =>
  request('GET', `/api/posts/${encodeURIComponent(id)}`);

export const createPost = (content) =>
  request('POST', '/api/posts', { content });

export const deletePost = (id) =>
  request('DELETE', `/api/posts/${encodeURIComponent(id)}`);

export const toggleLike = (id) =>
  request('POST', `/api/posts/${encodeURIComponent(id)}/like`);

// Comments
export const addComment = (postId, content) =>
  request('POST', `/api/posts/${encodeURIComponent(postId)}/comments`, { content });

export const deleteComment = (postId, commentId) =>
  request('DELETE', `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`);

// Users
export const getMe = () =>
  request('GET', '/api/users/me');

export const updateMe = (data) =>
  request('PUT', '/api/users/me', data);

export const getProfile = (username) =>
  request('GET', `/api/users/${encodeURIComponent(username)}`);

export const toggleFollow = (username) =>
  request('POST', `/api/users/${encodeURIComponent(username)}/follow`);
