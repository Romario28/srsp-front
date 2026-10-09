import { Fragment, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { formatDate } from '@/utils/date'
import { changeDeGrade, cleStatut, grouperParStatut, libelleEcheance, toneDelai, type FiltreStatut } from '@/utils/anticipation'
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
  const groupes = useMemo(() => grouperParStatut(items).filter((groupe) => groupe.items.length > 0), [items])
  const [filtre, setFiltre] = useState<FiltreStatut>('TOUS')
  const [page, setPage] = useState(0)
  const [selection, setSelection] = useState<AlerteAnticipation | null>(null)
  if (items.length === 0) return <EmptyState title={estAnomalie ? 'Aucune anomalie' : 'Aucune échéance dans cette fenêtre'} description={estAnomalie ? 'Le calcul est possible pour tous les agents en activité.' : "Élargissez la fenêtre ou l'intervalle de dates."} />

  const options: { value: FiltreStatut; label: string; count: number }[] = [
    { value: 'TOUS', label: 'Tous', count: items.length },
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
  const afficheSituations = changeDeGrade(type)
  const nbColonnes = 3 + (estRetraite ? 2 : 0) + (estFinContrat ? 1 : 0) + (afficheSituations ? 2 : 0) + (estAnomalie ? 1 : 3)

  return (
    <div className="flex flex-col gap-3">
      {groupes.length > 1 && <SegmentedControl options={options} value={filtreActif} ariaLabel="Filtrer par statut d'agent" onChange={(value) => { setFiltre(value); setPage(0) }} />}
      <div className="overflow-x-auto rounded-xl border border-[#E4E6EB] bg-white"><table className="w-full">
        <thead className="border-b border-[#EAEBF0] bg-[#FAFAFB]"><tr>
          <th className="table-head-cell">Matricule</th><th className="table-head-cell">Agent</th><th className="table-head-cell">Corps / cat. / grade</th>
          {estRetraite && <><th className="table-head-cell">Date de naissance</th><th className="table-head-cell">Âge</th></>}
          {estFinContrat && <th className="table-head-cell">Date de début</th>}
          {afficheSituations && <><th className="table-head-cell border-l border-[#EAEBF0]">Dernière situation</th><th className="table-head-cell border-l border-[#EAEBF0]">Nouvelle situation</th></>}
          {estAnomalie ? <th className="table-head-cell">Raison</th> : <><th className="table-head-cell">Préparation dès le</th><th className="table-head-cell">{estRetraite ? 'Date de retraite' : estFinContrat ? 'Date de fin' : 'Échéance'}</th><th className="table-head-cell">{estFinContrat ? 'Durée restante' : 'Délai'}</th></>}
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
              {estFinContrat && <td className="table-cell whitespace-nowrap text-[#4B4F5A]">{formatDate(item.dateDebutContrat)}</td>}
              {afficheSituations && <><td className="table-cell border-l border-[#EAEBF0]"><CelluleDerniereSituation grade={item.gradeCode} dateEffet={item.avanceDate ?? item.dateDebutContrat} /></td><td className="table-cell border-l border-[#EAEBF0] bg-accent-light/30"><CelluleNouvelleSituation gradeSuivant={item.gradeSuivant} dateEffet={item.dateEcheance} /></td></>}
              {estAnomalie ? <td className="table-cell text-[#4B4F5A]">{item.details ?? '—'}</td> : <><td className="table-cell whitespace-nowrap text-[#4B4F5A]">{formatDate(item.datePreparation)}</td><td className="table-cell whitespace-nowrap text-[#4B4F5A]">{estRetraite ? <DateRetraite dateEcheance={item.dateEcheance} naissance={item.dateNaissance} /> : formatDate(item.dateEcheance)}</td><td className="table-cell"><Badge tone={toneDelai(item.joursRestants)}>{libelleEcheance(item.joursRestants)}</Badge></td></>}
            </tr>
          </Fragment>
        })}</tbody>
      </table></div>
      <Pagination page={pageCourante} totalPages={totalPages} totalElements={lignes.length} onPageChange={setPage} />
      <EcheanceDetailModal item={selection} onClose={() => setSelection(null)} />
    </div>
  )
}
