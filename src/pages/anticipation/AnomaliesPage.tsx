import { useState } from 'react'
import { Search, AlertTriangle } from 'lucide-react'
import { useAction } from '@/hooks/useAction'
import { anticipationApi } from '@/api/anticipation'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Spinner } from '@/components/ui/Spinner'
import { FiltresAgentsBar } from '@/components/FiltresAgentsBar'
import { FILTRES_VIDES, cleFiltres, nbFiltres } from '@/utils/filtresAgents'
import { EcheancesResults } from './EcheancesResults'
import type { AlerteAnticipation, FiltresAgents } from '@/types/anticipation'

export function AnomaliesPage() {
  const analyse = useAction<[FiltresAgents], AlerteAnticipation[]>(
    (signal, filtres) => anticipationApi.anomalies(filtres, signal), 'Analyse impossible')
  const [filtres, setFiltres] = useState<FiltresAgents>(FILTRES_VIDES)
  const [analyses, setAnalyses] = useState<FiltresAgents>(FILTRES_VIDES)   // filtres du résultat affiché
  const [version, setVersion] = useState(0)
  const [le, setLe] = useState<Date | null>(null)

  const lancer = async () => {
    const resultat = await analyse.run(filtres)
    if (resultat) { setVersion((current) => current + 1); setLe(new Date()); setAnalyses(filtres) }
  }
  const anomalies = analyse.data ?? []
  const nbAgents = new Set(anomalies.map((item) => item.matricule)).size
  const perime = analyse.data != null && cleFiltres(analyses) !== cleFiltres(filtres)

  return <div className="flex flex-col gap-5">
    <div>
      <h1 className="font-display text-[20px] font-semibold text-ink">Anomalies</h1>
      <p className="mt-0.5 text-[13px] text-[#6B7180]">Agents en activité pour lesquels une échéance ne peut pas être calculée faute de données (date de naissance, grade, corps, dates d'ancrage ou durée requise). Il n'y a pas de fenêtre de dates : une anomalie n'a pas d'échéance. Corrigez à la source, puis réimportez.</p>
    </div>
    <FiltresAgentsBar valeur={filtres} onChange={setFiltres} />
    <div className="flex justify-end gap-2">
      {analyse.isLoading && <Button variant="secondary" onClick={analyse.cancel}>Annuler</Button>}
      <Button icon={<Search className="h-4 w-4" />} isLoading={analyse.isLoading} onClick={lancer}>Analyser</Button>
    </div>
    {analyse.error && <ErrorBanner message={analyse.error} />}
    {analyse.data ? <div className={`flex flex-col gap-4 transition-opacity ${analyse.isLoading ? 'opacity-50' : ''}`}>
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#4B4F5A]">
        <span><span className="font-medium text-ink">{anomalies.length} anomalie{anomalies.length > 1 ? 's' : ''}</span> · {nbAgents} agent{nbAgents > 1 ? 's' : ''}{le && ` · analysé à ${le.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}</span>
        {nbFiltres(analyses) > 0 && <Badge tone="accent">{nbFiltres(analyses)} filtre{nbFiltres(analyses) > 1 ? 's' : ''} agents</Badge>}
        {perime && <Badge tone="warning">Filtres modifiés depuis cette analyse</Badge>}
      </div>
      <EcheancesResults key={version} items={anomalies} type="ANOMALIE" />
    </div> : analyse.isLoading ? <Spinner label="Analyse en cours sur l'ensemble des agents en activité…" /> : !analyse.error ? <EmptyState icon={AlertTriangle} title="Aucune analyse lancée" description="Cliquez sur « Analyser »." /> : null}
  </div>
}
