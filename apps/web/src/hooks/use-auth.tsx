'use client';

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LoginInput, RegisterInput } from '@near-by/types';
import { apiClient, refreshAccessToken } from '../lib/api-client';
import { tokenStore } from '../lib/token-store';

interface CurrentUser {
  id: string;
  email: string;
  roles: string[];
}

interface AuthContextValue {
  user: CurrentUser | undefined;
  roles: string[];
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: ReturnType<typeof useLoginMutation>;
  register: ReturnType<typeof useRegisterMutation>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const { data } = await apiClient.post('/auth/login', input);
      tokenStore.set(data.accessToken, data.roles);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });
}

function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const { confirmPassword, ...payload } = input;
      const { data } = await apiClient.post('/auth/register', payload);
      tokenStore.set(data.accessToken, data.roles);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const queryClient = useQueryClient();
  const roles = useSyncExternalStore(tokenStore.subscribe, tokenStore.getRoles, tokenStore.getServerRoles);
  const hasToken = useSyncExternalStore(tokenStore.subscribe, tokenStore.hasToken, tokenStore.getServerHasToken);

  useEffect(() => {
    refreshAccessToken().finally(() => setIsBootstrapping(false));
  }, []);

  const { data: user } = useQuery<CurrentUser>({
    queryKey: ['me'],
    queryFn: async () => (await apiClient.get('/auth/me')).data,
    enabled: hasToken,
    retry: false,
  });

  const login = useLoginMutation();
  const register = useRegisterMutation();

  const logout = async () => {
    await apiClient.post('/auth/logout', {}).catch(() => undefined);
    tokenStore.clear();
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{ user, roles, isAuthenticated: !!user, isBootstrapping, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
