import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../utils/api';

export type Role = 'admin' | 'donor' | 'hospital';
export type AuthUser = {
  id: string;
  role: Role;
  email: string;
  name?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (payload: { email: string; password: string; remember?: boolean }) => Promise<void>;
  register: (payload: { name: string; email: string; password: string; role?: Role }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('authUser');
    if (storedToken && storedUser) {
      setAccessToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      accessToken,
      loading,
      login: async (payload) => {
        const res = await api.post('/auth/login', payload);
        const accessToken = res.data?.data?.accessToken;
        const usr = res.data?.data?.user;

        if (!accessToken || !usr) {
          throw new Error('Login succeeded but token/user missing from response');
        }

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('authUser', JSON.stringify(usr));

        setAccessToken(accessToken);
        setUser(usr);
      },
      register: async (payload) => {
        const res = await api.post('/auth/register', payload);
        if (!res.data?.success) {
          throw new Error(res.data?.message || 'Registration failed');
        }
      },
      logout: async () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('authUser');
        setUser(null);
        setAccessToken(null);
      },
    }),
    [user, accessToken, loading]
  );


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

