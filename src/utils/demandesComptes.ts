import { correspond, normaliser } from '@/utils/recherche'
import type { DemandeCompteDTO } from '@/types/demandeCompte'

export type Verification = 'CONFIRMEE' | 'DIFFERENTE' | 'INCONNUE'

/**
 * Compare le nom et le pr?nom d?clar?s ? ceux de l'agent du matricule (sans tenir compte de la casse ni des accents).
 * Un indice pour le validateur : n'importe qui peut saisir le matricule d'un autre.
 */
export function verifierIdentite(d: DemandeCompteDTO): Verification {
  const a = d.agentLie
  if (!a.trouve) return 'INCONNUE'
  const nomOk = normaliser(a.nom) !== '' && normaliser(a.nom) === normaliser(d.nom)
  // Pr?noms compos?s : tous les mots d?clar?s figurent chez l'agent, ou l'inverse
  const prenomOk = normaliser(a.prenoms) !== '' && (correspond(d.prenom, a.prenoms) || correspond(a.prenoms ?? '', d.prenom))
  return nomOk && prenomOk ? 'CONFIRMEE' : 'DIFFERENTE'
}
