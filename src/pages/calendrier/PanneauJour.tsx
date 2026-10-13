import { useMemo, type ReactNode } from 'react'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Spinner } from '@/components/ui/Spinner'
import { useFetch } from '@/hooks/useFetch'
import { formatDate } from '@/utils/date'
import { CATEGORIES, CATEGORIE_INFO, jourLong } from '@/utils/calendrier'
import { Age } from '@/pages/anticipation/DatesCarriere'
import { CelluleDerniereSituation, CelluleNouvelleSituation } from '@/pages/anticipation/SituationsGrade'
import type { AlerteAnticipation, CritereDate } from '@/types/anticipation'
import type { CalendrierAgent, CategorieCalendrier } from '@/types/calendrier'

interface Colonne {
  titre: string
  groupe?: 'derniere' | 'nouvelle'
  cellule: (e: AlerteAnticipation, critere: CritereDate) => ReactNode
}

const date = (valeur: string | null, fort: boolean) => (
  <span className={`whitespace-nowrap ${fort ? 'font-medium text-ink' : ''}`}>{formatDate(valeur)}</span>
)

const NOM: Colonne = {
  titre: 'Nom',
  cellule: (e) => (
    <button type="button" aria-label={`Ouvrir la fiche de ${e.nomComplet}`} className="text-left font-medium text-ink">
      {e.nomComplet}
    </button>
  ),
}
const MATRICULE: Colonne = { titre: 'Matricule', cellule: (e) => <span className="font-mono text-[12.5px]">{e.matricule}</span> }
const PREPARATION: Colonne = {
  titre: 'Date de préparation',
  cellule: (e, critere) => date(e.datePreparation, critere === 'PREPARATION'),
}
const DERNIERE: Colonne = {
  titre: 'Dernière situation', groupe: 'derniere',
  cellule: (e) => <CelluleDerniereSituation grade={e.gradeCode} dateEffet={e.avanceDate ?? e.dateDebutContrat} />,
}
const NOUVELLE: Colonne = {
  titre: 'Nouvelle situation', groupe: 'nouvelle',
  cellule: (e) => <CelluleNouvelleSituation gradeSuivant={e.gradeSuivant} dateEffet={e.dateEcheance} />,
}
const SITUATIONS = [NOM, MATRICULE, PREPARATION, DERNIERE, NOUVELLE]

const COLONNES: Record<CategorieCalendrier, Colonne[]> = {
  DEPART_RETRAITE: [
    NOM, MATRICULE,
    { titre: 'Âge', cellule: (e) => <Age naissance={e.dateNaissance} /> },
    PREPARATION,
    { titre: "Date d'échéance", cellule: (e, critere) => date(e.dateEcheance, critere === 'ECHEANCE') },
  ],
  AVANCEMENT: SITUATIONS,
  ELD: SITUATIONS,
  TITULARISATION: SITUATIONS,
  FIN_CONTRAT: [
    NOM, MATRICULE, PREPARATION,
    { titre: 'Date de début', cellule: (e) => date(e.dateDebutContrat, false) },
    { titre: 'Date de fin', cellule: (e, critere) => date(e.dateEcheance, critere === 'ECHEANCE') },
  ],
}

function Groupe({ categorie, lignes, critere, onSelect }: {
  categorie: CategorieCalendrier
  lignes: CalendrierAgent[]
  critere: CritereDate
  onSelect: (echeance: AlerteAnticipation) => void
}) {
  const colonnes = COLONNES[categorie]
  return (
    <section className="flex flex-col gap-2">
      <h4 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
        <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${CATEGORIE_INFO[categorie].point}`} />
        {CATEGORIE_INFO[categorie].label}
        <span className="font-normal text-[#9CA0AC]">{lignes.length}</span>
      </h4>
      <div className="overflow-x-auto rounded-lg border border-[#E4E6EB]">
        <table className="w-full">
          <thead className="border-b border-[#EAEBF0] bg-[#FAFAFB]">
            <tr>
              {colonnes.map((c) => (
                <th key={c.titre} className={`table-head-cell ${c.groupe ? 'border-l border-[#EAEBF0]' : ''}`}>{c.titre}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAEBF0]">
            {lignes.map(({ echeance }) => (
              <tr key={echeance.matricule} onClick={() => onSelect(echeance)} className="cursor-pointer hover:bg-[#FAFAFB]">
                {colonnes.map((c) => (
                  <td
                    key={c.titre}
                    className={`table-cell text-[#4B4F5A] ${c.groupe ? 'border-l border-[#EAEBF0]' : ''} ${c.groupe === 'nouvelle' ? 'bg-accent-light/30' : ''}`}
                  >
                    {c.cellule(echeance, critere)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

interface PanneauJourProps {
  jour: string
  critere: CritereDate
  actifs: ReadonlySet<CategorieCalendrier>
  chargerDetail: (jour: string, critere: CritereDate) => Promise<readonly CalendrierAgent[]>
  detailEnCache: (jour: string, critere: CritereDate) => readonly CalendrierAgent[] | undefined
  onSelect: (echeance: AlerteAnticipation) => void
}

export function PanneauJour({ jour, critere, actifs, chargerDetail, detailEnCache, onSelect }: PanneauJourProps) {
  const enCache = detailEnCache(jour, critere)
  const { data, isLoading, error, reload } = useFetch(() => chargerDetail(jour, critere), [jour, critere])
  const agents = data ?? enCache
  const lignes = useMemo(() => (agents ?? []).filter((l) => actifs.has(l.categorie)), [agents, actifs])
  const groupes = CATEGORIES
    .map((categorie) => ({ categorie, items: lignes.filter((l) => l.categorie === categorie) }))
    .filter((g) => g.items.length > 0)
  const nbAgents = new Set(lignes.map((l) => l.echeance.matricule)).size

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-xl border border-[#E4E6EB] bg-white p-5">
      <header>
        <h3 className="font-display text-[16px] font-semibold text-ink">{jourLong(jour)}</h3>
        {lignes.length > 0 && (
          <p className="mt-0.5 text-[12.5px] text-[#6B7180]">
            <span className="font-medium text-ink">{nbAgents} agent{nbAgents > 1 ? 's' : ''} concerné{nbAgents > 1 ? 's' : ''}</span>
            {' '}· placés ce jour selon leur date de {critere === 'PREPARATION' ? 'préparation' : "d'échéance"}
            {' '}· cliquez une ligne pour ouvrir la fiche
          </p>
        )}
      </header>

      {error && !agents ? (
        <div className="flex flex-col items-start gap-2">
          <ErrorBanner message={error} />
          <Button variant="secondary" size="sm" onClick={reload}>Réessayer</Button>
        </div>
      ) : isLoading && !agents ? (
        <Spinner label="Chargement des agents..." />
      ) : lignes.length === 0 ? (
        <EmptyState icon={Users} title="Aucune échéance ce jour" description="Aucun agent ne correspond aux types affichés." />
      ) : (
        groupes.map((g) => (
          <Groupe key={g.categorie} categorie={g.categorie} lignes={g.items} critere={critere} onSelect={onSelect} />
        ))
      )}
    </section>
  )
}
