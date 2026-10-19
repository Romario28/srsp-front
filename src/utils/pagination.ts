/**
 * Pages à afficher (indices 0-based) : première, dernière, courante et ses voisines.
 * Un trou d'une seule page est comblé par cette page ; un trou plus grand devient null (« … »).
 */
export function numerosAffiches(courante: number, total: number): (number | null)[] {
  const gardees = [...new Set([0, total - 1, courante - 1, courante, courante + 1])]
    .filter((p) => p >= 0 && p < total)
    .sort((a, b) => a - b)
  const resultat: (number | null)[] = []
  gardees.forEach((p, i) => {
    if (i > 0) {
      const ecart = p - gardees[i - 1]
      if (ecart === 2) resultat.push(p - 1)
      else if (ecart > 2) resultat.push(null)
    }
    resultat.push(p)
  })
  return resultat
}
