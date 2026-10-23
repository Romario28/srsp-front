import type { FiltresAgents, StatutAgent, TypeAnticipation } from './anticipation'

export type StatutDossier = 'EN_ATTENTE_DE_TRAITEMENT' | 'EN_COURS' | 'SANS_SUITE'
export type VueDossier = 'A_TRAITER' | 'EN_RETARD' | 'EN_COURS' | 'SANS_SUITE' | 'TOUS'

/** Miroir de DossierDTO.java */
export interface DossierDTO {
  id: number
  matricule: string
  nomComplet: string
  statutAgent: StatutAgent | null
  corpsCode: string | null
  categorieCode: string | null
  gradeCode: string | null
  type: TypeAnticipation
  datePreparation: string
  dateEcheance: string
  statut: StatutDossier
  dateDemarrage: string | null
  motifSansSuite: string | null
  enRetard: boolean
  joursRetard: number | null
}

/** Identifie le dossier d'une ligne d'agent : clé d'unicité (matricule, type, échéance). */
export interface CibleDossier {
  matricule: string
  type: TypeAnticipation
  dateEcheance: string
}

/** Miroir de SyntheseDossiersDTO.java */
export interface SyntheseDossiers {
  aTraiter: number
  enRetard: number
  enCours: number
  sansSuite: number
  dateReprise: string | null
}

/** Ce qui réduit la liste, donc aussi les compteurs des onglets. */
export type FiltresSynthese = FiltresAgents & { type?: TypeAnticipation; matricule?: string }

export interface FiltresDossiers {
  vue: VueDossier
  inverse: boolean
  type?: TypeAnticipation
  matricule?: string
  page: number
  size: number
}
