import { apiClient } from './client'
import type { MonEspaceDTO } from '@/types/monEspace'

export const monEspaceApi = {
  consulter: (signal?: AbortSignal) => apiClient.get<MonEspaceDTO>('/mon-espace', { signal }).then((r) => r.data),
}
