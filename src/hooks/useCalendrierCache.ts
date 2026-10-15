import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { calendrierApi } from '@/api/calendrier'
import { extractErrorMessage } from '@/api/client'
import { CacheAsynchrone, ChargementAnnule } from '@/utils/cacheAsynchrone'
import { clePortee, type Portee } from '@/utils/calendrier'
import { cleFiltres } from '@/utils/filtresAgents'
import type { CritereDate, FiltresAgents } from '@/types/anticipation'
import type { CalendrierAgent, CalendrierJour } from '@/types/calendrier'

/** Un détail de jour est réutilisé sans appel pendant cette durée, comptée depuis son chargement. */
const DUREE_DETAIL_JOUR_MS = 30_000

const cleAnnee = (filtres: string, annee: number) => `${filtres}|${annee}`
const cleDetail = (filtres: string, portee: Portee, critere: CritereDate) => `${filtres}|${critere}|${clePortee(portee)}`

/**
 * Données du calendrier pour l'année affichée et le jeu de filtres courant :
 *  - cache par (filtres, année) : changer de vue ou de critère ne rappelle rien ;
 *  - après l'année affichée, préchargement silencieux de N+1 puis N-1, une requête à la fois ;
 *  - cache du détail d'un jour ou d'un mois (30 s), lui aussi par jeu de filtres ;
 *  - actualiser() : annule et vide tout, puis recharge.
 * Un nouveau jeu de filtres charge ses propres années ; revenir à un jeu déjà vu est instantané.
 * Les caches vivent autant que la page : la quitter les vide.
 */
export function useCalendrierCache(annee: number, filtres: FiltresAgents) {
  const cle = useMemo(() => cleFiltres(filtres), [filtres])
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
        await annees.obtenir(cleAnnee(cle, annee), (signal) => calendrierApi.annee(annee, filtres, signal))
      } catch (err) {
        if (!annule && !(err instanceof ChargementAnnule)) setErreur({ annee, message: extractErrorMessage(err, 'Chargement impossible') })
        return
      }
      for (const voisine of [annee + 1, annee - 1]) {
        if (annule) return
        try { await annees.obtenir(cleAnnee(cle, voisine), (signal) => calendrierApi.annee(voisine, filtres, signal)) }
        catch { /* Préchargement silencieux : la navigation retentera cette année. */ }
      }
    })()
    return () => { annule = true }
  }, [annees, annee, filtres, cle, rechargement])

  useEffect(() => () => { annees.vider(); details.vider() }, [annees, details])

  const parAnnee = useMemo(() => {
    const resultat = new Map<number, readonly CalendrierJour[]>()
    for (const a of [annee - 1, annee, annee + 1]) {
      const resolue = instantane.get(cleAnnee(cle, a))
      if (resolue) resultat.set(a, resolue.valeur)
    }
    return resultat
  }, [instantane, annee, cle])
  const courante = instantane.get(cleAnnee(cle, annee))
  const message = erreur?.annee === annee ? erreur.message : null
  const reessayer = useCallback(() => { setErreur(null); setRechargement((n) => n + 1) }, [])
  const actualiser = useCallback(() => {
    annees.vider(); details.vider(); setErreur(null); setRechargement((n) => n + 1)
  }, [annees, details])
  const chargerDetail = useCallback(
    (portee: Portee, critere: CritereDate) =>
      details.obtenir(cleDetail(cle, portee, critere), (signal) =>
        portee.genre === 'JOUR'
          ? calendrierApi.agents(portee.iso, critere, filtres, signal)
          : calendrierApi.agentsDuMois(portee.annee, portee.mois + 1, critere, filtres, signal)),   // 0-11 → 1-12
    [details, cle, filtres],
  )
  const detailEnCache = useCallback(
    (portee: Portee, critere: CritereDate) => details.lire(cleDetail(cle, portee, critere)),
    [details, cle],
  )

  return {
    parAnnee,
    isLoading: courante == null && message == null,
    error: message,
    chargeLe: courante?.chargeLe ?? null,
    reessayer, actualiser, chargerDetail, detailEnCache,
  }
}
