import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, ClipboardList, RefreshCw, Search, X } from 'lucide-react'
import { useFetch } from '@/hooks/useFetch'
import { dossiersApi } from '@/api/dossiers'
import { extractErrorMessage } from '@/api/client'
import { TYPE_LABELS, TYPES_ECHEANCE } from '@/utils/anticipation'
import { filtresDepuisUrl, nbFiltres } from '@/utils/filtresAgents'
import { formatDate } from '@/utils/date'
import { AIDE_ORDRE, VUES_DOSSIER, type Ordre } from '@/utils/dossiers'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Pagination } from '@/components/ui/Pagination'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Spinner } from '@/components/ui/Spinner'
import { BoutonExport } from '@/components/BoutonExport'
import { LigneDossier } from './LigneDossier'
import { DossierFormModal } from './DossierFormModal'
import { MenuTri } from './MenuTri'
import { MenuFiltres } from './MenuFiltres'
import { PastillesFiltres } from './PastillesFiltres'
import type { FiltresAgents, TypeAnticipation } from '@/types/anticipation'
import type { DossierDTO, VueDossier } from '@/types/dossier'

const TAILLE_PAGE = 50

const AIDE_VUE: Record<VueDossier, string> = {
  A_TRAITER: "Préparation atteinte, échéance pas encore dépassée, dossier non démarré. Cliquez sur « Démarrer » quand vous commencez le dossier.",
  EN_RETARD: "Échéance dépassée et dossier non démarré. Un dossier reste ici, en rouge, jusqu'à son démarrage.",
  EN_COURS: 'Dossiers démarrés par un gestionnaire. Un dossier en cours n’est jamais « en retard ».',
  SANS_SUITE: 'Dossiers abandonnés, avec leur motif. Ouvrez-en un pour le rouvrir.',
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
  const [filtresAgents, setFiltresAgents] = useState<FiltresAgents>(() => filtresDepuisUrl(params))
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

  // Une ligne modifiée reste en place (nouvel état affiché) jusqu'au prochain rechargement, pour éviter un saut de ligne.
  const [surcharges, setSurcharges] = useState<Record<number, DossierDTO>>({})
  useEffect(() => { setSurcharges({}) }, [data])
  const lignes = (data?.content ?? []).map((d) => surcharges[d.id] ?? d)
  useEffect(() => {
    if (data && data.content.length === 0 && data.number > 0) setPage(Math.max(0, data.totalPages - 1))
  }, [data])

  const [edition, setEdition] = useState<DossierDTO | null>(null)
  const [aDemarrer, setADemarrer] = useState<DossierDTO | null>(null)
  const [demarrage, setDemarrage] = useState(false)
  const [erreurAction, setErreurAction] = useState<string | null>(null)

  const repartir = () => setPage(0)
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

  const appliquer = (maj: DossierDTO) => {
    setSurcharges((c) => ({ ...c, [maj.id]: maj }))
    synthese.reload()
  }
  const confirmerDemarrage = async () => {
    if (!aDemarrer) return
    setDemarrage(true)
    setErreurAction(null)
    try {
      appliquer(await dossiersApi.demarrer(aDemarrer.id))
    } catch (err) {
      setErreurAction(extractErrorMessage(err, 'Impossible de démarrer ce dossier'))
      reload()   // la liste était peut-être périmée (dossier déjà démarré par un collègue)
    } finally {
      setDemarrage(false)
      setADemarrer(null)
    }
  }
  const actualiser = () => { setErreurAction(null); reload(); synthese.reload() }

  const options: { value: VueDossier; label: string; count?: number }[] = [
    { value: 'A_TRAITER', label: 'À traiter', count: s?.aTraiter },
    { value: 'EN_RETARD', label: 'En retard', count: s?.enRetard },
    { value: 'EN_COURS', label: 'En cours', count: s?.enCours },
    { value: 'SANS_SUITE', label: 'Sans suite', count: s?.sansSuite },
    { value: 'TOUS', label: 'Tous', count: s ? s.aTraiter + s.enRetard + s.enCours + s.sansSuite : undefined },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[20px] font-semibold text-ink">Dossiers</h1>
        <p className="mt-0.5 max-w-3xl text-[13px] text-[#6B7180]">
          Un dossier est créé automatiquement quand sa date de préparation est atteinte
          {s?.dateReprise ? ` (dossiers suivis à partir du ${formatDate(s.dateReprise)})` : ''}. Il est « à traiter » jusqu'à ce qu'un gestionnaire le démarre ; non démarré après son échéance, il reste en rouge.
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

      {isLoading && !data ? <Spinner label="Chargement des dossiers…" /> : data && !error ? (
        lignes.length === 0 ? <EmptyState icon={ClipboardList} title="Aucun dossier"
          description={vue === 'EN_RETARD' ? 'Aucun dossier en retard : rien à rattraper.' : vue === 'A_TRAITER' ? 'Aucun dossier à traiter pour le moment.' : 'Aucun dossier ne correspond à ces critères.'} /> :
        <div className={`flex flex-col gap-3 transition-opacity ${isLoading ? 'opacity-50' : ''}`}>
          <div ref={hautTableau} className="scroll-mt-4 overflow-x-auto rounded-xl border border-[#E4E6EB] bg-white">
            <table className="w-full">
              <thead className="border-b border-[#EAEBF0] bg-[#FAFAFB]"><tr>
                <th className="table-head-cell pl-5">Agent</th>
                <th className="table-head-cell">Type</th>
                <th className="table-head-cell">Préparation</th>
                <th className="table-head-cell">Échéance</th>
                <th className="table-head-cell">État</th>
                <th className="table-head-cell text-right">Action</th>
              </tr></thead>
              <tbody className="divide-y divide-[#EAEBF0]">{lignes.map((d) => (
                <LigneDossier key={d.id} d={d} onDemarrer={() => setADemarrer(d)} onOuvrir={() => setEdition(d)} />
              ))}</tbody>
            </table>
          </div>
          <Pagination page={data.number} totalPages={data.totalPages} totalElements={data.totalElements}
            onPageChange={changerPage} disabled={isLoading} avecNumeros />
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={aDemarrer != null} danger={false} confirmLabel="Démarrer" title="Démarrer le dossier" isLoading={demarrage}
        message={aDemarrer
          ? `Démarrer le dossier « ${TYPE_LABELS[aDemarrer.type]} » de ${aDemarrer.nomComplet} (${aDemarrer.matricule}), échéance le ${formatDate(aDemarrer.dateEcheance)} ? Il passera à « En cours » et ne pourra plus revenir à « À traiter ».`
          : ''}
        onConfirm={confirmerDemarrage} onCancel={() => setADemarrer(null)}
      />
      <DossierFormModal dossier={edition} onClose={() => setEdition(null)} onChange={(maj) => { appliquer(maj); setEdition(null) }} />
    </div>
  )
}
