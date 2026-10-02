import { apiClient } from './client'
import { ECHEANCE_SLUGS } from '@/utils/anticipation'
import type { AlerteAnticipation, EtatBaseAgents, FiltresEcheances, TypeEcheance } from '@/types/anticipation'

export const anticipationApi = {
  etatBase: (signal?: AbortSignal) =>
    apiClient.get<EtatBaseAgents>('/anticipation/base', { signal }).then((r) => r.data),
  echeances: (type: TypeEcheance, filtres: FiltresEcheances = {}, signal?: AbortSignal) =>
    apiClient.get<AlerteAnticipation[]>(`/anticipation/${ECHEANCE_SLUGS[type]}`, { params: filtres, signal }).then((r) => r.data),
  anomalies: (signal?: AbortSignal) =>
    apiClient.get<AlerteAnticipation[]>('/anticipation/anomalies', { signal }).then((r) => r.data),
}
