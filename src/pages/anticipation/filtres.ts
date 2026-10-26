import { formatDate } from '@/utils/date'
import { MAX_MOIS } from '@/utils/anticipation'
import type { CritereDate, FiltresEcheances } from '@/types/anticipation'
import type { ConfigurationDelaiDTO } from '@/types/configurationDelai'

export interface EtatFiltres {
  prevenance: string
  retard: string
  dateDebut: string
  dateFin: string
  /** Date sur laquelle portent la fenêtre relative et l'intervalle de dates. */
  critere: CritereDate
}

export const FILTRES_VIDES: EtatFiltres = { prevenance: '', retard: '', dateDebut: '', dateFin: '', critere: 'PREPARATION' }
export const datesActives = (etat: EtatFiltres) => etat.dateDebut !== '' || etat.dateFin !== ''
const estMoisValide = (valeur: string) => /^\d+$/.test(valeur.trim()) && Number(valeur) <= MAX_MOIS

export function validerFiltres(etat: EtatFiltres): string | null {
  if (datesActives(etat)) {
    if (etat.dateDebut && etat.dateFin && etat.dateFin < etat.dateDebut) return 'La date de fin précède la date de début.'
    return null
  }
  if (etat.prevenance.trim() !== '' && !estMoisValide(etat.prevenance)) return `La préparation doit être un nombre entier de mois, entre 0 et ${MAX_MOIS}.`
  if (etat.retard.trim() !== '' && !estMoisValide(etat.retard)) return `Le retard doit être un nombre entier de mois, entre 0 et ${MAX_MOIS}.`
  return null
}

export function construireFiltres(etat: EtatFiltres, config: ConfigurationDelaiDTO | null): FiltresEcheances {
  // Le critère s'applique aux deux modes : il part toujours (avant, seulement avec des dates).
  const filtres: FiltresEcheances = { critereDate: etat.critere }
  if (datesActives(etat)) {
    if (etat.dateDebut) filtres.dateDebut = etat.dateDebut
    if (etat.dateFin) filtres.dateFin = etat.dateFin
    return filtres
  }
  const prevenance = etat.prevenance.trim()
  const retard = etat.retard.trim()
  if (prevenance !== '' && Number(prevenance) !== config?.prevenanceMois) filtres.prevenanceMois = Number(prevenance)
  if (retard !== '' && Number(retard) !== config?.retardMois) filtres.retardMois = Number(retard)
  return filtres
}

export function decrireFenetre(filtres: FiltresEcheances, config: ConfigurationDelaiDTO | null): string {
  const surPreparation = filtres.critereDate === 'PREPARATION'
  if (filtres.dateDebut || filtres.dateFin) {
    const quoi = surPreparation ? 'préparation' : 'échéances'
    if (filtres.dateDebut && filtres.dateFin) return `${quoi} du ${formatDate(filtres.dateDebut)} au ${formatDate(filtres.dateFin)}`
    return filtres.dateDebut ? `${quoi} à partir du ${formatDate(filtres.dateDebut)}` : `${quoi} jusqu'au ${formatDate(filtres.dateFin)}`
  }
  const prevenance = filtres.prevenanceMois ?? config?.prevenanceMois
  const retard = filtres.retardMois ?? config?.retardMois
  if (prevenance == null || retard == null) return 'fenêtre configurée'
  if (surPreparation) {
    return `dont la préparation débute dans ${prevenance} mois au plus, ${retard === 0 ? 'sans préparation déjà ouverte' : `ou a débuté il y a ${retard} mois au plus`}`
  }
  return `à préparer dès ${prevenance} mois avant l'échéance, ${retard === 0 ? 'sans retard affiché' : `jusqu'à ${retard} mois après`}`
}
