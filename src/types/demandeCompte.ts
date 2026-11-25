import type { AgentLieDTO, PerimetreDTO } from './utilisateur'

export type ProfilDemande = 'ROLE_AGENT' | 'ROLE_RH' | 'ROLE_CHEF'

export interface DemandeCompteRequest {
  matricule: string
  nom: string      // [MODIFIÉ] chaîne vide si non renseigné : au moins le nom ou le prénom
  prenom: string   // [MODIFIÉ] idem
  email: string
  password: string
  profil: string
  departementId: number
}

export interface DemandeCompteDTO {
  id: number
  email: string
  nom: string | null      // [MODIFIÉ] était : string
  prenom: string | null   // [MODIFIÉ] était : string
  matricule: string
  profil: string
  dateDemande: string
  agentLie: AgentLieDTO
  perimetreSuggere: PerimetreDTO
  departement: string | null
}
