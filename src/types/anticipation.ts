export type TypeAnticipation =
  | 'DEPART_RETRAITE' | 'AVANCEMENT' | 'TITULARISATION' | 'FIN_CONTRAT' | 'ANOMALIE'

/** Les types avec échéance, donc une fenêtre configurable. ANOMALIE n'en a pas. */
export type TypeEcheance = Exclude<TypeAnticipation, 'ANOMALIE'>

/** Le statut peut être null si la donnée est absente ou non reconnue à l'import. */
export type StatutAgent = 'FONCTIONNAIRE' | 'CONTRACTUEL' | 'ELD'
export type CritereDate = 'ECHEANCE' | 'PREPARATION'

/** État du référentiel d'agents, renvoyé par GET /api/anticipation/base. */
export interface EtatBaseAgents {
  nbAgents: number
}

/** Ligne calculée à la demande par GET /api/anticipation/*, distincte d'une alerte persistée du batch. */
export interface AlerteAnticipation {
  matricule: string
  nomComplet: string
  type: TypeAnticipation
  dateEcheance: string | null
  datePreparation: string | null
  joursRestants: number
  details: string | null
  statut: StatutAgent | null
  dateNaissance: string | null
  avanceDate: string | null
  dateDebutContrat: string | null
  dateFinContrat: string | null
  corpsCode: string | null
  gradeCode: string | null
  categorieCode: string | null
}

export interface FiltresEcheances {
  prevenanceMois?: number
  retardMois?: number
  dateDebut?: string
  dateFin?: string
  critereDate?: CritereDate
}
