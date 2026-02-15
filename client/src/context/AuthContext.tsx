import { createContext, useEffect, useState, type ReactNode } from 'react';
import api from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  markOnboardingSeen: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  markOnboardingSeen: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
    window.location.href = '/login';
  };

  const markOnboardingSeen = async () => {
    await api.post('/auth/onboarding-seen');
    setUser((prev) => prev ? { ...prev, hasSeenOnboarding: true } : prev);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, markOnboardingSeen }}>
      {children}
    </AuthContext.Provider>
  );
}
