import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { demandesComptesApi } from '@/api/demandesComptes'
import { useAuth } from '@/hooks/useAuth'
import { peutVoirUtilisateurs } from '@/utils/roles'

const INTERVALLE_MS = 60_000

interface DemandesComptesValue { count: number | null; refresh: () => void }
// eslint-disable-next-line react-refresh/only-export-components
export const DemandesComptesContext = createContext<DemandesComptesValue | undefined>(undefined)

/**
 * Pastille ? Demandes de comptes ? : ADMIN et CHEF, sur ce que CE validateur peut traiter.
 * Rafra?chie chaque minute (onglet visible seulement) et au retour sur l'onglet.
 */
export function DemandesComptesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const actif = peutVoirUtilisateurs(user?.roles)
  const [count, setCount] = useState<number | null>(null)
  const dernierAppel = useRef(0)
  const refresh = useCallback(() => {
    if (!actif) return
    const appel = ++dernierAppel.current
    demandesComptesApi.compteur()
      .then((n) => { if (appel === dernierAppel.current) setCount(n) })
      .catch(() => { /* Pastille indicative : conserver la derni?re valeur connue. */ })
  }, [actif])

  useEffect(() => {
    if (!actif) { setCount(null); return }
    refresh()
    const siVisible = () => { if (document.visibilityState === 'visible') refresh() }
    const minuteur = window.setInterval(siVisible, INTERVALLE_MS)
    document.addEventListener('visibilitychange', siVisible)
    return () => {
      window.clearInterval(minuteur)
      document.removeEventListener('visibilitychange', siVisible)
    }
  }, [actif, refresh])

  const value = useMemo(() => ({ count: actif ? count : null, refresh }), [actif, count, refresh])
  return <DemandesComptesContext.Provider value={value}>{children}</DemandesComptesContext.Provider>
}
