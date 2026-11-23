import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { demandesComptesApi } from '@/api/demandesComptes'
import { useAuth } from '@/hooks/useAuth'
import { peutVoirUtilisateurs } from '@/utils/roles'

// Filet de sécurité : relecture périodique, plus rapide quand le flux temps réel est coupé
const INTERVALLE_FLUX_OUVERT_MS = 60_000
const INTERVALLE_FLUX_COUPE_MS = 15_000
// Reconnexion du flux : délai doublé à chaque échec, de 2 s à 30 s
const DELAI_MIN_MS = 2_000
const DELAI_MAX_MS = 30_000

interface DemandesComptesValue {
  count: number | null
  /** Augmente à chaque changement signalé par le serveur : les écrans qui listent les demandes s'en servent pour se recharger. */
  version: number
  refresh: () => void
}
// eslint-disable-next-line react-refresh/only-export-components
export const DemandesComptesContext = createContext<DemandesComptesValue | undefined>(undefined)

const pause = (ms: number, signal: AbortSignal) => new Promise<void>((resolve) => {
  const minuteur = window.setTimeout(resolve, ms)
  signal.addEventListener('abort', () => { window.clearTimeout(minuteur); resolve() }, { once: true })
})

/**
 * Pastille « Demandes de comptes » : ADMIN et CHEF, sur ce que CE validateur peut traiter (le serveur applique le périmètre).
 * Temps réel : le serveur pousse un signal « ça a changé » (SSE) et on relit alors le compteur. Le signal ne transporte aucune donnée.
 * Si le flux est coupé, la relecture périodique prend le relais et la reconnexion se fait toute seule.
 */
export function DemandesComptesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const actif = peutVoirUtilisateurs(user?.roles)
  const [count, setCount] = useState<number | null>(null)
  const [version, setVersion] = useState(0)
  const [fluxOuvert, setFluxOuvert] = useState(false)
  const dernierAppel = useRef(0)
  const refresh = useCallback(() => {
    if (!actif) return
    const appel = ++dernierAppel.current
    demandesComptesApi.compteur()
      .then((n) => { if (appel === dernierAppel.current) setCount(n) })
      .catch(() => { /* Pastille indicative : conserver la dernière valeur connue. */ })
  }, [actif])

  // Lecture initiale
  useEffect(() => {
    if (!actif) { setCount(null); return }
    refresh()
  }, [actif, refresh])

  // Filet de sécurité : relecture périodique (onglet visible seulement) et au retour sur l'onglet
  useEffect(() => {
    if (!actif) return
    const siVisible = () => { if (document.visibilityState === 'visible') refresh() }
    const minuteur = window.setInterval(siVisible, fluxOuvert ? INTERVALLE_FLUX_OUVERT_MS : INTERVALLE_FLUX_COUPE_MS)
    document.addEventListener('visibilitychange', siVisible)
    return () => {
      window.clearInterval(minuteur)
      document.removeEventListener('visibilitychange', siVisible)
    }
  }, [actif, refresh, fluxOuvert])

  // Flux temps réel, avec reconnexion automatique
  useEffect(() => {
    if (!actif) return
    const controleur = new AbortController()
    let attente = DELAI_MIN_MS
    void (async () => {
      while (!controleur.signal.aborted) {
        try {
          const issue = await demandesComptesApi.ecouter(controleur.signal, (evenement) => {
            if (evenement === 'pret') {
              attente = DELAI_MIN_MS
              setFluxOuvert(true)
              refresh()   // rattrape ce qui a pu arriver pendant une coupure
            } else if (evenement === 'changement') {
              refresh()
              setVersion((v) => v + 1)
            }
          })
          if (issue === 'refuse') return   // inutile d'insister : le filet de sécurité continue
        } catch { /* coupure réseau ou arrêt du serveur : on retente plus bas */ }
        if (controleur.signal.aborted) return
        setFluxOuvert(false)
        await pause(attente, controleur.signal)
        attente = Math.min(attente * 2, DELAI_MAX_MS)
      }
    })()
    return () => { controleur.abort(); setFluxOuvert(false) }   // déconnexion : le serveur voit la fermeture et retire le flux
  }, [actif, refresh])

  const value = useMemo(() => ({ count: actif ? count : null, version, refresh }), [actif, count, version, refresh])
  return <DemandesComptesContext.Provider value={value}>{children}</DemandesComptesContext.Provider>
}
