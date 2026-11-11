import { NavLink } from 'react-router-dom'
import { LayoutDashboard, UserCog, UserCheck, ScrollText, ShieldCheck, Hourglass, TrendingUp, GraduationCap, BadgeCheck, CalendarClock, CalendarDays, AlertTriangle, Bell, SlidersHorizontal, Upload, UserPlus, ClipboardList, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin, isAgent, peutVoirAnticipation, peutVoirUtilisateurs } from '@/utils/roles'
import { useAlertesNouvelles } from '@/hooks/useAlertesNouvelles'
import { useDemandesComptes } from '@/hooks/useDemandesComptes'
import { APP_NAME, APP_NAME_LONG, APP_VERSION } from '@/config/app'

type Visible = (roles: string[] | undefined) => boolean
type CleBadge = 'alertes' | 'demandes'
interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  visible: Visible
  badge?: CleBadge
}

const LIBELLE_BADGE: Record<CleBadge, (n: number) => string> = {
  alertes: (n) => `${n} alerte${n > 1 ? 's' : ''} nouvelle${n > 1 ? 's' : ''}`,
  demandes: (n) => `${n} demande${n > 1 ? 's' : ''} de compte en attente`,
}

const NAV_GROUPS: { titre?: string; items: NavItem[] }[] = [
  { items: [
    { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, visible: peutVoirAnticipation },
    { to: '/mon-espace', label: 'Mon Espace', icon: User, visible: isAgent },
  ] },
  { titre: 'Anticipation RH', items: [
    { to: '/anticipation/alertes', label: 'Alertes', icon: Bell, visible: peutVoirAnticipation, badge: 'alertes' },
    { to: '/anticipation/dossiers', label: 'Dossiers', icon: ClipboardList, visible: peutVoirAnticipation },
    { to: '/anticipation/calendrier', label: 'Calendrier', icon: CalendarDays, visible: peutVoirAnticipation },
    { to: '/anticipation/retraite', label: 'Départs à la retraite', icon: Hourglass, visible: peutVoirAnticipation },
    { to: '/anticipation/avancement', label: 'Avancements', icon: TrendingUp, visible: peutVoirAnticipation },
    { to: '/anticipation/avancement-classe', label: 'Avancements de classe', icon: GraduationCap, visible: peutVoirAnticipation },
    { to: '/anticipation/titularisation', label: 'Titularisations', icon: BadgeCheck, visible: peutVoirAnticipation },
    { to: '/anticipation/fin-contrat', label: 'Fins de contrat', icon: CalendarClock, visible: peutVoirAnticipation },
    { to: '/anticipation/integration', label: 'Intégrations', icon: UserPlus, visible: peutVoirAnticipation },
    { to: '/anticipation/anomalies', label: 'Anomalies', icon: AlertTriangle, visible: peutVoirAnticipation },
    { to: '/anticipation/configuration', label: 'Configuration', icon: SlidersHorizontal, visible: isAdmin },
  ] },
  { titre: 'Administration', items: [
    { to: '/utilisateurs', label: 'Gestion des utilisateurs', icon: UserCog, visible: peutVoirUtilisateurs },
    { to: '/demandes-comptes', label: 'Demandes de comptes', icon: UserCheck, visible: peutVoirUtilisateurs, badge: 'demandes' },
    { to: '/imports', label: 'Imports', icon: Upload, visible: isAdmin },
    { to: '/audit', label: "Journal d'audit", icon: ScrollText, visible: isAdmin },
  ] },
]

export function Sidebar() {
  const { user } = useAuth()
  const { count: alertes } = useAlertesNouvelles()
  const { count: demandes } = useDemandesComptes()
  const compteurs: Record<CleBadge, number | null> = { alertes, demandes }
  const groupes = NAV_GROUPS
    .map((groupe) => ({ ...groupe, items: groupe.items.filter((item) => item.visible(user?.roles)) }))
    .filter((groupe) => groupe.items.length > 0)

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col bg-ink text-white">
      <div className="flex items-center gap-2.5 px-5 py-6" title={APP_NAME_LONG}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <ShieldCheck className="h-4.5 w-4.5 text-white" />
        </div>
        <p className="font-display text-[16px] font-semibold leading-none tracking-wide">{APP_NAME}</p>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3">
        {groupes.map((groupe) => (
          <div key={groupe.titre ?? 'principal'}>
            {groupe.titre && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-white/50">{groupe.titre}</p>}
            <div className="space-y-1">
              {groupe.items.map((item) => {
                const n = item.badge ? compteurs[item.badge] : null
                return (
                  <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${isActive ? 'bg-ink-light text-white' : 'text-white/65 hover:bg-ink-light hover:text-white'}`
                  }>
                    <item.icon className="h-[17px] w-[17px]" />{item.label}
                    {item.badge && n != null && n > 0 && <span aria-label={LIBELLE_BADGE[item.badge](n)} className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold leading-none text-white">{n > 99 ? '99+' : n}</span>}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-[11px] text-white/40">{APP_NAME} - v{APP_VERSION}</p>
      </div>
    </aside>
  )
}