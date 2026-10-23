import { apiClient } from './client'
import type { FiltresAgents } from '@/types/anticipation'
import type { Page } from '@/types/api'
import type { CibleDossier, DossierDTO, FiltresDossiers, FiltresSynthese, SyntheseDossiers } from '@/types/dossier'

export const dossiersApi = {
  lister: (filtres: FiltresDossiers & FiltresAgents, signal?: AbortSignal) =>
    apiClient.get<Page<DossierDTO>>('/dossiers', { params: filtres, signal }).then((r) => r.data),
  synthese: (filtres: FiltresSynthese, signal?: AbortSignal) =>
    apiClient.get<SyntheseDossiers>('/dossiers/synthese', { params: filtres, signal }).then((r) => r.data),
  parEcheance: (cible: CibleDossier, signal?: AbortSignal) =>
    apiClient.get<DossierDTO>('/dossiers/par-echeance', { params: cible, signal }).then((r) => r.data),
  demarrer: (id: number) => apiClient.post<DossierDTO>(`/dossiers/${id}/demarrage`).then((r) => r.data),
  sansSuite: (id: number, motif: string) =>
    apiClient.post<DossierDTO>(`/dossiers/${id}/sans-suite`, { motif }).then((r) => r.data),
  reouvrir: (id: number) => apiClient.post<DossierDTO>(`/dossiers/${id}/reouverture`).then((r) => r.data),
}
