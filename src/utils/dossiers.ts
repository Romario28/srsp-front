import type { EtatDossier } from '@/types/anticipation'
import type { DossierDTO, EtapeDossier, StatutDossier, VueDossier } from '@/types/dossier'

/** Même ordre que l'enum EtapeDossier côté Java : colonnes du tableau et champs du formulaire. */
export const ETAPES: readonly { cle: EtapeDossier; label: string }[] = [
  { cle: 'CHEF_AVANT_FOP', label: 'CHEF' },
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

/** Mêmes tons que STATUT_DOSSIER ; « en retard » s'y ajoute en rouge. */
export const ETAT_DOSSIER: Record<EtatDossier, { label: string; tone: 'neutral' | 'danger' | 'accent' | 'success' | 'violet' }> = {
  A_TRAITER: { label: 'À traiter', tone: 'neutral' },
  EN_RETARD: { label: 'En retard', tone: 'danger' },
  EN_COURS: { label: 'En cours', tone: 'accent' },
  TRAITE: { label: 'Traité', tone: 'success' },
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

export const VUES_DOSSIER: readonly VueDossier[] = ['A_TRAITER', 'EN_RETARD', 'EN_COURS', 'TRAITES', 'SANS_SUITE', 'TOUS']

/** État affiché d'un dossier : « en retard » n'existe que pour un dossier non démarré. */
export function etatDe(d: Pick<DossierDTO, 'statut' | 'enRetard'>): EtatDossier {
  switch (d.statut) {
    case 'SANS_SUITE': return 'SANS_SUITE'
    case 'TRAITE': return 'TRAITE'
    case 'EN_COURS': return 'EN_COURS'
    case 'EN_ATTENTE_DE_TRAITEMENT': return d.enRetard ? 'EN_RETARD' : 'A_TRAITER'
  }
}

const VUE_DE_ETAT: Record<EtatDossier, VueDossier> = {
  A_TRAITER: 'A_TRAITER', EN_RETARD: 'EN_RETARD', EN_COURS: 'EN_COURS', TRAITE: 'TRAITES', SANS_SUITE: 'SANS_SUITE',
}

/** Écran Dossiers filtré sur l'agent et ouvert sur l'onglet correspondant à son état. */
export function lienDossiers(d: Pick<DossierDTO, 'matricule' | 'statut' | 'enRetard'>): string {
  const params = new URLSearchParams({ matricule: d.matricule, vue: VUE_DE_ETAT[etatDe(d)] })
  return `/anticipation/dossiers?${params.toString()}`
}
