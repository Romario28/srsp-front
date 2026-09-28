import { apiClient } from './client'
import type { CreatePorteeDelegueeRequest, PorteeDelegueeDTO } from '@/types/porteeDeleguee'

// NOTE : pas d'endpoint "liste toutes les délégations" côté backend — uniquement
// par utilisateur. La page Délégations est donc construite autour de la recherche
// d'un utilisateur, pas d'une liste globale.
export const porteesDelegueesApi = {
  getPourUtilisateur: (idUtilisateur: number) =>
    apiClient
      .get<PorteeDelegueeDTO[]>(`/portees-deleguees/utilisateur/${idUtilisateur}`)
      .then((r) => r.data),

  accorder: (payload: CreatePorteeDelegueeRequest) =>
    apiClient.post<PorteeDelegueeDTO>('/portees-deleguees', payload).then((r) => r.data),

  // MODIFIÉ — le backend n'attend plus l'identifiant du bénéficiaire à la révocation :
  // seul l'ID de la délégation suffit.
  revoquer: (id: number) => apiClient.delete<void>(`/portees-deleguees/${id}`),
}
