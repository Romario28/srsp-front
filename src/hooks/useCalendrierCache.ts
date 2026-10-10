import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { calendrierApi } from '@/api/calendrier'
import { extractErrorMessage } from '@/api/client'
import { CacheAsynchrone, ChargementAnnule } from '@/utils/cacheAsynchrone'
import type { CritereDate } from '@/types/anticipation'
import type { CalendrierAgent, CalendrierJour } from '@/types/calendrier'

/** Un détail de jour est réutilisé sans appel pendant cette durée, comptée depuis son chargement. */
const DUREE_DETAIL_JOUR_MS = 30_000

const cleJour = (jour: string, critere: CritereDate) => `${critere}|${jour}`

/**
 * Données du calendrier pour l'année affichée :
 *  - cache par année (les deux dates sont dans la réponse : changer de vue ou de critère ne rappelle rien) ;
 *  - après l'année affichée, préchargement silencieux de N+1 puis N-1, une requête à la fois ;
 *  - cache du détail d'un jour (30 s) ;
 *  - actualiser() : annule et vide tout, puis recharge.
 * Les caches vivent autant que la page : la quitter les vide.
 */
export function useCalendrierCache(annee: number) {
  const [annees] = useState(() => new CacheAsynchrone<readonly CalendrierJour[]>())
  const [details] = useState(() => new CacheAsynchrone<readonly CalendrierAgent[]>(DUREE_DETAIL_JOUR_MS))
  const instantane = useSyncExternalStore(annees.abonner, annees.instantane)
  const [rechargement, setRechargement] = useState(0)
  const [erreur, setErreur] = useState<{ annee: number; message: string } | null>(null)

  useEffect(() => {
    let annule = false
    setErreur(null)
    void (async () => {
      try {
        await annees.obtenir(String(annee), (signal) => calendrierApi.annee(annee, signal))
      } catch (err) {
        if (!annule && !(err instanceof ChargementAnnule)) setErreur({ annee, message: extractErrorMessage(err, 'Chargement impossible') })
        return
      }
      for (const voisine of [annee + 1, annee - 1]) {
        if (annule) return
        try { await annees.obtenir(String(voisine), (signal) => calendrierApi.annee(voisine, signal)) }
        catch { /* Préchargement silencieux : la navigation retentera cette année. */ }
      }
    })()
    return () => { annule = true }
  }, [annees, annee, rechargement])

  useEffect(() => () => { annees.vider(); details.vider() }, [annees, details])

  const parAnnee = useMemo(() => {
    const resultat = new Map<number, readonly CalendrierJour[]>()
    for (const a of [annee - 1, annee, annee + 1]) {
      const resolue = instantane.get(String(a))
      if (resolue) resultat.set(a, resolue.valeur)
    }
    return resultat
  }, [instantane, annee])
  const courante = instantane.get(String(annee))
  const message = erreur?.annee === annee ? erreur.message : null
  const reessayer = useCallback(() => { setErreur(null); setRechargement((n) => n + 1) }, [])
  const actualiser = useCallback(() => {
    annees.vider(); details.vider(); setErreur(null); setRechargement((n) => n + 1)
  }, [annees, details])
  const chargerDetail = useCallback((jour: string, critere: CritereDate) =>
    details.obtenir(cleJour(jour, critere), (signal) => calendrierApi.agents(jour, critere, signal)), [details])
  const detailEnCache = useCallback((jour: string, critere: CritereDate) => details.lire(cleJour(jour, critere)), [details])

  return {
    parAnnee,
    isLoading: courante == null && message == null,
    error: message,
    chargeLe: courante?.chargeLe ?? null,
    reessayer, actualiser, chargerDetail, detailEnCache,
  }
}
