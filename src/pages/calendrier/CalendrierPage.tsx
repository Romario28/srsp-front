import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { useCalendrierCache } from '@/hooks/useCalendrierCache'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Spinner } from '@/components/ui/Spinner'
import {
  CATEGORIES, CATEGORIE_INFO, agregerParJour, comptesParMois, pastilles, prefixeMois, titrePeriode, totauxPeriode,
  type VueCalendrier,
} from '@/utils/calendrier'
import { VueMois } from './VueMois'
import { VueAnnee } from './VueAnnee'
import { JourModal } from './JourModal'
import type { CritereDate } from '@/types/anticipation'
import type { CategorieCalendrier } from '@/types/calendrier'

const VUES: { value: VueCalendrier; label: string }[] = [
  { value: 'MOIS', label: 'Mois' },
  { value: 'ANNEE', label: 'Année' },
]
const CRITERES: { value: CritereDate; label: string }[] = [
  { value: 'PREPARATION', label: 'Préparation' },
  { value: 'ECHEANCE', label: 'Échéance' },
]
const tousLesTypes = (): ReadonlySet<CategorieCalendrier> => new Set(CATEGORIES)

export function CalendrierPage() {
  const maintenant = new Date()
  const [vue, setVue] = useState<VueCalendrier>('MOIS')
  const [annee, setAnnee] = useState(maintenant.getFullYear())
  const [mois, setMois] = useState(maintenant.getMonth())
  const [critere, setCritere] = useState<CritereDate>('PREPARATION')
  const [actifs, setActifs] = useState<ReadonlySet<CategorieCalendrier>>(tousLesTypes)
  const [jour, setJour] = useState<string | null>(null)

  // Vue, critère et légende ne rappellent jamais le serveur : tout est dérivé du cache par année
  const { parAnnee, isLoading, error, chargeLe, reessayer, actualiser, chargerDetail, detailEnCache } = useCalendrierCache(annee)

  const parJourTous = useMemo(() => agregerParJour(parAnnee, critere), [parAnnee, critere])
  const parJour = useMemo(() => pastilles(parJourTous, actifs), [parJourTous, actifs])
  const comptes = useMemo(() => comptesParMois(parJourTous, annee, actifs), [parJourTous, annee, actifs])
  const prefixe = vue === 'ANNEE' ? String(annee) : prefixeMois(annee, mois)
  const totaux = useMemo(() => totauxPeriode(parJourTous, prefixe), [parJourTous, prefixe])

  const deplacer = (delta: number) => {
    if (vue === 'ANNEE') {
      setAnnee((a) => a + delta)
    } else {
      const d = new Date(annee, mois + delta, 1)
      setAnnee(d.getFullYear())
      setMois(d.getMonth())
    }
  }
  const versAujourdhui = () => {
    const n = new Date()
    setAnnee(n.getFullYear())
    setMois(n.getMonth())
  }
  const surPeriodeCourante = annee === maintenant.getFullYear() && (vue === 'ANNEE' || mois === maintenant.getMonth())

  const basculer = (categorie: CategorieCalendrier) =>
    setActifs((courants) => {
      const suivants = new Set(courants)
      if (!suivants.delete(categorie)) suivants.add(categorie)
      return suivants
    })

  const ouvrirMois = (m: number) => { setMois(m); setVue('MOIS') }
  const heure = chargeLe != null
    ? new Date(chargeLe).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[20px] font-semibold text-ink">Calendrier des échéances</h1>
        <p className="mt-0.5 max-w-3xl text-[13px] text-[#6B7180]">
          Agents en activité, jour par jour. Chaque pastille compte les agents d&apos;un type ce jour-là : cliquez un jour pour les lister.
          Les anomalies n&apos;apparaissent pas, faute de date.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" aria-label={vue === 'ANNEE' ? 'Année précédente' : 'Mois précédent'} onClick={() => deplacer(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" aria-label={vue === 'ANNEE' ? 'Année suivante' : 'Mois suivant'} onClick={() => deplacer(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="min-w-[10rem] px-2 font-display text-[17px] font-semibold text-ink">{titrePeriode(vue, annee, mois)}</h2>
          <Button variant="ghost" size="sm" onClick={versAujourdhui} disabled={surPeriodeCourante}>Aujourd&apos;hui</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {heure && <span className="text-[12px] text-[#9CA0AC]">Calculé à {heure}</span>}
          <Button variant="secondary" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={actualiser} disabled={isLoading}>
            Actualiser
          </Button>
          <SegmentedControl options={VUES} value={vue} onChange={setVue} ariaLabel="Vue du calendrier" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-ink">Afficher :</span>
          <SegmentedControl options={CRITERES} value={critere} onChange={setCritere} ariaLabel="Date affichée sur le calendrier" />
        </div>
        <p className="text-[12.5px] text-[#6B7180]">
          {critere === 'PREPARATION'
            ? 'Date à partir de laquelle le dossier peut être constitué (échéance − délai de préparation du type).'
            : "Date effective de l'événement : retraite, avancement, titularisation, fin de contrat."}
        </p>
      </div>

      <div role="group" aria-label="Types d'échéance affichés" className="flex flex-wrap gap-2">
        {CATEGORIES.map((categorie) => {
          const actif = actifs.has(categorie)
          return (
            <button
              key={categorie} type="button" aria-pressed={actif} onClick={() => basculer(categorie)}
              className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-[13px] font-medium transition-colors hover:border-accent ${
                actif ? 'border-[#DADCE3] bg-white text-ink' : 'border-dashed border-[#DADCE3] bg-transparent text-[#9CA0AC]'
              }`}
            >
              <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${actif ? CATEGORIE_INFO[categorie].point : 'border border-[#9CA0AC]'}`} />
              {CATEGORIE_INFO[categorie].label}
              <span className="rounded-full bg-[#EAEBF0] px-1.5 text-[11px] tabular-nums text-[#4B4F5A]">{totaux[categorie]}</span>
            </button>
          )
        })}
      </div>

      {error && (
        <div className="flex flex-col items-start gap-2">
          <ErrorBanner message={error} />
          <Button variant="secondary" size="sm" onClick={reessayer}>Réessayer</Button>
        </div>
      )}

      {isLoading ? <Spinner label="Calcul des échéances…" /> : !error ? (
        vue === 'MOIS'
          ? <VueMois annee={annee} mois={mois} parJour={parJour} onJour={setJour} />
          : <VueAnnee annee={annee} comptes={comptes} actifs={actifs} onMois={ouvrirMois} />
      ) : null}

      <JourModal
        jour={jour} critere={critere} actifs={actifs}
        chargerDetail={chargerDetail} detailEnCache={detailEnCache}
        onClose={() => setJour(null)}
      />
    </div>
  )
}
