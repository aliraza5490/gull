export interface Webhook {
  id: string;
  name: string;
  url: string;
  secret: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookCreate {
  name: string;
  url: string;
  secret?: string;
  is_active?: boolean;
}

export interface WebhookUpdate {
  name?: string;
  url?: string;
  secret?: string | null;
  is_active?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
