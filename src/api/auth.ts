import { apiClient } from './client'
import type { LoginRequest, LoginResponse, MeResponse } from '@/types/auth'
import type { DemandeCompteRequest } from '@/types/demandeCompte'

export const authApi = {
  login: (payload: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', payload).then((r) => r.data),
  logout: () => apiClient.post<void>('/auth/logout'),
  me: () => apiClient.get<MeResponse>('/auth/me').then((r) => r.data),
  demanderCompte: (payload: DemandeCompteRequest) =>
    apiClient.post<{ message: string }>('/auth/demande-compte', payload).then((r) => r.data),
}
