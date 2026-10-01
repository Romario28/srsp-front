import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { alertesApi } from '@/api/alertes'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/utils/roles'

interface AlertesNouvellesValue { count: number | null; refresh: () => void }
// eslint-disable-next-line react-refresh/only-export-components
export const AlertesNouvellesContext = createContext<AlertesNouvellesValue | undefined>(undefined)

export function AlertesNouvellesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const admin = isAdmin(user?.roles)
  const [count, setCount] = useState<number | null>(null)
  const dernierAppel = useRef(0)
  const refresh = useCallback(() => {
    if (!admin) return
    const appel = ++dernierAppel.current
    alertesApi.compter({ statut: 'NOUVELLE' })
      .then((n) => { if (appel === dernierAppel.current) setCount(n) })
      .catch(() => { /* Pastille indicative : conserver la dernière valeur connue. */ })
  }, [admin])

  useEffect(() => {
    if (!admin) { setCount(null); return }
    refresh()
    const surRetourOnglet = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', surRetourOnglet)
    return () => document.removeEventListener('visibilitychange', surRetourOnglet)
  }, [admin, refresh])

  const value = useMemo(() => ({ count: admin ? count : null, refresh }), [admin, count, refresh])
  return <AlertesNouvellesContext.Provider value={value}>{children}</AlertesNouvellesContext.Provider>
}
