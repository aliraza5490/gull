import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { PaginatedResponse } from '../types/webhook';

// Types
export interface ReceiverEndpoint {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  type: 'temporary' | 'persistent';
  secret: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReceiverEndpointCreate {
  name: string;
  slug: string;
  type: 'temporary' | 'persistent';
  secret?: string;
  is_active?: boolean;
}

export interface ReceiverEndpointUpdate {
  name?: string;
  slug?: string;
  secret?: string | null;
  is_active?: boolean;
}

export interface Destination {
  id: string;
  endpoint_id: string;
  name: string;
  url: string;
  method: string;
  timeout: number;
  is_active: boolean;
  auth_type: string;
  auth_config: any;
  headers_to_inject: any;
  headers_to_strip: string[];
  payload_transform_template: string | null;
  created_at: string;
}

export interface DestinationCreate {
  name: string;
  url: string;
  method: string;
  timeout?: number;
  is_active?: boolean;
  auth_type: string;
  auth_config?: any;
  headers_to_inject?: any;
  headers_to_strip?: string[];
  payload_transform_template?: string | null;
}

export interface WebhookPayload {
  id: string;
  endpoint_id: string;
  method: string;
  headers: any;
  query_params: any;
  raw_body: string;
  parsed_body: any;
  content_type: string;
  is_drifted: boolean;
  received_at: string;
}

export interface WebhookDelivery {
  id: string;
  payload_id: string;
  destination_id: string;
  attempt: number;
  status_code: number | null;
  response_body: string | null;
  success: boolean;
  latency_ms: number;
  error_message: string | null;
  delivered_at: string;
}

export interface SchemaDriftAlert {
  id: string;
  endpoint_id: string;
  payload_id: string;
  message: string;
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  created_at: string;
}

export interface WorkspaceCreate {
  name: string;
}

// React Query Keys
export const queryKeys = {
  endpoints: () => ['endpoints'] as const,
  endpoint: (id: string) => ['endpoints', id] as const,
  destinations: (endpointId: string) => ['endpoints', endpointId, 'destinations'] as const,
  payloads: (endpointId: string, filters: any) => ['endpoints', endpointId, 'payloads', filters] as const,
  deliveries: (endpointId: string, payloadId: string) => ['endpoints', endpointId, 'payloads', payloadId, 'deliveries'] as const,
  alerts: (endpointId: string) => ['endpoints', endpointId, 'alerts'] as const,
  workspaces: () => ['workspaces'] as const,
};

// Workspaces hooks
export function useWorkspaces() {
  return useQuery<Workspace[]>({
    queryKey: queryKeys.workspaces(),
    queryFn: () => api.get<Workspace[]>('/workspaces/'),
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation<Workspace, Error, WorkspaceCreate>({
    mutationFn: (data) => api.post<Workspace>('/workspaces/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() });
    },
  });
}

// Endpoints hooks
export function useEndpoints(workspaceId?: string, page: number = 1, pageSize: number = 20) {
  const queryParams = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (workspaceId) {
    queryParams.append('workspace_id', workspaceId);
  }
  return useQuery<PaginatedResponse<ReceiverEndpoint>>({
    queryKey: [...queryKeys.endpoints(), { workspaceId, page, pageSize }],
    queryFn: () => api.get<PaginatedResponse<ReceiverEndpoint>>(`/webhooks/?${queryParams.toString()}`),
  });
}

export function useCreateEndpoint(workspaceId?: string) {
  const queryClient = useQueryClient();
  return useMutation<ReceiverEndpoint, Error, ReceiverEndpointCreate>({
    mutationFn: (data) => {
      const q = workspaceId ? `?workspace_id=${workspaceId}` : '';
      return api.post<ReceiverEndpoint>(`/webhooks/${q}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.endpoints() });
    },
  });
}

export function useUpdateEndpoint() {
  const queryClient = useQueryClient();
  return useMutation<ReceiverEndpoint, Error, { id: string; data: ReceiverEndpointUpdate }>({
    mutationFn: ({ id, data }) => api.patch<ReceiverEndpoint>(`/webhooks/${id}`, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.endpoints() });
      queryClient.invalidateQueries({ queryKey: queryKeys.endpoint(updated.id) });
    },
  });
}

export function useDeleteEndpoint() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete<void>(`/webhooks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.endpoints() });
    },
  });
}

// Destinations hooks
export function useDestinations(endpointId: string) {
  return useQuery<Destination[]>({
    queryKey: queryKeys.destinations(endpointId),
    queryFn: () => api.get<Destination[]>(`/webhooks/${endpointId}/destinations`),
    enabled: !!endpointId,
  });
}

export function useCreateDestination(endpointId: string) {
  const queryClient = useQueryClient();
  return useMutation<Destination, Error, DestinationCreate>({
    mutationFn: (data) => api.post<Destination>(`/webhooks/${endpointId}/destinations`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.destinations(endpointId) });
    },
  });
}

export function useUpdateDestination(endpointId: string) {
  const queryClient = useQueryClient();
  return useMutation<Destination, Error, { id: string; data: Partial<DestinationCreate> }>({
    mutationFn: ({ id, data }) => api.patch<Destination>(`/webhooks/${endpointId}/destinations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.destinations(endpointId) });
    },
  });
}

export function useDeleteDestination(endpointId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete<void>(`/webhooks/${endpointId}/destinations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.destinations(endpointId) });
    },
  });
}

// Payloads hooks
export function usePayloads(endpointId: string, page: number = 1, pageSize: number = 20, filters: { method?: string; success?: boolean; search?: string } = {}) {
  const queryParams = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (filters.method) queryParams.append('method', filters.method);
  if (filters.success !== undefined) queryParams.append('success', String(filters.success));
  if (filters.search) queryParams.append('search_query', filters.search);

  return useQuery<PaginatedResponse<WebhookPayload>>({
    queryKey: queryKeys.payloads(endpointId, { page, pageSize, ...filters }),
    queryFn: () => api.get<PaginatedResponse<WebhookPayload>>(`/webhooks/${endpointId}/payloads?${queryParams.toString()}`),
    enabled: !!endpointId,
  });
}

export function useDeliveries(endpointId: string, payloadId: string) {
  return useQuery<WebhookDelivery[]>({
    queryKey: queryKeys.deliveries(endpointId, payloadId),
    queryFn: () => api.get<WebhookDelivery[]>(`/webhooks/${endpointId}/payloads/${payloadId}/deliveries`),
    enabled: !!endpointId && !!payloadId,
  });
}

export function useReplayPayload(endpointId: string) {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { payloadId: string; destinationId?: string; customBody?: string }>({
    mutationFn: ({ payloadId, destinationId, customBody }) => {
      const q = destinationId ? `?destination_id=${destinationId}` : '';
      return api.post<any>(`/webhooks/${endpointId}/payloads/${payloadId}/replay${q}`, customBody);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deliveries(endpointId, variables.payloadId) });
    },
  });
}

// Drift alerts hooks
export function useDriftAlerts(endpointId: string) {
  return useQuery<SchemaDriftAlert[]>({
    queryKey: queryKeys.alerts(endpointId),
    queryFn: () => api.get<SchemaDriftAlert[]>(`/webhooks/${endpointId}/drift-alerts`),
    enabled: !!endpointId,
  });
}

// Session shares hooks
export function useCreateShare(endpointId: string) {
  return useMutation<{ id: string; token: string; expires_at: string }, Error, { expires_in_seconds: number }>({
    mutationFn: (data) => api.post(`/webhooks/${endpointId}/shares`, data),
  });
}

export function useSharedEndpoint(token: string) {
  return useQuery<ReceiverEndpoint>({
    queryKey: ['shared', token],
    queryFn: () => api.get<ReceiverEndpoint>(`/webhooks/shares/${token}`),
    enabled: !!token,
  });
}

export function useSharedPayloads(token: string) {
  return useQuery<PaginatedResponse<WebhookPayload>>({
    queryKey: ['shared', token, 'payloads'],
    queryFn: () => api.get<PaginatedResponse<WebhookPayload>>(`/webhooks/shares/${token}/payloads`),
    enabled: !!token,
  });
}

export function useSharedDeliveries(token: string, payloadId: string) {
  return useQuery<WebhookDelivery[]>({
    queryKey: ['shared', token, 'payloads', payloadId, 'deliveries'],
    queryFn: () => api.get<WebhookDelivery[]>(`/webhooks/shares/${token}/payloads/${payloadId}/deliveries`),
    enabled: !!token && !!payloadId,
  });
}

