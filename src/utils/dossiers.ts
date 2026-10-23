import type { EtatDossier } from '@/types/anticipation'
import type { DossierDTO, VueDossier } from '@/types/dossier'

/** Rouge = retard uniquement ; le reste est neutre, bleu ou violet. */
export const ETAT_DOSSIER: Record<EtatDossier, { label: string; tone: 'neutral' | 'danger' | 'accent' | 'violet' }> = {
  A_TRAITER: { label: 'À traiter', tone: 'neutral' },
  EN_RETARD: { label: 'En retard', tone: 'danger' },
  EN_COURS: { label: 'En cours', tone: 'accent' },
  SANS_SUITE: { label: 'Sans suite', tone: 'violet' },
}

/** Ordre envoyé au paramètre `inverse` de l'API. */
export type Ordre = 'DEFAUT' | 'INVERSE'
export const LIBELLE_ORDRE: Record<Ordre, string> = { INVERSE: 'Récent', DEFAUT: 'Ancien' }

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

export const VUES_DOSSIER: readonly VueDossier[] = ['A_TRAITER', 'EN_RETARD', 'EN_COURS', 'SANS_SUITE', 'TOUS']

/** État affiché d'un dossier : « en retard » n'existe que pour un dossier non démarré. */
export function etatDe(d: Pick<DossierDTO, 'statut' | 'enRetard'>): EtatDossier {
  switch (d.statut) {
    case 'SANS_SUITE': return 'SANS_SUITE'
    case 'EN_COURS': return 'EN_COURS'
    case 'EN_ATTENTE_DE_TRAITEMENT': return d.enRetard ? 'EN_RETARD' : 'A_TRAITER'
  }
}

const VUE_DE_ETAT: Record<EtatDossier, VueDossier> = {
  A_TRAITER: 'A_TRAITER', EN_RETARD: 'EN_RETARD', EN_COURS: 'EN_COURS', SANS_SUITE: 'SANS_SUITE',
}

/** Écran Dossiers filtré sur l'agent et ouvert sur l'onglet correspondant à son état. */
export function lienDossiers(d: Pick<DossierDTO, 'matricule' | 'statut' | 'enRetard'>): string {
  const params = new URLSearchParams({ matricule: d.matricule, vue: VUE_DE_ETAT[etatDe(d)] })
  return `/anticipation/dossiers?${params.toString()}`
}
