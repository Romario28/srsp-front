import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Calculator } from 'lucide-react'
import { useFetch } from '@/hooks/useFetch'
import { useAction } from '@/hooks/useAction'
import { useDebounce } from '@/hooks/useDebounce'
import { anticipationApi } from '@/api/anticipation'
import { anticipationConfigApi } from '@/api/anticipationConfig'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Badge } from '@/components/ui/Badge'
import { FiltresAgentsBar } from '@/components/FiltresAgentsBar'
import { ECHEANCE_SLUGS, TYPE_LABELS } from '@/utils/anticipation'
import { BoutonExport } from '@/components/BoutonExport'
import type { EcranExport } from '@/api/exports'
import { filtresDepuisUrl, nbFiltres } from '@/utils/filtresAgents'
import { EcheancesFilters } from './EcheancesFilters'
import { EcheancesResults } from './EcheancesResults'
import { FILTRES_VIDES, construireFiltres, decrireFenetre, validerFiltres, type EtatFiltres } from './filtres'
import type { FiltresAgents, FiltresEcheances, TypeEcheance } from '@/types/anticipation'

const DESCRIPTIONS: Record<TypeEcheance, string> = {
  DEPART_RETRAITE: "Agents atteignant l'âge légal de départ (date de naissance + âge légal fixé côté serveur).",
  AVANCEMENT: "Avancement d'échelon : le grade suivant garde les deux premiers caractères du grade actuel. Échéance = date du dernier avancement (à défaut, début de contrat) + durée requise du couple corps/grade. Même calcul pour tous les statuts, ELD compris.",
  AVANCEMENT_CLASSE: "Avancement de classe : le grade suivant change les deux premiers caractères du code (ex. 2C2E → 1C3E). Même calcul d'échéance qu'un avancement ; sa fenêtre de préparation se règle séparément (1 mois par défaut).",
  TITULARISATION: "Même calcul qu'un avancement : seul l'intitulé change, pour le grade de stagiaire.",
  FIN_CONTRAT: 'Agents dont le contrat prend fin. Un contrat sans date de fin (durée indéterminée) n’apparaît jamais.',
  INTEGRATION: "Contractuels sans date de fin de contrat : intégration (passage au statut de fonctionnaire) 2 ans après la date de début de contrat. Un contractuel sans date de début est signalé en anomalie.",
}

interface DernierCalcul { filtres: FiltresEcheances; le: Date }

interface Saisie {
  etat: EtatFiltres
  agents: FiltresAgents
  /** Faux tant que l'utilisateur n'a rien choisi : l'écran d'invite reste affiché, aucun calcul ne part. */
  touche: boolean
}
const DELAI_MS = 500

export function EcheancesPage({ type }: { type: TypeEcheance }) {
  const [params] = useSearchParams()
  const { data: configs } = useFetch(() => anticipationConfigApi.lister())
  const config = useMemo(() => configs?.find((item) => item.type === type) ?? null, [configs, type])

  const [saisie, setSaisie] = useState<Saisie>(() => {
    const agents = filtresDepuisUrl(params)
    return { etat: FILTRES_VIDES, agents, touche: nbFiltres(agents) > 0 }
  })
  const stable = useDebounce(saisie, DELAI_MS)
  const [dernier, setDernier] = useState<DernierCalcul | null>(null)
  const calcul = useAction((signal, filtres: FiltresEcheances) => anticipationApi.echeances(type, filtres, signal), 'Calcul impossible')
  const { run } = calcul
  const signatureEnvoyee = useRef<string | null>(null)
  const sequence = useRef(0)

  const changerEtat = (patch: Partial<EtatFiltres>) =>
    setSaisie((c) => ({ ...c, touche: true, etat: { ...c.etat, ...patch } }))
  const changerAgents = (agents: FiltresAgents) =>
    setSaisie((c) => ({ ...c, touche: true, agents }))

  // Pré-remplissage depuis la configuration : ce n'est pas un choix de l'utilisateur, `touche` ne change pas
  useEffect(() => {
    if (!config) return
    setSaisie((c) => {
      const prevenance = c.etat.prevenance === '' ? String(config.prevenanceMois) : c.etat.prevenance
      const retard = c.etat.retard === '' ? String(config.retardMois) : c.etat.retard
      if (prevenance === c.etat.prevenance && retard === c.etat.retard) return c
      return { ...c, etat: { ...c.etat, prevenance, retard } }
    })
  }, [config])

  // Remontage (mode strict de React en dev) : on repart d'un écran vierge
  useEffect(() => () => { signatureEnvoyee.current = null }, [])

  // Calcul automatique, une fois la saisie stabilisée
  useEffect(() => {
    if (!stable.touche || validerFiltres(stable.etat) !== null) return
    const filtres: FiltresEcheances = { ...construireFiltres(stable.etat, config), ...stable.agents }
    const signature = JSON.stringify(filtres)
    if (signature === signatureEnvoyee.current) return
    signatureEnvoyee.current = signature
    const numero = ++sequence.current
    void run(filtres).then((resultat) => {
      if (resultat) setDernier({ filtres, le: new Date() })
      else if (sequence.current === numero) signatureEnvoyee.current = null
    })
  }, [stable, config, run])

  const erreurSaisie = stable.touche ? validerFiltres(stable.etat) : null
  const occupe = saisie.touche && (stable !== saisie || calcul.isLoading)

  return <div className="flex flex-col gap-5">
    <div><h1 className="font-display text-[20px] font-semibold text-ink">{TYPE_LABELS[type]}</h1><p className="mt-0.5 text-[13px] text-[#6B7180]">{DESCRIPTIONS[type]}</p><p className="mt-0.5 text-[12.5px] text-[#9CA0AC]">Seuls les agents en activité sont pris en compte (situation administrative « 00 » ou non renseignée).</p><p className="mt-0.5 text-[12.5px] text-[#9CA0AC]">Date de préparation = échéance − délai de préparation du type : à partir de cette date, le dossier peut être constitué.</p></div>
    <FiltresAgentsBar valeur={saisie.agents} onChange={changerAgents} />
    <EcheancesFilters etat={saisie.etat} config={config} erreur={erreurSaisie} occupe={occupe} onChange={changerEtat} />
    {calcul.error && <ErrorBanner message={calcul.error} />}
    {calcul.data && dernier ? <div aria-busy={calcul.isLoading} className={`flex flex-col gap-4 transition-opacity ${calcul.isLoading ? 'opacity-50' : ''}`}>
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#4B4F5A]"><span className="font-medium text-ink">{calcul.data.length} échéance{calcul.data.length > 1 ? 's' : ''}</span><span>· {decrireFenetre(dernier.filtres, config)}</span><span>· calculé à {dernier.le.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>{nbFiltres(dernier.filtres) > 0 && <Badge tone="accent">{nbFiltres(dernier.filtres)} filtre{nbFiltres(dernier.filtres) > 1 ? 's' : ''} agents</Badge>}
        {erreurSaisie && <Badge tone="warning">Résultats précédents : filtres invalides</Badge>}
      </div>
      <div className="flex justify-end"><BoutonExport ecran={ECHEANCE_SLUGS[type] as EcranExport} params={dernier.filtres} disabled={calcul.data.length === 0} title="Exporter en Excel le résultat affiché (le filtre Statut de la barre s'applique, ni les onglets ni la recherche)" /></div>
      <EcheancesResults items={calcul.data} type={type} />
    </div> : (calcul.isLoading || occupe) ? <Spinner label="Calcul en cours sur l'ensemble des agents en activité…" /> : !calcul.error ? <EmptyState icon={Calculator} title="Aucun calcul lancé" description="Modifiez un filtre, ou cliquez sur « Valeurs configurées » : le calcul se lance automatiquement." /> : null}
  </div>
}
