import { useState } from 'react'
import { Plus, Crown, Network, FolderTree, ArrowLeftRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useFetch } from '@/hooks/useFetch'
import { departementsApi } from '@/api/departements'
import { employesApi } from '@/api/employes'
import { isAdmin } from '@/utils/roles'
import { extractErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Select } from '@/components/ui/Select'
import { buildTree, DepartementTree, type TreeNode } from './DepartementTree'
import { DepartementFormModal } from './DepartementFormModal'
import { DepartementMoveModal } from './DepartementMoveModal'
import type { DepartementResponse } from '@/types/departement'

export function DepartementsPage() {
  const { user } = useAuth()
  const admin = isAdmin(user?.roles)

  const { data: flat, isLoading, error, reload } = useFetch(() => departementsApi.getAll())
  const { data: employesPage } = useFetch(() => employesApi.getAll(0, 200))

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [createModal, setCreateModal] = useState<{ open: boolean; parent: DepartementResponse | null }>({
    open: false,
    parent: null,
  })
  // AJOUTÉ — modale de déplacement du département sélectionné (admin).
  const [moveModal, setMoveModal] = useState<{ open: boolean; target: DepartementResponse | null }>({
    open: false,
    target: null,
  })
  const [chefError, setChefError] = useState<string | null>(null)
  const [isAssigningChef, setIsAssigningChef] = useState(false)

  const tree = buildTree(flat ?? [])
  const selected = flat?.find((d) => d.id === selectedId) ?? null

  // Employés du département sélectionné — pas d'endpoint dédié côté backend,
  // on filtre côté client la liste déjà visible pour l'utilisateur courant.
  const employesDuDepartement = (employesPage?.content ?? []).filter((e) => e.idDepartement === selectedId)

  const handleAssignerChef = async (idEmploye: string) => {
    if (!selected) return
    setChefError(null)
    setIsAssigningChef(true)
    try {
      await departementsApi.definirChef(selected.id, idEmploye ? Number(idEmploye) : null)
      reload()
    } catch (err) {
      setChefError(extractErrorMessage(err, "Impossible d'assigner ce chef"))
    } finally {
      setIsAssigningChef(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[20px] font-semibold text-ink">Organigramme</h1>
          <p className="mt-0.5 text-[13px] text-[#6B7180]">
            {flat?.length ?? 0} département{(flat?.length ?? 0) > 1 ? 's' : ''} — cliquez pour voir le détail
          </p>
        </div>
        {admin && (
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreateModal({ open: true, parent: null })}>
            Nouveau département racine
          </Button>
        )}
      </div>

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <Spinner label="Chargement de l'organigramme…" />
      ) : (flat?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed border-[#DADCE3] bg-white py-14 text-center">
          <Network className="mx-auto h-8 w-8 text-[#B4B8C2]" />
          <p className="mt-2 text-sm font-medium text-ink">Aucun département pour le moment</p>
          {admin && (
            <Button
              size="sm"
              className="mt-3"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setCreateModal({ open: true, parent: null })}
            >
              Créer le Secrétariat Général
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-xl border border-[#E4E6EB] bg-white p-3">
            <DepartementTree nodes={tree} onSelect={(n: TreeNode) => setSelectedId(n.id)} selectedId={selectedId} />
          </div>

          <div className="rounded-xl border border-[#E4E6EB] bg-white p-5">
            {!selected ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <FolderTree className="h-7 w-7 text-[#C4C7D0]" />
                <p className="text-[13px] text-[#6B7180]">Sélectionnez un département dans l'arbre</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[#9CA0AC]">{selected.niveau}</p>
                  <h2 className="font-display text-[16px] font-semibold text-ink">{selected.nomDepartement}</h2>
                  {selected.description && (
                    <p className="mt-1 text-[12.5px] text-[#6B7180]">{selected.description}</p>
                  )}
                </div>

                {selected.nomParent && (
                  <div className="text-[12.5px] text-[#6B7180]">
                    Rattaché à <span className="font-medium text-ink">{selected.nomParent}</span>
                  </div>
                )}

                <div className="border-t border-[#EAEBF0] pt-4">
                  <p className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-ink">
                    <Crown className="h-3.5 w-3.5 text-warning" /> Chef de département
                  </p>
                  {admin ? (
                    <>
                      <Select
                        label=""
                        value={selected.idChef != null ? String(selected.idChef) : ''}
                        onChange={(e) => handleAssignerChef(e.target.value)}
                        disabled={isAssigningChef}
                      >
                        <option value="">— Poste vacant —</option>
                        {employesDuDepartement.map((e) => (
                          <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
                        ))}
                      </Select>
                      {employesDuDepartement.length === 0 && (
                        <p className="mt-1 text-[11.5px] text-[#9CA0AC]">
                          Aucun employé rattaché à ce département n'est visible pour l'instant.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-[13px] text-ink">{selected.nomChef ?? 'Poste vacant'}</p>
                  )}
                  {chefError && <div className="mt-2"><ErrorBanner message={chefError} /></div>}
                </div>

                {admin && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => setCreateModal({ open: true, parent: selected })}
                  >
                    Ajouter un sous-département
                  </Button>
                )}

                {/* AJOUTÉ — déplacement du département (répercuté sur ses sous-départements) ;
                    le sélecteur de la modale exclut le département lui-même et son sous-arbre. */}
                {admin && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<ArrowLeftRight className="h-4 w-4" />}
                    onClick={() => setMoveModal({ open: true, target: selected })}
                  >
                    Déplacer ce département
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <DepartementFormModal
        isOpen={createModal.open}
        parent={createModal.parent}
        onClose={() => setCreateModal({ open: false, parent: null })}
        onSaved={reload}
      />

      {/* AJOUTÉ — déplacement (l'API PATCH /departements/{id}/deplacer existait déjà). */}
      <DepartementMoveModal
        isOpen={moveModal.open}
        departement={moveModal.target}
        flat={flat ?? []}
        onClose={() => setMoveModal({ open: false, target: null })}
        onSaved={reload}
      />
    </div>
  )
}
