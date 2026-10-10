import { useMemo } from 'react'
import { Users } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Spinner } from '@/components/ui/Spinner'
import { useFetch } from '@/hooks/useFetch'
import { formatDate } from '@/utils/date'
import { statutAgentLabel } from '@/utils/anticipation'
import { CATEGORIES, CATEGORIE_INFO, jourLong } from '@/utils/calendrier'
import type { CritereDate } from '@/types/anticipation'
import type { CalendrierAgent, CategorieCalendrier } from '@/types/calendrier'

interface JourModalProps {
  jour: string | null
  critere: CritereDate
  actifs: ReadonlySet<CategorieCalendrier>
  /** Détail d'un jour : réutilisé tant qu'il est récent, sinon rechargé (cache de la page). */
  chargerDetail: (jour: string, critere: CritereDate) => Promise<readonly CalendrierAgent[]>
  /** Lecture synchrone du même cache : la liste s'affiche sans passer par « Chargement… ». */
  detailEnCache: (jour: string, critere: CritereDate) => readonly CalendrierAgent[] | undefined
  onClose: () => void
}

export function JourModal({ jour, onClose, ...reste }: JourModalProps) {
  return (
    <Modal isOpen={jour != null} onClose={onClose} maxWidth="max-w-2xl" title={jour ? jourLong(jour) : ''}>
      {jour && <Contenu jour={jour} onClose={onClose} {...reste} />}
    </Modal>
  )
}

function Contenu({ jour, critere, actifs, chargerDetail, detailEnCache, onClose }: Omit<JourModalProps, 'jour'> & { jour: string }) {
  const enCache = detailEnCache(jour, critere)
  // Cache frais : la promesse est déjà résolue, aucune requête ne part
  const { data, isLoading, error, reload } = useFetch(() => chargerDetail(jour, critere), [jour, critere])
  const agents = data ?? enCache
  const lignes = useMemo(() => (agents ?? []).filter((l) => actifs.has(l.categorie)), [agents, actifs])
  const groupes = CATEGORIES
    .map((categorie) => ({ categorie, items: lignes.filter((l) => l.categorie === categorie) }))
    .filter((g) => g.items.length > 0)
  const nbAgents = new Set(lignes.map((l) => l.matricule)).size
  const preparationActive = critere === 'PREPARATION'

  return (
    <div className="flex flex-col gap-5">
      {error && !agents ? (
        <div className="flex flex-col items-start gap-2">
          <ErrorBanner message={error} />
          <Button variant="secondary" size="sm" onClick={reload}>Réessayer</Button>
        </div>
      ) : isLoading && !agents ? (
        <Spinner label="Chargement des agents…" />
      ) : lignes.length === 0 ? (
        <EmptyState icon={Users} title="Aucune échéance ce jour" description="Aucun agent ne correspond aux types affichés." />
      ) : (
        <>
          <p className="text-[13px] text-[#4B4F5A]">
            <span className="font-medium text-ink">{nbAgents} agent{nbAgents > 1 ? 's' : ''} concerné{nbAgents > 1 ? 's' : ''}</span>
            {' '}· placés ce jour selon leur date de {preparationActive ? 'préparation' : "d'échéance"}
          </p>
          {groupes.map((g) => (
            <section key={g.categorie} className="flex flex-col gap-2">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${CATEGORIE_INFO[g.categorie].point}`} />
                {CATEGORIE_INFO[g.categorie].label}
                <span className="font-normal text-[#9CA0AC]">{g.items.length}</span>
              </h3>
              <div className="overflow-x-auto rounded-lg border border-[#E4E6EB]">
                <table className="w-full">
                  <thead className="border-b border-[#EAEBF0] bg-[#FAFAFB]">
                    <tr>
                      <th className="table-head-cell">Agent</th>
                      <th className="table-head-cell">Statut</th>
                      <th className="table-head-cell">Préparation dès le</th>
                      <th className="table-head-cell">Échéance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEBF0]">
                    {g.items.map((l) => (
                      <tr key={l.matricule}>
                        <td className="table-cell">
                          <div className="font-medium text-ink">{l.nomComplet}</div>
                          <div className="font-mono text-[12px] text-[#6B7180]">{l.matricule}</div>
                        </td>
                        <td className="table-cell"><Badge>{statutAgentLabel(l.statut)}</Badge></td>
                        <td className={`table-cell whitespace-nowrap ${preparationActive ? 'font-medium text-ink' : 'text-[#6B7180]'}`}>{formatDate(l.datePreparation)}</td>
                        <td className={`table-cell whitespace-nowrap ${preparationActive ? 'text-[#6B7180]' : 'font-medium text-ink'}`}>{formatDate(l.dateEcheance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </>
      )}
      <div className="flex justify-end">
        <Button variant="secondary" onClick={onClose}>Fermer</Button>
      </div>
    </div>
  )
}
