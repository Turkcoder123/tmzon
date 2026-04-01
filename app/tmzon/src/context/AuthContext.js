import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../api/client';
import {
  saveSession,
  getToken,
  getUserId,
  getUsername,
  clearSession,
} from '../utils/session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const token = await getToken();
      if (token) {
        const userId = await getUserId();
        const username = await getUsername();
        setUser({ userId, username });
      }
    } catch {
      await clearSession();
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email, password) {
    const data = await api.login(email, password);
    const { token, user: u } = data;
    await saveSession(token, u._id || u.id, u.username);
    setUser({ userId: u._id || u.id, username: u.username });
    return data;
  }

  async function register(username, email, password) {
    const data = await api.register(username, email, password);
    const { token, user: u } = data;
    await saveSession(token, u._id || u.id, u.username);
    setUser({ userId: u._id || u.id, username: u.username });
    return data;
  }

  async function logout() {
    await clearSession();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
