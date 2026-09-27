import { apiClient } from './client'
import type { CreateDepartementRequest, DepartementResponse } from '@/types/departement'

export const departementsApi = {
  getAll: () => apiClient.get<DepartementResponse[]>('/departements').then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<DepartementResponse>(`/departements/${id}`).then((r) => r.data),

  create: (payload: CreateDepartementRequest) =>
    apiClient.post<DepartementResponse>('/departements', payload).then((r) => r.data),

  // Query params, pas de body — idEmploye omis = retire le chef (poste vacant)
  definirChef: (id: number, idEmploye: number | null) =>
    apiClient
      .patch<DepartementResponse>(`/departements/${id}/chef`, null, {
        params: idEmploye != null ? { idEmploye } : {},
      })
      .then((r) => r.data),

  deplacer: (id: number, idNouveauParent: number | null) =>
    apiClient
      .patch<DepartementResponse>(`/departements/${id}/deplacer`, null, {
        params: idNouveauParent != null ? { idNouveauParent } : {},
      })
      .then((r) => r.data),
}
