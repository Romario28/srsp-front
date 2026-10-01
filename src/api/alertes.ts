import { apiClient } from './client'
import type { Page } from '@/types/api'
import type { AlerteDTO, FiltresAlertes } from '@/types/alerte'

function lister(filtres: FiltresAlertes, signal?: AbortSignal) {
  return apiClient.get<Page<AlerteDTO>>('/alertes', { params: filtres, signal }).then((response) => response.data)
}

export const alertesApi = {
  lister,
  compter: (filtres: Omit<FiltresAlertes, 'page' | 'size'>, signal?: AbortSignal) =>
    lister({ ...filtres, page: 0, size: 1 }, signal).then((page) => page.totalElements),
  // Ce GET modifie NOUVELLE en VUE : l'appeler uniquement à la demande explicite de l'utilisateur.
  consulter: (id: number) => apiClient.get<AlerteDTO>(`/alertes/${id}`).then((response) => response.data),
  acquitter: (id: number) => apiClient.patch<AlerteDTO>(`/alertes/${id}/acquitter`).then((response) => response.data),
}
