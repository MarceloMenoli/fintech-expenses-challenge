import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { Session, User } from './types';

interface AuthState { user: User | null; authenticate: (session: Session) => void; logout: () => void; expired: boolean }
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [expired, setExpired] = useState(false);
  const client = useQueryClient();
  const logout = useCallback(() => {
    delete api.defaults.headers.common.Authorization;
    setUser(null);
    client.clear();
  }, [client]);
  useEffect(() => {
    const id = api.interceptors.response.use((response) => response, (error: unknown) => {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const response = error.response as { status?: number } | undefined;
        if (response?.status === 401 && api.defaults.headers.common.Authorization) { logout(); setExpired(true); }
      }
      return Promise.reject(error);
    });
    return () => api.interceptors.response.eject(id);
  }, [logout]);
  function authenticate(session: Session) {
    client.clear();
    api.defaults.headers.common.Authorization = `Bearer ${session.accessToken}`;
    setUser(session.user);
    setExpired(false);
  }
  return <AuthContext.Provider value={{ user, authenticate, logout, expired }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider is missing');
  return context;
}
