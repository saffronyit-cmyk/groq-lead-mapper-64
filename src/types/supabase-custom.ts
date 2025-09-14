// Temporary types until migration is applied
export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OdooConfiguration {
  id: string;
  user_id: string;
  name: string;
  url: string;
  database: string;
  username: string;
  api_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}