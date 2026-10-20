import { apiClient } from './client'
import type { FiltresAgents } from '@/types/anticipation'
import type { Page } from '@/types/api'
import type { DossierDTO, FiltresDossiers, FiltresSynthese, LotRequest, MajEtapesRequest, ResultatLot, SyntheseDossiers } from '@/types/dossier'

export const dossiersApi = {
  lister: (filtres: FiltresDossiers & FiltresAgents, signal?: AbortSignal) =>
    apiClient.get<Page<DossierDTO>>('/dossiers', { params: filtres, signal }).then((r) => r.data),
  synthese: (filtres: FiltresSynthese, signal?: AbortSignal) =>
    apiClient.get<SyntheseDossiers>('/dossiers/synthese', { params: filtres, signal }).then((r) => r.data),
  majEtapes: (id: number, payload: MajEtapesRequest) =>
    apiClient.put<DossierDTO>(`/dossiers/${id}/etapes`, payload).then((r) => r.data),
  appliquerLot: (payload: LotRequest) => apiClient.post<ResultatLot>('/dossiers/lot', payload).then((r) => r.data),
  sansSuite: (id: number, motif: string) =>
    apiClient.post<DossierDTO>(`/dossiers/${id}/sans-suite`, { motif }).then((r) => r.data),
  reouvrir: (id: number) => apiClient.post<DossierDTO>(`/dossiers/${id}/reouverture`).then((r) => r.data),
}
