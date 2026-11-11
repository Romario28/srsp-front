import { apiClient } from './client'
import type { PerimetreDTO } from '@/types/utilisateur'
import type { DemandeCompteDTO } from '@/types/demandeCompte'

export const demandesComptesApi = {
  lister: () => apiClient.get<DemandeCompteDTO[]>('/demandes-comptes').then((r) => r.data),
  compteur: () => apiClient.get<number>('/demandes-comptes/compteur').then((r) => r.data),
  approuver: (id: number, perimetre?: PerimetreDTO) =>
    apiClient.post(`/demandes-comptes/${id}/approbation`, { perimetre }).then((r) => r.data),
  refuser: (id: number, motif: string) =>
    apiClient.post(`/demandes-comptes/${id}/refus`, { motif }).then((r) => r.data),
}
