import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  login as apiLogin,
  pinLogin as apiPinLogin,
  register as apiRegister,
  logout as apiLogout,
  getCurrentUser,
  getToken,
  getStoredUser
} from './authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getToken());
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Restore session on load
  useEffect(() => {
    async function init() {
      const storedToken = getToken();
      if (!storedToken) {
        setUser(null);
        setToken(null);
        setIsLoading(false);
        return;
      }
      try {
        const profile = await getCurrentUser();
        setUser(profile || getStoredUser());
        setToken(storedToken);
      } catch {
        setUser(getStoredUser());
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const login = useCallback(async (credentials) => {
    setAuthError(null);
    try {
      const res = await apiLogin(credentials);
      setUser(res.data.user);
      setToken(res.data.token);
      return res;
    } catch (err) {
      setAuthError(err.message || 'Login failed');
      throw err;
    }
  }, []);

  const pinLogin = useCallback(async ({ pin, employeeId }) => {
    setAuthError(null);
    try {
      const res = await apiPinLogin({ pin, employeeId });
      setUser(res.data.user);
      setToken(res.data.token);
      return res;
    } catch (err) {
      setAuthError(err.message || 'PIN login failed');
      throw err;
    }
  }, []);

  const register = useCallback(async (userData) => {
    setAuthError(null);
    try {
      const res = await apiRegister(userData);
      if (res.data?.user && res.data?.token) {
        setUser(res.data.user);
        setToken(res.data.token);
      }
      return res;
    } catch (err) {
      setAuthError(err.message || 'Registration failed');
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
      setToken(null);
      setAuthError(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const profile = await getCurrentUser();
    if (profile) setUser(profile);
    return profile;
  }, []);

  const role = user?.role || null;
  const isAdmin = role === 'admin';
  const isStaff = ['staff', 'manager', 'admin'].includes(role);
  const isMember = Boolean(user);

  const hasRole = useCallback((...roles) => {
    if (!user?.role) return false;
    if (user.role === 'admin') return true;
    return roles.flat().includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAdmin,
        isStaff,
        isMember,
        isAuthenticated: Boolean(user && token),
        isLoading,
        authError,
        setAuthError,
        login,
        pinLogin,
        register,
        logout,
        refreshUser,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
