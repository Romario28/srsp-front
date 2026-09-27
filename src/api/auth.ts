import { apiClient } from './client'
import type { LoginRequest, LoginResponse, MeResponse } from '@/types/auth'

export const authApi = {
  login: (payload: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', payload).then((r) => r.data),
  logout: () => apiClient.post<void>('/auth/logout'),
  me: () => apiClient.get<MeResponse>('/auth/me').then((r) => r.data),
}
