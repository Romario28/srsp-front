import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, ClipboardList, RefreshCw, Search, X } from 'lucide-react'
import { useFetch } from '@/hooks/useFetch'
import { dossiersApi } from '@/api/dossiers'
import { extractErrorMessage } from '@/api/client'
import { TYPE_LABELS, TYPES_ECHEANCE } from '@/utils/anticipation'
import { FILTRES_VIDES, nbFiltres } from '@/utils/filtresAgents'
import { formatDate } from '@/utils/date'
import { AIDE_ORDRE, ETAPES, VUES_DOSSIER, type Ordre } from '@/utils/dossiers'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Pagination } from '@/components/ui/Pagination'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Spinner } from '@/components/ui/Spinner'
import { LigneDossier } from './LigneDossier'
import { BarreLot } from './BarreLot'
import { DossierFormModal } from './DossierFormModal'
import { BoutonExport } from '@/components/BoutonExport'
import { MenuTri } from './MenuTri'
import { MenuFiltres } from './MenuFiltres'
import { PastillesFiltres } from './PastillesFiltres'
import type { FiltresAgents, TypeAnticipation } from '@/types/anticipation'
import type { DossierDTO, EtapeDossier, ResultatLot, VueDossier } from '@/types/dossier'

const TAILLE_PAGE = 50

const AIDE_VUE: Record<VueDossier, string> = {
  A_TRAITER: 'Période de traitement ouverte : préparation atteinte, échéance pas encore dépassée, dossier non démarré.',
  EN_RETARD: "Échéance dépassée et dossier non démarré. Un dossier reste ici, en rouge, jusqu'à son démarrage.",
  EN_COURS: 'Dossiers démarrés (« CHEF » renseignée) mais pas terminés. Ils ne sont jamais en retard : le badge « À relancer » signale ceux sans nouvelle étape depuis trop longtemps.',
  TRAITES: "Dossiers dont l'étape FIN est renseignée.",
  SANS_SUITE: 'Dossiers classés sans suite. Ouvrez-en un pour le rouvrir.',
  TOUS: 'Tous les dossiers, quel que soit leur état.',
}

const CHAMP_BARRE = 'h-8 rounded-lg border border-[#DADCE3] bg-white text-[13px] text-ink focus:border-accent'

export function DossiersPage() {
  const [params] = useSearchParams()
  const matriculeUrl = (params.get('matricule') ?? '').trim()
  const [vue, setVue] = useState<VueDossier>(() => VUES_DOSSIER.find((v) => v === params.get('vue')) ?? 'A_TRAITER')
  const [inverse, setInverse] = useState(false)
  const [type, setType] = useState<TypeAnticipation | ''>('')
  const [saisie, setSaisie] = useState(matriculeUrl)
  const [matricule, setMatricule] = useState(matriculeUrl)
  const [filtresAgents, setFiltresAgents] = useState<FiltresAgents>(FILTRES_VIDES)
  const [page, setPage] = useState(0)
  const hautTableau = useRef<HTMLDivElement>(null)

  const { data, isLoading, error, reload } = useFetch(
    () => dossiersApi.lister({ vue, inverse, type: type || undefined, matricule: matricule || undefined, ...filtresAgents, page, size: TAILLE_PAGE }),
    [vue, inverse, type, matricule, filtresAgents, page],
  )
  // Les compteurs des onglets suivent les mêmes critères que la liste : type, recherche et filtres agents.
  const synthese = useFetch(
    () => dossiersApi.synthese({ type: type || undefined, matricule: matricule || undefined, ...filtresAgents }),
    [type, matricule, filtresAgents],
  )
  const s = synthese.data
  const filtreActif = type !== '' || matricule !== '' || nbFiltres(filtresAgents) > 0
  const aideOrdre = AIDE_ORDRE[vue]
  const ordre: Ordre = inverse ? 'INVERSE' : 'DEFAUT'
  const paramsExport = { vue, inverse, type: type || undefined, matricule: matricule || undefined, ...filtresAgents }

  // Les mises à jour unitaires restent en place pour éviter un saut de ligne jusqu'au prochain rechargement.
  const [surcharges, setSurcharges] = useState<Record<number, DossierDTO>>({})
  useEffect(() => { setSurcharges({}) }, [data])
  const lignes = (data?.content ?? []).map((d) => surcharges[d.id] ?? d)
  useEffect(() => {
    if (data && data.content.length === 0 && data.number > 0) setPage(Math.max(0, data.totalPages - 1))
  }, [data])

  const [selection, setSelection] = useState<ReadonlySet<number>>(new Set())
  const [preparationsSelection, setPreparationsSelection] = useState<Record<number, string>>({})
  const [edition, setEdition] = useState<DossierDTO | null>(null)
  const [erreurAction, setErreurAction] = useState<string | null>(null)
  const [resultatLot, setResultatLot] = useState<ResultatLot | null>(null)
  const [enLot, setEnLot] = useState(false)

  const selectionnables = lignes.filter((d) => d.statut !== 'SANS_SUITE')
  const pageEntiereCochee = selectionnables.length > 0 && selectionnables.every((d) => selection.has(d.id))
  const repartir = () => { setPage(0); setSelection(new Set()); setPreparationsSelection({}) }
  const changerVue = (v: VueDossier) => { setVue(v); setInverse(false); repartir() }
  const changerPage = (p: number) => { setPage(p); hautTableau.current?.scrollIntoView({ block: 'start' }) }
  const choisirOrdre = (o: Ordre) => { setInverse(o === 'INVERSE'); repartir() }
  const changerFiltres = (v: FiltresAgents) => { setFiltresAgents(v); repartir() }
  const rechercher = (event: FormEvent) => {
    event.preventDefault()
    const valeur = saisie.trim()
    if (valeur !== matricule) { setMatricule(valeur); repartir() }
    else if (page !== 0) repartir()
  }
  const effacerRecherche = () => { setSaisie(''); if (matricule !== '') { setMatricule(''); repartir() } }
  const basculer = (d: DossierDTO) => {
    setSelection((c) => { const n = new Set(c); if (!n.delete(d.id)) n.add(d.id); return n })
    setPreparationsSelection((c) => {
      const n = { ...c }
      if (selection.has(d.id)) delete n[d.id]
      else n[d.id] = d.datePreparation
      return n
    })
  }
  const basculerPage = () => {
    setSelection((c) => {
      const n = new Set(c)
      selectionnables.forEach((d) => (pageEntiereCochee ? n.delete(d.id) : n.add(d.id)))
      return n
    })
    setPreparationsSelection((p) => {
      const dates = { ...p }
      selectionnables.forEach((d) => {
        if (pageEntiereCochee) delete dates[d.id]
        else dates[d.id] = d.datePreparation
      })
      return dates
    })
  }
  const viderSelection = () => { setSelection(new Set()); setPreparationsSelection({}) }
  const dateMinimumLot = Object.values(preparationsSelection).sort().at(-1) ?? null

  const appliquer = (maj: DossierDTO) => {
    setSurcharges((c) => ({ ...c, [maj.id]: maj }))
    synthese.reload()
  }
  const enregistrerEtape = async (d: DossierDTO, etape: EtapeDossier, valeur: string | null) => {
    setErreurAction(null)
    if (valeur && valeur.slice(0, 10) < d.datePreparation.slice(0, 10)) {
      const libelle = ETAPES.find((e) => e.cle === etape)?.label ?? etape
      setErreurAction(`« ${libelle} » : la date ${formatDate(valeur)} précède la date de préparation du dossier (${formatDate(d.datePreparation)}).`)
      return
    }
    try { appliquer(await dossiersApi.majEtapes(d.id, { version: d.version, etapes: { [etape]: valeur } })) }
    catch (err) { setErreurAction(extractErrorMessage(err, "Impossible d'enregistrer cette étape")) }
  }
  const appliquerLot = async (etape: EtapeDossier, date: string, ecraser: boolean) => {
    setEnLot(true)
    setErreurAction(null)
    setResultatLot(null)
    try {
      setResultatLot(await dossiersApi.appliquerLot({ ids: Array.from(selection), etape, date, ecraser }))
      viderSelection()
      reload()
      synthese.reload()
    } catch (err) { setErreurAction(extractErrorMessage(err, "Impossible d'appliquer l'étape")) }
    finally { setEnLot(false) }
  }
  const actualiser = () => { setErreurAction(null); reload(); synthese.reload() }

  const options: { value: VueDossier; label: string; count?: number }[] = [
    { value: 'A_TRAITER', label: 'À traiter', count: s?.aTraiter },
    { value: 'EN_RETARD', label: 'En retard', count: s?.enRetard },
    { value: 'EN_COURS', label: 'En cours', count: s?.enCours },
    { value: 'TRAITES', label: 'Traités', count: s?.traites },
    { value: 'SANS_SUITE', label: 'Sans suite', count: s?.sansSuite },
    { value: 'TOUS', label: 'Tous' },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[20px] font-semibold text-ink">Dossiers</h1>
        <p className="mt-0.5 max-w-3xl text-[13px] text-[#6B7180]">
          Suivi des dossiers administratifs, étape par étape. Un dossier est créé automatiquement quand sa date de préparation est atteinte
          {s?.dateReprise ? ` (dossiers suivis à partir du ${formatDate(s.dateReprise)})` : ''}. Un dossier non démarré après son échéance reste en rouge jusqu'à son démarrage.
        </p>
      </div>

      {s && !s.dateReprise && <div className="rounded-lg border border-warning/30 bg-warning-light px-4 py-3 text-[13px] text-warning">
        La date de reprise (<code>dossiers.date-reprise</code>) n'est pas définie : aucun dossier n'est créé automatiquement.
      </div>}
      {s && s.enRetard > 0 && vue !== 'EN_RETARD' && <div className="flex items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger-light px-4 py-3 text-[13px] text-danger">
        <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span><strong>{s.enRetard} dossier{s.enRetard > 1 ? 's' : ''} en retard</strong> : échéance dépassée, dossier non démarré.{filtreActif && ' (selon les filtres actifs)'}</span>
        </span>
        <Button variant="secondary" size="sm" onClick={() => changerVue('EN_RETARD')}>Voir</Button>
      </div>}

      <SegmentedControl options={options} value={vue} onChange={changerVue} ariaLabel="Vue des dossiers" />
      <p className="text-[12.5px] text-[#6B7180]">
        {AIDE_VUE[vue]}
        {vue === 'EN_COURS' && s && s.aRelancer > 0 && <span className="font-medium text-warning"> {s.aRelancer} à relancer (plus de {s.relanceApresJours} jours sans nouvelle étape).</span>}
        {filtreActif && <span className="text-[#9CA0AC]"> Les compteurs tiennent compte du type, de la recherche et des filtres actifs.</span>}
      </p>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={rechercher} role="search" className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA0AC]" />
            <input value={saisie} onChange={(e) => setSaisie(e.target.value)} placeholder="Matricule exact (Entrée)"
              aria-label="Matricule de l'agent : Entrée pour chercher"
              className={`${CHAMP_BARRE} w-52 pl-9 pr-8 placeholder:text-[#9CA0AC] ${matricule !== '' && saisie.trim() === matricule ? 'border-accent' : ''}`} />
            {saisie !== '' && <button type="button" onClick={effacerRecherche} aria-label="Effacer la recherche"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#9CA0AC] hover:text-ink"><X className="h-3.5 w-3.5" /></button>}
          </form>
          <select value={type} onChange={(e) => { setType(e.target.value as TypeAnticipation | ''); repartir() }} aria-label="Filtrer par type"
            className={`${CHAMP_BARRE} px-2.5`}>
            <option value="">Tous les types</option>{TYPES_ECHEANCE.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
          <MenuTri aide={aideOrdre} ordre={ordre} onChoisir={choisirOrdre} />
          <MenuFiltres valeur={filtresAgents} onChange={changerFiltres} />
          <div className="ml-auto flex items-start gap-2">
            <BoutonExport ecran="dossiers" params={paramsExport} disabled={isLoading || data?.totalElements === 0}
              title="Exporter en Excel les dossiers de l’onglet affiché, avec les filtres actifs (toutes les pages)" />
            <Button variant="secondary" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={actualiser} disabled={isLoading}>Actualiser</Button>
          </div>
        </div>
        <PastillesFiltres valeur={filtresAgents} onChange={changerFiltres} />
      </div>
      {error && <ErrorBanner message={error} />}
      {erreurAction && <ErrorBanner message={erreurAction} />}
      {resultatLot && <div className={`rounded-lg border px-4 py-3 text-[13px] ${resultatLot.refuses.length > 0 ? 'border-warning/30 bg-warning-light text-warning' : 'border-success/30 bg-success-light text-success'}`}>
        <div className="flex items-start justify-between gap-3"><p className="font-semibold">
          {resultatLot.modifies} dossier{resultatLot.modifies > 1 ? 's' : ''} mis à jour
          {resultatLot.inchanges > 0 && `, ${resultatLot.inchanges} déjà à cette date`}
          {resultatLot.refuses.length > 0 && `, ${resultatLot.refuses.length} refusé${resultatLot.refuses.length > 1 ? 's' : ''}`}
        </p><button type="button" onClick={() => setResultatLot(null)} aria-label="Fermer ce compte rendu"><X className="h-4 w-4" /></button></div>
        {resultatLot.refuses.length > 0 && <ul className="mt-1.5 max-h-48 list-disc space-y-0.5 overflow-y-auto pl-5 text-[12.5px]">
          {resultatLot.refuses.map((r) => <li key={r.id}><span className="font-medium">{r.libelle}</span> : {r.motif}</li>)}
        </ul>}
      </div>}

      {isLoading && !data ? <Spinner label="Chargement des dossiers…" /> : data && !error ? (
        lignes.length === 0 ? <EmptyState icon={ClipboardList} title="Aucun dossier"
          description={vue === 'EN_RETARD' ? 'Aucun dossier en retard : rien à rattraper.' : vue === 'A_TRAITER' ? 'Aucun dossier à traiter pour le moment.' : 'Aucun dossier ne correspond à ces critères.'} /> :
        <div className={`flex flex-col gap-3 transition-opacity ${isLoading ? 'opacity-50' : ''}`}>
          <div ref={hautTableau} className="scroll-mt-4 overflow-x-auto rounded-xl border border-[#E4E6EB] bg-white">
            <table className="w-full">
              <thead className="border-b border-[#EAEBF0] bg-[#FAFAFB]"><tr>
                <th className="table-head-cell sticky left-0 z-[2] bg-[#FAFAFB] pl-5"><label className="flex items-center gap-2.5">
                  <input type="checkbox" checked={pageEntiereCochee} onChange={basculerPage} aria-label="Sélectionner les dossiers de la page" className="h-4 w-4 accent-accent" />Agent
                </label></th>
                <th className="table-head-cell">Type</th><th className="table-head-cell">Préparation</th><th className="table-head-cell">Échéance</th>
                {ETAPES.map((e) => <th key={e.cle} className="table-head-cell whitespace-nowrap">{e.label}</th>)}
                <th className="table-head-cell">Statut</th>
              </tr></thead>
              <tbody className="divide-y divide-[#EAEBF0]">{lignes.map((d) => <LigneDossier key={d.id} d={d} selectionne={selection.has(d.id)}
                    onToggle={() => basculer(d)} onOuvrir={() => setEdition(d)} onEtape={(etape, valeur) => enregistrerEtape(d, etape, valeur)} />)}</tbody>
            </table>
          </div>
          <Pagination page={data.number} totalPages={data.totalPages} totalElements={data.totalElements}
            onPageChange={changerPage} disabled={isLoading} avecNumeros />
        </div>
      ) : null}

      {selection.size > 0 && <BarreLot nb={selection.size} dateMinimum={dateMinimumLot} occupe={enLot} onAppliquer={appliquerLot} onVider={viderSelection} />}
      <DossierFormModal dossier={edition} onClose={() => setEdition(null)} onChange={(maj) => { appliquer(maj); setEdition(null) }} />
    </div>
  )
}
