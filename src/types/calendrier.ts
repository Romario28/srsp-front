import type { AlerteAnticipation } from './anticipation'

/** Miroir de CategorieCalendrier.java */
export type CategorieCalendrier = 'DEPART_RETRAITE' | 'AVANCEMENT' | 'AVANCEMENT_CLASSE' | 'ELD' | 'TITULARISATION' | 'FIN_CONTRAT' | 'INTEGRATION'

/** Miroir de CalendrierJourDTO.java : un nombre d'échéances pour un couple de dates. */
export interface CalendrierJour {
  datePreparation: string
  dateEcheance: string
  categorie: CategorieCalendrier
  nombre: number
}

/**
 * Miroir de CalendrierAgentDTO.java. L'échéance a la forme des lignes des écrans Retraites, Avancements...
 * C'est ce qui permet d'afficher les colonnes propres à chaque type et d'ouvrir la fiche sans nouvel appel.
 */
export interface CalendrierAgent {
  categorie: CategorieCalendrier
  echeance: AlerteAnticipation
}
