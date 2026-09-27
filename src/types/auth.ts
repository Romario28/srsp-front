export interface LoginRequest {
  email: string
  password: string
}

// Miroir de LoginResponse.java
export interface LoginResponse {
  token: string
  email: string
  nomComplet: string
  roles: string[]        // ["ROLE_ADMIN", "ROLE_EMPLOYE"]
  statut: string
}

// Miroir de la Map renvoyée par GET /api/auth/me
export interface MeResponse {
  id: number
  email: string
  nomComplet: string
  statut: string
  nomDepartement: string
  roles: string[]
  dateDerniereConnexion: string
}

// Seuls ces 2 rôles existent désormais — "chef", "RH central" et "RH local"
// sont des positions structurelles ou des délégations, pas des rôles Spring Security.
export type Role = 'ROLE_ADMIN' | 'ROLE_EMPLOYE'
