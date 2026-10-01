import { formatDate } from '@/utils/date'
import type { FiltresEcheances } from '@/types/anticipation'
import type { ConfigurationDelaiDTO } from '@/types/configurationDelai'

export interface EtatFiltres {
  prevenance: string
  retard: string
  dateDebut: string
  dateFin: string
}

export const FILTRES_VIDES: EtatFiltres = { prevenance: '', retard: '', dateDebut: '', dateFin: '' }
export const datesActives = (etat: EtatFiltres) => etat.dateDebut !== '' || etat.dateFin !== ''
const estEntierPositif = (valeur: string) => /^\d+$/.test(valeur.trim())

export function validerFiltres(etat: EtatFiltres): string | null {
  if (datesActives(etat)) {
    if (etat.dateDebut && etat.dateFin && etat.dateFin < etat.dateDebut) return 'La date de fin précède la date de début.'
    return null
  }
  if (etat.prevenance.trim() !== '' && !estEntierPositif(etat.prevenance)) return 'La prévenance doit être un nombre entier de jours (0 ou plus).'
  if (etat.retard.trim() !== '' && !estEntierPositif(etat.retard)) return 'Le retard doit être un nombre entier de jours (0 ou plus).'
  return null
}

export function construireFiltres(etat: EtatFiltres, config: ConfigurationDelaiDTO | null): FiltresEcheances {
  const filtres: FiltresEcheances = {}
  if (datesActives(etat)) {
    if (etat.dateDebut) filtres.dateDebut = etat.dateDebut
    if (etat.dateFin) filtres.dateFin = etat.dateFin
    return filtres
  }
  const prevenance = etat.prevenance.trim()
  const retard = etat.retard.trim()
  if (prevenance !== '' && Number(prevenance) !== config?.prevenanceJours) filtres.prevenanceJours = Number(prevenance)
  if (retard !== '' && Number(retard) !== config?.retardJours) filtres.retardJours = Number(retard)
  return filtres
}

export function decrireFenetre(filtres: FiltresEcheances, config: ConfigurationDelaiDTO | null): string {
  if (filtres.dateDebut || filtres.dateFin) {
    if (filtres.dateDebut && filtres.dateFin) return `échéances du ${formatDate(filtres.dateDebut)} au ${formatDate(filtres.dateFin)}`
    return filtres.dateDebut ? `échéances à partir du ${formatDate(filtres.dateDebut)}` : `échéances jusqu'au ${formatDate(filtres.dateFin)}`
  }
  const prevenance = filtres.prevenanceJours ?? config?.prevenanceJours
  const retard = filtres.retardJours ?? config?.retardJours
  if (prevenance == null || retard == null) return 'fenêtre configurée'
  return `à venir dans ${prevenance} j au plus · ${retard === 0 ? 'aucun retard affiché' : `dépassées depuis ${retard} j au plus`}`
}
