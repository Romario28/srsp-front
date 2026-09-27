import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Network, KeyRound, UserCog, ScrollText, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/utils/roles'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/employes', label: 'Employés', icon: Users },
  { to: '/departements', label: 'Organigramme', icon: Network },
  { to: '/delegations', label: 'Délégations', icon: KeyRound },
  { to: '/utilisateurs', label: 'Comptes utilisateurs', icon: UserCog, adminOnly: true },
  { to: '/audit', label: "Journal d'audit", icon: ScrollText, adminOnly: true },
]

export function Sidebar() {
  const { user } = useAuth()
  const admin = isAdmin(user?.roles)

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col bg-ink text-white">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <ShieldCheck className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <p className="font-display text-[14px] font-semibold leading-none">Gestion RH</p>
          <p className="mt-1 text-[11px] leading-none text-white/50">& Organigramme</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.filter((item) => !item.adminOnly || admin).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                isActive ? 'bg-ink-light text-white' : 'text-white/65 hover:bg-ink-light hover:text-white'
              }`
            }
          >
            <item.icon className="h-[17px] w-[17px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-[11px] text-white/40">Gestion RH & Organigramme · v2.0</p>
      </div>
    </aside>
  )
}
