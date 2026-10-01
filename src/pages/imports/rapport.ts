import { decrireReference, type DescriptionReference } from './importSpecs'
import type { ImportKey, RapportImport } from '@/types/import'

export type Verdict = 'ok' | 'reserves' | 'echec'
export interface ReferenceNonResolue extends DescriptionReference { champ: string; nb: number; exemples: string[] }
export interface AnalyseRapport {
  verdict: Verdict; erreurs: string[]; doublons: [string, number][]; references: ReferenceNonResolue[]
  nbReferences: number; illisible: boolean; vide: boolean
}
const ORDRE_GRAVITE = { haute: 0, moyenne: 1, info: 2 } as const

export function analyserRapport(rapport: RapportImport, cle: ImportKey): AnalyseRapport {
  const erreurs = rapport.erreurs ?? []
  const doublons = Object.entries(rapport.doublonsCle ?? {}).sort((a, b) => b[1] - a[1])
  const references = Object.entries(rapport.referencesNonResolues ?? {}).map(([champ, nb]) => ({
    champ, nb, exemples: rapport.exemplesNonResolus?.[champ] ?? [], ...decrireReference(cle, champ),
  })).sort((a, b) => ORDRE_GRAVITE[a.gravite] - ORDRE_GRAVITE[b.gravite])
  const illisible = erreurs.some((erreur) => erreur.startsWith('Fichier illisible'))
  const vide = rapport.lus === 0
  const verdict: Verdict = illisible ? 'echec' : vide || erreurs.length > 0 || references.length > 0 || doublons.length > 0 ? 'reserves' : 'ok'
  return { verdict, erreurs, doublons, references, illisible, vide, nbReferences: references.reduce((sum, reference) => sum + reference.nb, 0) }
}
