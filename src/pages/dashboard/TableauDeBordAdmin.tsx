import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useFetch } from '@/hooks/useFetch'
import { useAlertesNouvelles } from '@/hooks/useAlertesNouvelles'
import { useDossierApercu } from '@/hooks/useDossierApercu'
import { dashboardApi } from '@/api/dashboard'
import { dossiersApi } from '@/api/dossiers'
import { ZoneIndicateurs } from './ZoneIndicateurs'
import { GraphiqueAges } from './GraphiqueAges'
import { GraphiqueRetraites } from './GraphiqueRetraites'
import { GraphiqueDossiers } from './GraphiqueDossiers'
import { ZoneUrgences } from './ZoneUrgences'

const heure = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
export function TableauDeBordAdmin() {
  const effectifs = useFetch(() => dashboardApi.effectifs())
  const synthese = useFetch(() => dossiersApi.synthese({}))
  const urgences = useFetch(() => dashboardApi.urgences())
  const alertes = useFetch(() => dashboardApi.alertes())
  const echeances = useFetch(() => dashboardApi.echeances(30))
  const { refresh: rafraichirBadge } = useAlertesNouvelles()
  const { version } = useDossierApercu()
  const [actualiseA, setActualiseA] = useState(() => new Date())
  const enChargement = [effectifs, synthese, urgences, alertes, echeances].some((x) => x.isLoading)
  useEffect(() => { rafraichirBadge() }, [rafraichirBadge])
  const versionInitiale = useRef(version)
  useEffect(() => {
    if (version === versionInitiale.current) return
    versionInitiale.current = version
    synthese.reload(); urgences.reload()
  }, [version, synthese.reload, urgences.reload])
  const actualiser = () => {
    effectifs.reload(); synthese.reload(); urgences.reload(); alertes.reload(); echeances.reload()
    rafraichirBadge(); setActualiseA(new Date())
  }
  return <div className="flex flex-col gap-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="font-display text-[22px] font-semibold text-ink">Tableau de bord</h1><p className="mt-1 text-[13px] text-[#6B7180]">Vue d'ensemble de l'effectif et des dossiers.</p></div>
      <div className="flex items-center gap-3"><span className="text-[12px] text-[#9CA0AC]">Actualisé à {heure(actualiseA)}</span><Button variant="secondary" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={actualiser} disabled={enChargement}>Actualiser</Button></div>
    </div>
    {synthese.data && !synthese.data.dateReprise && <div className="rounded-lg border border-warning/30 bg-warning-light px-4 py-3 text-[13px] text-warning">La date de reprise (<code>dossiers.date-reprise</code>) n'est pas définie : aucun dossier n'est créé automatiquement, donc les indicateurs de dossiers restent vides.</div>}
    <ZoneIndicateurs effectifs={effectifs} synthese={synthese} urgences={urgences} alertes={alertes} echeances={echeances} />
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-12"><GraphiqueAges etat={effectifs} className="xl:col-span-5" /><GraphiqueRetraites etat={effectifs} className="xl:col-span-4" /><GraphiqueDossiers etat={synthese} className="lg:col-span-2 xl:col-span-3" /></div>
    <ZoneUrgences etat={urgences} />
  </div>
}
