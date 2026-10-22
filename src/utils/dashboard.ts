import type { EffectifsDTO } from '@/types/dashboard'
import { AlertTriangle, Ban, CheckCircle2, Clock3, RefreshCw } from 'lucide-react'

export const nombreFr = (n: number) => n.toLocaleString('fr-FR')
export const pluriel = (n: number, singulier: string, plurielMot: string) => `${nombreFr(n)} ${n > 1 ? plurielMot : singulier}`
export const pourcent = (n: number, total: number) => total > 0 ? (n * 100 / total).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : '0'
export const SEXES = ['M', 'F', '?'] as const
export type FiltreSexe = 'TOUS' | 'M' | 'F'
export const LIBELLES_SEXE: Record<typeof SEXES[number], string> = { M: 'Hommes', F: 'Femmes', '?': 'Non renseigné' }
export const COULEURS_SEXE: Record<typeof SEXES[number], string> = { M: '#2A6F97', F: '#B83280', '?': '#A7ADB8' }

export interface BarreAge { tranche: number; M: number; F: number; inconnu: number; total: number }
const nbTranches = (b: EffectifsDTO['ages']['bornes']) => Math.ceil((b.max - b.min) / b.pas) + 2
export function libelleTranche(i: number, b: EffectifsDTO['ages']['bornes']) {
  if (i === 0) return `< ${b.min}`
  const premiere = i === 1 ? b.min : b.min + (i - 1) * b.pas
  if (i >= nbTranches(b) - 1) return `${b.max}+`
  return `${premiere}–${premiere + b.pas - 1}`
}
export function libelleTrancheLong(i: number, b: EffectifsDTO['ages']['bornes']) {
  if (i === 0) return `Moins de ${b.min} ans`
  const premiere = i === 1 ? b.min : b.min + (i - 1) * b.pas
  if (i >= nbTranches(b) - 1) return `${b.max} ans et plus`
  return `${premiere} à ${premiere + b.pas - 1} ans`
}
export function agregerAges(lignes: EffectifsDTO['ages']['lignes'], sexe: FiltreSexe, categorie: string | null, bornes: EffectifsDTO['ages']['bornes']): BarreAge[] {
  const resultat = Array.from({ length: nbTranches(bornes) }, (_, tranche) => ({ tranche, M: 0, F: 0, inconnu: 0, total: 0 }))
  for (const l of lignes) {
    if (categorie !== null && l.categorie !== categorie) continue
    if (sexe !== 'TOUS' && l.sexe !== sexe) continue
    const b = resultat[l.tranche]
    if (!b) continue
    if (l.sexe === 'M' || l.sexe === 'F') b[l.sexe] += l.nombre
    else b.inconnu += l.nombre
    b.total += l.nombre
  }
  return resultat
}
export function categoriesDisponibles(lignes: EffectifsDTO['ages']['lignes']): string[] {
  return [...new Set(lignes.map((l) => l.categorie))].sort((a, b) => a.localeCompare(b, 'fr'))
}
export const valeurSexe = (b: BarreAge, sexe: typeof SEXES[number]) => sexe === '?' ? b.inconnu : b[sexe]
export function positionAgeLegal(age: number, b: EffectifsDTO['ages']['bornes']): number {
  return Math.max(0, Math.min(nbTranches(b), 1 + (age - b.min) / b.pas))
}
export const alignement = (i: number, n: number): 'gauche' | 'centre' | 'droite' => i < n / 3 ? 'gauche' : i >= 2 * n / 3 ? 'droite' : 'centre'
export const moisCourt = (cle: string) => new Date(`${cle}-01T00:00:00`).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')
export const moisLong = (cle: string) => new Date(`${cle}-01T00:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

export const ETATS_GRAPHE = [
  { cle: 'enRetard', label: 'En retard', vue: 'EN_RETARD', couleur: '#C43D4D', icone: AlertTriangle, aide: 'Échéance dépassée et dossier non démarré.' },
  { cle: 'aTraiter', label: 'À traiter', vue: 'A_TRAITER', couleur: '#A7ADB8', icone: Clock3, aide: 'Préparation atteinte, échéance pas encore dépassée.' },
  { cle: 'enCours', label: 'En cours', vue: 'EN_COURS', couleur: '#2A6F97', icone: RefreshCw, aide: 'Dossiers démarrés, pas encore terminés.' },
  { cle: 'traites', label: 'Traités', vue: 'TRAITES', couleur: '#2F855A', icone: CheckCircle2, aide: 'Étape FIN renseignée.' },
  { cle: 'sansSuite', label: 'Sans suite', vue: 'SANS_SUITE', couleur: '#805AD5', icone: Ban, aide: 'Dossiers classés sans suite.' },
] as const
