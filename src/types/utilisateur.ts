/** Miroir de PerimetreDTO.java : une liste vide = pas de restriction sur cet axe. */
export interface PerimetreDTO { ministeres: string[]; soas: string[]; fivs: string[] }
export const PERIMETRE_VIDE: PerimetreDTO = { ministeres: [], soas: [], fivs: [] }
export const perimetreVide = (p: PerimetreDTO) => p.ministeres.length + p.soas.length + p.fivs.length === 0

/** Miroir de AgentLieDTO.java. trouve = false : matricule saisi, agent absent de la base. */
export interface AgentLieDTO {
  matricule: string
  trouve: boolean
  nom: string | null
  prenoms: string | null
  gradeCode: string | null
  gradeLibelle: string | null
  corpsCode: string | null
  corpsLibelle: string | null
  categorieCode: string | null
}

/** Miroir de UtilisateurDTO.java (liste). */
export interface UtilisateurDTO {
  id: number
  email: string
  statut: 'ACTIF' | 'SUSPENDU' | 'DESACTIVE'
  dateCreation: string
  dateDerniereConnexion: string | null
  nomComplet: string
  matriculeAgent: string | null
  roles: string[]
  perimetre: PerimetreDTO
  agirSurSonDossier: boolean
}

/** Miroir de UtilisateurDetailDTO.java (fiche). */
export interface UtilisateurDetailDTO {
  id: number
  email: string
  statut: 'ACTIF' | 'SUSPENDU' | 'DESACTIVE'
  dateCreation: string
  dateDerniereConnexion: string | null
  nom: string | null
  prenom: string | null
  matriculeAgent: string | null
  roles: string[]
  perimetre: PerimetreDTO
  agentLie: AgentLieDTO | null
  agirSurSonDossier: boolean
}

export interface UpdateUtilisateurRequest {
  nom: string
  prenom: string
  matriculeAgent: string   // vide = pas de lien
  roles: string[]
  perimetre: PerimetreDTO
  agirSurSonDossier?: boolean
}
export interface CreateUtilisateurRequest extends UpdateUtilisateurRequest { email: string; password: string }

export interface UtilisateurCreatedResponse { id: number; email: string; statut: string }
