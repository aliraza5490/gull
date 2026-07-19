import { getStoredToken, clearAuth } from './storage';
import { getApiBaseUrl } from '@/lib/utils';

const BASE_URL = `${getApiBaseUrl()}/api/v1`;



export class ApiError extends Error {
  status: number;
  info: any;

  constructor(message: string, status: number, info: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.info = info;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers = new Headers(options.headers);
  
  // Attach token if present
  if (typeof window !== 'undefined') {
    const token = getStoredToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle unauthorized responses by dispatching a global event
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      clearAuth();
      window.dispatchEvent(new Event('unauthorized'));
    }
  }

  if (!response.ok) {
    let info: any = null;
    try {
      info = await response.json();
    } catch {
      info = { detail: await response.text() };
    }
    const message = info?.detail || `API request failed with status ${response.status}`;
    throw new ApiError(message, response.status, info);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: any, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: any, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: 'DELETE' }),
};
