// Miroir de CreateUtilisateurRequest.java — idGroupe retiré (Groupe supprimé du backend)
export interface CreateUtilisateurRequest {
  email: string
  password: string
  idEmploye?: number | null
  roles: string[]
}

// Miroir de UtilisateurDTO.java
export interface UtilisateurDTO {
  id: number
  email: string
  statut: 'ACTIF' | 'SUSPENDU' | 'DESACTIVE'
  dateCreation: string
  dateDerniereConnexion: string | null
  nomEmploye: string | null
  matriculeEmploye: string | null
  nomDepartement: string | null
  roles: string[]
}

export interface UtilisateurCreatedResponse {
  id: number
  email: string
  statut: string
}
