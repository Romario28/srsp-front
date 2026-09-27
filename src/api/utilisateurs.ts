import { apiClient } from './client'
import type { CreateUtilisateurRequest, UtilisateurCreatedResponse, UtilisateurDTO } from '@/types/utilisateur'
import type { Page } from '@/types/employe'

export const utilisateursApi = {
  getAll: (page = 0, size = 100) =>
    apiClient
      .get<Page<UtilisateurDTO>>('/utilisateurs', { params: { page, size, sort: 'email' } })
      .then((r) => r.data),

  getById: (id: number) => apiClient.get<UtilisateurDTO>(`/utilisateurs/${id}`).then((r) => r.data),

  create: (payload: CreateUtilisateurRequest) =>
    apiClient.post<UtilisateurCreatedResponse>('/utilisateurs', payload).then((r) => r.data),

  changeStatut: (id: number, statut: 'ACTIF' | 'SUSPENDU' | 'DESACTIVE') =>
    apiClient
      .patch<UtilisateurCreatedResponse>(`/utilisateurs/${id}/statut`, null, { params: { statut } })
      .then((r) => r.data),
}
