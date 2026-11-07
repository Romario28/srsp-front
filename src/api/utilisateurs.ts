import { apiClient } from './client'
import type {
  AgentLieDTO, CreateUtilisateurRequest, UpdateUtilisateurRequest, UtilisateurCreatedResponse, UtilisateurDetailDTO, UtilisateurDTO,
} from '@/types/utilisateur'
import type { Page } from '@/types/api'

export const utilisateursApi = {
  getAll: (page = 0, size = 100) =>
    apiClient.get<Page<UtilisateurDTO>>('/utilisateurs', { params: { page, size, sort: 'email' } }).then((r) => r.data),

  getById: (id: number) => apiClient.get<UtilisateurDetailDTO>(`/utilisateurs/${id}`).then((r) => r.data),

  /** Aperçu de l'agent d'un matricule : renvoie trouve = false (pas d'erreur) si l'agent n'existe pas. */
  agentLie: (matricule: string) =>
    apiClient.get<AgentLieDTO>(`/utilisateurs/agents/${encodeURIComponent(matricule)}`).then((r) => r.data),

  create: (payload: CreateUtilisateurRequest) =>
    apiClient.post<UtilisateurDetailDTO>('/utilisateurs', payload).then((r) => r.data),

  update: (id: number, payload: UpdateUtilisateurRequest) =>
    apiClient.put<UtilisateurDetailDTO>(`/utilisateurs/${id}`, payload).then((r) => r.data),

  changeStatut: (id: number, statut: 'ACTIF' | 'SUSPENDU' | 'DESACTIVE') =>
    apiClient
      .patch<UtilisateurCreatedResponse>(`/utilisateurs/${id}/statut`, null, { params: { statut } })
      .then((r) => r.data),
}