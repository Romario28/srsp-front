// Miroir de CreateEmployeRequest.java — departement est maintenant un id, plus une String
export interface CreateEmployeRequest {
  matricule: string
  nom: string
  prenom: string
  poste: string
  idDepartement: number
  dateEmbauche?: string
}

export interface UpdateEmployeRequest {
  nom?: string
  prenom?: string
  poste?: string
  idDepartement?: number
  dateEmbauche?: string
}

// Miroir de EmployeResponse.java
export interface EmployeResponse {
  id: number
  matricule: string
  nom: string
  prenom: string
  poste: string
  idDepartement: number | null
  nomDepartement: string | null
  dateEmbauche: string | null
  aUnCompte: boolean
  estChef: boolean          // chef officiel de son département
  idManager: number | null
  nomManager: string | null // dérivé automatiquement (voir HierarchieService côté backend)
}

// GET /api/employes est paginé (Spring Data Page<T>)
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number   // page courante (0-indexed)
  size: number
  first: boolean
  last: boolean
}
