import type { EtapeDossier, StatutDossier } from '@/types/dossier'

/** Même ordre que l'enum EtapeDossier côté Java : colonnes du tableau et champs du formulaire. */
export const ETAPES: readonly { cle: EtapeDossier; label: string }[] = [
  { cle: 'CHEF_AVANT_FOP', label: 'Chef avant FOP' },
  { cle: 'FOP', label: 'FOP' },
  { cle: 'VISA', label: 'VISA' },
  { cle: 'CF', label: 'CF' },
  { cle: 'PREFET', label: 'Préfet' },
  { cle: 'PERS_TANA', label: 'Pers Tana' },
  { cle: 'SOLDE', label: 'Solde' },
  { cle: 'FIN', label: 'FIN' },
]

export const STATUT_DOSSIER: Record<StatutDossier, { label: string; tone: 'neutral' | 'accent' | 'success' | 'violet' }> = {
  EN_ATTENTE_DE_TRAITEMENT: { label: 'À traiter', tone: 'neutral' },
  EN_COURS: { label: 'En cours', tone: 'accent' },
  TRAITE: { label: 'Traité', tone: 'success' },
  SANS_SUITE: { label: 'Sans suite', tone: 'violet' },
}
