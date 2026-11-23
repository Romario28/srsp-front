import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { anticipationApi } from '@/api/anticipation'
import { dossiersApi } from '@/api/dossiers'
import { useAuth } from '@/hooks/useAuth'
import { useDossierApercu } from '@/hooks/useDossierApercu'
import { peutVoirAnticipation } from '@/utils/roles'

const INTERVALLE_DOSSIERS_MS = 60_000     // 4 requêtes de comptage : léger
const INTERVALLE_ANOMALIES_MS = 300_000   // recalcule le moteur sur tous les agents : plus rare

type Quoi = 'dossiers' | 'anomalies'
interface CompteursMenuValue {
  /** « À traiter » + « en retard », dans le périmètre du compte. null : pas encore connu ou non concerné. */
  dossiers: number | null
  anomalies: number | null
  /** Sans argument : les deux. */
  refresh: (quoi?: Quoi) => void
}
// eslint-disable-next-line react-refresh/only-export-components
export const CompteursMenuContext = createContext<CompteursMenuValue | undefined>(undefined)

/**
 * Compteurs des pastilles du menu. Les chiffres viennent du serveur, qui applique le périmètre du compte :
 * le menu n'a rien à filtrer. Réservé aux profils qui accèdent à l'anticipation (ADMIN, CHEF, RH).
 * À placer sous DossierApercuProvider : un dossier modifié depuis l'aperçu relance le décompte.
 */
export function CompteursMenuProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const { version } = useDossierApercu()
  const actif = peutVoirAnticipation(user?.roles)
  const [dossiers, setDossiers] = useState<number | null>(null)
  const [anomalies, setAnomalies] = useState<number | null>(null)
  const appelDossiers = useRef(0)
  const appelAnomalies = useRef(0)

  // Une réponse plus ancienne que la dernière demande est ignorée ; en cas d'échec, la dernière valeur est conservée.
  const chargerDossiers = useCallback(() => {
    if (!actif) return
    const appel = ++appelDossiers.current
    dossiersApi.synthese({})
      .then((s) => { if (appel === appelDossiers.current) setDossiers(s.aTraiter + s.enRetard) })
      .catch(() => { /* pastille indicative */ })
  }, [actif])

  const chargerAnomalies = useCallback(() => {
    if (!actif) return
    const appel = ++appelAnomalies.current
    anticipationApi.compterAnomalies()
      .then((n) => { if (appel === appelAnomalies.current) setAnomalies(n) })
      .catch(() => { /* pastille indicative */ })
  }, [actif])

  useEffect(() => { if (!actif) { setDossiers(null); setAnomalies(null) } }, [actif])

  // Dossiers : à l'ouverture, à chaque changement de page, et quand un dossier est modifié dans l'aperçu
  useEffect(() => { chargerDossiers() }, [chargerDossiers, pathname, version])
  // Anomalies : à l'ouverture seulement (calcul coûteux), puis toutes les cinq minutes
  useEffect(() => { chargerAnomalies() }, [chargerAnomalies])

  // Sondage, onglet visible seulement ; les dossiers sont aussi relus au retour sur l'onglet
  useEffect(() => {
    if (!actif) return
    const siVisible = (charger: () => void) => () => { if (document.visibilityState === 'visible') charger() }
    const minuteurDossiers = window.setInterval(siVisible(chargerDossiers), INTERVALLE_DOSSIERS_MS)
    const minuteurAnomalies = window.setInterval(siVisible(chargerAnomalies), INTERVALLE_ANOMALIES_MS)
    const retour = siVisible(chargerDossiers)
    document.addEventListener('visibilitychange', retour)
    return () => {
      window.clearInterval(minuteurDossiers)
      window.clearInterval(minuteurAnomalies)
      document.removeEventListener('visibilitychange', retour)
    }
  }, [actif, chargerDossiers, chargerAnomalies])

  const refresh = useCallback((quoi?: Quoi) => {
    if (quoi !== 'anomalies') chargerDossiers()
    if (quoi !== 'dossiers') chargerAnomalies()
  }, [chargerDossiers, chargerAnomalies])

  const value = useMemo(
    () => ({ dossiers: actif ? dossiers : null, anomalies: actif ? anomalies : null, refresh }),
    [actif, dossiers, anomalies, refresh],
  )
  return <CompteursMenuContext.Provider value={value}>{children}</CompteursMenuContext.Provider>
}
