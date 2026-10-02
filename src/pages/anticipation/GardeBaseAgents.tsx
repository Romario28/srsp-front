import { Database, Upload } from 'lucide-react'
import { Outlet, useNavigate } from 'react-router-dom'
import { anticipationApi } from '@/api/anticipation'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useFetch } from '@/hooks/useFetch'

/** État partagé lorsque la base ne contient encore aucun agent. */
export function EtatBaseVide() {
  const navigate = useNavigate()
  return (
    <EmptyState
      icon={Database}
      title="Aucun agent importé"
      description="Les agents ne se saisissent pas à l'écran : ils arrivent par import. Commencez par les référentiels, puis les indices grade × corps, puis les agents."
      action={<Button icon={<Upload className="h-4 w-4" />} onClick={() => navigate('/imports')}>Aller à la page Imports</Button>}
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

