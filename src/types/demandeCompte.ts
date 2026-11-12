import type { AgentLieDTO, PerimetreDTO } from './utilisateur'

export type ProfilDemande = 'ROLE_AGENT' | 'ROLE_RH' | 'ROLE_CHEF'

export interface DemandeCompteRequest {
  matricule: string
  nom: string
  prenom: string
  email: string
  password: string
  profil: string
  departementId: number   // [NOUVEAU]
}

export interface DemandeCompteDTO {
  id: number
  email: string
  nom: string
  prenom: string
  matricule: string
  profil: string
  dateDemande: string
  agentLie: AgentLieDTO
  perimetreSuggere: PerimetreDTO
  departement: string | null   // [NOUVEAU] libellé déclaré ; null pour une demande antérieure
}
