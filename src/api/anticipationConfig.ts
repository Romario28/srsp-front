import { apiClient } from './client'
import type { TypeEcheance } from '@/types/anticipation'
import type { ConfigurationDelaiDTO, DefinirDelaiRequest } from '@/types/configurationDelai'

export const anticipationConfigApi = {
  lister: (signal?: AbortSignal) => apiClient.get<ConfigurationDelaiDTO[]>('/anticipation/configuration', { signal }).then((r) => r.data),
  definir: (type: TypeEcheance, payload: DefinirDelaiRequest) =>
    apiClient.put<ConfigurationDelaiDTO>(`/anticipation/configuration/${type}`, payload).then((r) => r.data),
  reinitialiser: (type: TypeEcheance) => apiClient.delete<void>(`/anticipation/configuration/${type}`),
}
