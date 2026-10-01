import { Fragment, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { formatDate } from '@/utils/date'
import { cleStatut, grouperParStatut, libelleEcheance, toneDelai, type FiltreStatut } from '@/utils/anticipation'
import type { AlerteAnticipation, TypeAnticipation } from '@/types/anticipation'

const TAILLE_PAGE = 50
function enteteSource(type: TypeAnticipation): string | null {
  if (type === 'DEPART_RETRAITE') return 'Date de naissance'
  if (type === 'AVANCEMENT' || type === 'TITULARISATION') return "Date d'ancrage"
  return null
}
function dateSource(type: TypeAnticipation, alerte: AlerteAnticipation): string | null {
  if (type === 'DEPART_RETRAITE') return alerte.dateNaissance
  if (type === 'AVANCEMENT' || type === 'TITULARISATION') return alerte.avanceDate ?? alerte.dateDebutContrat
  return null
}
function corpsGrade(alerte: AlerteAnticipation): string {
  if (alerte.corpsCode == null && alerte.gradeCode == null) return '—'
  return [alerte.corpsCode, alerte.categorieCode, alerte.gradeCode].map((value) => value ?? '—').join(' / ')
}

export function EcheancesResults({ items, type }: { items: AlerteAnticipation[]; type: TypeAnticipation }) {
  const estAnomalie = type === 'ANOMALIE'
  const groupes = useMemo(() => grouperParStatut(items).filter((groupe) => groupe.items.length > 0), [items])
  const [filtre, setFiltre] = useState<FiltreStatut>('TOUS')
  const [page, setPage] = useState(0)
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
  const entete = enteteSource(type)
  const nbColonnes = 3 + (entete ? 1 : 0) + (estAnomalie ? 1 : 2)

  return (
    <div className="flex flex-col gap-3">
      {groupes.length > 1 && <SegmentedControl options={options} value={filtreActif} ariaLabel="Filtrer par statut d'agent" onChange={(value) => { setFiltre(value); setPage(0) }} />}
      <div className="overflow-x-auto rounded-xl border border-[#E4E6EB] bg-white"><table className="w-full">
        <thead className="border-b border-[#EAEBF0] bg-[#FAFAFB]"><tr>
          <th className="table-head-cell">Matricule</th><th className="table-head-cell">Agent</th><th className="table-head-cell">Corps / cat. / grade</th>
          {entete && <th className="table-head-cell">{entete}</th>}
          {estAnomalie ? <th className="table-head-cell">Raison</th> : <><th className="table-head-cell">Échéance</th><th className="table-head-cell">Délai</th></>}
        </tr></thead>
        <tbody className="divide-y divide-[#EAEBF0]">{tranche.map(({ groupe, item }, index) => {
          const premier = index === 0 || tranche[index - 1].groupe !== groupe
          return <Fragment key={`${debut + index}-${item.matricule}`}>
            {premier && <tr className="bg-[#FAFAFB]"><td colSpan={nbColonnes} className="px-4 py-2 text-[12px] font-semibold text-ink">{groupe.label}<span className="ml-2 font-normal text-[#9CA0AC]">{groupe.items.length}</span></td></tr>}
            <tr className="hover:bg-[#FAFAFB]">
              <td className="table-cell font-mono text-[12.5px] text-[#4B4F5A]">{item.matricule}</td>
              <td className="table-cell"><div className="font-medium text-ink">{item.nomComplet}</div>{!estAnomalie && item.details && <div className="text-[12px] text-[#9CA0AC]">{item.details}</div>}</td>
              <td className="table-cell font-mono text-[12.5px] text-[#4B4F5A]">{corpsGrade(item)}</td>
              {entete && <td className="table-cell text-[#4B4F5A]">{formatDate(dateSource(type, item))}</td>}
              {estAnomalie ? <td className="table-cell text-[#4B4F5A]">{item.details ?? '—'}</td> : <><td className="table-cell whitespace-nowrap text-[#4B4F5A]">{formatDate(item.dateEcheance)}</td><td className="table-cell"><Badge tone={toneDelai(item.joursRestants)}>{libelleEcheance(item.joursRestants)}</Badge></td></>}
            </tr>
          </Fragment>
        })}</tbody>
      </table></div>
      <Pagination page={pageCourante} totalPages={totalPages} totalElements={lignes.length} onPageChange={setPage} />
    </div>
  )
}
