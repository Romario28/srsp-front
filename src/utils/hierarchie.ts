// NOUVEAU — Utilitaires de hiérarchie de départements, partagés par les écrans
// (déplacement, sélecteurs de parent indentés, comptages de sous-arbre).
import type { DepartementResponse } from '@/types/departement'

/** IDs de tous les descendants d'un département (tous niveaux) — lui-même exclu. */
export function descendantIds(flat: DepartementResponse[], id: number): Set<number> {
  const enfantsParParent = new Map<number, number[]>()
  for (const d of flat) {
    if (d.idParent != null) {
      const liste = enfantsParParent.get(d.idParent) ?? []
      liste.push(d.id)
      enfantsParParent.set(d.idParent, liste)
    }
  }
  const resultats = new Set<number>()
  const file = [...(enfantsParParent.get(id) ?? [])]
  while (file.length > 0) {
    const courant = file.pop()!
    if (resultats.has(courant)) continue
    resultats.add(courant)
    file.push(...(enfantsParParent.get(courant) ?? []))
  }
  return resultats
}

/** Nombre de sous-départements d'un département (tous niveaux confondus). */
export function compterSousDepartements(flat: DepartementResponse[], id: number): number {
  return descendantIds(flat, id).size
}

/** Profondeur d'un département dans l'arbre (racine = 0). */
export function profondeur(flat: DepartementResponse[], id: number): number {
  const parId = new Map(flat.map((d) => [d.id, d]))
  let courant = parId.get(id)
  let n = 0
  while (courant?.idParent != null && parId.has(courant.idParent) && n < 100) {
    courant = parId.get(courant.idParent)
    n += 1
  }
  return n
}

/** Départements triés par chemin, avec leur profondeur — pour un sélecteur de parent indenté. */
export function optionsIndente(
  flat: DepartementResponse[]
): { id: number; nom: string; profondeur: number }[] {
  return [...flat]
    .sort((a, b) => (a.chemin ?? a.nomDepartement).localeCompare(b.chemin ?? b.nomDepartement))
    .map((d) => ({ id: d.id, nom: d.nomDepartement, profondeur: profondeur(flat, d.id) }))
}
