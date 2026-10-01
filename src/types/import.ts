export type ImportKey =
  | 'grade' | 'corps' | 'sanction' | 'soa' | 'localite' | 'ministere' | 'hee'
  | 'indice-grade-corps' | 'agents'

export interface RapportImport {
  lus: number
  crees: number
  misAJour: number
  erreurs: string[]
  doublonsCle: Record<string, number>
  referencesNonResolues: Record<string, number>
  exemplesNonResolus: Record<string, string[]>
}

export interface EtatImport {
  phase: 'envoi' | 'termine' | 'echec'
  fichierNom: string
  debut: number
  dureeMs?: number
  rapport?: RapportImport
  erreur?: string
  erreurReseau?: boolean
}
