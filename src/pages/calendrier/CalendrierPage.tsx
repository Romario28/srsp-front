import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, RefreshCw } from 'lucide-react'
import { useCalendrierCache } from '@/hooks/useCalendrierCache'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Spinner } from '@/components/ui/Spinner'
import { FiltresAgentsBar } from '@/components/FiltresAgentsBar'
import { BoutonExport } from '@/components/BoutonExport'
import {
  CATEGORIES, CATEGORIE_INFO, agregerParJour, clePortee, comptesParMois, effectifsDuMois, pastilles, pastillesDe,
  bornesExport, jourCourtAnnee, prefixeMois, titrePeriode, totauxPeriode, versIso, type Portee, type VueCalendrier,
} from '@/utils/calendrier'
import { FILTRES_VIDES, cleFiltres } from '@/utils/filtresAgents'
import { EcheanceDetailModal } from '@/pages/anticipation/EcheanceDetailModal'
import { VueMois } from './VueMois'
import { VueAnnee } from './VueAnnee'
import { DetailJour } from './DetailJour'
import { EffectifsMois } from './EffectifsMois'
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
const MODES: { value: ModeListe; label: string }[] = [
  { value: 'JOUR', label: 'Jour' },
  { value: 'MOIS', label: 'Mois' },
]
const tousLesTypes = (): ReadonlySet<CategorieCalendrier> => new Set(CATEGORIES)

export function CalendrierPage() {
  const maintenant = new Date()
  const [vue, setVue] = useState<VueCalendrier>('MOIS')
  const [annee, setAnnee] = useState(maintenant.getFullYear())
  const [mois, setMois] = useState(maintenant.getMonth())            // 0-11
  const [critere, setCritere] = useState<CritereDate>('PREPARATION')  // par défaut : préparation
  const [actifs, setActifs] = useState<ReadonlySet<CategorieCalendrier>>(tousLesTypes)
  // null = pleine largeur ; sinon disposition en deux zones (calendrier réduit + tableau des agents)
  const [detail, setDetail] = useState<Detail | null>(null)
  // Échéance dont la fiche complète est ouverte : une seule modale pour toute la page
  const [fiche, setFiche] = useState<AlerteAnticipation | null>(null)
  const [filtres, setFiltres] = useState<FiltresAgents>(FILTRES_VIDES)

  const modeListe: ModeListe = detail?.mode ?? 'JOUR'
  // Date marquée dans le calendrier et les effectifs : seulement en mode Jour
  const jourChoisi = detail?.mode === 'JOUR' ? detail.iso : null
  // Ce que listent la zone de droite et le bloc de détail : le jour choisi, ou le mois affiché
  const portee: Portee | null = detail == null ? null
    : detail.mode === 'JOUR' ? { genre: 'JOUR', iso: detail.iso } : { genre: 'MOIS', annee, mois }

  // Vue, critères et légende ne rappellent jamais le serveur : tout est dérivé du cache par année
  const { parAnnee, isLoading, error, chargeLe, reessayer, actualiser, chargerDetail, detailEnCache } = useCalendrierCache(annee, filtres)

  const parJourTous = useMemo(() => agregerParJour(parAnnee, critere), [parAnnee, critere])
  const parJour = useMemo(() => pastilles(parJourTous, actifs), [parJourTous, actifs])
  const comptes = useMemo(() => comptesParMois(parJourTous, annee, actifs), [parJourTous, annee, actifs])

  // Compteurs de la légende : le jour choisi en mode Jour, sinon le mois affiché (l'année en vue Année).
  // Une date complète sert de préfixe : seule cette date correspond.
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

  /**
   * Navigation entre mois : si les deux zones sont ouvertes, on passe en mode Mois sur le nouveau mois
   * et la date précédente est effacée. En pleine largeur, il n'y a rien à basculer : on ne les ouvre pas.
   */
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
  // Grisé seulement s'il n'y a rien à changer : en mode Jour, il sert aussi à revenir au mois entier
  const surPeriodeCourante = annee === maintenant.getFullYear() && (vue === 'ANNEE' || mois === maintenant.getMonth())

  const basculer = (categorie: CategorieCalendrier) =>
    setActifs((courants) => {
      const suivants = new Set(courants)
      if (!suivants.delete(categorie)) suivants.add(categorie)
      return suivants
    })

  // Choisir une date, où qu'on clique (calendrier, effectifs), demande les agents de cette date : mode Jour
  const choisirJour = (iso: string) => setDetail({ mode: 'JOUR', iso })

  // Toggle Jour / Mois. Jour : sur aujourd'hui (et sur son mois, pour que la date soit dans la grille).
  const changerMode = (suivant: ModeListe) => {
    if (suivant === modeListe) return   // déjà dans ce mode : la date choisie ne bouge pas
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
    if (suivante === 'ANNEE') setDetail(null)   // la vue Année est un aperçu pleine largeur : pas de détail ouvert
  }
  const ouvrirMois = (m: number) => { setMois(m); setVue('MOIS') }
  const heure = chargeLe != null
    ? new Date(chargeLe).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[20px] font-semibold text-ink">Calendrier des échéances</h1>
        <p className="mt-0.5 max-w-3xl text-[13px] text-[#6B7180]">
          Agents en activité, jour par jour. Cliquez un jour pour lister ses agents ; cliquez un agent pour ouvrir sa fiche.
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
          <Button variant="ghost" size="sm" onClick={versMoisActuel} disabled={surPeriodeCourante && detail?.mode !== 'JOUR'}>
            Mois actuel
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {heure && <span className="text-[12px] text-[#9CA0AC]">Calculé à {heure}</span>}
          <BoutonExport ecran="calendrier" params={paramsExport} disabled={actifs.size === 0}
            title={actifs.size === 0 ? 'Aucun type affiché : rien à exporter' : `Exporter en Excel : ${perimetreExport}`} />
          <Button variant="secondary" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={actualiser} disabled={isLoading}>
            Actualiser
          </Button>
          <SegmentedControl options={VUES} value={vue} onChange={changerVue} ariaLabel="Vue du calendrier" />
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

      <FiltresAgentsBar valeur={filtres} onChange={setFiltres} />

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
              <span title={`Total ${periodeTotaux}`} className="rounded-full bg-[#EAEBF0] px-1.5 text-[11px] tabular-nums text-[#4B4F5A]">{totaux[categorie]}</span>
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
        vue === 'ANNEE' ? (
          <VueAnnee annee={annee} comptes={comptes} actifs={actifs} critere={critere} onMois={ouvrirMois} />
        ) : portee == null ? (
          <VueMois annee={annee} mois={mois} parJour={parJour} onJour={choisirJour} />
        ) : (
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
            {/* Colonne gauche : calendrier réduit, détail, effectifs. Hauteur naturelle, c'est la page qui défile. */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#6B7180]">Calendrier</p>
                <Button variant="secondary" size="sm" icon={<Maximize2 className="h-3.5 w-3.5" />} onClick={() => setDetail(null)}>
                  Agrandir
                </Button>
              </div>
              <SegmentedControl
                options={MODES} value={modeListe} onChange={changerMode}
                ariaLabel="Agents listés à droite : ceux du jour choisi ou ceux du mois"
              />
              {/* selection : null en mode Mois, aucune date n'est entourée */}
              <VueMois compact annee={annee} mois={mois} parJour={parJour} selection={jourChoisi} onJour={choisirJour} />
              <DetailJour
                portee={portee} critere={critere}
                pastilles={portee.genre === 'JOUR' ? parJour.get(portee.iso) ?? [] : pastillesDe(comptes[mois])}
              />
              <EffectifsMois effectifs={effectifs} critere={critere} selection={jourChoisi} onJour={choisirJour} />
            </div>
            {/* key : un autre jour, un autre mois ou un autre critère repart d'un panneau neuf, jamais d'une liste périmée */}
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
