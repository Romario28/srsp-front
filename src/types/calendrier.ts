import type { StatutAgent } from './anticipation'

/** Miroir de CategorieCalendrier.java */
export type CategorieCalendrier = 'DEPART_RETRAITE' | 'AVANCEMENT' | 'ELD' | 'TITULARISATION' | 'FIN_CONTRAT'

/** Miroir de CalendrierJourDTO.java : un nombre d'échéances pour un couple de dates. */
export interface CalendrierJour {
  datePreparation: string
  dateEcheance: string
  categorie: CategorieCalendrier
  nombre: number
}

/** Miroir de CalendrierAgentDTO.java */
export interface CalendrierAgent {
  matricule: string
  nomComplet: string
  categorie: CategorieCalendrier
  statut: StatutAgent | null
  datePreparation: string | null
  dateEcheance: string | null
}
