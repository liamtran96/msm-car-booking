import { apiClient } from '@/lib/axios';
import type { LoginCredentials, LoginResponse } from '../types/auth.types';
import type { User } from '@/types/user.types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getMe(): Promise<User> {
    const { data } = await apiClient.get<{ user: User }>('/auth/me');
    return data.user;
  },
};
