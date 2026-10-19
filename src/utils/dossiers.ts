import type { EtapeDossier, StatutDossier, VueDossier } from '@/types/dossier'

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

/** Ordre envoyé au paramètre `inverse` de l'API. */
export type Ordre = 'DEFAUT' | 'INVERSE'

export const LIBELLE_ORDRE: Record<Ordre, string> = { INVERSE: 'Récent (Nouveau)', DEFAUT: 'Ancien (Urgent)' }

export const AIDE_ORDRE: Partial<Record<VueDossier, Record<Ordre, string>>> = {
  A_TRAITER: {
    INVERSE: 'Préparation la plus récente en premier : les nouveaux dossiers, à commencer à préparer, sont en tête.',
    DEFAUT: "Échéance la plus proche en premier : les dossiers à finir aujourd'hui sont en tête.",
  },
  EN_RETARD: {
    INVERSE: 'Échéance la plus récente en premier : les retards qui viennent de commencer.',
    DEFAUT: "Échéance la plus ancienne en premier : les oublis les plus critiques d'abord.",
  },
}
