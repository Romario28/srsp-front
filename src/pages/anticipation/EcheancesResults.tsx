import { Fragment, useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { ChampRecherche } from '@/components/ui/ChampRecherche'
import { DossierBadge } from '@/components/DossierBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { formatDate } from '@/utils/date'
import { changeDeGrade, cleStatut, grouperParStatut, libelleEcheance, toneDelai, type FiltreStatut } from '@/utils/anticipation'
import { correspond } from '@/utils/recherche'
import type { AlerteAnticipation, TypeAnticipation } from '@/types/anticipation'
import { CelluleDerniereSituation, CelluleNouvelleSituation } from './SituationsGrade'
import { Age, DateRetraite } from './DatesCarriere'
import { EcheanceDetailModal } from './EcheanceDetailModal'

const TAILLE_PAGE = 50
function corpsGrade(alerte: AlerteAnticipation): string {
  if (alerte.corpsCode == null && alerte.gradeCode == null) return '—'
  return [alerte.corpsCode, alerte.categorieCode, alerte.gradeCode].map((value) => value ?? '—').join(' / ')
}

export function EcheancesResults({ items, type }: { items: AlerteAnticipation[]; type: TypeAnticipation }) {
  const estAnomalie = type === 'ANOMALIE'
  const [recherche, setRecherche] = useState('')
  // matricule, nom ou prénoms (nomComplet = « prénoms nom »), sans tenir compte de la casse ni des accents
  const trouves = useMemo(() => items.filter((item) => correspond(recherche, item.matricule, item.nomComplet)), [items, recherche])
  const groupes = useMemo(() => grouperParStatut(trouves).filter((groupe) => groupe.items.length > 0), [trouves])
  const [filtre, setFiltre] = useState<FiltreStatut>('TOUS')
  const [page, setPage] = useState(0)
  // Nouveaux résultats : retour en haut de liste ; la recherche et l'onglet de statut sont conservés
  useEffect(() => { setPage(0) }, [items])
  const [selection, setSelection] = useState<AlerteAnticipation | null>(null)
  if (items.length === 0) return <EmptyState title={estAnomalie ? 'Aucune anomalie' : 'Aucune échéance dans cette fenêtre'} description={estAnomalie ? 'Le calcul est possible pour tous les agents en activité.' : "Élargissez la fenêtre ou l'intervalle de dates."} />

  const options: { value: FiltreStatut; label: string; count: number }[] = [
    { value: 'TOUS', label: 'Tous', count: trouves.length },
    ...groupes.map((groupe) => ({ value: cleStatut(groupe.statut), label: groupe.label, count: groupe.items.length })),
  ]
  const filtreActif: FiltreStatut = options.some((option) => option.value === filtre) ? filtre : 'TOUS'
  const visibles = filtreActif === 'TOUS' ? groupes : groupes.filter((groupe) => cleStatut(groupe.statut) === filtreActif)
  const lignes = visibles.flatMap((groupe) => groupe.items.map((item) => ({ groupe, item })))
  const totalPages = Math.max(1, Math.ceil(lignes.length / TAILLE_PAGE))
  const pageCourante = Math.min(page, totalPages - 1)
  const debut = pageCourante * TAILLE_PAGE
  const tranche = lignes.slice(debut, debut + TAILLE_PAGE)
  const estRetraite = type === 'DEPART_RETRAITE'
  const estFinContrat = type === 'FIN_CONTRAT'
  const estIntegration = type === 'INTEGRATION'
  const afficheSituations = changeDeGrade(type)
  const nbColonnes = 3 + (estRetraite ? 2 : 0) + (estFinContrat || estIntegration ? 1 : 0) + (afficheSituations ? 2 : 0) + (estAnomalie ? 1 : 4)
  const changerRecherche = (valeur: string) => { setRecherche(valeur); setPage(0) }
  const rechercheActive = recherche.trim() !== ''

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <ChampRecherche valeur={recherche} onChange={changerRecherche} className="w-full max-w-sm"
          ariaLabel="Rechercher un agent par matricule, nom ou prénoms" placeholder="Matricule, nom ou prénoms…" />
        {rechercheActive && <span className="text-[12.5px] text-[#6B7180]">{trouves.length} résultat{trouves.length > 1 ? 's' : ''} sur {items.length}</span>}
      </div>
      {groupes.length > 1 && <SegmentedControl options={options} value={filtreActif} ariaLabel="Filtrer par statut d'agent" onChange={(value) => { setFiltre(value); setPage(0) }} />}
      {lignes.length === 0 ? (
        <EmptyState icon={Search} title="Aucun résultat" description={`Aucun agent ne correspond à « ${recherche.trim()} ».`} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E4E6EB] bg-white"><table className="w-full">
          <thead className="border-b border-[#EAEBF0] bg-[#FAFAFB]"><tr>
            <th className="table-head-cell">Matricule</th><th className="table-head-cell">Agent</th><th className="table-head-cell">Corps / cat. / grade</th>
            {estRetraite && <><th className="table-head-cell">Date de naissance</th><th className="table-head-cell">Âge</th></>}
            {(estFinContrat || estIntegration) && <th className="table-head-cell">{estIntegration ? 'Début de contrat' : 'Date de début'}</th>}
            {afficheSituations && <><th className="table-head-cell border-l border-[#EAEBF0]">Dernière situation</th><th className="table-head-cell border-l border-[#EAEBF0]">Nouvelle situation</th></>}
            {estAnomalie ? <th className="table-head-cell">Raison</th> : <><th className="table-head-cell">Préparation dès le</th><th className="table-head-cell">{estRetraite ? 'Date de retraite' : estFinContrat ? 'Date de fin' : estIntegration ? "Date d'intégration" : 'Échéance'}</th><th className="table-head-cell">{estFinContrat ? 'Durée restante' : 'Délai'}</th><th className="table-head-cell">Dossier</th></>}
          </tr></thead>
          <tbody className="divide-y divide-[#EAEBF0]">{tranche.map(({ groupe, item }, index) => {
            const premier = index === 0 || tranche[index - 1].groupe !== groupe
            return <Fragment key={`${debut + index}-${item.matricule}`}>
              {premier && <tr className="bg-[#FAFAFB]"><td colSpan={nbColonnes} className="px-4 py-2 text-[12px] font-semibold text-ink">{groupe.label}<span className="ml-2 font-normal text-[#9CA0AC]">{groupe.items.length}</span></td></tr>}
              <tr onClick={() => setSelection(item)} className="cursor-pointer hover:bg-[#FAFAFB]">
                <td className="table-cell font-mono text-[12.5px] text-[#4B4F5A]">{item.matricule}</td>
                <td className="table-cell"><button type="button" aria-label={`Ouvrir la fiche de ${item.nomComplet}`} className="text-left font-medium text-ink">{item.nomComplet}</button>{!estAnomalie && item.details && <div className="text-[12px] text-[#9CA0AC]">{item.details}</div>}</td>
                <td className="table-cell font-mono text-[12.5px] text-[#4B4F5A]">{corpsGrade(item)}</td>
                {estRetraite && <><td className="table-cell whitespace-nowrap text-[#4B4F5A]">{formatDate(item.dateNaissance)}</td><td className="table-cell whitespace-nowrap text-[#4B4F5A]"><Age naissance={item.dateNaissance} /></td></>}
                {(estFinContrat || estIntegration) && <td className="table-cell whitespace-nowrap text-[#4B4F5A]">{formatDate(item.dateDebutContrat)}</td>}
                {afficheSituations && <><td className="table-cell border-l border-[#EAEBF0]"><CelluleDerniereSituation grade={item.gradeCode} dateEffet={item.avanceDate ?? item.dateDebutContrat} /></td><td className="table-cell border-l border-[#EAEBF0] bg-accent-light/30"><CelluleNouvelleSituation gradeSuivant={item.gradeSuivant} dateEffet={item.dateEcheance} /></td></>}
                {estAnomalie ? <td className="table-cell text-[#4B4F5A]">{item.details ?? '—'}</td> : <><td className="table-cell whitespace-nowrap text-[#4B4F5A]">{formatDate(item.datePreparation)}</td><td className="table-cell whitespace-nowrap text-[#4B4F5A]">{estRetraite ? <DateRetraite dateEcheance={item.dateEcheance} naissance={item.dateNaissance} /> : formatDate(item.dateEcheance)}</td><td className="table-cell"><Badge tone={toneDelai(item.joursRestants)}>{libelleEcheance(item.joursRestants)}</Badge></td><td className="table-cell"><DossierBadge etat={item.dossier} matricule={item.matricule} type={item.type} dateEcheance={item.dateEcheance} /></td></>}
              </tr>
            </Fragment>
          })}</tbody>
        </table></div>
      )}
      <Pagination page={pageCourante} totalPages={totalPages} totalElements={lignes.length} onPageChange={setPage} />
      <EcheanceDetailModal item={selection} onClose={() => setSelection(null)} />
    </div>
  )
}
