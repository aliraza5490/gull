'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  AuthUser,
  getStoredToken,
  getStoredUser,
  storeAuth,
  clearAuth,
  authQueryKeys,
  useLogin as useLoginMutation,
  useRegister as useRegisterMutation,
  useCurrentUser,
} from '@/services/auth';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedUser = getStoredUser();
    const token = getStoredToken();
    if (storedUser && token) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  // Sync with React Query user data
  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    }
  }, [currentUser]);

  // Listen for 401 unauthorized events from api.ts
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      clearAuth();
      queryClient.clear();
      router.push('/login');
    };

    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, [router, queryClient]);

  const login = useCallback(
    async (email: string, password: string, rememberMe?: boolean) => {
      const result = await loginMutation.mutateAsync({ email, password, rememberMe });
      setUser(result.user);
    },
    [loginMutation]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const result = await registerMutation.mutateAsync({ email, password });
      setUser(result.user);
    },
    [registerMutation]
  );

  const logout = useCallback(() => {
    setUser(null);
    clearAuth();
    queryClient.clear();
    router.push('/login');
  }, [router, queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!getStoredToken(),
        isLoading: isLoading || isUserLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
