import { apiClient } from './client'
import { alertesApi } from './alertes'
import { dossiersApi } from './dossiers'
import type { CompteursAlertes, EcheancesAVenirDTO, EffectifsDTO, Urgences } from '@/types/dashboard'

export const dashboardApi = {
  effectifs: () => apiClient.get<EffectifsDTO>('/dashboard/effectifs').then((r) => r.data),
  echeances: (jours: number) => apiClient.get<EcheancesAVenirDTO>('/dashboard/echeances', { params: { jours } }).then((r) => r.data),
  alertes: async (): Promise<CompteursAlertes> => {
    const [nouvelles, anomalies] = await Promise.all([
      alertesApi.compter({ statut: 'NOUVELLE' }),
      alertesApi.compter({ statut: 'NOUVELLE', type: 'ANOMALIE' }),
    ])
    return { nouvelles, anomalies }
  },
  urgences: async (): Promise<Urgences> => {
    const retards = await dossiersApi.lister({ vue: 'EN_RETARD', inverse: false, page: 0, size: 5 })
    if (retards.totalElements > 0) return { mode: 'RETARD', page: retards }
    return { mode: 'A_TRAITER', page: await dossiersApi.lister({ vue: 'A_TRAITER', inverse: false, page: 0, size: 5 }) }
  },
}
