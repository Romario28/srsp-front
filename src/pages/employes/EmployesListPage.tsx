import { useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Crown, Layers } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useFetch } from '@/hooks/useFetch'
import { employesApi } from '@/api/employes'
import { isAdmin } from '@/utils/roles'
import { formatDate } from '@/utils/date'
import { extractErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Badge } from '@/components/ui/Badge'
import { EmployeFormModal } from './EmployeFormModal'
import type { EmployeResponse } from '@/types/employe'

const SANS_DEPARTEMENT = 'Sans département'

export function EmployesListPage() {
  const { user } = useAuth()
  const admin = isAdmin(user?.roles)

  // Portée déjà appliquée côté backend (chef/délégation/soi-même) — on récupère
  // une page large et on filtre juste par texte côté client.
  const { data: page, isLoading, error, reload } = useFetch(() => employesApi.getAll(0, 100))
  const employes = page?.content ?? []
  const [search, setSearch] = useState('')
  const [departementFiltre, setDepartementFiltre] = useState('')
  const [grouperParDepartement, setGrouperParDepartement] = useState(false)

  const [formState, setFormState] = useState<{ open: boolean; employe: EmployeResponse | null }>({
    open: false,
    employe: null,
  })
  const [deleteTarget, setDeleteTarget] = useState<EmployeResponse | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Départements réellement présents dans la liste visible — pas un appel API séparé,
  // le filtre ne propose donc que des départements pertinents pour cet utilisateur.
  const departementsDisponibles = useMemo(() => {
    const noms = new Set(employes.map((e) => e.nomDepartement ?? SANS_DEPARTEMENT))
    return Array.from(noms).sort((a, b) => a.localeCompare(b))
  }, [employes])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return employes.filter((e) => {
      const matchTexte =
        !q || [e.matricule, e.nom, e.prenom, e.poste, e.nomDepartement].some((v) => v?.toLowerCase().includes(q))
      const matchDepartement =
        !departementFiltre || (e.nomDepartement ?? SANS_DEPARTEMENT) === departementFiltre
      return matchTexte && matchDepartement
    })
  }, [employes, search, departementFiltre])

  const groupes = useMemo(() => {
    if (!grouperParDepartement) return null
    const map = new Map<string, EmployeResponse[]>()
    for (const e of filtered) {
      const cle = e.nomDepartement ?? SANS_DEPARTEMENT
      if (!map.has(cle)) map.set(cle, [])
      map.get(cle)!.push(e)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered, grouperParDepartement])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await employesApi.remove(deleteTarget.id)
      setDeleteTarget(null)
      reload()
    } catch (err) {
      setDeleteError(extractErrorMessage(err, 'Suppression impossible'))
    } finally {
      setIsDeleting(false)
    }
  }

  const renderRow = (emp: EmployeResponse) => (
    <tr key={emp.id} className="hover:bg-[#FAFAFB]">
      <td className="table-cell font-mono text-[12.5px] text-[#4B4F5A]">{emp.matricule}</td>
      <td className="table-cell font-medium text-ink">
        <div className="flex items-center gap-1.5">
          {emp.prenom} {emp.nom}
          {emp.estChef && (
            <span title="Chef de département">
              <Crown className="h-3.5 w-3.5 text-warning" />
            </span>
          )}
        </div>
      </td>
      <td className="table-cell text-[#4B4F5A]">{emp.poste || '—'}</td>
      {!grouperParDepartement && <td className="table-cell text-[#4B4F5A]">{emp.nomDepartement || '—'}</td>}
      <td className="table-cell text-[#4B4F5A]">{formatDate(emp.dateEmbauche)}</td>
      <td className="table-cell">
        <Badge tone={emp.aUnCompte ? 'success' : 'neutral'}>{emp.aUnCompte ? 'Lié' : 'Aucun'}</Badge>
      </td>
      <td className="table-cell">
        <div className="flex justify-end gap-1">
          <button
            onClick={() => setFormState({ open: true, employe: emp })}
            aria-label={`Modifier ${emp.prenom} ${emp.nom}`}
            className="rounded-md p-1.5 text-[#6B7180] hover:bg-accent-light hover:text-accent-dark"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {admin && (
            <button
              onClick={() => {
                setDeleteError(null)
                setDeleteTarget(emp)
              }}
              aria-label={`Supprimer ${emp.prenom} ${emp.nom}`}
              className="rounded-md p-1.5 text-[#6B7180] hover:bg-danger-light hover:text-danger"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[20px] font-semibold text-ink">Employés</h1>
          <p className="mt-0.5 text-[13px] text-[#6B7180]">
            {page?.totalElements ?? 0} employé{(page?.totalElements ?? 0) > 1 ? 's' : ''} visible
            {(page?.totalElements ?? 0) > 1 ? 's' : ''} depuis votre position dans l'organigramme
          </p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setFormState({ open: true, employe: null })}>
          Nouvel employé
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA0AC]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, matricule, poste, département…"
            className="h-10 w-full rounded-lg border border-[#DADCE3] bg-white pl-9 pr-3 text-sm text-ink placeholder:text-[#9CA0AC] focus:border-accent"
          />
        </div>

        <select
          value={departementFiltre}
          onChange={(e) => setDepartementFiltre(e.target.value)}
          aria-label="Filtrer par département"
          className="h-10 rounded-lg border border-[#DADCE3] bg-white px-3 text-sm text-ink focus:border-accent"
        >
          <option value="">Tous les départements</option>
          {departementsDisponibles.map((nom) => (
            <option key={nom} value={nom}>{nom}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setGrouperParDepartement((v) => !v)}
          aria-pressed={grouperParDepartement}
          className={`flex h-10 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition-colors ${
            grouperParDepartement
              ? 'border-accent bg-accent-light text-accent-dark'
              : 'border-[#DADCE3] bg-white text-[#6B7180] hover:border-accent'
          }`}
        >
          <Layers className="h-4 w-4" />
          Regrouper par département
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <Spinner label="Chargement des employés…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search ? 'Aucun résultat' : 'Aucun employé visible pour le moment'}
          description={
            search
              ? `Aucun employé ne correspond à « ${search} ».`
              : "Votre portée actuelle (chef, délégation, ou vous-même) ne couvre aucun employé pour l'instant."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E4E6EB] bg-white">
          <table className="w-full">
            <thead className="border-b border-[#EAEBF0] bg-[#FAFAFB]">
              <tr>
                <th className="table-head-cell">Matricule</th>
                <th className="table-head-cell">Nom</th>
                <th className="table-head-cell">Poste</th>
                {!grouperParDepartement && <th className="table-head-cell">Département</th>}
                <th className="table-head-cell">Embauche</th>
                <th className="table-head-cell">Compte</th>
                <th className="table-head-cell text-right">Actions</th>
              </tr>
            </thead>
            {groupes ? (
              groupes.map(([nomDepartement, membres]) => (
                <tbody key={nomDepartement} className="divide-y divide-[#EAEBF0]">
                  <tr className="bg-[#FAFAFB]">
                    <td colSpan={6} className="px-4 py-2 text-[12px] font-semibold text-ink">
                      {nomDepartement}
                      <span className="ml-2 font-normal text-[#9CA0AC]">
                        {membres.length} employé{membres.length > 1 ? 's' : ''}
                      </span>
                    </td>
                  </tr>
                  {membres.map((emp) => renderRow(emp))}
                </tbody>
              ))
            ) : (
              <tbody className="divide-y divide-[#EAEBF0]">{filtered.map((emp) => renderRow(emp))}</tbody>
            )}
          </table>
        </div>
      )}

      <EmployeFormModal
        isOpen={formState.open}
        employe={formState.employe}
        onClose={() => setFormState({ open: false, employe: null })}
        onSaved={reload}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Supprimer l'employé"
        message={
          deleteError ??
          `Voulez-vous vraiment supprimer ${deleteTarget?.prenom} ${deleteTarget?.nom} ? Cette action est irréversible.`
        }
        confirmLabel="Supprimer"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
