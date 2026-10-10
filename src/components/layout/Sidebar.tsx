import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Network, KeyRound, UserCog, ScrollText, ShieldCheck, Hourglass, TrendingUp, BadgeCheck, CalendarClock, CalendarDays, AlertTriangle, Bell, SlidersHorizontal, Upload } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/utils/roles'
import { useAlertesNouvelles } from '@/hooks/useAlertesNouvelles'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  adminOnly?: boolean
  badge?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/employes', label: 'Employés', icon: Users },
  { to: '/departements', label: 'Organigramme', icon: Network },
  { to: '/delegations', label: 'Délégations', icon: KeyRound },
  { to: '/utilisateurs', label: 'Comptes utilisateurs', icon: UserCog, adminOnly: true },
  { to: '/audit', label: "Journal d'audit", icon: ScrollText, adminOnly: true },
]

const NAV_GROUPS = [
  { titre: undefined, items: NAV_ITEMS.filter((item) => item.to === '/') },
  { titre: 'Organisation', items: NAV_ITEMS.filter((item) => ['/employes', '/departements', '/delegations'].includes(item.to)) },
  { titre: 'Anticipation RH', items: [
    { to: '/anticipation/alertes', label: 'Alertes', icon: Bell, adminOnly: true, badge: true },
    { to: '/anticipation/calendrier', label: 'Calendrier', icon: CalendarDays, adminOnly: true },
    { to: '/anticipation/retraite', label: 'Départs à la retraite', icon: Hourglass, adminOnly: true },
    { to: '/anticipation/avancement', label: 'Avancements', icon: TrendingUp, adminOnly: true },
    { to: '/anticipation/titularisation', label: 'Titularisations', icon: BadgeCheck, adminOnly: true },
    { to: '/anticipation/fin-contrat', label: 'Fins de contrat', icon: CalendarClock, adminOnly: true },
    { to: '/anticipation/anomalies', label: 'Anomalies', icon: AlertTriangle, adminOnly: true },
    { to: '/anticipation/configuration', label: 'Configuration', icon: SlidersHorizontal, adminOnly: true },
  ] },
  { titre: 'Administration', items: [
    ...NAV_ITEMS.filter((item) => item.to === '/utilisateurs'),
    { to: '/imports', label: 'Imports', icon: Upload, adminOnly: true },
    ...NAV_ITEMS.filter((item) => item.to === '/audit'),
  ] },
]

export function Sidebar() {
  const { user } = useAuth()
  const admin = isAdmin(user?.roles)
  const { count } = useAlertesNouvelles()
  const groupes = NAV_GROUPS.map((groupe) => ({ ...groupe, items: groupe.items.filter((item) => !item.adminOnly || admin) })).filter((groupe) => groupe.items.length > 0)

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

      <nav className="flex-1 space-y-5 overflow-y-auto px-3">
        {groupes.map((groupe) => (
          <div key={groupe.titre ?? 'principal'}>
            {groupe.titre && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-white/50">{groupe.titre}</p>}
            <div className="space-y-1">
              {groupe.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${isActive ? 'bg-ink-light text-white' : 'text-white/65 hover:bg-ink-light hover:text-white'}`
                }>
                  <item.icon className="h-[17px] w-[17px]" />{item.label}
                  {item.badge && count != null && count > 0 && <span aria-label={`${count} alerte${count > 1 ? 's' : ''} nouvelle${count > 1 ? 's' : ''}`} className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold leading-none text-white">{count > 99 ? '99+' : count}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-[11px] text-white/40">Gestion RH & Organigramme · v2.0</p>
      </div>
    </aside>
  )
}
