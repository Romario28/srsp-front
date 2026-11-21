export type CleTache = 'CONSULTATION' | 'TRAITEMENT' | 'AUTRES'

// Libellés recopiés du modèle
export const TACHES: readonly { cle: CleTache; label: string; detail?: string }[] = [
  { cle: 'CONSULTATION', label: 'Consultation', detail: 'Tableau de bord - informations pensionnée - Bulletin de pension' },
  { cle: 'TRAITEMENT', label: 'Traitement', detail: "Traitement des mouvements de l'entité" },
  { cle: 'AUTRES', label: 'Autres' },
]

export const ENTETE_ADMINISTRATION = [
  "MINISTERE DE L'ECONOMIE ET DES FINANCES",
  'SECRETARIAT GENERAL',
  'DIRECTION GENERALE DU BUDGET ET DES FINANCES',
  'DIRECTION DE LA SOLDE ET DES PENSIONS',
] as const
export const DESTINATAIRE_DEMANDE = 'CHEF DE SERVICE DE LA SOLDE ET DES PENSIONS'

// Un seul lieu pour les deux documents
export const LIEU_DOCUMENTS = 'Fianarantsoa'

// Nom de l'application cité dans la lettre (le modèle contient « Système de Gestion de la Solde et des Pensions »)
export const LIBELLE_APPLICATION_LETTRE = 'Système de Gestion de la Solde et des Pensions'

// Logo facultatif : placez le fichier dans public/ (PNG ou JPEG). Absent, les documents sortent sans logo.
export const LOGO_URL = '/logo-mef.png'
