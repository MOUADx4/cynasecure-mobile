import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, type User } from '../api/auth';
import { resetToHome } from '../navigation/navigationRef';

type AuthState = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<User & { requires2fa?: boolean; emailUnverified?: boolean }>;
  logout: () => Promise<void>;
  register: (data: { firstName: string; lastName: string; email: string; password: string }) => Promise<{ needsVerification?: boolean }>;
  refresh: () => Promise<void>;
  updateProfile: (data: { firstName?: string; lastName?: string; phone?: string; company?: string }) => Promise<void>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthState | null>(null);
const CACHE_KEY = '@auth_user';

async function readCachedUser(): Promise<User | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

async function writeCachedUser(u: User | null) {
  try {
    if (u) await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(u));
    else await AsyncStorage.removeItem(CACHE_KEY);
  } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const setUser = useCallback((u: User | null) => {
    writeCachedUser(u);
    setUserState(u);
  }, []);

  // On mount: restore from cache immediately → show UI without waiting for /api/me
  useEffect(() => {
    readCachedUser().then((cached) => {
      if (cached) {
        setUserState(cached);
        setLoading(false);
      }
      // Always validate in background
      authApi.me()
        .then((me) => {
          writeCachedUser(me);
          setUserState(me);
        })
        .catch(() => {
          writeCachedUser(null);
          setUserState(null);
        })
        .finally(() => setLoading(false));
    });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, [setUser]);

  const login = async (email: string, password: string, remember = false) => {
    const res = await authApi.login(email, password, remember);
    if (!res.requires2fa && !res.emailUnverified) {
      setUser(res);
    }
    return res;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    setUser(null);
    resetToHome();
  };

  const register = async (data: { firstName: string; lastName: string; email: string; password: string }) => {
    return await authApi.register(data);
  };

  const updateProfile = async (data: { firstName?: string; lastName?: string; phone?: string; company?: string }) => {
    const updated = await authApi.updateProfile(data);
    setUser(updated);
  };

  const value: AuthState = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.roles?.includes('ROLE_ADMIN') ?? false,
    login,
    logout,
    register,
    refresh,
    updateProfile,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
