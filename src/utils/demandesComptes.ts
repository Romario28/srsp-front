import { correspond, normaliser } from '@/utils/recherche'
import type { DemandeCompteDTO } from '@/types/demandeCompte'

export type Verification = 'CONFIRMEE' | 'DIFFERENTE' | 'INCONNUE'

/** [NOUVEAU] Assemble les morceaux présents (ni nuls ni vides) avec un simple espace ; chaîne vide s'il n'y en a aucun. */
export const joindre = (...parties: (string | null | undefined)[]): string =>
  parties.map((p) => p?.trim() ?? '').filter(Boolean).join(' ')

/** [NOUVEAU] « Prénom Nom » du demandeur ; si l'un manque, l'autre seul ; à défaut, l'e-mail. */
export const nomDemandeur = (d: DemandeCompteDTO): string => joindre(d.prenom, d.nom) || d.email

/** [NOUVEAU] Lesquels des deux champs le demandeur a renseignés. */
export const champsDeclares = (d: DemandeCompteDTO) => ({ nom: normaliser(d.nom) !== '', prenom: normaliser(d.prenom) !== '' })

/**
 * Compare le nom et le prénom DÉCLARÉS à ceux de l'agent du matricule (sans tenir compte de la casse ni des accents).
 * [MODIFIÉ] seul le champ renseigné est comparé ; un champ absent ne compte ni pour ni contre.
 * Un indice pour le validateur : n'importe qui peut saisir le matricule d'un autre.
 */
export function verifierIdentite(d: DemandeCompteDTO): Verification {
  const a = d.agentLie
  if (!a.trouve) return 'INCONNUE'
  const { nom, prenom } = champsDeclares(d)
  if (!nom && !prenom) return 'DIFFERENTE'   // rien à comparer : jamais « correspond »
  const nomOk = !nom || (normaliser(a.nom) !== '' && normaliser(a.nom) === normaliser(d.nom))
  // Prénoms composés : tous les mots déclarés figurent chez l'agent, ou l'inverse
  const prenomOk = !prenom || (normaliser(a.prenoms) !== '' && (correspond(d.prenom ?? '', a.prenoms) || correspond(a.prenoms ?? '', d.prenom)))
  return nomOk && prenomOk ? 'CONFIRMEE' : 'DIFFERENTE'
}
