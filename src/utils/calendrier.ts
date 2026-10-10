import type { CritereDate } from '@/types/anticipation'
import type { CalendrierJour, CategorieCalendrier } from '@/types/calendrier'

export const CATEGORIES: readonly CategorieCalendrier[] = ['DEPART_RETRAITE', 'AVANCEMENT', 'ELD', 'TITULARISATION', 'FIN_CONTRAT']
export const CATEGORIE_INFO: Record<CategorieCalendrier, { label: string; point: string }> = {
  DEPART_RETRAITE: { label: 'Départs à la retraite', point: 'bg-violet' },
  AVANCEMENT: { label: 'Avancements', point: 'bg-accent' },
  ELD: { label: 'Avancements ELD', point: 'bg-warning' },
  TITULARISATION: { label: 'Titularisations', point: 'bg-success' },
  FIN_CONTRAT: { label: 'Fins de contrat', point: 'bg-danger' },
}
export interface Pastille { categorie: CategorieCalendrier; nombre: number }
export type VueCalendrier = 'MOIS' | 'ANNEE'
export type ComptesJour = Partial<Record<CategorieCalendrier, number>>
export const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const
const NB_JOURS_GRILLE = 42
const pad = (n: number) => String(n).padStart(2, '0')
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const versIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const depuisIso = (iso: string) => { const [a, m, j] = iso.split('-').map(Number); return new Date(a, m - 1, j) }
export const prefixeMois = (annee: number, mois: number) => `${annee}-${pad(mois + 1)}`

export function joursGrille(annee: number, mois: number): Date[] {
  const decalage = (new Date(annee, mois, 1).getDay() + 6) % 7
  return Array.from({ length: NB_JOURS_GRILLE }, (_, i) => new Date(annee, mois, 1 - decalage + i))
}
export const nomMois = (annee: number, mois: number) => new Date(annee, mois, 1).toLocaleDateString('fr-FR', { month: 'long' })
export const titrePeriode = (vue: VueCalendrier, annee: number, mois: number) =>
  vue === 'ANNEE' ? String(annee) : majuscule(new Date(annee, mois, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }))
export const jourLong = (iso: string) => majuscule(depuisIso(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))

/** Les couples de dates peuvent se trouver dans deux réponses annuelles; on ne retient que l'année de la date sélectionnée. */
export function agregerParJour(parAnnee: ReadonlyMap<number, readonly CalendrierJour[]>, critere: CritereDate): Map<string, ComptesJour> {
  const parJour = new Map<string, ComptesJour>()
  parAnnee.forEach((lignes, annee) => {
    const prefixe = `${annee}-`
    for (const ligne of lignes) {
      const date = critere === 'PREPARATION' ? ligne.datePreparation : ligne.dateEcheance
      if (!date.startsWith(prefixe)) continue
      const comptes = parJour.get(date) ?? {}
      comptes[ligne.categorie] = (comptes[ligne.categorie] ?? 0) + ligne.nombre
      parJour.set(date, comptes)
    }
  })
  return parJour
}

export function pastilles(parJour: ReadonlyMap<string, ComptesJour>, actifs: ReadonlySet<CategorieCalendrier>): Map<string, Pastille[]> {
  const resultat = new Map<string, Pastille[]>()
  parJour.forEach((comptes, jour) => {
    const liste = CATEGORIES.flatMap((categorie) => {
      const nombre = comptes[categorie] ?? 0
      return actifs.has(categorie) && nombre > 0 ? [{ categorie, nombre }] : []
    })
    if (liste.length) resultat.set(jour, liste)
  })
  return resultat
}

export function comptesParMois(parJour: ReadonlyMap<string, ComptesJour>, annee: number, actifs: ReadonlySet<CategorieCalendrier>): ComptesJour[] {
  const mois: ComptesJour[] = Array.from({ length: 12 }, () => ({}))
  parJour.forEach((comptes, jour) => {
    if (!jour.startsWith(`${annee}-`)) return
    const m = Number(jour.slice(5, 7)) - 1
    for (const categorie of CATEGORIES) {
      const nombre = comptes[categorie] ?? 0
      if (actifs.has(categorie) && nombre > 0) mois[m][categorie] = (mois[m][categorie] ?? 0) + nombre
    }
  })
  return mois
}

export function totauxPeriode(parJour: ReadonlyMap<string, ComptesJour>, prefixe: string): Record<CategorieCalendrier, number> {
  const totaux = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<CategorieCalendrier, number>
  parJour.forEach((comptes, jour) => {
    if (!jour.startsWith(prefixe)) return
    for (const categorie of CATEGORIES) totaux[categorie] += comptes[categorie] ?? 0
  })
  return totaux
}
