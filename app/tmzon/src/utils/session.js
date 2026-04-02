import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  TOKEN: 'tmzon_token',
  REFRESH_TOKEN: 'tmzon_refresh_token',
  DEVICE_ID: 'tmzon_device_id',
  USER_ID: 'tmzon_user_id',
  USERNAME: 'tmzon_username',
};

async function setItem(key, value) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, String(value));
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

export async function saveSession(accessToken, refreshToken, deviceId, userId, username) {
  const tasks = [];
  if (accessToken) tasks.push(setItem(KEYS.TOKEN, accessToken));
  if (refreshToken) tasks.push(setItem(KEYS.REFRESH_TOKEN, refreshToken));
  if (deviceId) tasks.push(setItem(KEYS.DEVICE_ID, deviceId));
  if (userId) tasks.push(setItem(KEYS.USER_ID, String(userId)));
  if (username) tasks.push(setItem(KEYS.USERNAME, username));
  await Promise.all(tasks);
}

export async function getToken() {
  return getItem(KEYS.TOKEN);
}

export async function getRefreshToken() {
  return getItem(KEYS.REFRESH_TOKEN);
}

export async function getDeviceId() {
  return getItem(KEYS.DEVICE_ID);
}

export async function getUserId() {
  return getItem(KEYS.USER_ID);
}

export async function getUsername() {
  return getItem(KEYS.USERNAME);
}

export async function updateTokens(accessToken, refreshToken) {
  const tasks = [];
  if (accessToken) tasks.push(setItem(KEYS.TOKEN, accessToken));
  if (refreshToken) tasks.push(setItem(KEYS.REFRESH_TOKEN, refreshToken));
  await Promise.all(tasks);
}

export async function isLoggedIn() {
  const token = await getToken();
  return !!token;
}

export async function clearSession() {
  await Promise.all([
    removeItem(KEYS.TOKEN),
    removeItem(KEYS.REFRESH_TOKEN),
    removeItem(KEYS.DEVICE_ID),
    removeItem(KEYS.USER_ID),
    removeItem(KEYS.USERNAME),
  ]);
}
