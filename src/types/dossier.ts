import type { FiltresAgents, StatutAgent, TypeAnticipation } from './anticipation'

export type EtapeDossier = 'CHEF_AVANT_FOP' | 'FOP' | 'VISA' | 'CF' | 'PREFET' | 'PERS_TANA' | 'SOLDE' | 'FIN'
export type StatutDossier = 'EN_ATTENTE_DE_TRAITEMENT' | 'EN_COURS' | 'TRAITE' | 'SANS_SUITE'
export type VueDossier = 'A_TRAITER' | 'EN_RETARD' | 'EN_COURS' | 'TRAITES' | 'SANS_SUITE' | 'TOUS'

/** Miroir de DossierDTO.java */
export interface DossierDTO {
  id: number
  version: number
  matricule: string
  nomComplet: string
  statutAgent: StatutAgent | null
  corpsCode: string | null
  categorieCode: string | null
  gradeCode: string | null
  type: TypeAnticipation
  datePreparation: string
  dateEcheance: string
  etapes: Record<EtapeDossier, string | null>
  statut: StatutDossier
  motifSansSuite: string | null
  enRetard: boolean
  joursRetard: number | null
  aRelancer: boolean
  joursSansNouvelle: number | null
}

/** Miroir de SyntheseDossiersDTO.java */
export interface SyntheseDossiers {
  aTraiter: number
  enRetard: number
  enCours: number
  traites: number
  sansSuite: number
  aRelancer: number // sous-ensemble de enCours
  dateReprise: string | null
  relanceApresJours: number
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

export interface MajEtapesRequest {
  version: number
  etapes: Partial<Record<EtapeDossier, string | null>>
}

export interface LotRequest {
  ids: number[]
  etape: EtapeDossier
  date: string
  ecraser: boolean
}

export interface ResultatLot {
  modifies: number
  inchanges: number
  refuses: { id: number; libelle: string; motif: string }[]
}
