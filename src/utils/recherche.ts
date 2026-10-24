/** Minuscules, sans accents, espaces réduits : « Rakoto  JÉAN » et « rakoto jean » se valent. */
export function normaliser(texte: string | null | undefined): string {
  return (texte ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ')
}

/** Chaque mot saisi doit se retrouver dans l'un des champs ; l'ordre des mots n'a pas d'importance. Saisie vide : tout passe. */
export function correspond(recherche: string, ...champs: (string | null | undefined)[]): boolean {
  const mots = normaliser(recherche).split(' ').filter(Boolean)
  if (mots.length === 0) return true
  const cible = normaliser(champs.join(' '))
  return mots.every((mot) => cible.includes(mot))
}
