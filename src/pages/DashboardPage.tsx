import { Users, Network, KeyRound } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useFetch } from '@/hooks/useFetch'
import { employesApi } from '@/api/employes'
import { departementsApi } from '@/api/departements'
import { porteesDelegueesApi } from '@/api/porteesDeleguees'
import { isAdmin } from '@/utils/roles'
import { Spinner } from '@/components/ui/Spinner'
import { StatCard } from '@/components/ui/StatCard'
import { TableauDeBordAdmin } from './dashboard/TableauDeBordAdmin'

export function DashboardPage() {
  const { user } = useAuth()
  return isAdmin(user?.roles) ? <TableauDeBordAdmin /> : <TableauDeBordUtilisateur />
}

/** Tableau des comptes non-ADMIN : identique à leur écran précédent. */
function TableauDeBordUtilisateur() {
  const { user } = useAuth()
  const employes = useFetch(() => employesApi.getAll(0, 1))
  const departements = useFetch(() => departementsApi.getAll())
  const delegations = useFetch(() => user?.id != null ? porteesDelegueesApi.getPourUtilisateur(user.id) : Promise.resolve([]), [user?.id])
  if (employes.isLoading || departements.isLoading) return <Spinner label="Chargement du tableau de bord…" />
  return <div className="flex flex-col gap-7">
    <div><h1 className="font-display text-[22px] font-semibold text-ink">Bonjour {user?.nomComplet?.split(' ')[0]} 👋</h1><p className="mt-1 text-[13.5px] text-[#6B7180]">Voici ce qui est visible depuis votre position dans l'organigramme.</p></div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={Users} label="Employés visibles" value={employes.data?.totalElements ?? 0} to="/employes" />
      <StatCard icon={Network} label="Départements" value={departements.data?.length ?? 0} to="/departements" />
      <StatCard icon={KeyRound} label="Mes délégations" value={delegations.data?.length ?? 0} to="/delegations" sub="voir le détail" />
    </div>
  </div>
}
