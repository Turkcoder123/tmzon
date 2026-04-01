import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  TOKEN: 'tmzon_token',
  USER_ID: 'tmzon_user_id',
  USERNAME: 'tmzon_username',
};

async function setItem(key, value) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getItem(key) {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function removeItem(key) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export async function saveSession(token, userId, username) {
  await Promise.all([
    setItem(KEYS.TOKEN, token),
    setItem(KEYS.USER_ID, String(userId)),
    setItem(KEYS.USERNAME, username),
  ]);
}

export async function getToken() {
  return getItem(KEYS.TOKEN);
}

export async function getUserId() {
  return getItem(KEYS.USER_ID);
}

export async function getUsername() {
  return getItem(KEYS.USERNAME);
}

export async function isLoggedIn() {
  const token = await getToken();
  return !!token;
}

export async function clearSession() {
  await Promise.all([
    removeItem(KEYS.TOKEN),
    removeItem(KEYS.USER_ID),
    removeItem(KEYS.USERNAME),
  ]);
}
