import { apiClient } from './client'
import { ECHEANCE_SLUGS } from '@/utils/anticipation'
import type { AlerteAnticipation, FiltresEcheances, TypeEcheance } from '@/types/anticipation'

export const anticipationApi = {
  echeances: (type: TypeEcheance, filtres: FiltresEcheances = {}, signal?: AbortSignal) =>
    apiClient.get<AlerteAnticipation[]>(`/anticipation/${ECHEANCE_SLUGS[type]}`, { params: filtres, signal }).then((r) => r.data),
  anomalies: (signal?: AbortSignal) =>
    apiClient.get<AlerteAnticipation[]>('/anticipation/anomalies', { signal }).then((r) => r.data),
}
