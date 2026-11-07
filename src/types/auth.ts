export interface LoginRequest {
  email: string
  password: string
}

// Miroir de LoginResponse.java
export interface LoginResponse {
  token: string
  email: string
  nomComplet: string
  roles: string[]
  statut: string
}

/** [NOUVEAU] Miroir de Perimetre.java, tel que renvoyé par /auth/me. */
export interface PerimetreMe { accesTotal: boolean; ministeres: string[]; soas: string[]; fivs: string[] }

// Miroir de la Map renvoyée par GET /api/auth/me
export interface MeResponse {
  id: number
  email: string
  nomComplet: string
  statut: string
  matriculeAgent: string            // [NOUVEAU] chaîne vide si le compte n'est lié à aucun agent
  roles: string[]
  dateDerniereConnexion: string
  peutTraiterSonDossier: boolean    // [NOUVEAU] vrai si son rôle est dispensé de la règle du dossier propre
  perimetre: PerimetreMe            // [NOUVEAU]
}

// [MODIFIÉ]
export type Role = 'ROLE_ADMIN' | 'ROLE_GESTIONNAIRE'