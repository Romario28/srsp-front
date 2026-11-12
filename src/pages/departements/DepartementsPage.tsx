import { useMemo, useState } from 'react'
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useFetch } from '@/hooks/useFetch'
import { departementsApi } from '@/api/departements'
import { extractErrorMessage } from '@/api/client'
import { correspond } from '@/utils/recherche'
import { Button } from '@/components/ui/Button'
import { ChampRecherche } from '@/components/ui/ChampRecherche'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Spinner } from '@/components/ui/Spinner'
import { DepartementFormModal } from './DepartementFormModal'
import type { DepartementDTO } from '@/types/departement'

export function DepartementsPage() {
  const { data, isLoading, error, reload } = useFetch(() => departementsApi.lister())
  const [recherche, setRecherche] = useState('')
  const [formulaire, setFormulaire] = useState<{ ouvert: boolean; departement: DepartementDTO | null }>({ ouvert: false, departement: null })
  const [aSupprimer, setASupprimer] = useState<DepartementDTO | null>(null)
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  const liste = data ?? []
  const trouves = useMemo(() => liste.filter((d) => correspond(recherche, d.libelle)), [liste, recherche])

  const supprimer = async () => {
    if (!aSupprimer) return
    setEnCours(true)
    setErreurSuppression(null)
    try {
      await departementsApi.supprimer(aSupprimer.id)
      setASupprimer(null)
      reload()
    } catch (err) {
      setErreurSuppression(extractErrorMessage(err, 'Suppression impossible'))
    } finally {
      setEnCours(false)
    }
  }

  const ouvrirCreation = () => setFormulaire({ ouvert: true, departement: null })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[20px] font-semibold text-ink">Départements</h1>
          <p className="mt-0.5 max-w-3xl text-[13px] text-[#6B7180]">
            Liste proposée dans la demande de compte et reprise sur les documents PDF. C'est une information : le département n'a aucun effet sur les droits d'accès, qui dépendent du périmètre.
            {data && ` ${data.length} département${data.length > 1 ? 's' : ''}.`}
          </p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={ouvrirCreation}>Nouveau département</Button>
      </div>

      {error && <ErrorBanner message={error} />}

      {isLoading && !data ? <Spinner label="Chargement des départements…" /> : data && !error ? (
        data.length === 0 ? (
          <EmptyState icon={Building2} title="Aucun département"
            description="Sans département, la page publique de demande de compte ne peut pas être envoyée."
            action={<Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={ouvrirCreation}>Nouveau département</Button>} />
        ) : (
          <div className="flex flex-col gap-3">
            <ChampRecherche valeur={recherche} onChange={setRecherche} className="w-72" ariaLabel="Rechercher un département" placeholder="Rechercher…" />
            {trouves.length === 0 ? (
              <EmptyState title="Aucun résultat" description={`Aucun département ne correspond à « ${recherche.trim()} ».`} />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#E4E6EB] bg-white">
                <table className="w-full">
                  <thead className="border-b border-[#EAEBF0] bg-[#FAFAFB]"><tr>
                    <th className="table-head-cell">Libellé</th><th className="table-head-cell text-right">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-[#EAEBF0]">{trouves.map((d) => (
                    <tr key={d.id} className="hover:bg-[#FAFAFB]">
                      <td className="table-cell font-medium text-ink">{d.libelle}</td>
                      <td className="table-cell">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => setFormulaire({ ouvert: true, departement: d })} aria-label={`Modifier ${d.libelle}`} title="Modifier"
                            className="rounded-md p-1.5 text-[#6B7180] hover:bg-accent-light hover:text-accent-dark"><Pencil className="h-4 w-4" /></button>
                          <button type="button" onClick={() => { setErreurSuppression(null); setASupprimer(d) }} aria-label={`Supprimer ${d.libelle}`} title="Supprimer"
                            className="rounded-md p-1.5 text-[#6B7180] hover:bg-danger-light hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        )
      ) : null}

      <DepartementFormModal isOpen={formulaire.ouvert} departement={formulaire.departement}
        onClose={() => setFormulaire({ ouvert: false, departement: null })}
        onSaved={() => { setFormulaire({ ouvert: false, departement: null }); reload() }} />
      <ConfirmDialog isOpen={!!aSupprimer} title="Supprimer le département" confirmLabel="Supprimer" isLoading={enCours}
        message={erreurSuppression ?? (aSupprimer ? `Supprimer « ${aSupprimer.libelle} » ? Cette action est définitive.` : '')}
        onConfirm={supprimer} onCancel={() => setASupprimer(null)} />
    </div>
  )
}
