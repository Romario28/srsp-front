import { useState } from 'react'
import { Eye, Plus, UserCog } from 'lucide-react'
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
import { UtilisateurFormModal } from './UtilisateurFormModal'
import { UtilisateurFicheModal } from './UtilisateurFicheModal'
import { perimetreVide, type PerimetreDTO, type UtilisateurDetailDTO, type UtilisateurDTO } from '@/types/utilisateur'

const STATUTS: UtilisateurDTO['statut'][] = ['ACTIF', 'SUSPENDU', 'DESACTIVE']

function ResumePerimetre({ perimetre, admin }: { perimetre: PerimetreDTO; admin: boolean }) {
  if (admin) return <span className="text-[#4B4F5A]">Accès total</span>
  if (perimetreVide(perimetre)) return <Badge tone="warning">Aucun agent visible</Badge>
  const parties = [
    perimetre.ministeres.length > 0 && `${perimetre.ministeres.length} ministère${perimetre.ministeres.length > 1 ? 's' : ''}`,
    perimetre.soas.length > 0 && `${perimetre.soas.length} SOA`,
    perimetre.fivs.length > 0 && `${perimetre.fivs.length} localité${perimetre.fivs.length > 1 ? 's' : ''}`,
  ].filter(Boolean)
  return <span className="text-[#4B4F5A]">{parties.join(' · ')}</span>
}

export function UtilisateursListPage() {
  const { data: page, isLoading, error, reload } = useFetch(() => utilisateursApi.getAll(0, 100))
  const utilisateurs = page?.content ?? []
  const [ficheId, setFicheId] = useState<number | null>(null)
  const [formulaire, setFormulaire] = useState<{ ouvert: boolean; utilisateur: UtilisateurDetailDTO | null }>({ ouvert: false, utilisateur: null })
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

  const total = page?.totalElements ?? 0
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[20px] font-semibold text-ink">Comptes utilisateurs</h1>
          <p className="mt-0.5 text-[13px] text-[#6B7180]">{total} compte{total > 1 ? 's' : ''} créé{total > 1 ? 's' : ''}</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setFormulaire({ ouvert: true, utilisateur: null })}>Nouveau compte</Button>
      </div>

      {error && <ErrorBanner message={error} />}
      {statusError && <ErrorBanner message={statusError} />}

      {isLoading ? (
        <Spinner label="Chargement des comptes…" />
      ) : utilisateurs.length === 0 ? (
        <EmptyState icon={UserCog} title="Aucun compte pour le moment" description="Créez un compte pour donner accès à l'application."
          action={<Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setFormulaire({ ouvert: true, utilisateur: null })}>Nouveau compte</Button>} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E4E6EB] bg-white">
          <table className="w-full">
            <thead className="border-b border-[#EAEBF0] bg-[#FAFAFB]">
              <tr>
                <th className="table-head-cell">Compte</th>
                <th className="table-head-cell">Agent lié</th>
                <th className="table-head-cell">Rôles</th>
                <th className="table-head-cell">Périmètre</th>
                <th className="table-head-cell">Dernière connexion</th>
                <th className="table-head-cell">Statut</th>
                <th className="table-head-cell text-right">Fiche</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEBF0]">
              {utilisateurs.map((u) => {
                const admin = u.roles.includes('ROLE_ADMIN')
                return (
                  <tr key={u.id} className="hover:bg-[#FAFAFB]">
                    <td className="table-cell">
                      <button type="button" onClick={() => setFicheId(u.id)} className="text-left font-medium text-ink hover:underline">{u.nomComplet || u.email}</button>
                      {u.nomComplet && <p className="text-[12px] text-[#9CA0AC]">{u.email}</p>}
                    </td>
                    <td className="table-cell whitespace-nowrap font-mono text-[12.5px] text-[#4B4F5A]">{u.matriculeAgent ?? '—'}</td>
                    <td className="table-cell"><div className="flex flex-wrap gap-1">{u.roles.map((r) => <Badge key={r} tone="accent">{roleLabel(r)}</Badge>)}</div></td>
                    <td className="table-cell text-[13px]"><ResumePerimetre perimetre={u.perimetre} admin={admin} /></td>
                    <td className="table-cell whitespace-nowrap text-[#4B4F5A]">{formatDateTime(u.dateDerniereConnexion)}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <StatutBadge statut={u.statut} />
                        <select aria-label={`Changer le statut de ${u.email}`} value={u.statut} disabled={pendingId === u.id}
                          onChange={(e) => handleStatutChange(u, e.target.value as UtilisateurDTO['statut'])}
                          className="h-7 rounded-md border border-[#DADCE3] bg-white px-1.5 text-[11.5px] text-[#6B7180] disabled:opacity-50">
                          {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex justify-end">
                        <button type="button" onClick={() => setFicheId(u.id)} aria-label={`Ouvrir la fiche de ${u.nomComplet || u.email}`} title="Ouvrir la fiche"
                          className="rounded-md p-1.5 text-[#6B7180] hover:bg-accent-light hover:text-accent-dark"><Eye className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <UtilisateurFicheModal utilisateurId={ficheId} onClose={() => setFicheId(null)}
        onModifier={(u) => { setFicheId(null); setFormulaire({ ouvert: true, utilisateur: u }) }} />
      <UtilisateurFormModal isOpen={formulaire.ouvert} utilisateur={formulaire.utilisateur}
        onClose={() => setFormulaire({ ouvert: false, utilisateur: null })}
        onSaved={(u) => { setFormulaire({ ouvert: false, utilisateur: null }); reload(); setFicheId(u.id) }} />
    </div>
  )
}