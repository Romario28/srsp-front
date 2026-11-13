export type CleFonction = 'SECRETAIRE' | 'COMPTABLE' | 'CHEF_BUREAU' | 'CHEF_DIVISION' | 'CHEF_SERVICE' | 'AUTRES'
export type CleTache = 'CONSULTATION' | 'TRAITEMENT' | 'VALIDATION' | 'MIGRATION' | 'AUTRES'

export const FONCTIONS: readonly { cle: CleFonction; label: string }[] = [
  { cle: 'SECRETAIRE', label: 'Secrétaire' },
  { cle: 'COMPTABLE', label: 'Comptable' },
  { cle: 'CHEF_BUREAU', label: 'Chef de bureau' },
  { cle: 'CHEF_DIVISION', label: 'Chef de division' },
  { cle: 'CHEF_SERVICE', label: 'Chef de service' },
  { cle: 'AUTRES', label: 'Autres' },
]

// Libellés recopiés du modèle
export const TACHES: readonly { cle: CleTache; label: string; detail?: string }[] = [
  { cle: 'CONSULTATION', label: 'Consultation', detail: 'Tableau de bord - informations pensionnée - Bulletin de pension' },
  { cle: 'TRAITEMENT', label: 'Traitement', detail: "Traitement des mouvements de l'entité" },
  { cle: 'VALIDATION', label: 'Validation', detail: "Vérification et approbation des mouvements de l'entité" },
  { cle: 'MIGRATION', label: 'Migration', detail: "Transfert des données après validation de chaque entité" },
  { cle: 'AUTRES', label: 'Autres' },
]

export const ENTETE_ADMINISTRATION = [
  "MINISTERE DE L'ECONOMIE ET DES FINANCES",
  'SECRETARIAT GENERAL',
  'DIRECTION GENERALE DU BUDGET ET DES FINANCES',
  'DIRECTION DE LA SOLDE ET DES PENSIONS',
] as const
export const DESTINATAIRE_DEMANDE = 'CHEF DE SERVICE DE LA SOLDE ET DES PENSIONS'

// [MODIFIÉ] un seul lieu pour les deux documents (était : LIEU_DEMANDE = 'Fianarantsoa' et LIEU_LETTRE = 'Antananarivo')
export const LIEU_DOCUMENTS = 'Fianarantsoa'

// Nom de l'application cité dans la lettre (le modèle contient « Système de Gestion de la Solde et des Pensions »)
export const LIBELLE_APPLICATION_LETTRE = 'Système de Gestion de la Solde et des Pensions'

// Logo facultatif : placez le fichier dans public/ (PNG ou JPEG). Absent, les documents sortent sans logo.
export const LOGO_URL = '/logo-mef.png'
