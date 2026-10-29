import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Info, Maximize2, RefreshCw } from 'lucide-react'
import { useCalendrierCache } from '@/hooks/useCalendrierCache'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Infobulle } from '@/components/ui/Infobulle'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Spinner } from '@/components/ui/Spinner'
import { BoutonExport } from '@/components/BoutonExport'
import {
  CATEGORIES, CATEGORIE_INFO, agregerParJour, clePortee, comptesParMois, effectifsDuMois, pastilles, pastillesDe,
  bornesExport, jourCourtAnnee, prefixeMois, titrePeriode, totauxPeriode, versIso, type Portee, type VueCalendrier,
} from '@/utils/calendrier'
import { cleFiltres, filtresDepuisUrl } from '@/utils/filtresAgents'
import { EcheanceDetailModal } from '@/pages/anticipation/EcheanceDetailModal'
import { MenuFiltres } from '@/pages/dossiers/MenuFiltres'
import { PastillesFiltres } from '@/pages/dossiers/PastillesFiltres'
import { VueMois } from './VueMois'
import { VueAnnee } from './VueAnnee'
import { DetailJour } from './DetailJour'
import { EffectifsMois } from './EffectifsMois'
import { BlocsDefilants } from './BlocsDefilants'
import { PanneauJour } from './PanneauJour'
import type { AlerteAnticipation, CritereDate, FiltresAgents } from '@/types/anticipation'
import type { CategorieCalendrier } from '@/types/calendrier'

type ModeListe = 'JOUR' | 'MOIS'
/** Deux zones ouvertes : les agents d'un jour précis, ou ceux du mois affiché (sans date attachée). */
type Detail = { mode: 'JOUR'; iso: string } | { mode: 'MOIS' }

const VUES: { value: VueCalendrier; label: string }[] = [
  { value: 'MOIS', label: 'Mois' },
  { value: 'ANNEE', label: 'Année' },
]
const CRITERES: { value: CritereDate; label: string }[] = [
  { value: 'PREPARATION', label: 'Préparation' },
  { value: 'ECHEANCE', label: 'Échéance' },
]
const AIDE_CRITERE: Record<CritereDate, string> = {
  PREPARATION: 'Date à partir de laquelle le dossier peut être constitué (échéance − délai de préparation du type).',
  ECHEANCE: "Date effective de l'événement : retraite, avancement, titularisation, fin de contrat.",
}
const MODES: { value: ModeListe; label: string }[] = [
  { value: 'JOUR', label: 'Jour' },
  { value: 'MOIS', label: 'Mois' },
]
const tousLesTypes = (): ReadonlySet<CategorieCalendrier> => new Set(CATEGORIES)

export function CalendrierPage() {
  const [params] = useSearchParams()
  const maintenant = new Date()
  const [vue, setVue] = useState<VueCalendrier>('MOIS')
  const [annee, setAnnee] = useState(maintenant.getFullYear())
  const [mois, setMois] = useState(maintenant.getMonth())
  const [critere, setCritere] = useState<CritereDate>(() => params.get('critere') === 'ECHEANCE' ? 'ECHEANCE' : 'PREPARATION')
  const [actifs, setActifs] = useState<ReadonlySet<CategorieCalendrier>>(tousLesTypes)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [fiche, setFiche] = useState<AlerteAnticipation | null>(null)
  const [filtres, setFiltres] = useState<FiltresAgents>(() => filtresDepuisUrl(params))

  const modeListe: ModeListe = detail?.mode ?? 'JOUR'
  const jourChoisi = detail?.mode === 'JOUR' ? detail.iso : null
  const portee: Portee | null = detail == null ? null
    : detail.mode === 'JOUR' ? { genre: 'JOUR', iso: detail.iso } : { genre: 'MOIS', annee, mois }

  const { parAnnee, isLoading, error, chargeLe, reessayer, actualiser, chargerDetail, detailEnCache } = useCalendrierCache(annee, filtres)

  const parJourTous = useMemo(() => agregerParJour(parAnnee, critere), [parAnnee, critere])
  const parJour = useMemo(() => pastilles(parJourTous, actifs), [parJourTous, actifs])
  const comptes = useMemo(() => comptesParMois(parJourTous, annee, actifs), [parJourTous, annee, actifs])

  const prefixe = vue === 'ANNEE' ? String(annee) : jourChoisi ?? prefixeMois(annee, mois)
  const periodeTotaux = vue === 'ANNEE' ? "de l'année" : jourChoisi ? 'du jour' : 'du mois'
  const totaux = useMemo(() => totauxPeriode(parJourTous, prefixe), [parJourTous, prefixe])
  const perimetreExport = vue === 'MOIS' && jourChoisi ? jourCourtAnnee(jourChoisi) : titrePeriode(vue, annee, mois)
  const paramsExport = {
    ...bornesExport(vue, annee, mois, jourChoisi),
    critereDate: critere,
    typesCalendrier: actifs.size === CATEGORIES.length ? undefined : Array.from(actifs).join(','),
    ...filtres,
  }
  const effectifs = useMemo(() => effectifsDuMois(parJour, prefixeMois(annee, mois)), [parJour, annee, mois])

  const allerAuMois = (a: number, m: number) => {
    setAnnee(a)
    setMois(m)
    setDetail((courant) => (courant == null ? null : { mode: 'MOIS' }))
  }
  const deplacer = (delta: number) => {
    if (vue === 'ANNEE') {
      setAnnee((a) => a + delta)
      return
    }
    const d = new Date(annee, mois + delta, 1)
    allerAuMois(d.getFullYear(), d.getMonth())
  }
  const versMoisActuel = () => {
    const n = new Date()
    allerAuMois(n.getFullYear(), n.getMonth())
  }
  const surPeriodeCourante = annee === maintenant.getFullYear() && (vue === 'ANNEE' || mois === maintenant.getMonth())

  const basculer = (categorie: CategorieCalendrier) =>
    setActifs((courants) => {
      const suivants = new Set(courants)
      if (!suivants.delete(categorie)) suivants.add(categorie)
      return suivants
    })

  const choisirJour = (iso: string) => setDetail({ mode: 'JOUR', iso })

  const changerMode = (suivant: ModeListe) => {
    if (suivant === modeListe) return
    if (suivant === 'MOIS') {
      setDetail({ mode: 'MOIS' })
      return
    }
    const n = new Date()
    setAnnee(n.getFullYear())
    setMois(n.getMonth())
    setDetail({ mode: 'JOUR', iso: versIso(n) })
  }

  const changerVue = (suivante: VueCalendrier) => {
    setVue(suivante)
    if (suivante === 'ANNEE') setDetail(null)
  }
  const ouvrirMois = (m: number) => { setMois(m); setVue('MOIS') }
  const heure = chargeLe != null
    ? new Date(chargeLe).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="flex flex-col gap-2.5 lg:h-[calc(100vh_-_7.5rem)] lg:min-h-[30rem]">
      <header className="flex flex-shrink-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <h1 className="font-display text-[20px] font-semibold text-ink">Calendrier des échéances</h1>
        <p className="text-[12.5px] text-[#6B7180]">
          Agents en activité, jour par jour. Cliquez un jour pour lister ses agents, puis un agent pour ouvrir sa fiche. Les anomalies n&apos;apparaissent pas, faute de date.
        </p>
      </header>

      <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-1.5">
          <Button variant="secondary" size="sm" aria-label={vue === 'ANNEE' ? 'Année précédente' : 'Mois précédent'} onClick={() => deplacer(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" aria-label={vue === 'ANNEE' ? 'Année suivante' : 'Mois suivant'} onClick={() => deplacer(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="min-w-[9rem] px-1.5 font-display text-[16px] font-semibold text-ink">{titrePeriode(vue, annee, mois)}</h2>
          <Button variant="ghost" size="sm" onClick={versMoisActuel} disabled={surPeriodeCourante && detail?.mode !== 'JOUR'}>
            Mois actuel
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {heure && <span className="text-[12px] text-[#9CA0AC]">Calculé à {heure}</span>}
          <BoutonExport ecran="calendrier" params={paramsExport} disabled={actifs.size === 0}
            title={actifs.size === 0 ? 'Aucun type affiché : rien à exporter' : `Exporter en Excel : ${perimetreExport}`} />
          <Button variant="secondary" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={actualiser} disabled={isLoading}>
            Actualiser
          </Button>
          <SegmentedControl options={VUES} value={vue} onChange={changerVue} ariaLabel="Vue du calendrier" />
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-medium text-ink">Afficher :</span>
          <SegmentedControl options={CRITERES} value={critere} onChange={setCritere} ariaLabel="Date affichée sur le calendrier" />
          <Infobulle align="gauche" etiquette="Aide : date affichée sur le calendrier" texte={AIDE_CRITERE[critere]}>
            <Info className="h-4 w-4 text-[#9CA0AC]" aria-hidden="true" />
          </Infobulle>
        </div>
        <MenuFiltres libelle="Filtres" valeur={filtres} onChange={setFiltres} />
        <PastillesFiltres valeur={filtres} onChange={setFiltres} />
      </div>

      <div role="group" aria-label="Types d'échéance affichés" className="flex flex-shrink-0 flex-wrap gap-1.5">
        {CATEGORIES.map((categorie) => {
          const actif = actifs.has(categorie)
          return (
            <button
              key={categorie} type="button" aria-pressed={actif} onClick={() => basculer(categorie)}
              className={`flex h-7 items-center gap-1.5 rounded-md border px-2 text-[12px] font-medium transition-colors hover:border-accent ${
                actif ? 'border-[#DADCE3] bg-white text-ink' : 'border-dashed border-[#DADCE3] bg-transparent text-[#9CA0AC]'
              }`}
            >
              <span aria-hidden="true" className={`h-2 w-2 rounded-full ${actif ? CATEGORIE_INFO[categorie].point : 'border border-[#9CA0AC]'}`} />
              {CATEGORIE_INFO[categorie].label}
              <span title={`Total ${periodeTotaux}`} className="rounded-full bg-[#EAEBF0] px-1.5 text-[10.5px] leading-4 tabular-nums text-[#4B4F5A]">{totaux[categorie]}</span>
            </button>
          )
        })}
      </div>

      {error && (
        <div className="flex flex-shrink-0 flex-col items-start gap-2">
          <ErrorBanner message={error} />
          <Button variant="secondary" size="sm" onClick={reessayer}>Réessayer</Button>
        </div>
      )}

      {isLoading ? <Spinner label="Calcul des échéances…" /> : !error ? (
        vue === 'ANNEE' ? (
          <div className="min-h-0 flex-1 lg:overflow-y-auto">
            <VueAnnee annee={annee} comptes={comptes} actifs={actifs} critere={critere} onMois={ouvrirMois} />
          </div>
        ) : portee == null ? (
          <div className="min-h-0 flex-1 lg:overflow-y-auto">
            <VueMois annee={annee} mois={mois} parJour={parJour} onJour={choisirJour} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-2 lg:min-h-0">
              <div className="flex flex-shrink-0 items-center justify-between gap-2">
                <SegmentedControl
                  options={MODES} value={modeListe} onChange={changerMode}
                  ariaLabel="Agents listés à droite : ceux du jour choisi ou ceux du mois"
                />
                <Button variant="secondary" size="sm" icon={<Maximize2 className="h-3.5 w-3.5" />} onClick={() => setDetail(null)}>
                  Agrandir
                </Button>
              </div>
              <BlocsDefilants
                ariaLabel="Blocs de gauche : calendrier et effectifs du mois"
                blocs={[
                  {
                    cle: 'calendrier', titre: 'Calendrier',
                    contenu: <>
                      <div className="flex-shrink-0">
                        <VueMois compact annee={annee} mois={mois} parJour={parJour} selection={jourChoisi} onJour={choisirJour} />
                      </div>
                      <div className="flex-shrink-0">
                        <DetailJour
                          portee={portee} critere={critere}
                          pastilles={portee.genre === 'JOUR' ? parJour.get(portee.iso) ?? [] : pastillesDe(comptes[mois])}
                        />
                      </div>
                    </>,
                  },
                  {
                    cle: 'effectifs', titre: 'Effectifs du mois',
                    contenu: <EffectifsMois effectifs={effectifs} critere={critere} selection={jourChoisi} onJour={choisirJour} />,
                  },
                ]}
              />
            </div>
            <PanneauJour
              key={`${clePortee(portee)}|${critere}|${cleFiltres(filtres)}`} portee={portee} critere={critere} actifs={actifs}
              chargerDetail={chargerDetail} detailEnCache={detailEnCache} onSelect={setFiche}
            />
          </div>
        )
      ) : null}

      <EcheanceDetailModal item={fiche} onClose={() => setFiche(null)} />
    </div>
  )
}
