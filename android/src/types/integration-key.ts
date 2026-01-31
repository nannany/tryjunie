export interface IntegrationKey {
  id: string;
  user_id: string;
  name: string;
  key: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  updated_at: string;
}

export interface CreateIntegrationKeyRequest {
  name: string;
}

export interface UpdateIntegrationKeyRequest {
  name?: string;
  is_active?: boolean;
}
