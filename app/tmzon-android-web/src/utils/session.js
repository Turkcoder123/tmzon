const KEY_TOKEN = 'tmzon_token';
const KEY_USER_ID = 'tmzon_user_id';
const KEY_USERNAME = 'tmzon_username';

export function saveSession(token, userId, username) {
  localStorage.setItem(KEY_TOKEN, token);
  localStorage.setItem(KEY_USER_ID, userId);
  localStorage.setItem(KEY_USERNAME, username);
}

export function getToken() {
  return localStorage.getItem(KEY_TOKEN);
}

export function getUserId() {
  return localStorage.getItem(KEY_USER_ID);
}

export function getUsername() {
  return localStorage.getItem(KEY_USERNAME);
}

export function isLoggedIn() {
  return !!getToken();
}

export function clearSession() {
  localStorage.removeItem(KEY_TOKEN);
  localStorage.removeItem(KEY_USER_ID);
  localStorage.removeItem(KEY_USERNAME);
}
