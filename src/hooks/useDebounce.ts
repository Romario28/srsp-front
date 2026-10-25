import { useEffect, useState } from 'react'

/** Valeur qui ne suit `valeur` qu'après `delaiMs` sans nouveau changement : évite de réagir à chaque frappe. */
export function useDebounce<T>(valeur: T, delaiMs = 500): T {
  const [stable, setStable] = useState(valeur)
  useEffect(() => {
    const minuteur = window.setTimeout(() => setStable(valeur), delaiMs)
    return () => window.clearTimeout(minuteur)
  }, [valeur, delaiMs])
  return stable
}
