import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useFetch } from '@/hooks/useFetch'
import { useAlertesNouvelles } from '@/hooks/useAlertesNouvelles'
import { useDossierApercu } from '@/hooks/useDossierApercu'
import { dashboardApi } from '@/api/dashboard'
import { dossiersApi } from '@/api/dossiers'
import { porteeDepuisUrl } from '@/utils/dashboard'
import { cleFiltres, parametresUrl } from '@/utils/filtresAgents'
import { BarrePortee } from './BarrePortee'
import { ZoneIndicateurs } from './ZoneIndicateurs'
import { RepartitionTypes } from './RepartitionTypes'
import { EcheancesImminentes } from './EcheancesImminentes'
import { GraphiqueAges } from './GraphiqueAges'
import { GraphiqueRetraites } from './GraphiqueRetraites'
import { GraphiqueDossiers } from './GraphiqueDossiers'
import { ZoneUrgences } from './ZoneUrgences'
import type { FiltresAgents } from '@/types/anticipation'

const heure = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
export function TableauDeBordAdmin() {
  const [params, setParams] = useSearchParams()
  const portee = useMemo(() => porteeDepuisUrl(params), [params])
  const cle = cleFiltres(portee)
  const changerPortee = (suivante: FiltresAgents) => setParams(parametresUrl(suivante), { replace: true })
  const effectifs = useFetch(() => dashboardApi.effectifs(portee), [cle])
  const synthese = useFetch(() => dossiersApi.synthese({ ...portee }), [cle])
  const urgences = useFetch(() => dashboardApi.urgences(portee), [cle])
  const alertes = useFetch(() => dashboardApi.alertes(portee), [cle])
  const echeances = useFetch(() => dashboardApi.echeances(30, portee), [cle])
  const { refresh: rafraichirBadge } = useAlertesNouvelles()
  const { version } = useDossierApercu()
  const [actualiseA, setActualiseA] = useState(() => new Date())
  const blocs = [effectifs, synthese, urgences, alertes, echeances]
  const enChargement = blocs.some((b) => b.isLoading)
  const rafraichissement = enChargement && blocs.some((b) => b.data != null)

  useEffect(() => { rafraichirBadge() }, [rafraichirBadge])
  useEffect(() => { setActualiseA(new Date()) }, [cle])
  const versionInitiale = useRef(version)
  useEffect(() => {
    if (version === versionInitiale.current) return
    versionInitiale.current = version
    synthese.reload()
    urgences.reload()
  }, [version, synthese.reload, urgences.reload])

  const actualiser = () => {
    effectifs.reload(); synthese.reload(); urgences.reload(); alertes.reload(); echeances.reload()
    rafraichirBadge()
    setActualiseA(new Date())
  }
  return <div className="flex flex-col gap-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="font-display text-[22px] font-semibold text-ink">Tableau de bord</h1><p className="mt-1 text-[13px] text-[#6B7180]">Vue d'ensemble de l'effectif et des dossiers.</p></div>
      <div className="flex items-center gap-3"><span className="text-[12px] text-[#9CA0AC]">Actualisé à {heure(actualiseA)}</span><Button variant="secondary" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={actualiser} disabled={enChargement}>Actualiser</Button></div>
    </div>
    <BarrePortee valeur={portee} onChange={changerPortee} />
    <div aria-busy={enChargement} className={`flex flex-col gap-6 transition-opacity ${rafraichissement ? 'opacity-60' : ''}`}>
      {synthese.data && !synthese.data.dateReprise && <div className="rounded-lg border border-warning/30 bg-warning-light px-4 py-3 text-[13px] text-warning">La date de reprise (<code>dossiers.date-reprise</code>) n'est pas définie : aucun dossier n'est créé automatiquement, donc les indicateurs de dossiers restent vides.</div>}
      <ZoneIndicateurs effectifs={effectifs} synthese={synthese} urgences={urgences} alertes={alertes} echeances={echeances} portee={portee} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2"><RepartitionTypes etat={echeances} /><EcheancesImminentes etat={echeances} /></div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-12">
        <GraphiqueAges etat={effectifs} className="xl:col-span-5" />
        <GraphiqueRetraites etat={effectifs} portee={portee} className="xl:col-span-4" />
        <GraphiqueDossiers etat={synthese} portee={portee} className="lg:col-span-2 xl:col-span-3" />
      </div>
      <ZoneUrgences etat={urgences} portee={portee} />
    </div>
  </div>
}
