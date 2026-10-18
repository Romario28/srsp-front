import { useEffect, useState, type FormEvent } from 'react'
import { AlertTriangle, ClipboardList, RefreshCw, Search, X } from 'lucide-react'
import { useFetch } from '@/hooks/useFetch'
import { dossiersApi } from '@/api/dossiers'
import { extractErrorMessage } from '@/api/client'
import { TYPE_LABELS, TYPES_ECHEANCE } from '@/utils/anticipation'
import { FILTRES_VIDES } from '@/utils/filtresAgents'
import { formatDate } from '@/utils/date'
import { ETAPES } from '@/utils/dossiers'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Pagination } from '@/components/ui/Pagination'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Spinner } from '@/components/ui/Spinner'
import { FiltresAgentsBar } from '@/components/FiltresAgentsBar'
import { LigneDossier } from './LigneDossier'
import { BarreLot } from './BarreLot'
import { DossierFormModal } from './DossierFormModal'
import type { FiltresAgents, TypeAnticipation } from '@/types/anticipation'
import type { DossierDTO, EtapeDossier, ResultatLot, VueDossier } from '@/types/dossier'

const TAILLE_PAGE = 50

export function DossiersPage() {
  const [vue, setVue] = useState<VueDossier>('A_TRAITER')
  const [type, setType] = useState<TypeAnticipation | ''>('')
  const [saisie, setSaisie] = useState('')
  const [matricule, setMatricule] = useState('')
  const [filtresAgents, setFiltresAgents] = useState<FiltresAgents>(FILTRES_VIDES)
  const [page, setPage] = useState(0)

  const { data, isLoading, error, reload } = useFetch(
    () => dossiersApi.lister({ vue, type: type || undefined, matricule: matricule || undefined, ...filtresAgents, page, size: TAILLE_PAGE }),
    [vue, type, matricule, filtresAgents, page],
  )
  const synthese = useFetch(() => dossiersApi.synthese())
  const s = synthese.data

  const [surcharges, setSurcharges] = useState<Record<number, DossierDTO>>({})
  useEffect(() => { setSurcharges({}) }, [data])
  const lignes = (data?.content ?? []).map((d) => surcharges[d.id] ?? d)

  const [selection, setSelection] = useState<ReadonlySet<number>>(new Set())
  const [edition, setEdition] = useState<DossierDTO | null>(null)
  const [erreurAction, setErreurAction] = useState<string | null>(null)
  const [resultatLot, setResultatLot] = useState<ResultatLot | null>(null)
  const [enLot, setEnLot] = useState(false)

  const selectionnables = lignes.filter((d) => d.statut !== 'SANS_SUITE')
  const pageEntiereCochee = selectionnables.length > 0 && selectionnables.every((d) => selection.has(d.id))

  const repartir = () => { setPage(0); setSelection(new Set()) }
  const changerVue = (v: VueDossier) => { setVue(v); repartir() }
  const rechercher = (event: FormEvent) => { event.preventDefault(); setMatricule(saisie.trim()); repartir() }
  const basculer = (id: number) => setSelection((c) => { const n = new Set(c); if (!n.delete(id)) n.add(id); return n })
  const basculerPage = () => setSelection((c) => {
    const n = new Set(c)
    selectionnables.forEach((d) => (pageEntiereCochee ? n.delete(d.id) : n.add(d.id)))
    return n
  })

  const appliquer = (maj: DossierDTO) => {
    setSurcharges((c) => ({ ...c, [maj.id]: maj }))
    synthese.reload()
  }
  const enregistrerEtape = async (d: DossierDTO, etape: EtapeDossier, valeur: string | null) => {
    setErreurAction(null)
    try { appliquer(await dossiersApi.majEtapes(d.id, { version: d.version, etapes: { [etape]: valeur } })) }
    catch (err) { setErreurAction(extractErrorMessage(err, "Impossible d'enregistrer cette étape")) }
  }
  const appliquerLot = async (etape: EtapeDossier, date: string, ecraser: boolean) => {
    setEnLot(true)
    setErreurAction(null)
    setResultatLot(null)
    try {
      setResultatLot(await dossiersApi.appliquerLot({ ids: Array.from(selection), etape, date, ecraser }))
      setSelection(new Set())
      reload()
      synthese.reload()
    } catch (err) { setErreurAction(extractErrorMessage(err, "Impossible d'appliquer l'étape")) }
    finally { setEnLot(false) }
  }
  const actualiser = () => { setErreurAction(null); reload(); synthese.reload() }

  const options: { value: VueDossier; label: string; count?: number }[] = [
    { value: 'A_TRAITER', label: 'À traiter', count: s ? s.enAttente + s.enCours : undefined },
    { value: 'EN_RETARD', label: 'En retard', count: s?.enRetard },
    { value: 'A_RELANCER', label: 'À relancer', count: s?.aRelancer },
    { value: 'TERMINES', label: 'Terminés', count: s?.termines },
    { value: 'TOUS', label: 'Tous' },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[20px] font-semibold text-ink">Dossiers</h1>
          <p className="mt-0.5 max-w-3xl text-[13px] text-[#6B7180]">
            Suivi des dossiers administratifs, étape par étape. Un dossier est créé automatiquement quand sa date de préparation est atteinte
            {s?.dateReprise ? ` (dossiers suivis à partir du ${formatDate(s.dateReprise)})` : ''}. Un dossier non démarré après sa préparation reste en rouge jusqu'à son démarrage.
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={actualiser} disabled={isLoading}>Actualiser</Button>
      </div>

      {s && !s.dateReprise && <div className="rounded-lg border border-warning/30 bg-warning-light px-4 py-3 text-[13px] text-warning">
        La date de reprise (<code>dossiers.date-reprise</code>) n'est pas définie : aucun dossier n'est créé automatiquement.
      </div>}
      {s && s.enRetard > 0 && vue !== 'EN_RETARD' && <div className="flex items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger-light px-4 py-3 text-[13px] text-danger">
        <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span><strong>{s.enRetard} dossier{s.enRetard > 1 ? 's' : ''} en retard</strong> : préparation dépassée, dossier non démarré.</span>
        </span>
        <Button variant="secondary" size="sm" onClick={() => changerVue('EN_RETARD')}>Voir</Button>
      </div>}

      <SegmentedControl options={options} value={vue} onChange={changerVue} ariaLabel="Vue des dossiers" />
      {vue === 'A_RELANCER' && s && <p className="text-[12.5px] text-[#6B7180]">Dossiers en cours sans nouvelle étape depuis plus de {s.relanceApresJours} jours. Ce n'est pas un retard : un simple rappel.</p>}

      <div className="flex flex-wrap items-center gap-3">
        <select value={type} onChange={(e) => { setType(e.target.value as TypeAnticipation | ''); repartir() }} aria-label="Filtrer par type"
          className="h-9 rounded-lg border border-[#DADCE3] bg-white px-3 text-[13px] text-ink focus:border-accent">
          <option value="">Tous les types</option>{TYPES_ECHEANCE.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
        <form onSubmit={rechercher} className="flex items-center gap-2">
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA0AC]" />
            <input value={saisie} onChange={(e) => setSaisie(e.target.value)} placeholder="Matricule exact…" aria-label="Matricule de l'agent"
              className="h-9 w-44 rounded-lg border border-[#DADCE3] bg-white pl-9 pr-3 text-[13px] text-ink placeholder:text-[#9CA0AC] focus:border-accent" />
          </div>
          <Button type="submit" variant="secondary" size="sm">Chercher</Button>
          {matricule !== '' && <Button type="button" variant="ghost" size="sm" icon={<X className="h-3.5 w-3.5" />}
            onClick={() => { setSaisie(''); setMatricule(''); repartir() }}>{matricule}</Button>}
        </form>
      </div>
      <FiltresAgentsBar valeur={filtresAgents} onChange={(v) => { setFiltresAgents(v); repartir() }} />

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
        lignes.length === 0 ? <EmptyState icon={ClipboardList} title="Aucun dossier" description={vue === 'EN_RETARD' ? 'Aucun dossier en retard : rien à rattraper.' : 'Aucun dossier ne correspond à ces critères.'} /> :
        <div className={`flex flex-col gap-3 transition-opacity ${isLoading ? 'opacity-50' : ''}`}>
          <div className="overflow-x-auto rounded-xl border border-[#E4E6EB] bg-white"><table className="w-full">
            <thead className="border-b border-[#EAEBF0] bg-[#FAFAFB]"><tr>
              <th className="table-head-cell sticky left-0 z-[2] bg-[#FAFAFB] pl-5"><label className="flex items-center gap-2.5">
                <input type="checkbox" checked={pageEntiereCochee} onChange={basculerPage} aria-label="Sélectionner les dossiers de la page" className="h-4 w-4 accent-accent" />Agent
              </label></th>
              <th className="table-head-cell">Type</th><th className="table-head-cell">Préparation</th><th className="table-head-cell">Échéance</th>
              {ETAPES.map((e) => <th key={e.cle} className="table-head-cell whitespace-nowrap">{e.label}</th>)}
              <th className="table-head-cell">Statut</th>
            </tr></thead>
            <tbody className="divide-y divide-[#EAEBF0]">{lignes.map((d) => <LigneDossier key={d.id} d={d} selectionne={selection.has(d.id)}
              onToggle={() => basculer(d.id)} onOuvrir={() => setEdition(d)} onEtape={(etape, valeur) => enregistrerEtape(d, etape, valeur)} />)}</tbody>
          </table></div>
          <Pagination page={data.number} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} disabled={isLoading} />
        </div>
      ) : null}

      {selection.size > 0 && <BarreLot nb={selection.size} occupe={enLot} onAppliquer={appliquerLot} onVider={() => setSelection(new Set())} />}
      <DossierFormModal dossier={edition} onClose={() => setEdition(null)} onChange={(maj) => { appliquer(maj); setEdition(null) }} />
    </div>
  )
}
