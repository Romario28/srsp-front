import { useCallback, useEffect, useState } from 'react'
import { useAction } from '@/hooks/useAction'
import { anticipationApi } from '@/api/anticipation'
import { Badge } from '@/components/ui/Badge'
import { BoutonInfo } from '@/components/ui/BoutonInfo'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Spinner } from '@/components/ui/Spinner'
import { FiltresAgentsBar } from '@/components/FiltresAgentsBar'
import { BoutonExport } from '@/components/BoutonExport'
import { FILTRES_VIDES, nbFiltres } from '@/utils/filtresAgents'
import { EcheancesResults } from './EcheancesResults'
import type { AlerteAnticipation, FiltresAgents } from '@/types/anticipation'

export function AnomaliesPage() {
  const analyse = useAction<[FiltresAgents], AlerteAnticipation[]>(
    (signal, filtres) => anticipationApi.anomalies(filtres, signal), 'Analyse impossible')
  const { run } = analyse
  const [filtres, setFiltres] = useState<FiltresAgents>(FILTRES_VIDES)
  const [analyses, setAnalyses] = useState<FiltresAgents>(FILTRES_VIDES)
  const [le, setLe] = useState<Date | null>(null)

  const lancer = useCallback((cible: FiltresAgents) =>
    run(cible).then((resultat) => { if (resultat) { setLe(new Date()); setAnalyses(cible) } }), [run])

  useEffect(() => { void lancer(filtres) }, [filtres, lancer])

  const anomalies = analyse.data ?? []
  const nbAgents = new Set(anomalies.map((item) => item.matricule)).size

  return <div className="flex h-[calc(100vh_-_7.5rem)] min-h-[30rem] flex-col gap-3">
    <header className="flex-shrink-0">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-[20px] font-semibold text-ink">Anomalies</h1>
        <BoutonInfo etiquette="Aide : anomalies" largeur={440}>
          <p>Il n'y a pas de fenêtre de dates : une anomalie n'a pas d'échéance. Corrigez à la source, puis réimportez.</p>
        </BoutonInfo>
      </div>
      <p className="mt-0.5 text-[13px] text-[#6B7180]">Agents en activité pour lesquels une échéance ne peut pas être calculée faute de données (date de naissance, grade, corps, dates d'ancrage, durée requise, ou date de début de contrat d'un contractuel sans date de fin).</p>
    </header>
    <div className="flex-shrink-0"><FiltresAgentsBar valeur={filtres} onChange={setFiltres} /></div>
    {analyse.error && <div className="flex flex-shrink-0 flex-col items-start gap-2">
      <ErrorBanner message={analyse.error} />
      <Button variant="secondary" size="sm" onClick={() => void lancer(filtres)}>Réessayer</Button>
    </div>}
    {analyse.data ? <div className={`flex min-h-0 flex-1 flex-col gap-2 transition-opacity ${analyse.isLoading ? 'opacity-50' : ''}`}>
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2 text-[13px] text-[#4B4F5A]">
        <span><span className="font-medium text-ink">{anomalies.length} anomalie{anomalies.length > 1 ? 's' : ''}</span> · {nbAgents} agent{nbAgents > 1 ? 's' : ''}{le && ` · analysé à ${le.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}</span>
        {nbFiltres(analyses) > 0 && <Badge tone="accent">{nbFiltres(analyses)} filtre{nbFiltres(analyses) > 1 ? 's' : ''} agents</Badge>}
        <div className="ml-auto"><BoutonExport ecran="anomalies" params={analyses} disabled={anomalies.length === 0} title="Exporter en Excel l'analyse affichée" /></div>
      </div>
      <EcheancesResults items={anomalies} type="ANOMALIE" />
    </div> : !analyse.error ? <Spinner label="Analyse en cours sur l'ensemble des agents en activité…" /> : null}
  </div>
}
