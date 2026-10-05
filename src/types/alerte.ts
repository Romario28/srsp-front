import type { TypeAnticipation } from './anticipation'

export type StatutAlerte = 'NOUVELLE' | 'VUE' | 'ACQUITTEE'

/** Alerte persistée par le batch de nuit, distincte des résultats de calcul à la demande. */
export interface AlerteDTO {
  id: number
  matriculeAgent: string
  nomCompletAgent: string | null
  type: TypeAnticipation
  dateEcheance: string | null
  datePreparation: string | null
  details: string | null
  statut: StatutAlerte
  dateDetection: string
  dateDerniereConsultation: string | null
  dateAcquittement: string | null
  acquitteeParEmail: string | null
}

export interface FiltresAlertes {
  type?: TypeAnticipation
  statut?: StatutAlerte
  matricule?: string
  page?: number
  size?: number
}
