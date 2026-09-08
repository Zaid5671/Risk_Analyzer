import { apiClient } from '@/lib/api-client';
import type { LoginRequest, TokenResponse, User, UserCreate } from '@/types/auth';

export const authService = {
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>('/auth/login', credentials);
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },

  async getUsers(): Promise<User[]> {
    const { data } = await apiClient.get<User[]>('/auth/users');
    return data;
  },

  async createUser(payload: UserCreate): Promise<User> {
    const { data } = await apiClient.post<User>('/auth/users', payload);
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
