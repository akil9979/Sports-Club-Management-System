import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  login as apiLogin,
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

  // Restore & verify session on initial load or page refresh
  useEffect(() => {
    let isMounted = true;

    async function initAuthSession() {
      const storedToken = getToken();
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const profile = await getCurrentUser();
        if (isMounted) {
          if (profile) {
            setUser(profile);
            setToken(storedToken);
          } else {
            setUser(null);
            setToken(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.warn('[AuthContext] Session verification failed:', err.message);
          // If cached user exists, retain it in offline mode; otherwise clear
          const cached = getStoredUser();
          if (cached) {
            setUser(cached);
            setToken(storedToken);
          } else {
            setUser(null);
            setToken(null);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuthSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setAuthError(null);
    try {
      const result = await apiLogin(credentials);
      const activeUser = result.data.user;
      const activeToken = result.data.token;
      setUser(activeUser);
      setToken(activeToken);
      return result;
    } catch (err) {
      setAuthError(err.message || 'Login failed');
      throw err;
    }
  }, []);

  const register = useCallback(async (userData) => {
    setAuthError(null);
    try {
      const result = await apiRegister(userData);
      if (result.data?.user && result.data?.token) {
        setUser(result.data.user);
        setToken(result.data.token);
      }
      return result;
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
    try {
      const profile = await getCurrentUser();
      if (profile) {
        setUser(profile);
      }
      return profile;
    } catch (err) {
      console.warn('[AuthContext] Failed to refresh user profile:', err);
      return null;
    }
  }, []);

  const hasRole = useCallback((...allowedRoles) => {
    if (!user || !user.role) return false;
    if (user.role === 'admin') return true;
    return allowedRoles.flat().includes(user.role);
  }, [user]);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    authError,
    setAuthError,
    login,
    register,
    logout,
    refreshUser,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
