import { apiClient } from './client'
import { ECHEANCE_SLUGS } from '@/utils/anticipation'
import type { AgentFiche, AlerteAnticipation, EtatBaseAgents, FiltresEcheances, TypeEcheance } from '@/types/anticipation'

export const anticipationApi = {
  etatBase: (signal?: AbortSignal) =>
    apiClient.get<EtatBaseAgents>('/anticipation/base', { signal }).then((r) => r.data),
  fiche: (matricule: string, signal?: AbortSignal) =>
    apiClient.get<AgentFiche>(`/anticipation/agents/${encodeURIComponent(matricule)}`, { signal }).then((r) => r.data),
  echeances: (type: TypeEcheance, filtres: FiltresEcheances = {}, signal?: AbortSignal) =>
    apiClient.get<AlerteAnticipation[]>(`/anticipation/${ECHEANCE_SLUGS[type]}`, { params: filtres, signal }).then((r) => r.data),
  anomalies: (signal?: AbortSignal) =>
    apiClient.get<AlerteAnticipation[]>('/anticipation/anomalies', { signal }).then((r) => r.data),
}
