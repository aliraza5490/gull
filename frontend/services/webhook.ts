import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { Webhook, WebhookCreate, WebhookUpdate, PaginatedResponse } from '../types/webhook';

export const webhookKeys = {
  all: ['webhooks'] as const,
  lists: () => [...webhookKeys.all, 'list'] as const,
  list: (page: number, pageSize: number) => [...webhookKeys.lists(), { page, pageSize }] as const,
  details: () => [...webhookKeys.all, 'detail'] as const,
  detail: (id: string) => [...webhookKeys.details(), id] as const,
};

export function useWebhooks(page: number = 1, pageSize: number = 20) {
  return useQuery<PaginatedResponse<Webhook>>({
    queryKey: webhookKeys.list(page, pageSize),
    queryFn: () => api.get<PaginatedResponse<Webhook>>(`/webhooks/?page=${page}&page_size=${pageSize}`),
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();
  return useMutation<Webhook, Error, WebhookCreate>({
    mutationFn: (data) => api.post<Webhook>('/webhooks/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();
  return useMutation<Webhook, Error, { id: string; data: WebhookUpdate }>({
    mutationFn: ({ id, data }) => api.patch<Webhook>(`/webhooks/${id}`, data),
    onSuccess: (updatedWebhook) => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: webhookKeys.detail(updatedWebhook.id) });
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete<void>(`/webhooks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
    },
  });
}
