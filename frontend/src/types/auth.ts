export type Role = 'MINISTRY' | 'STATE_OFFICER' | 'DISTRICT_OFFICER' | 'MP';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  role: Role;
  email: string;
  full_name: string;
  assigned_state: string | null;
  assigned_district: string | null;
  assigned_mp_name: string | null;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  assigned_state: string | null;
  assigned_district: string | null;
  assigned_mp_name: string | null;
  is_active: boolean;
  created_at: string | null;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name: string;
  role: Role;
  assigned_state?: string | null;
  assigned_district?: string | null;
  assigned_mp_name?: string | null;
}
