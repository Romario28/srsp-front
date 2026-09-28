import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { KeyRound, Plus, Search, Trash2, RotateCcw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useFetch } from '@/hooks/useFetch'
import { porteesDelegueesApi } from '@/api/porteesDeleguees'
import { extractErrorMessage } from '@/api/client'
import { isAdmin } from '@/utils/roles'
import { formatDate } from '@/utils/date'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CreateDelegationModal } from './CreateDelegationModal'
import type { PorteeDelegueeDTO } from '@/types/porteeDeleguee'

/**
 * Il n'existe pas d'endpoint "toutes les délégations" côté backend — uniquement
 * GET /portees-deleguees/utilisateur/{id}. Cette page tourne donc autour d'un
 * utilisateur cible : la vôtre par défaut, ou — pour un ADMIN uniquement — un
 * autre en le cherchant par ID, ou via le lien depuis Comptes utilisateurs.
 */
export function DelegationsPage() {
  const { user } = useAuth()
  // MODIFIÉ — la consultation des délégations d'un autre utilisateur est réservée à
  // l'admin : un non-admin consulte uniquement les siennes, même si ?userId= est dans l'URL.
  const admin = isAdmin(user?.roles)
  const [searchParams, setSearchParams] = useSearchParams()

  const urlUserId = searchParams.get('userId')
  const targetId = admin && urlUserId ? Number(urlUserId) : (user?.id ?? null)
  const [searchInput, setSearchInput] = useState(admin ? (urlUserId ?? '') : '')

  const { data: delegations, isLoading, error, reload } = useFetch(
    () => (targetId != null ? porteesDelegueesApi.getPourUtilisateur(targetId) : Promise.resolve([])),
    [targetId]
  )

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<PorteeDelegueeDTO | null>(null)
  const [revokeError, setRevokeError] = useState<string | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)

  const isSelf = targetId === user?.id

  const goToUser = () => {
    const n = Number(searchInput)
    if (searchInput && !Number.isNaN(n)) setSearchParams({ userId: String(n) })
  }
  const resetToSelf = () => {
    setSearchInput('')
    setSearchParams({})
  }

  const today = new Date().toISOString().slice(0, 10)
  const estRevocable = (d: PorteeDelegueeDTO) => !d.dateFin || d.dateFin >= today

  const handleRevoke = async () => {
    if (!revokeTarget) return
    setIsRevoking(true)
    setRevokeError(null)
    try {
      // MODIFIÉ — le backend n'attend plus de paramètre bénéficiaire : seul l'ID de
      // la délégation est envoyé.
      await porteesDelegueesApi.revoquer(revokeTarget.id)
      setRevokeTarget(null)
      reload()
    } catch (err) {
      setRevokeError(extractErrorMessage(err, 'Révocation impossible'))
    } finally {
      setIsRevoking(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[20px] font-semibold text-ink">Délégations</h1>
          <p className="mt-0.5 text-[13px] text-[#6B7180]">
            {isSelf ? 'Vos délégations actives ou passées' : `Délégations de l'utilisateur #${targetId}`}
          </p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
          Accorder une délégation
        </Button>
      </div>

      {/* MODIFIÉ — la recherche par ID (consulter les délégations d'un autre utilisateur)
          n'est proposée qu'à l'administrateur. */}
      {admin && (
        <div className="flex items-end gap-2">
          <div className="relative w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA0AC]" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && goToUser()}
              type="number"
              placeholder="ID utilisateur…"
              className="h-10 w-full rounded-lg border border-[#DADCE3] bg-white pl-9 pr-3 text-sm text-ink placeholder:text-[#9CA0AC] focus:border-accent"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={goToUser}>Voir</Button>
          {!isSelf && (
            <Button variant="ghost" size="sm" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={resetToSelf}>
              Revenir à moi-même
            </Button>
          )}
        </div>
      )}

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <Spinner label="Chargement des délégations…" />
      ) : !delegations || delegations.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="Aucune délégation"
          description={isSelf ? "Vous n'avez aucune délégation, active ou passée." : "Cet utilisateur n'a aucune délégation."}
          action={
            <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
              Accorder une délégation
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E4E6EB] bg-white">
          <table className="w-full">
            <thead className="border-b border-[#EAEBF0] bg-[#FAFAFB]">
              <tr>
                <th className="table-head-cell">Bénéficiaire</th>
                <th className="table-head-cell">Département</th>
                <th className="table-head-cell">Accès</th>
                <th className="table-head-cell">Période</th>
                <th className="table-head-cell">Accordé par</th>
                <th className="table-head-cell">Statut</th>
                <th className="table-head-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEBF0]">
              {delegations.map((d) => {
                // AJOUTÉ — statut dérivé des dates (voir statutDelegation plus bas).
                const statut = statutDelegation(d, today)
                return (
                <tr key={d.id} className="hover:bg-[#FAFAFB]">
                  <td className="table-cell font-medium text-ink">{d.emailUtilisateur}</td>
                  <td className="table-cell text-[#4B4F5A]">{d.nomDepartement}</td>
                  <td className="table-cell">
                    <Badge tone={d.typeAcces === 'LECTURE_ECRITURE' ? 'accent' : 'neutral'}>
                      {d.typeAcces === 'LECTURE_ECRITURE' ? 'Lecture/écriture' : 'Lecture seule'}
                    </Badge>
                  </td>
                  <td className="table-cell text-[#4B4F5A]">
                    {formatDate(d.dateDebut)} → {d.dateFin ? formatDate(d.dateFin) : 'permanente'}
                  </td>
                  <td className="table-cell text-[#4B4F5A]">{d.accordePar}</td>
                  <td className="table-cell">
                    {/* MODIFIÉ — À venir / Active / Terminée au lieu du seul Active/Inactive. */}
                    <Badge tone={statut.tone}>{statut.label}</Badge>
                  </td>
                  <td className="table-cell">
                    {estRevocable(d) && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => { setRevokeError(null); setRevokeTarget(d) }}
                          aria-label="Révoquer"
                          className="rounded-md p-1.5 text-[#6B7180] hover:bg-danger-light hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <CreateDelegationModal
        isOpen={isCreateOpen}
        idUtilisateurPrerempli={targetId}
        onClose={() => setIsCreateOpen(false)}
        onSaved={reload}
      />

      <ConfirmDialog
        isOpen={!!revokeTarget}
        title="Révoquer la délégation"
        message={
          revokeError ??
          `Révoquer l'accès à « ${revokeTarget?.nomDepartement} » ? ${
            revokeTarget && !revokeTarget.dateFin ? 'Cette délégation permanente sera close à la date du jour.' : ''
          }`
        }
        confirmLabel="Révoquer"
        isLoading={isRevoking}
        onConfirm={handleRevoke}
        onCancel={() => setRevokeTarget(null)}
      />
    </div>
  )
}

// AJOUTÉ — statut dérivé des dates : la donnée backend reste un booléen « active »,
// on l'affine côté écran (À venir = active dont le début est futur, Active = effective
// aujourd'hui, Terminée = inactive). Distinguer « annulée » de « clôturée » exigerait
// une donnée réelle du backend (évolution B2) — aucune invention ici.
function statutDelegation(
  d: PorteeDelegueeDTO,
  today: string
): { label: string; tone: 'accent' | 'success' | 'neutral' } {
  if (!d.active) return { label: 'Terminée', tone: 'neutral' }
  return d.dateDebut > today ? { label: 'À venir', tone: 'accent' } : { label: 'Active', tone: 'success' }
}
