import type { StatutAgent, TypeAnticipation, TypeEcheance } from '@/types/anticipation'

export const TYPE_LABELS: Record<TypeAnticipation, string> = {
  DEPART_RETRAITE: 'Départ à la retraite',
  AVANCEMENT: 'Avancement',
  TITULARISATION: 'Titularisation',
  FIN_CONTRAT: 'Fin de contrat',
  ANOMALIE: 'Anomalie',
}

export const TYPES_ECHEANCE: readonly TypeEcheance[] = [
  'DEPART_RETRAITE', 'AVANCEMENT', 'TITULARISATION', 'FIN_CONTRAT',
]

const STATUT_LABELS: Record<StatutAgent, { singulier: string; pluriel: string }> = {
  FONCTIONNAIRE: { singulier: 'Fonctionnaire', pluriel: 'Fonctionnaires' },
  CONTRACTUEL: { singulier: 'Contractuel', pluriel: 'Contractuels' },
  ELD: { singulier: 'ELD', pluriel: 'ELD' },
}

export function statutAgentLabel(statut: StatutAgent | null | undefined, pluriel = false): string {
  if (statut == null) return 'Non renseigné'
  const label = STATUT_LABELS[statut]
  return label ? (pluriel ? label.pluriel : label.singulier) : 'Non renseigné'
}

export const ORDRE_STATUTS: readonly (StatutAgent | null)[] = ['FONCTIONNAIRE', 'CONTRACTUEL', 'ELD', null]

function normaliserStatut(statut: string | null | undefined): StatutAgent | null {
  return statut === 'FONCTIONNAIRE' || statut === 'CONTRACTUEL' || statut === 'ELD' ? statut : null
}

export interface GroupeStatut<T> {
  statut: StatutAgent | null
  label: string
  items: T[]
}

export function grouperParStatut<T extends { statut: StatutAgent | null }>(items: T[]): GroupeStatut<T>[] {
  return ORDRE_STATUTS.map((statut) => ({
    statut,
    label: statutAgentLabel(statut, true),
    items: items.filter((item) => normaliserStatut(item.statut) === statut),
  }))
}

export function formatDuree(jours: number): string {
  const j = Math.abs(Math.round(jours))
  if (j < 30) return `${j} jour${j > 1 ? 's' : ''}`
  const mois = Math.floor(j / 30)
  if (mois < 12) return `${mois} mois`
  const ans = Math.floor(mois / 12)
  const reste = mois % 12
  return `${ans} an${ans > 1 ? 's' : ''}${reste > 0 ? ` et ${reste} mois` : ''}`
}

export function libelleEcheance(joursRestants: number | null | undefined): string {
  if (joursRestants == null) return '—'
  if (joursRestants === 0) return "Aujourd'hui"
  return joursRestants > 0
    ? `Dans ${formatDuree(joursRestants)}`
    : `Dépassé de ${formatDuree(joursRestants)}`
}

/** Doit rester aligné sur FenetreAnticipation.MAX_MOIS côté backend. */
export const MAX_MOIS = 1200

export function formatMois(mois: number): string {
  if (mois < 12) return `${mois} mois`
  const ans = Math.floor(mois / 12)
  const reste = mois % 12
  return `${mois} mois (${ans} an${ans > 1 ? 's' : ''}${reste > 0 ? ` et ${reste} mois` : ''})`
}

export const ECHEANCE_SLUGS: Record<TypeEcheance, string> = {
  DEPART_RETRAITE: 'retraite',
  AVANCEMENT: 'avancement',
  TITULARISATION: 'titularisation',
  FIN_CONTRAT: 'fin-contrat',
}

export type FiltreStatut = 'TOUS' | StatutAgent | 'NON_RENSEIGNE'

export function cleStatut(statut: StatutAgent | null): Exclude<FiltreStatut, 'TOUS'> {
  return statut ?? 'NON_RENSEIGNE'
}

export function toneDelai(jours: number): 'danger' | 'warning' | 'neutral' {
  if (jours < 0) return 'danger'
  return jours <= 30 ? 'warning' : 'neutral'
}
