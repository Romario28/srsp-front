import { statutAgentLabel } from '@/utils/anticipation'
import type { FiltresAgents, OptionFiltre, OptionsFiltres, StatutAgent } from '@/types/anticipation'

export type CleFiltre = keyof FiltresAgents

/** Ordre d'affichage, et ordre canonique des clés : deux jeux identiques donnent la même clé et le même JSON. */
export const CHAMPS_FILTRES: readonly { cle: CleFiltre; label: string }[] = [
  { cle: 'statutAgent', label: 'Statut' },
  { cle: 'corps', label: 'Corps' },
  { cle: 'grade', label: 'Grade' },
  { cle: 'categorie', label: 'Catégorie' },
  { cle: 'fiv', label: 'FIV' },
  { cle: 'soa', label: 'SOA' },
  { cle: 'region', label: 'Région' },
  { cle: 'ministere', label: 'Ministère' },
]

export const FILTRES_VIDES: FiltresAgents = {}

const STATUTS: OptionFiltre[] = (['FONCTIONNAIRE', 'CONTRACTUEL', 'ELD'] as StatutAgent[])
  .map((code) => ({ code, libelle: statutAgentLabel(code) }))

export function optionsDe(cle: CleFiltre, options: OptionsFiltres | null): OptionFiltre[] {
  switch (cle) {
    case 'statutAgent': return STATUTS
    case 'corps': return options?.corps ?? []
    case 'grade': return options?.grades ?? []
    case 'categorie': return options?.categories ?? []
    case 'fiv': return options?.fiv ?? []
    case 'soa': return options?.soa ?? []
    case 'region': return options?.regions ?? []
    case 'ministere': return options?.ministeres ?? []
  }
}

/** Texte d'une option de liste : « A88J — Libellé », ou le libellé seul pour le statut. */
export function texteOption(cle: CleFiltre, option: OptionFiltre): string {
  if (cle === 'statutAgent') return option.libelle ?? option.code
  return option.libelle ? `${option.code} — ${option.libelle}` : option.code
}

/** Valeur d'un filtre actif, telle qu'affichée dans une pastille. */
export const valeurAffichee = (cle: CleFiltre, code: string) =>
  cle === 'statutAgent' ? statutAgentLabel(code as StatutAgent) : code

/** Nouveau jeu de filtres avec un critère changé ; valeur vide = critère retiré. Les clés restent canoniques. */
export function avecFiltre(filtres: FiltresAgents, cle: CleFiltre, valeur: string): FiltresAgents {
  const suivant: FiltresAgents = {}
  for (const champ of CHAMPS_FILTRES) {
    const v = champ.cle === cle ? valeur : filtres[champ.cle]
    if (v) Object.assign(suivant, { [champ.cle]: v })
  }
  return suivant
}

export const nbFiltres = (filtres: FiltresAgents) => CHAMPS_FILTRES.filter((c) => filtres[c.cle]).length

/** Identifiant stable d'un jeu de filtres : clé de cache et comparaison. */
export const cleFiltres = (filtres: FiltresAgents) => JSON.stringify(CHAMPS_FILTRES.map((c) => filtres[c.cle] ?? ''))
