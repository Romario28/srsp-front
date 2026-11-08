import { Database, Upload } from 'lucide-react'
import { Outlet, useNavigate } from 'react-router-dom'
import { anticipationApi } from '@/api/anticipation'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'
import { useFetch } from '@/hooks/useFetch'
import { isAdmin } from '@/utils/roles'

/** État partagé lorsque la base ne contient encore aucun agent. */
export function EtatBaseVide() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const admin = isAdmin(user?.roles)
  return (
    <EmptyState
      icon={Database}
      title="Aucun agent importé"
      description={admin
        ? "Les agents ne se saisissent pas à l'écran : ils arrivent par import. Commencez par les référentiels, puis les indices grade × corps, puis les agents."
        : "Aucun agent n'a encore été importé. Un administrateur doit d'abord importer les référentiels, les indices grade × corps, puis les agents."}
      action={admin
        ? <Button icon={<Upload className="h-4 w-4" />} onClick={() => navigate('/imports')}>Aller à la page Imports</Button>
        : undefined}
    />
  )
}

/** Empêche le montage des écrans de calcul tant que la base est vide. */
export function GardeBaseAgents() {
  const { data, isLoading } = useFetch(() => anticipationApi.etatBase())

  if (isLoading && !data) return <Spinner label="Vérification des données…" />
  if (data?.nbAgents === 0) {
    return <div className="flex flex-col gap-5"><h1 className="font-display text-[20px] font-semibold text-ink">Anticipation RH</h1><EtatBaseVide /></div>
  }

  // En cas d'échec du comptage, les écrans restent accessibles et gèrent leurs erreurs.
  return <Outlet />
}
