import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bell, RefreshCw, Search, X } from 'lucide-react'
import { useFetch } from '@/hooks/useFetch'
import { useAlertesNouvelles } from '@/hooks/useAlertesNouvelles'
import { alertesApi } from '@/api/alertes'
import { extractErrorMessage } from '@/api/client'
import { formatDate } from '@/utils/date'
import { changeDeGrade, TYPE_LABELS, TYPES_ECHEANCE } from '@/utils/anticipation'
import { Badge, StatutAlerteBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Pagination } from '@/components/ui/Pagination'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Spinner } from '@/components/ui/Spinner'
import { AlerteDetailModal } from './AlerteDetailModal'
import { EcheanceAlerte } from './EcheanceAlerte'
import { CelluleDerniereSituation, CelluleNouvelleSituation } from '../SituationsGrade'
import type { TypeAnticipation } from '@/types/anticipation'
import type { AlerteDTO, StatutAlerte } from '@/types/alerte'

const TAILLE_PAGE = 20
const TYPES_ALERTE: TypeAnticipation[] = [...TYPES_ECHEANCE, 'ANOMALIE']
type FiltreStatutAlerte = StatutAlerte | 'TOUS'
const OPTIONS_STATUT: { value: FiltreStatutAlerte; label: string }[] = [
  { value: 'NOUVELLE', label: 'Nouvelles' }, { value: 'VUE', label: 'Vues' },
  { value: 'ACQUITTEE', label: 'Acquittées' }, { value: 'TOUS', label: 'Toutes' },
]
function typeDepuisUrl(valeur: string | null): TypeAnticipation | '' {
  return TYPES_ALERTE.find((type) => type === valeur) ?? ''
}

export function AlertesPage() {
  const { refresh: rafraichirCompteur } = useAlertesNouvelles()
  const [searchParams] = useSearchParams()
  const [type, setType] = useState<TypeAnticipation | ''>(() => typeDepuisUrl(searchParams.get('type')))
  const [statut, setStatut] = useState<FiltreStatutAlerte>('NOUVELLE')
  const [saisie, setSaisie] = useState('')
  const [matricule, setMatricule] = useState('')
  const [page, setPage] = useState(0)
  const { data, isLoading, error, reload } = useFetch(() => alertesApi.lister({
    type: type || undefined,
    statut: statut === 'TOUS' ? undefined : statut,
    matricule: matricule || undefined,
    page,
    size: TAILLE_PAGE,
  }), [type, statut, matricule, page])

  const [surcharges, setSurcharges] = useState<Record<number, AlerteDTO>>({})
  useEffect(() => { setSurcharges({}) }, [data])
  const lignes = (data?.content ?? []).map((alerte) => surcharges[alerte.id] ?? alerte)
  useEffect(() => {
    if (data && data.content.length === 0 && data.number > 0) setPage(Math.max(0, data.totalPages - 1))
  }, [data])

  const [selection, setSelection] = useState<AlerteDTO | null>(null)
  const [erreurConsult, setErreurConsult] = useState<string | null>(null)
  const ouvertureRef = useRef<number | null>(null)
  const modifie = useRef(false)
  const appliquer = (maj: AlerteDTO) => {
    setSurcharges((current) => ({ ...current, [maj.id]: maj }))
    setSelection((current) => current?.id === maj.id ? maj : current)
  }

  // La consultation est un GET qui écrit côté serveur : il part uniquement depuis cette action utilisateur.
  const ouvrir = async (alerte: AlerteDTO) => {
    ouvertureRef.current = alerte.id
    setSelection(alerte)
    setErreurConsult(null)
    try {
      const maj = await alertesApi.consulter(alerte.id)
      appliquer(maj)
      if (maj.statut !== alerte.statut) { modifie.current = true; rafraichirCompteur() }
    } catch (err) {
      if (ouvertureRef.current === alerte.id) setErreurConsult(extractErrorMessage(err, "Impossible d'enregistrer la consultation"))
    }
  }
  const fermer = () => {
    ouvertureRef.current = null
    setSelection(null)
    setErreurConsult(null)
    if (modifie.current) { modifie.current = false; reload() }
  }
  const apresAcquittement = (maj: AlerteDTO) => { appliquer(maj); modifie.current = true; rafraichirCompteur() }
  const resynchroniser = async (id: number) => {
    try { appliquer(await alertesApi.consulter(id)); modifie.current = true; rafraichirCompteur() }
    catch { /* conserver le message d'erreur affiché dans le panneau */ }
  }
  const changerType = (value: TypeAnticipation | '') => { setType(value); setPage(0) }
  const changerStatut = (value: FiltreStatutAlerte) => { setStatut(value); setPage(0) }
  const rechercher = (event: FormEvent) => { event.preventDefault(); setMatricule(saisie.trim()); setPage(0) }
  const effacerMatricule = () => { setSaisie(''); setMatricule(''); setPage(0) }
  const actualiser = () => { reload(); rafraichirCompteur() }
  const filtresActifs = type !== '' || matricule !== ''

  return <div className="flex flex-col gap-5">
    <div className="flex items-start justify-between gap-4"><div>
      <h1 className="font-display text-[20px] font-semibold text-ink">Alertes</h1>
      <p className="mt-0.5 max-w-3xl text-[13px] text-[#6B7180]">Générées chaque nuit avec les fenêtres configurées. Une alerte reste dans le fil jusqu'à son acquittement, même quand l'agent sort de la fenêtre. Les plus urgentes sont en tête, les anomalies en fin de liste.</p>
    </div><Button variant="secondary" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={actualiser} disabled={isLoading}>Actualiser</Button></div>

    <div className="flex flex-wrap items-center gap-3">
      <SegmentedControl options={OPTIONS_STATUT} value={statut} onChange={changerStatut} ariaLabel="Filtrer par statut d'alerte" />
      <select value={type} onChange={(event) => changerType(event.target.value as TypeAnticipation | '')} aria-label="Filtrer par type" className="h-9 rounded-lg border border-[#DADCE3] bg-white px-3 text-[13px] text-ink focus:border-accent">
        <option value="">Tous les types</option>{TYPES_ALERTE.map((value) => <option key={value} value={value}>{TYPE_LABELS[value]}</option>)}
      </select>
      <form onSubmit={rechercher} className="flex items-center gap-2">
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA0AC]" /><input value={saisie} onChange={(event) => setSaisie(event.target.value)} placeholder="Matricule exact…" aria-label="Matricule de l'agent" className="h-9 w-44 rounded-lg border border-[#DADCE3] bg-white pl-9 pr-3 text-[13px] text-ink placeholder:text-[#9CA0AC] focus:border-accent" /></div>
        <Button type="submit" variant="secondary" size="sm">Chercher</Button>
        {matricule !== '' && <Button type="button" variant="ghost" size="sm" icon={<X className="h-3.5 w-3.5" />} onClick={effacerMatricule}>{matricule}</Button>}
      </form>
    </div>

    {error && <ErrorBanner message={error} />}
    {isLoading && !data ? <Spinner label="Chargement des alertes…" /> : data && !error ? (
      lignes.length === 0 ? <EmptyState icon={Bell} title={statut === 'NOUVELLE' && !filtresActifs ? 'Aucune nouvelle alerte' : 'Aucune alerte'} description={statut === 'NOUVELLE' && !filtresActifs ? 'Le prochain calcul a lieu cette nuit.' : 'Aucune alerte ne correspond à ces filtres.'} /> :
      <div className={`flex flex-col gap-3 transition-opacity ${isLoading ? 'opacity-50' : ''}`}>
        <div className="overflow-x-auto rounded-xl border border-[#E4E6EB] bg-white"><table className="w-full">
          <thead className="border-b border-[#EAEBF0] bg-[#FAFAFB]"><tr><th className="table-head-cell">Matricule</th><th className="table-head-cell">Agent</th><th className="table-head-cell">Type</th><th className="table-head-cell border-l border-[#EAEBF0]">Dernière situation</th><th className="table-head-cell border-l border-[#EAEBF0]">Nouvelle situation</th><th className="table-head-cell">Préparation dès le</th><th className="table-head-cell">Échéance</th><th className="table-head-cell">Détectée le</th><th className="table-head-cell">Statut</th></tr></thead>
          <tbody className="divide-y divide-[#EAEBF0]">{lignes.map((alerte) => <tr key={alerte.id} onClick={() => ouvrir(alerte)} className="cursor-pointer hover:bg-[#FAFAFB]">
            <td className="table-cell font-mono text-[12.5px] text-[#4B4F5A]">{alerte.matriculeAgent}</td>
            <td className="table-cell"><button type="button" className={`text-left text-ink ${alerte.statut === 'NOUVELLE' ? 'font-semibold' : 'font-medium'}`}>{alerte.nomCompletAgent ?? '—'}</button>{alerte.details && <div className="text-[12px] text-[#9CA0AC]">{alerte.details}</div>}</td>
            <td className="table-cell"><Badge tone={alerte.type === 'ANOMALIE' ? 'warning' : 'neutral'}>{TYPE_LABELS[alerte.type]}</Badge></td>
            {changeDeGrade(alerte.type) ? <><td className="table-cell border-l border-[#EAEBF0]"><CelluleDerniereSituation grade={alerte.gradeActuel} dateEffet={alerte.dateEffetActuelle} /></td><td className="table-cell border-l border-[#EAEBF0] bg-accent-light/30"><CelluleNouvelleSituation gradeSuivant={alerte.gradeSuivant} dateEffet={alerte.dateEcheance} /></td></> : <><td className="table-cell border-l border-[#EAEBF0]" /><td className="table-cell border-l border-[#EAEBF0]" /></>}
            <td className="table-cell whitespace-nowrap text-[#4B4F5A]">{formatDate(alerte.datePreparation)}</td>
            <td className="table-cell"><EcheanceAlerte alerte={alerte} /></td>
            <td className="table-cell whitespace-nowrap text-[#4B4F5A]">{formatDate(alerte.dateDetection)}</td>
            <td className="table-cell"><StatutAlerteBadge statut={alerte.statut} /></td>
          </tr>)}</tbody>
        </table></div>
        <Pagination page={data.number} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} disabled={isLoading} />
      </div>
    ) : null}
    <AlerteDetailModal alerte={selection} erreurConsultation={erreurConsult} onClose={fermer} onAcquittee={apresAcquittement} onObsolete={resynchroniser} />
  </div>
}
