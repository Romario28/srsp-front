import { useMemo, useState } from 'react'
import { Search, ScrollText } from 'lucide-react'
import { useFetch } from '@/hooks/useFetch'
import { auditApi } from '@/api/audit'
import { formatDateTime } from '@/utils/date'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Badge } from '@/components/ui/Badge'

const ACTION_TONES: Record<string, 'success' | 'warning' | 'danger' | 'accent' | 'neutral'> = {
  CREATE_EMPLOYE: 'success',
  CREATE_USER: 'success',
  UPDATE_EMPLOYE: 'accent',
  CHANGE_STATUT: 'warning',
  DELETE_EMPLOYE: 'danger',
  LOGIN: 'neutral',
  LOGOUT: 'neutral',
  UPDATE_CONFIG_DELAI: 'accent',    // AJOUTÉ
  RESET_CONFIG_DELAI: 'warning',    // AJOUTÉ
  IMPORT_EXCEL: 'accent',           // AJOUTÉ
}

export function AuditListPage() {
  const { data: entries, isLoading, error } = useFetch(() => auditApi.getAll())
  const [search, setSearch] = useState('')

  const sorted = useMemo(() => {
    if (!entries) return []
    return [...entries].sort((a, b) => new Date(b.dateAction).getTime() - new Date(a.dateAction).getTime())
  }, [entries])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter((e) => [e.email, e.action, e.details, e.adresseIp].some((v) => v?.toLowerCase().includes(q)))
  }, [sorted, search])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[20px] font-semibold text-ink">Journal d'audit</h1>
        <p className="mt-0.5 text-[13px] text-[#6B7180]">
          {entries?.length ?? 0} action{(entries?.length ?? 0) > 1 ? 's' : ''} journalisée
          {(entries?.length ?? 0) > 1 ? 's' : ''}
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA0AC]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrer par email, action, IP…"
          className="h-10 w-full rounded-lg border border-[#DADCE3] bg-white pl-9 pr-3 text-sm text-ink placeholder:text-[#9CA0AC] focus:border-accent"
        />
      </div>

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <Spinner label="Chargement du journal…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={search ? 'Aucun résultat' : 'Aucune action journalisée'}
          description={search ? `Aucune entrée ne correspond à « ${search} ».` : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E4E6EB] bg-white">
          <table className="w-full">
            <thead className="border-b border-[#EAEBF0] bg-[#FAFAFB]">
              <tr>
                <th className="table-head-cell">Date</th>
                <th className="table-head-cell">Utilisateur</th>
                <th className="table-head-cell">Action</th>
                <th className="table-head-cell">Détails</th>
                <th className="table-head-cell">Adresse IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEBF0]">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-[#FAFAFB]">
                  <td className="table-cell whitespace-nowrap text-[#4B4F5A]">{formatDateTime(entry.dateAction)}</td>
                  <td className="table-cell font-medium text-ink">{entry.email ?? 'Système'}</td>
                  <td className="table-cell">
                    <Badge tone={ACTION_TONES[entry.action] ?? 'neutral'}>{entry.action}</Badge>
                  </td>
                  <td className="table-cell max-w-md text-[#4B4F5A]">{entry.details ?? '—'}</td>
                  <td className="table-cell font-mono text-[12px] text-[#9CA0AC]">{entry.adresseIp ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-lg border border-warning/30 bg-warning-light px-4 py-3 text-[12.5px] text-warning">
        Les créations/déplacements de département et les octrois/révocations de délégation
        ne sont pas encore journalisés côté backend — seuls les employés, comptes et
        connexions apparaissent ici pour l'instant.
      </div>
    </div>
  )
}
