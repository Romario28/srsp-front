import type { TypeEcheance } from './anticipation'

export interface ConfigurationDelaiDTO {
  type: TypeEcheance
  prevenanceJours: number
  retardJours: number
  prevenanceJoursDefaut: number
  retardJoursDefaut: number
  personnalise: boolean
}

export interface DefinirDelaiRequest {
  prevenanceJours: number
  retardJours: number
}
