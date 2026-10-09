export type TypeAnticipation =
  | 'DEPART_RETRAITE' | 'AVANCEMENT' | 'TITULARISATION' | 'FIN_CONTRAT' | 'ANOMALIE'

/** Les types avec échéance, donc une fenêtre configurable. ANOMALIE n'en a pas. */
export type TypeEcheance = Exclude<TypeAnticipation, 'ANOMALIE'>

/** Le statut peut être null si la donnée est absente ou non reconnue à l'import. */
export type StatutAgent = 'FONCTIONNAIRE' | 'CONTRACTUEL' | 'ELD'
export type CritereDate = 'ECHEANCE' | 'PREPARATION'
export type CasGradeSuivant = 'UNIQUE' | 'AMBIGU' | 'DERNIER_GRADE' | 'INDETERMINE'

export interface GradeSuivantDTO {
  cas: CasGradeSuivant
  codes: string[]
}

export interface ReferenceAgent {
  code: string
  libelle: string | null
}

/** Fiche complète récupérée à l'ouverture du détail d'une échéance. */
export interface AgentFiche {
  matricule: string
  nom: string | null
  prenoms: string | null
  statut: StatutAgent | null
  dateNaissance: string | null
  sexe: string | null
  cin: string | null
  posteNumero: string | null
  corps: ReferenceAgent | null
  categorieCode: string | null
  grade: ReferenceAgent | null
  indice: string | null
  dateDebutContrat: string | null
  dateFinContrat: string | null
  avanceDate: string | null
  situation: ReferenceAgent | null
  hee: ReferenceAgent | null
  heeCategorieCode: string | null
  sectionCode: string | null
  localite: ReferenceAgent | null
  soa: ReferenceAgent | null
  regCode: string | null
  ministere: ReferenceAgent | null
}

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
  gradeSuivant: GradeSuivantDTO | null
}

export interface FiltresEcheances {
  prevenanceMois?: number
  retardMois?: number
  dateDebut?: string
  dateFin?: string
  critereDate?: CritereDate
}
