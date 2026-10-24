export type TypeAnticipation =
  | 'DEPART_RETRAITE' | 'AVANCEMENT' | 'AVANCEMENT_CLASSE' | 'TITULARISATION' | 'FIN_CONTRAT' | 'INTEGRATION' | 'ANOMALIE'

/** Les types avec échéance, donc une fenêtre configurable. ANOMALIE n'en a pas. */
export type TypeEcheance = Exclude<TypeAnticipation, 'ANOMALIE'>

/** Le statut peut être null si la donnée est absente ou non reconnue à l'import. */
export type StatutAgent = 'FONCTIONNAIRE' | 'CONTRACTUEL' | 'ELD'
export type CritereDate = 'ECHEANCE' | 'PREPARATION'
/** Miroir de EtatDossier.java : état du dossier lié à une échéance. null = aucun dossier. */
export type EtatDossier = 'A_TRAITER' | 'EN_RETARD' | 'EN_COURS' | 'SANS_SUITE'
export type CasGradeSuivant = 'UNIQUE' | 'AMBIGU' | 'DERNIER_GRADE' | 'INDETERMINE'

export interface GradeSuivantDTO {
  cas: CasGradeSuivant
  codes: string[]
}

export interface ReferenceAgent {
  code: string
  libelle: string | null
}

/** Miroir de SituationIntegration.java */
export type SituationIntegration = 'NON_CONTRACTUEL' | 'CONTRAT_AVEC_FIN' | 'DEBUT_MANQUANT' | 'CONCERNE'

/** Miroir de AgentFicheDTO.Integration : les dates ne sont renseignées que si CONCERNE. */
export interface IntegrationFiche {
  situation: SituationIntegration
  dateIntegration: string | null
  datePreparation: string | null
}

/** Fiche complète récupérée à l'ouverture du détail d'une échéance. */
export interface AgentFiche {
  matricule: string
  nom: string | null
  prenoms: string | null
  statut: StatutAgent | null
  integration: IntegrationFiche
  /** Grade suivant du grade actuel (fourni par le serveur ; absent sur un serveur plus ancien, affiché « — »). */
  gradeSuivant?: GradeSuivantDTO | null
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
  dossier: EtatDossier | null
}

/** Filtres cumulables sur les agents. Absent = pas de filtre. Noms identiques aux paramètres de l'API. */
export interface FiltresAgents {
  statutAgent?: StatutAgent
  corps?: string
  grade?: string
  categorie?: string
  fiv?: string
  soa?: string
  region?: string
  ministere?: string
}

/** Miroir d'OptionFiltre.java */
export interface OptionFiltre {
  code: string
  libelle: string | null
}

/** Miroir d'OptionsFiltresDTO.java */
export interface OptionsFiltres {
  corps: OptionFiltre[]
  grades: OptionFiltre[]
  categories: OptionFiltre[]
  fiv: OptionFiltre[]
  soa: OptionFiltre[]
  regions: OptionFiltre[]
  ministeres: OptionFiltre[]
}

export interface FiltresEcheances extends FiltresAgents {
  prevenanceMois?: number
  retardMois?: number
  dateDebut?: string
  dateFin?: string
  critereDate?: CritereDate
}
