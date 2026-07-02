import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

// ── Types ────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

// ── Local Storage & Session Storage Helpers ──────────────────

import { getStoredToken, getStoredUser, storeAuth, clearAuth } from './storage';
export { getStoredToken, getStoredUser, storeAuth, clearAuth };


// ── API Functions ────────────────────────────────────────────

async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/login', data);
}

async function registerUser(data: RegisterRequest): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/register', data);
}

async function fetchCurrentUser(): Promise<AuthUser> {
  return api.get<AuthUser>('/auth/me');
}

// ── React Query Hooks ────────────────────────────────────────

export const authQueryKeys = {
  currentUser: () => ['auth', 'me'] as const,
};

export interface LoginVariables extends LoginRequest {
  rememberMe?: boolean;
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation<AuthResponse, Error, LoginVariables>({
    mutationFn: ({ email, password }) => loginUser({ email, password }),
    onSuccess: (data, variables) => {
      storeAuth(data.access_token, data.user, variables.rememberMe);
      queryClient.setQueryData(authQueryKeys.currentUser(), data.user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation<AuthResponse, Error, RegisterRequest>({
    mutationFn: registerUser,
    onSuccess: (data) => {
      storeAuth(data.access_token, data.user);
      queryClient.setQueryData(authQueryKeys.currentUser(), data.user);
    },
  });
}

export function useCurrentUser() {
  return useQuery<AuthUser>({
    queryKey: authQueryKeys.currentUser(),
    queryFn: fetchCurrentUser,
    enabled: !!getStoredToken(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}
