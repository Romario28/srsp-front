import type { AgentFiche, AlerteAnticipation } from './anticipation'
import type { DossierDTO } from './dossier'

/** Miroir de MonEspaceDTO.java */
export interface MonEspaceDTO {
  fiche: AgentFiche
  /** Faux : situation administrative autre que « en activité », aucune échéance n'est calculée. */
  enActivite: boolean
  agirSurSonDossier: boolean
  echeances: AlerteAnticipation[]
  donneesManquantes: string[]
  dossiers: DossierDTO[]
}
