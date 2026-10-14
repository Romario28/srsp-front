import { apiClient } from './client'
import type { CritereDate } from '@/types/anticipation'
import type { CalendrierAgent, CalendrierJour } from '@/types/calendrier'

export const calendrierApi = {
  /** Une année entière, avec les deux dates : le critère d'affichage se choisit côté client. */
  annee: (annee: number, signal?: AbortSignal) =>
    apiClient.get<CalendrierJour[]>('/anticipation/calendrier', { params: { annee }, signal }).then((r) => r.data),

  // Au clic sur un jour seulement : la grille ne transporte que des comptes
  agents: (date: string, critereDate: CritereDate, signal?: AbortSignal) =>
    apiClient.get<CalendrierAgent[]>('/anticipation/calendrier/agents', { params: { date, critereDate }, signal }).then((r) => r.data),

  // Tous les agents d'un mois : `mois` est le mois civil (1 à 12), pas l'index 0-11 de la page
  agentsDuMois: (annee: number, mois: number, critereDate: CritereDate, signal?: AbortSignal) =>
    apiClient.get<CalendrierAgent[]>('/anticipation/calendrier/agents/mois', { params: { annee, mois, critereDate }, signal }).then((r) => r.data),
}
