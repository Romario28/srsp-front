import type { TypeEcheance } from './anticipation'

export interface ConfigurationDelaiDTO {
  type: TypeEcheance
  prevenanceMois: number
  retardMois: number
  prevenanceMoisDefaut: number
  retardMoisDefaut: number
  personnalise: boolean
}

export interface DefinirDelaiRequest {
  prevenanceMois: number
  retardMois: number
}
