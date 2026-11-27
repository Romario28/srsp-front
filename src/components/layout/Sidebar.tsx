import { useEffect, useId, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, UserCog, UserCheck, Building2, ScrollText, ShieldCheck, Hourglass, TrendingUp, CalendarClock, CalendarDays, AlertTriangle, SlidersHorizontal, Upload, UserPlus, ClipboardList, User, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin, isAgent, peutVoirAnticipation, peutVoirUtilisateurs } from '@/utils/roles'
import { useCompteursMenu } from '@/hooks/useCompteursMenu'   // [NOUVEAU]
import { useDemandesComptes } from '@/hooks/useDemandesComptes'
import { APP_NAME, APP_NAME_LONG, afficherIntegration } from '@/config/app'

type Visible = (roles: string[] | undefined) => boolean
type CleBadge = 'dossiers' | 'anomalies' | 'demandes'   // [MODIFIÉ] était : 'demandes'
interface NavFeuille {
  to: string
  label: string
  icon: typeof LayoutDashboard
  visible: Visible
  badge?: CleBadge
}
interface NavEnfant { to: string; label: string; visible: Visible }
interface NavParent { label: string; icon: typeof LayoutDashboard; enfants: NavEnfant[] }
type NavEntree = NavFeuille | NavParent
const estParent = (entree: NavEntree): entree is NavParent => 'enfants' in entree

// [MODIFIÉ] libellé lu par les lecteurs d'écran, par pastille
const LIBELLE_BADGE: Record<CleBadge, (n: number) => string> = {
  dossiers: (n) => `${n} dossier${n > 1 ? 's' : ''} à traiter ou en retard`,
  anomalies: (n) => `${n} anomalie${n > 1 ? 's' : ''} détectée${n > 1 ? 's' : ''}`,
  demandes: (n) => `${n} demande${n > 1 ? 's' : ''} de compte en attente`,
}

const NAV_GROUPS: { titre?: string; items: NavEntree[] }[] = [
  { items: [
    { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, visible: peutVoirAnticipation },
    { to: '/mon-espace', label: 'Mon Espace', icon: User, visible: isAgent },
  ] },
  { titre: 'Anticipation RH', items: [
    { to: '/anticipation/dossiers', label: 'Dossiers', icon: ClipboardList, visible: peutVoirAnticipation, badge: 'dossiers' },   // [MODIFIÉ] + badge
    { to: '/anticipation/calendrier', label: 'Calendrier', icon: CalendarDays, visible: peutVoirAnticipation },
    { to: '/anticipation/retraite', label: 'Départs à la retraite', icon: Hourglass, visible: peutVoirAnticipation },
    { label: 'Changements des situations', icon: TrendingUp, enfants: [
      { to: '/anticipation/avancement', label: "Avancements", visible: peutVoirAnticipation },
      { to: '/anticipation/avancement-classe', label: 'Avancement de classe', visible: peutVoirAnticipation },
      { to: '/anticipation/titularisation', label: 'Titularisation', visible: peutVoirAnticipation },
    ] },
    { to: '/anticipation/fin-contrat', label: 'Fins de contrat', icon: CalendarClock, visible: peutVoirAnticipation },
    { to: '/anticipation/integration', label: 'Intégrations', icon: UserPlus,
      visible: (roles) => afficherIntegration && peutVoirAnticipation(roles) },
    { to: '/anticipation/anomalies', label: 'Anomalies', icon: AlertTriangle, visible: peutVoirAnticipation, badge: 'anomalies' },   // [MODIFIÉ] + badge
    { to: '/anticipation/configuration', label: 'Configuration', icon: SlidersHorizontal, visible: isAdmin },
  ] },
  { titre: 'Administration', items: [
    { to: '/utilisateurs', label: 'Gestion des utilisateurs', icon: UserCog, visible: peutVoirUtilisateurs },
    { to: '/demandes-comptes', label: 'Demandes de comptes', icon: UserCheck, visible: peutVoirUtilisateurs, badge: 'demandes' },
    { to: '/departements', label: 'Départements', icon: Building2, visible: isAdmin },
    { to: '/imports', label: 'Imports', icon: Upload, visible: isAdmin },
    { to: '/audit', label: "Journal d'audit", icon: ScrollText, visible: isAdmin },
  ] },
]

/** Menu parent : le chevron indique qu'il se déroule ; il reste ouvert, avec l'état actif, sur l'une de ses pages. */
function MenuParent({ parent, roles }: { parent: NavParent; roles: string[] | undefined }) {
  const { pathname } = useLocation()
  const enfants = parent.enfants.filter((enfant) => enfant.visible(roles))
  const actif = enfants.some((enfant) => pathname === enfant.to || pathname.startsWith(`${enfant.to}/`))
  const [ouvert, setOuvert] = useState(actif)
  const idPanneau = useId()
  useEffect(() => { if (actif) setOuvert(true) }, [actif])
  const affiche = ouvert || actif
  return (
    <div>
      <button type="button" aria-expanded={affiche} aria-controls={idPanneau}
        onClick={() => { if (!actif) setOuvert((courant) => !courant) }}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13.5px] font-medium transition-colors ${actif ? 'bg-ink-light text-white' : 'text-white/65 hover:bg-ink-light hover:text-white'}`}>
        <parent.icon className="h-[17px] w-[17px]" />{parent.label}
        <ChevronDown aria-hidden="true" className={`ml-auto h-4 w-4 transition-transform ${affiche ? 'rotate-180' : ''}`} />
      </button>
      {affiche && (
        <div id={idPanneau} className="mt-1 space-y-1">
          {enfants.map((enfant) => (
            <NavLink key={enfant.to} to={enfant.to} className={({ isActive }) =>
              `flex items-center rounded-lg py-2 pl-10 pr-3 text-[13px] font-medium transition-colors ${isActive ? 'bg-ink-lighter text-white' : 'text-white/60 hover:bg-ink-light hover:text-white'}`
            }>{enfant.label}</NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const { user } = useAuth()
  const { count: demandes } = useDemandesComptes()
  const { dossiers, anomalies } = useCompteursMenu()   // [NOUVEAU]
  const compteurs: Record<CleBadge, number | null> = { dossiers, anomalies, demandes }   // [MODIFIÉ]
  const groupes = NAV_GROUPS
    .map((groupe) => ({
      ...groupe,
      items: groupe.items.filter((item) => estParent(item) ? item.enfants.some((enfant) => enfant.visible(user?.roles)) : item.visible(user?.roles)),
    }))
    .filter((groupe) => groupe.items.length > 0)

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col bg-ink text-white">
      <div className="flex items-center gap-2.5 px-5 py-6" title={APP_NAME_LONG}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <ShieldCheck className="h-4.5 w-4.5 text-white" />
        </div>
        <p className="font-display text-[16px] font-semibold leading-none tracking-wide">{APP_NAME}</p>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {groupes.map((groupe) => (
          <div key={groupe.titre ?? 'principal'}>
            {groupe.titre && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-white/50">{groupe.titre}</p>}
            <div className="space-y-1">
              {groupe.items.map((item) => {
                if (estParent(item)) return <MenuParent key={item.label} parent={item} roles={user?.roles} />
                const n = item.badge ? compteurs[item.badge] : null
                return (
                  <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${isActive ? 'bg-ink-light text-white' : 'text-white/65 hover:bg-ink-light hover:text-white'}`
                  }>
                    <item.icon className="h-[17px] w-[17px]" />{item.label}
                    {/* pastille : masquée quand le compteur est inconnu ou nul */}
                    {item.badge && n != null && n > 0 && <span aria-label={LIBELLE_BADGE[item.badge](n)} className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold leading-none text-white">{n > 99 ? '99+' : n}</span>}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
