import { Link } from 'react-router-dom'
import { Users, Network, UserCheck, ScrollText, ArrowUpRight, KeyRound } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useFetch } from '@/hooks/useFetch'
import { employesApi } from '@/api/employes'
import { departementsApi } from '@/api/departements'
import { utilisateursApi } from '@/api/utilisateurs'
import { porteesDelegueesApi } from '@/api/porteesDeleguees'
import { auditApi } from '@/api/audit'
import { isAdmin } from '@/utils/roles'
import { Spinner } from '@/components/ui/Spinner'
import { formatDateTime } from '@/utils/date'

export function DashboardPage() {
  const { user } = useAuth()
  const admin = isAdmin(user?.roles)

  const employes = useFetch(() => employesApi.getAll(0, 1)) // on ne veut que totalElements ici
  const departements = useFetch(() => departementsApi.getAll())
  const utilisateurs = useFetch(() => (admin ? utilisateursApi.getAll(0, 1) : Promise.resolve(null)), [admin])
  const audit = useFetch(() => (admin ? auditApi.getAll() : Promise.resolve([])), [admin])
  const mesDelegations = useFetch(
    () =>
      !admin && user?.id != null
        ? porteesDelegueesApi.getPourUtilisateur(user.id)
        : Promise.resolve([]),
    [admin, user?.id],
  )

  const isLoading = employes.isLoading || departements.isLoading

  const recentAudit = [...(audit.data ?? [])]
    .sort((a, b) => new Date(b.dateAction).getTime() - new Date(a.dateAction).getTime())
    .slice(0, 6)

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="font-display text-[22px] font-semibold text-ink">
          Bonjour {user?.nomComplet?.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-[13.5px] text-[#6B7180]">
          {admin
            ? "Vue d'ensemble de l'organigramme."
            : "Voici ce qui est visible depuis votre position dans l'organigramme."}
        </p>
      </div>

      {isLoading ? (
        <Spinner label="Chargement du tableau de bord…" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Employés visibles" value={employes.data?.totalElements ?? 0} to="/employes" />
            <StatCard icon={Network} label="Départements" value={departements.data?.length ?? 0} to="/departements" />
            {admin && (
              <>
                <StatCard icon={UserCheck} label="Comptes utilisateurs" value={utilisateurs.data?.totalElements ?? 0} to="/utilisateurs" />
                <StatCard icon={ScrollText} label="Actions journalisées" value={audit.data?.length ?? 0} to="/audit" />
              </>
            )}
            {!admin && (
              <StatCard
                icon={KeyRound}
                label="Mes délégations"
                value={mesDelegations.data?.length ?? 0}
                to="/delegations"
                sub="voir le détail"
              />
            )}
          </div>

          {admin && (
            <div className="rounded-xl border border-[#E4E6EB] bg-white">
              <div className="flex items-center justify-between border-b border-[#EAEBF0] px-5 py-4">
                <h2 className="font-display text-[14.5px] font-semibold text-ink">Activité récente</h2>
                <Link to="/audit" className="flex items-center gap-1 text-[12.5px] font-medium text-accent hover:underline">
                  Voir le journal complet <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {recentAudit.length === 0 ? (
                <p className="px-5 py-6 text-[13px] text-[#6B7180]">Aucune action récente.</p>
              ) : (
                <ul className="divide-y divide-[#EAEBF0]">
                  {recentAudit.map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-[13px] font-medium text-ink">{entry.action}</p>
                        <p className="text-[12px] text-[#6B7180]">{entry.email ?? 'Système'}</p>
                      </div>
                      <span className="text-[12px] text-[#9CA0AC]">{formatDateTime(entry.dateAction)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon, label, value, sub, to,
}: { icon: typeof Users; label: string; value: number; sub?: string; to: string }) {
  return (
    <Link to={to} className="group flex flex-col gap-3 rounded-xl border border-[#E4E6EB] bg-white p-5 transition-colors hover:border-accent">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-light text-accent-dark">
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-[#C4C7D0] transition-colors group-hover:text-accent" />
      </div>
      <div>
        <p className="font-display text-[24px] font-semibold leading-none text-ink">{value}</p>
        <p className="mt-1.5 text-[13px] text-[#6B7180]">{label}</p>
        {sub && <p className="text-[11.5px] text-[#9CA0AC]">{sub}</p>}
      </div>
    </Link>
  )
}
