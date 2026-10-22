import type { DossierDTO } from './dossier'
import type { Page } from './api'

export interface CompteursAlertes { nouvelles: number; anomalies: number }
export interface EcheancesAVenirDTO {
  jours: number
  du: string
  au: string
  total: number
  parCategorie: Record<string, number>
}
export interface EffectifsDTO {
  total: number
  fonctionnaires: number
  contractuels: number
  eld: number
  statutNonRenseigne: number
  ages: {
    bornes: { min: number; pas: number; max: number }
    ageLegal: number
    lignes: { tranche: number; sexe: string; categorie: string; nombre: number }[]
    sansDateNaissance: number
  }
  retraites: { depuis: string; mois: { cle: string; nombre: number }[]; annees: { cle: string; nombre: number }[]; dejaAtteint: number }
}
export interface EtatChargement<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  reload: () => void
}
/** Top des dossiers urgents : retards les plus anciens, ou dossiers à traiter à l'échéance la plus proche. */
export interface Urgences { mode: 'RETARD' | 'A_TRAITER'; page: Page<DossierDTO> }
