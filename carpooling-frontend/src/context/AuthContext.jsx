import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import * as authApi from '../api/auth';
import { logoutApi } from '../api/auth';

function getTokenExpiry(token) {
  try {
    return JSON.parse(atob(token.split('.')[1])).exp * 1000;
  } catch { return null; }
}

const AuthContext = createContext(null);

function defaultModeForRole(role) {
  return role === 'DRIVER' ? 'driver' : 'rider';
}

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
  const [pendingRoleSelection, setPendingRoleSelection] = useState(null);
  const [activeMode, setActiveModeState] = useState(() => {
    return localStorage.getItem('wp_active_mode') || 'rider';
  });

  const isAuthenticated = !!token && !!currentUser;
  const isDriver = currentUser?.role === 'DRIVER' || currentUser?.role === 'BOTH' || currentUser?.driverStatus === 'APPROVED';
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isPendingDriver = currentUser?.driverStatus === 'PENDING';
  const isBothRole = currentUser?.driverStatus === 'APPROVED' && currentUser?.passengerStatus === 'APPROVED';

  const setActiveMode = useCallback((mode) => {
    localStorage.setItem('wp_active_mode', mode);
    setActiveModeState(mode);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    const { token: jwt, refreshToken: refreshTok, userId, email: userEmail, role, requiresRoleSelection, driverStatus, passengerStatus } = res.data.data;

    if (requiresRoleSelection) {
      setPendingRoleSelection({ userId, email: userEmail });
      return { requiresRoleSelection: true };
    }

    const user = { id: userId, email: userEmail, role, driverStatus, passengerStatus };
    const mode = defaultModeForRole(role);
    localStorage.setItem('wp_token', jwt);
    if (refreshTok) localStorage.setItem('wp_refresh_token', refreshTok);
    localStorage.setItem('wp_user', JSON.stringify(user));
    localStorage.setItem('wp_active_mode', mode);
    setToken(jwt);
    setCurrentUser(user);
    setActiveModeState(mode);
    return user;
  }, []);

  const confirmRole = useCallback(async (selectedRole) => {
    if (!pendingRoleSelection) return;
    const res = await authApi.selectRole(pendingRoleSelection.userId, selectedRole);
    const { token: jwt, refreshToken: refreshTok, userId, email: userEmail, role, driverStatus, passengerStatus } = res.data.data;
    const user = { id: userId, email: userEmail, role, driverStatus, passengerStatus };
    const mode = defaultModeForRole(role);
    localStorage.setItem('wp_token', jwt);
    if (refreshTok) localStorage.setItem('wp_refresh_token', refreshTok);
    localStorage.setItem('wp_user', JSON.stringify(user));
    localStorage.setItem('wp_active_mode', mode);
    setToken(jwt);
    setCurrentUser(user);
    setActiveModeState(mode);
    setPendingRoleSelection(null);
    return user;
  }, [pendingRoleSelection]);

  const register = useCallback(async (data) => {
    const res = await authApi.register(data);
    const { token: jwt, refreshToken: refreshTok, userId, email: userEmail, role, driverStatus, passengerStatus } = res.data.data;
    const user = { id: userId, email: userEmail, role, driverStatus, passengerStatus };
    const mode = defaultModeForRole(role);
    localStorage.setItem('wp_token', jwt);
    if (refreshTok) localStorage.setItem('wp_refresh_token', refreshTok);
    localStorage.setItem('wp_user', JSON.stringify(user));
    localStorage.setItem('wp_active_mode', mode);
    setToken(jwt);
    setCurrentUser(user);
    setActiveModeState(mode);
    return user;
  }, []);

  const updateUser = useCallback((patch) => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem('wp_user', JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback(async () => {
    const rt = localStorage.getItem('wp_refresh_token');
    if (rt) {
      try { await logoutApi(rt); } catch {}
    }
    localStorage.removeItem('wp_token');
    localStorage.removeItem('wp_refresh_token');
    localStorage.removeItem('wp_user');
    localStorage.removeItem('wp_active_mode');
    setToken(null);
    setCurrentUser(null);
    setActiveModeState('rider');
    setPendingRoleSelection(null);
  }, []);

  // Triggered by api/client.js when token refresh fails — clears React state
  useEffect(() => {
    const handleForceLogout = () => {
      setToken(null);
      setCurrentUser(null);
      setActiveModeState('rider');
      setPendingRoleSelection(null);
    };
    window.addEventListener('auth:force-logout', handleForceLogout);
    return () => window.removeEventListener('auth:force-logout', handleForceLogout);
  }, []);

  // Proactive refresh: silently renew access token 2 min before expiry
  // so requests never hit the server with an expired token (eliminates 401 console noise)
  useEffect(() => {
    if (!token) return;
    const exp = getTokenExpiry(token);
    if (!exp) return;
    const msUntilRefresh = exp - Date.now() - 2 * 60 * 1000;
    if (msUntilRefresh <= 0) return;

    const timer = setTimeout(async () => {
      const rt = localStorage.getItem('wp_refresh_token');
      if (!rt) return;
      try {
        const res = await axios.post(
          `http://localhost:8081/api/auth/refresh?refreshToken=${encodeURIComponent(rt)}`
        );
        const { token: newToken, refreshToken: newRefresh } = res.data?.data || {};
        if (newToken) {
          localStorage.setItem('wp_token', newToken);
          if (newRefresh) localStorage.setItem('wp_refresh_token', newRefresh);
          setToken(newToken);
        }
      } catch { /* silent — interceptor handles it if a request fires after expiry */ }
    }, msUntilRefresh);

    return () => clearTimeout(timer);
  }, [token]);

  return (
    <AuthContext.Provider value={{
      currentUser, token, isAuthenticated, isDriver, isAdmin, isSuperAdmin,
      isPendingDriver, isBothRole, pendingRoleSelection,
      activeMode, setActiveMode,
      login, confirmRole, logout, register, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
