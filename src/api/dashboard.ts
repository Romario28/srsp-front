import { apiClient } from './client'
import { alertesApi } from './alertes'
import { dossiersApi } from './dossiers'
import type { FiltresAgents } from '@/types/anticipation'
import type { CompteursAlertes, EcheancesAVenirDTO, EffectifsDTO, Urgences } from '@/types/dashboard'

export const dashboardApi = {
  effectifs: (portee: FiltresAgents) => apiClient.get<EffectifsDTO>('/dashboard/effectifs', { params: portee }).then((r) => r.data),
  echeances: (jours: number, portee: FiltresAgents) => apiClient.get<EcheancesAVenirDTO>('/dashboard/echeances', { params: { jours, ...portee } }).then((r) => r.data),
  alertes: async (portee: FiltresAgents): Promise<CompteursAlertes> => {
    const [nouvelles, anomalies] = await Promise.all([
      alertesApi.compter({ statut: 'NOUVELLE', ...portee }),
      alertesApi.compter({ statut: 'NOUVELLE', type: 'ANOMALIE', ...portee }),
    ])
    return { nouvelles, anomalies }
  },
  urgences: async (portee: FiltresAgents): Promise<Urgences> => {
    const base = { inverse: false, page: 0, size: 5, ...portee }
    const retards = await dossiersApi.lister({ vue: 'EN_RETARD', ...base })
    if (retards.totalElements > 0) return { mode: 'RETARD', page: retards }
    return { mode: 'A_TRAITER', page: await dossiersApi.lister({ vue: 'A_TRAITER', ...base }) }
  },
}
