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

// ── Local Storage Helpers ────────────────────────────────────

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function storeAuth(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

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

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation<AuthResponse, Error, LoginRequest>({
    mutationFn: loginUser,
    onSuccess: (data) => {
      storeAuth(data.access_token, data.user);
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
