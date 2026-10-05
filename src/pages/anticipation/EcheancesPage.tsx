import { useEffect, useMemo, useState } from 'react'
import { Calculator } from 'lucide-react'
import { useFetch } from '@/hooks/useFetch'
import { useAction } from '@/hooks/useAction'
import { anticipationApi } from '@/api/anticipation'
import { anticipationConfigApi } from '@/api/anticipationConfig'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Badge } from '@/components/ui/Badge'
import { TYPE_LABELS } from '@/utils/anticipation'
import { EcheancesFilters } from './EcheancesFilters'
import { EcheancesResults } from './EcheancesResults'
import { FILTRES_VIDES, construireFiltres, decrireFenetre, validerFiltres, type EtatFiltres } from './filtres'
import type { FiltresEcheances, TypeEcheance } from '@/types/anticipation'

const DESCRIPTIONS: Record<TypeEcheance, string> = {
  DEPART_RETRAITE: "Agents atteignant l'âge légal de départ (date de naissance + âge légal fixé côté serveur).",
  AVANCEMENT: "Échéance = date du dernier avancement (à défaut, début de contrat) + durée requise du couple corps/grade. Même calcul pour tous les statuts, ELD compris.",
  TITULARISATION: "Même calcul qu'un avancement : seul l'intitulé change, pour le grade de stagiaire.",
  FIN_CONTRAT: 'Agents dont le contrat prend fin. Un contrat sans date de fin (durée indéterminée) n’apparaît jamais.',
}
interface DernierCalcul { filtres: FiltresEcheances; version: number; le: Date }

export function EcheancesPage({ type }: { type: TypeEcheance }) {
  const { data: configs } = useFetch(() => anticipationConfigApi.lister())
  const config = useMemo(() => configs?.find((item) => item.type === type) ?? null, [configs, type])
  const [etat, setEtat] = useState<EtatFiltres>(FILTRES_VIDES)
  const [erreurSaisie, setErreurSaisie] = useState<string | null>(null)
  const [dernier, setDernier] = useState<DernierCalcul | null>(null)
  const calcul = useAction((signal, filtres: FiltresEcheances) => anticipationApi.echeances(type, filtres, signal), 'Calcul impossible')

  useEffect(() => {
    if (!config) return
    setEtat((current) => ({
      ...current,
      prevenance: current.prevenance === '' ? String(config.prevenanceMois) : current.prevenance,
      retard: current.retard === '' ? String(config.retardMois) : current.retard,
    }))
  }, [config])

  const handleCalculer = async () => {
    const erreur = validerFiltres(etat)
    setErreurSaisie(erreur)
    if (erreur) return
    const filtres = construireFiltres(etat, config)
    const resultat = await calcul.run(filtres)
    if (resultat) setDernier((current) => ({ filtres, version: (current?.version ?? 0) + 1, le: new Date() }))
  }
  const perime = dernier != null && calcul.data != null && JSON.stringify(construireFiltres(etat, config)) !== JSON.stringify(dernier.filtres)

  return <div className="flex flex-col gap-5">
    <div><h1 className="font-display text-[20px] font-semibold text-ink">{TYPE_LABELS[type]}</h1><p className="mt-0.5 text-[13px] text-[#6B7180]">{DESCRIPTIONS[type]}</p><p className="mt-0.5 text-[12.5px] text-[#9CA0AC]">Seuls les agents en activité sont pris en compte (situation administrative « 00 » ou non renseignée).</p><p className="mt-0.5 text-[12.5px] text-[#9CA0AC]">Date de préparation = échéance − délai de préparation du type : à partir de cette date, le dossier peut être constitué.</p></div>
    <EcheancesFilters etat={etat} config={config} erreur={erreurSaisie} isLoading={calcul.isLoading} onChange={(patch) => setEtat((current) => ({ ...current, ...patch }))} onCalculer={handleCalculer} onAnnuler={calcul.cancel} />
    {calcul.error && <ErrorBanner message={calcul.error} />}
    {calcul.data && dernier ? <div className={`flex flex-col gap-4 transition-opacity ${calcul.isLoading ? 'opacity-50' : ''}`}>
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#4B4F5A]"><span className="font-medium text-ink">{calcul.data.length} échéance{calcul.data.length > 1 ? 's' : ''}</span><span>· {decrireFenetre(dernier.filtres, config)}</span><span>· calculé à {dernier.le.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>{perime && <Badge tone="warning">Filtres modifiés depuis ce calcul</Badge>}</div>
      <EcheancesResults key={dernier.version} items={calcul.data} type={type} />
    </div> : calcul.isLoading ? <Spinner label="Calcul en cours sur l'ensemble des agents en activité…" /> : !calcul.error ? <EmptyState icon={Calculator} title="Aucun calcul lancé" description="Réglez la fenêtre puis cliquez sur « Calculer »." /> : null}
  </div>
}
