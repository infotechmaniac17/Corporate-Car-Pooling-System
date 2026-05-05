import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('wp_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('wp_token') || null);
  const [pendingRoleSelection, setPendingRoleSelection] = useState(null); // { userId, email }

  const isAuthenticated = !!token && !!currentUser;
  const isDriver = currentUser?.role === 'DRIVER';
  const isAdmin = currentUser?.role === 'ADMIN';

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    const { token: jwt, userId, email: userEmail, role, requiresRoleSelection } = res.data.data;

    if (requiresRoleSelection) {
      setPendingRoleSelection({ userId, email: userEmail });
      return { requiresRoleSelection: true };
    }

    const user = { id: userId, email: userEmail, role };
    localStorage.setItem('wp_token', jwt);
    localStorage.setItem('wp_user', JSON.stringify(user));
    setToken(jwt);
    setCurrentUser(user);
    return user;
  }, []);

  const confirmRole = useCallback(async (selectedRole) => {
    if (!pendingRoleSelection) return;
    const res = await authApi.selectRole(pendingRoleSelection.userId, selectedRole);
    const { token: jwt, userId, email: userEmail, role } = res.data.data;
    const user = { id: userId, email: userEmail, role };
    localStorage.setItem('wp_token', jwt);
    localStorage.setItem('wp_user', JSON.stringify(user));
    setToken(jwt);
    setCurrentUser(user);
    setPendingRoleSelection(null);
    return user;
  }, [pendingRoleSelection]);

  const register = useCallback(async (data) => {
    const res = await authApi.register(data);
    const { token: jwt, userId, email: userEmail, role } = res.data.data;
    const user = { id: userId, email: userEmail, role };
    localStorage.setItem('wp_token', jwt);
    localStorage.setItem('wp_user', JSON.stringify(user));
    setToken(jwt);
    setCurrentUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('wp_token');
    localStorage.removeItem('wp_user');
    setToken(null);
    setCurrentUser(null);
    setPendingRoleSelection(null);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, token, isAuthenticated, isDriver, isAdmin, pendingRoleSelection, login, confirmRole, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
