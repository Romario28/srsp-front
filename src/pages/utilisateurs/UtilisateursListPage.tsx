import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, UserCog, KeyRound } from 'lucide-react'
import { useFetch } from '@/hooks/useFetch'
import { utilisateursApi } from '@/api/utilisateurs'
import { extractErrorMessage } from '@/api/client'
import { formatDateTime } from '@/utils/date'
import { roleLabel } from '@/utils/roles'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Badge, StatutBadge } from '@/components/ui/Badge'
import { CreateUtilisateurModal } from './CreateUtilisateurModal'
import type { UtilisateurDTO } from '@/types/utilisateur'

const STATUTS: UtilisateurDTO['statut'][] = ['ACTIF', 'SUSPENDU', 'DESACTIVE']

export function UtilisateursListPage() {
  const { data: page, isLoading, error, reload } = useFetch(() => utilisateursApi.getAll(0, 100))
  const utilisateurs = page?.content ?? []
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<number | null>(null)

  const handleStatutChange = async (u: UtilisateurDTO, statut: UtilisateurDTO['statut']) => {
    if (statut === u.statut) return
    setStatusError(null)
    setPendingId(u.id)
    try {
      await utilisateursApi.changeStatut(u.id, statut)
      reload()
    } catch (err) {
      setStatusError(extractErrorMessage(err, 'Changement de statut impossible'))
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[20px] font-semibold text-ink">Comptes utilisateurs</h1>
          <p className="mt-0.5 text-[13px] text-[#6B7180]">
            {page?.totalElements ?? 0} compte{(page?.totalElements ?? 0) > 1 ? 's' : ''} créé
            {(page?.totalElements ?? 0) > 1 ? 's' : ''}
          </p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
          Nouveau compte
        </Button>
      </div>

      {error && <ErrorBanner message={error} />}
      {statusError && <ErrorBanner message={statusError} />}

      {isLoading ? (
        <Spinner label="Chargement des comptes…" />
      ) : utilisateurs.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="Aucun compte pour le moment"
          description="Créez un compte pour donner accès à l'application."
          action={
            <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
              Nouveau compte
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E4E6EB] bg-white">
          <table className="w-full">
            <thead className="border-b border-[#EAEBF0] bg-[#FAFAFB]">
              <tr>
                <th className="table-head-cell">E-mail</th>
                <th className="table-head-cell">Employé lié</th>
                <th className="table-head-cell">Département</th>
                <th className="table-head-cell">Rôles</th>
                <th className="table-head-cell">Dernière connexion</th>
                <th className="table-head-cell">Statut</th>
                <th className="table-head-cell text-right">Délégations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEBF0]">
              {utilisateurs.map((u) => (
                <tr key={u.id} className="hover:bg-[#FAFAFB]">
                  <td className="table-cell font-medium text-ink">{u.email}</td>
                  <td className="table-cell text-[#4B4F5A]">
                    {u.nomEmploye ? (
                      <span>
                        {u.nomEmploye}{' '}
                        <span className="font-mono text-[11.5px] text-[#9CA0AC]">({u.matriculeEmploye})</span>
                      </span>
                    ) : '—'}
                  </td>
                  <td className="table-cell text-[#4B4F5A]">{u.nomDepartement ?? '—'}</td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => <Badge key={r} tone="accent">{roleLabel(r)}</Badge>)}
                    </div>
                  </td>
                  <td className="table-cell text-[#4B4F5A]">{formatDateTime(u.dateDerniereConnexion)}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <StatutBadge statut={u.statut} />
                      <select
                        aria-label={`Changer le statut de ${u.email}`}
                        value={u.statut}
                        disabled={pendingId === u.id}
                        onChange={(e) => handleStatutChange(u, e.target.value as UtilisateurDTO['statut'])}
                        className="h-7 rounded-md border border-[#DADCE3] bg-white px-1.5 text-[11.5px] text-[#6B7180] disabled:opacity-50"
                      >
                        {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex justify-end">
                      <Link
                        to={`/delegations?userId=${u.id}`}
                        title="Voir/gérer les délégations"
                        className="rounded-md p-1.5 text-[#6B7180] hover:bg-accent-light hover:text-accent-dark"
                      >
                        <KeyRound className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateUtilisateurModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSaved={reload} />
    </div>
  )
}
