import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { alertesApi } from '@/api/alertes'
import { useAuth } from '@/hooks/useAuth'
import { peutVoirAnticipation } from '@/utils/roles'

interface AlertesNouvellesValue { count: number | null; refresh: () => void }
// eslint-disable-next-line react-refresh/only-export-components
export const AlertesNouvellesContext = createContext<AlertesNouvellesValue | undefined>(undefined)

export function AlertesNouvellesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const actif = peutVoirAnticipation(user?.roles)
  const [count, setCount] = useState<number | null>(null)
  const dernierAppel = useRef(0)
  const refresh = useCallback(() => {
    if (!actif) return
    const appel = ++dernierAppel.current
    alertesApi.compter({ statut: 'NOUVELLE' })
      .then((n) => { if (appel === dernierAppel.current) setCount(n) })
      .catch(() => { /* Pastille indicative : conserver la dernière valeur connue. */ })
  }, [actif])

  useEffect(() => {
    if (!actif) { setCount(null); return }
    refresh()
    const surRetourOnglet = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', surRetourOnglet)
    return () => document.removeEventListener('visibilitychange', surRetourOnglet)
  }, [actif, refresh])

  const value = useMemo(() => ({ count: actif ? count : null, refresh }), [actif, count, refresh])
  return <AlertesNouvellesContext.Provider value={value}>{children}</AlertesNouvellesContext.Provider>
}
