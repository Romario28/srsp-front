import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { isAgent, peutVoirAnticipation } from '@/utils/roles'
import { TableauDeBordAdmin } from './dashboard/TableauDeBordAdmin'

export function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null
  if (isAgent(user.roles)) return <Navigate to="/mon-espace" replace />
  if (!peutVoirAnticipation(user.roles)) return <Navigate to="/interdit" replace />

  const p = user.perimetre
  const sansValeur = !p.accesTotal && p.ministeres.length + p.soas.length + p.fivs.length === 0
  return (
    <div className="flex flex-col gap-6">
      {sansValeur && (
        <div className="rounded-lg border border-warning/30 bg-warning-light px-4 py-3 text-[13px] text-warning">
          Aucune valeur de périmètre : votre compte ne donne accès à aucun agent pour l'instant. Contactez un administrateur.
        </div>
      )}
      <TableauDeBordAdmin />
    </div>
  )
}
