import type { EtatDossier, FiltresAgents, GradeSuivantDTO, TypeAnticipation } from './anticipation'

export type StatutAlerte = 'NOUVELLE' | 'VUE' | 'ACQUITTEE'

/** Alerte persistée par le batch de nuit, distincte des résultats de calcul à la demande. */
export interface AlerteDTO {
  id: number
  matriculeAgent: string
  nomCompletAgent: string | null
  type: TypeAnticipation
  dateEcheance: string | null
  datePreparation: string | null
  gradeSuivant: GradeSuivantDTO | null
  gradeActuel: string | null
  dateEffetActuelle: string | null
  details: string | null
  statut: StatutAlerte
  dateDetection: string
  dateDerniereConsultation: string | null
  dateAcquittement: string | null
  acquitteeParEmail: string | null
  dossier: EtatDossier | null
}

export interface FiltresAlertes extends FiltresAgents {
  type?: TypeAnticipation
  statut?: StatutAlerte   // statut de l'ALERTE ; celui de l'agent est statutAgent
  matricule?: string
  page?: number
  size?: number
}
