// Miroir de CreateDepartementRequest.java — niveau reste un libellé texte libre
export interface CreateDepartementRequest {
  nomDepartement: string
  niveau: string
  idDepartementParent?: number | null
  description?: string
}

// Miroir de DepartementResponse.java
export interface DepartementResponse {
  id: number
  nomDepartement: string
  niveau: string
  idParent: number | null
  nomParent: string | null
  idChef: number | null
  nomChef: string | null
  chemin: string | null
  description: string | null
  estRacine: boolean
  estFeuille: boolean
}

// Niveaux suggérés dans le formulaire — libellé texte libre côté backend,
// mais une liste guidée évite les fautes de frappe qui casseraient la hiérarchie.
export const NIVEAUX_SUGGERES = [
  'Secrétariat Général',
  'Direction Générale',
  'Direction',
  'Service',
  'Division',
] as const
