import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFetch } from '@/hooks/useFetch'
import { useAction } from '@/hooks/useAction'
import { useDebounce } from '@/hooks/useDebounce'
import { anticipationApi } from '@/api/anticipation'
import { anticipationConfigApi } from '@/api/anticipationConfig'
import { Spinner } from '@/components/ui/Spinner'
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
import type { ConfigurationDelaiDTO } from '@/types/configurationDelai'

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
}
const DELAI_MS = 500

/** Filtres réellement envoyés au serveur : deux saisies qui donnent les mêmes sont équivalentes
 * (ex. des mois saisis égaux aux mois configurés ne sont pas envoyés). */
function filtresEnvoyes(saisie: Saisie, config: ConfigurationDelaiDTO | null): FiltresEcheances {
  return { ...construireFiltres(saisie.etat, config), ...saisie.agents }
}

export function EcheancesPage({ type }: { type: TypeEcheance }) {
  const [params] = useSearchParams()
  const { data: configs } = useFetch(() => anticipationConfigApi.lister())
  const config = useMemo(() => configs?.find((item) => item.type === type) ?? null, [configs, type])

  const [saisie, setSaisie] = useState<Saisie>(() => ({ etat: FILTRES_VIDES, agents: filtresDepuisUrl(params) }))
  const stable = useDebounce(saisie, DELAI_MS)
  const [dernier, setDernier] = useState<DernierCalcul | null>(null)
  const calcul = useAction((signal, filtres: FiltresEcheances) => anticipationApi.echeances(type, filtres, signal), 'Calcul impossible')
  const { run } = calcul
  const signatureEnvoyee = useRef<string | null>(null)
  const sequence = useRef(0)

  const changerEtat = (patch: Partial<EtatFiltres>) =>
    setSaisie((c) => ({ ...c, etat: { ...c.etat, ...patch } }))
  const changerAgents = (agents: FiltresAgents) =>
    setSaisie((c) => ({ ...c, agents }))

  // Pré-remplissage depuis la configuration : les champs affichent les valeurs configurées.
  // Les filtres envoyés sont identiques (valeur = configuration), donc aucun nouveau calcul.
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

  // Calcul automatique : au premier affichage, puis à chaque changement stabilisé de la saisie
  useEffect(() => {
    if (validerFiltres(stable.etat) !== null) return
    const filtres = filtresEnvoyes(stable, config)
    const signature = JSON.stringify(filtres)
    if (signature === signatureEnvoyee.current) return
    signatureEnvoyee.current = signature
    const numero = ++sequence.current
    void run(filtres).then((resultat) => {
      if (resultat) setDernier({ filtres, le: new Date() })
      else if (sequence.current === numero) signatureEnvoyee.current = null
    })
  }, [stable, config, run])

  const erreurSaisie = validerFiltres(stable.etat)
  const enAttente = JSON.stringify(filtresEnvoyes(saisie, config)) !== JSON.stringify(filtresEnvoyes(stable, config))
  const occupe = enAttente || calcul.isLoading

  return <div className="flex h-[calc(100vh_-_7.5rem)] min-h-[30rem] flex-col gap-3">
    <header className="flex-shrink-0">
      <h1 className="font-display text-[20px] font-semibold text-ink">{TYPE_LABELS[type]}</h1>
      <p className="mt-0.5 text-[13px] text-[#6B7180]">{DESCRIPTIONS[type]}</p>
      <details className="mt-1 text-[12px] text-[#9CA0AC]">
        <summary className="w-fit cursor-pointer select-none hover:text-[#6B7180]">Règles communes</summary>
        <p className="mt-1">Seuls les agents en activité sont pris en compte (situation administrative « 00 » ou non renseignée).</p>
        <p>Date de préparation = échéance − délai de préparation du type : à partir de cette date, le dossier peut être constitué.</p>
      </details>
    </header>
    <div className="flex-shrink-0"><FiltresAgentsBar valeur={saisie.agents} onChange={changerAgents} /></div>
    <div className="flex-shrink-0"><EcheancesFilters etat={saisie.etat} config={config} erreur={erreurSaisie} occupe={occupe} onChange={changerEtat} /></div>
    {calcul.error && <div className="flex-shrink-0"><ErrorBanner message={calcul.error} /></div>}
    {calcul.data && dernier
      ? <div aria-busy={calcul.isLoading} className={`flex min-h-0 flex-1 flex-col gap-2 transition-opacity ${calcul.isLoading ? 'opacity-50' : ''}`}>
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2 text-[13px] text-[#4B4F5A]">
          <span className="font-medium text-ink">{calcul.data.length} échéance{calcul.data.length > 1 ? 's' : ''}</span>
          <span>· {decrireFenetre(dernier.filtres, config)}</span>
          <span>· calculé à {dernier.le.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          {nbFiltres(dernier.filtres) > 0 && <Badge tone="accent">{nbFiltres(dernier.filtres)} filtre{nbFiltres(dernier.filtres) > 1 ? 's' : ''} agents</Badge>}
          {erreurSaisie && <Badge tone="warning">Résultats précédents : filtres invalides</Badge>}
          <div className="ml-auto">
            <BoutonExport ecran={ECHEANCE_SLUGS[type] as EcranExport} params={dernier.filtres} disabled={calcul.data.length === 0}
              title="Exporter en Excel le résultat affiché (le filtre Statut de la barre s'applique, ni les onglets ni la recherche)" />
          </div>
        </div>
        <EcheancesResults items={calcul.data} type={type} />
      </div>
      : !calcul.error ? <Spinner label="Calcul en cours sur l'ensemble des agents en activité…" /> : null}
  </div>
}
