import { useMemo, type ReactNode } from 'react'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DossierBadge } from '@/components/DossierBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Spinner } from '@/components/ui/Spinner'
import { useFetch } from '@/hooks/useFetch'
import { formatDate } from '@/utils/date'
import { CATEGORIES, CATEGORIE_INFO, clePortee, jourLong, titrePeriode, type Portee } from '@/utils/calendrier'
import { Age } from '@/pages/anticipation/DatesCarriere'
import { CelluleDerniereSituation, CelluleNouvelleSituation } from '@/pages/anticipation/SituationsGrade'
import type { AlerteAnticipation, CritereDate } from '@/types/anticipation'
import type { CalendrierAgent, CategorieCalendrier } from '@/types/calendrier'

interface Colonne {
  titre: string
  /** Colonnes de situation : séparées par un filet, la « nouvelle » est teintée (comme dans les autres tableaux). */
  groupe?: 'derniere' | 'nouvelle'
  cellule: (e: AlerteAnticipation, critere: CritereDate) => ReactNode
}

/** La date qui place l'agent dans cette période est en évidence, l'autre en retrait. */
const date = (valeur: string | null, fort: boolean) => (
  <span className={`whitespace-nowrap ${fort ? 'font-medium text-ink' : ''}`}>{formatDate(valeur)}</span>
)

const NOM: Colonne = {
  titre: 'Nom',
  // Bouton : atteignable au clavier. Son clic remonte à la ligne, qui porte l'unique gestionnaire.
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
const DOSSIER: Colonne = { titre: 'Dossier', cellule: (e) => <DossierBadge etat={e.dossier} matricule={e.matricule} type={e.type} dateEcheance={e.dateEcheance} /> }
const SITUATIONS = [NOM, MATRICULE, PREPARATION, DERNIERE, NOUVELLE, DOSSIER]

/** Colonnes de chaque type. « Date de préparation » figure dans tous. ELD : comme Avancement. */
const COLONNES: Record<CategorieCalendrier, Colonne[]> = {
  DEPART_RETRAITE: [
    NOM, MATRICULE,
    { titre: 'Âge', cellule: (e) => <Age naissance={e.dateNaissance} /> },
    PREPARATION,
    { titre: "Date d'échéance", cellule: (e, critere) => date(e.dateEcheance, critere === 'ECHEANCE') },
    DOSSIER,
  ],
  AVANCEMENT: SITUATIONS,
  ELD: SITUATIONS,
  TITULARISATION: SITUATIONS,
  FIN_CONTRAT: [
    NOM, MATRICULE, PREPARATION,
    { titre: 'Date de début', cellule: (e) => date(e.dateDebutContrat, false) },
    { titre: 'Date de fin', cellule: (e, critere) => date(e.dateEcheance, critere === 'ECHEANCE') },
    DOSSIER,
  ],
  INTEGRATION: [
    NOM, MATRICULE, PREPARATION,
    { titre: 'Date de début', cellule: (e) => date(e.dateDebutContrat, false) },
    { titre: "Date d'intégration", cellule: (e, critere) => date(e.dateEcheance, critere === 'ECHEANCE') },
    DOSSIER,
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
            {/* Un agent n'a qu'une échéance par type : le matricule est unique dans un groupe, sur un jour comme sur un mois */}
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
  portee: Portee
  critere: CritereDate
  actifs: ReadonlySet<CategorieCalendrier>
  /** Détail d'un jour ou d'un mois : réutilisé tant qu'il est récent, sinon rechargé (cache de la page). */
  chargerDetail: (portee: Portee, critere: CritereDate) => Promise<readonly CalendrierAgent[]>
  /** Lecture synchrone du même cache : la liste s'affiche sans passer par « Chargement… ». */
  detailEnCache: (portee: Portee, critere: CritereDate) => readonly CalendrierAgent[] | undefined
  /** Ouvre la fiche complète : la modale est unique, elle vit dans la page. */
  onSelect: (echeance: AlerteAnticipation) => void
}

export function PanneauJour({ portee, critere, actifs, chargerDetail, detailEnCache, onSelect }: PanneauJourProps) {
  const enCache = detailEnCache(portee, critere)
  // Cache frais : la promesse est déjà résolue, aucune requête ne part
  const { data, isLoading, error, reload } = useFetch(() => chargerDetail(portee, critere), [clePortee(portee), critere])
  const agents = data ?? enCache
  const lignes = useMemo(() => (agents ?? []).filter((l) => actifs.has(l.categorie)), [agents, actifs])
  const groupes = CATEGORIES
    .map((categorie) => ({ categorie, items: lignes.filter((l) => l.categorie === categorie) }))
    .filter((g) => g.items.length > 0)
  const nbAgents = lignes.length   // une ligne = un agent pour un type : même unité que les groupes et « Effectifs du mois »
  const nbDistincts = new Set(lignes.map((l) => l.echeance.matricule)).size

  const titre = portee.genre === 'JOUR' ? jourLong(portee.iso) : titrePeriode('MOIS', portee.annee, portee.mois)
  const quand = portee.genre === 'JOUR' ? 'ce jour' : 'ce mois'

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-xl border border-[#E4E6EB] bg-white p-5">
      <header>
        <h3 className="font-display text-[16px] font-semibold text-ink">{titre}</h3>
        {lignes.length > 0 && (
          <p className="mt-0.5 text-[12.5px] text-[#6B7180]">
            <span className="font-medium text-ink">{nbAgents} agent{nbAgents > 1 ? 's' : ''} concerné{nbAgents > 1 ? 's' : ''}</span>
            {nbDistincts < nbAgents && (
              <span title="Un agent qui a plusieurs échéances sur la période (par exemple un avancement et une fin de contrat) figure dans chaque groupe concerné.">
                {' '}({nbDistincts} distinct{nbDistincts > 1 ? 's' : ''})
              </span>
            )}
            {' '}· placés {quand} selon leur date de {critere === 'PREPARATION' ? 'préparation' : "d'échéance"}
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
        <Spinner label="Chargement des agents…" />
      ) : lignes.length === 0 ? (
        <EmptyState icon={Users} title={`Aucune échéance ${quand}`} description="Aucun agent ne correspond aux types affichés." />
      ) : (
        groupes.map((g) => (
          <Groupe key={g.categorie} categorie={g.categorie} lignes={g.items} critere={critere} onSelect={onSelect} />
        ))
      )}
    </section>
  )
}
