// MODIFIÉ — le nom d'utilisateur ouvre désormais un menu profil : identité, rôle(s),
// département, dernière connexion (donnée déjà renvoyée par GET /api/auth/me) et
// déconnexion, regroupés au même endroit.
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin, roleLabel } from '@/utils/roles'
import { formatDateTime } from '@/utils/date'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
}

export function Topbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOuvert, setMenuOuvert] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fermeture du menu au clic extérieur.
  useEffect(() => {
    if (!menuOuvert) return
    const auClic = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOuvert(false)
    }
    document.addEventListener('mousedown', auClic)
    return () => document.removeEventListener('mousedown', auClic)
  }, [menuOuvert])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  if (!user) return null

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-[#E4E6EB] bg-white px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOuvert((v) => !v)}
            aria-expanded={menuOuvert}
            aria-haspopup="menu"
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-[#F0F1F4]"
          >
            <div className="text-right">
              <p className="text-[13.5px] font-medium text-ink">{user.nomComplet}</p>
              <p className="text-[12px] text-[#6B7180]">
                {isAdmin(user.roles) ? 'Administrateur' : user.nomDepartement || 'Aucun département'}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-light text-[13px] font-semibold text-accent-dark">
              {initials(user.nomComplet)}
            </div>
            <ChevronDown className={`h-4 w-4 text-[#9CA0AC] transition-transform ${menuOuvert ? 'rotate-180' : ''}`} />
          </button>

          {menuOuvert && (
            <div
              role="menu"
              className="absolute right-0 top-full z-20 mt-2 w-80 rounded-xl border border-[#E4E6EB] bg-white p-4 shadow-lg"
            >
              <p className="font-display text-[14px] font-semibold text-ink">{user.nomComplet}</p>
              <p className="text-[12.5px] text-[#6B7180]">{user.email}</p>

              <dl className="mt-3 space-y-2 border-t border-[#EAEBF0] pt-3 text-[12.5px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#6B7180]">Rôle(s)</dt>
                  <dd className="text-right font-medium text-ink">{user.roles.map(roleLabel).join(', ')}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#6B7180]">Département</dt>
                  <dd className="text-right font-medium text-ink">{user.nomDepartement || '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#6B7180]">Dernière connexion</dt>
                  <dd className="text-right font-medium text-ink">
                    {user.dateDerniereConnexion ? formatDateTime(user.dateDerniereConnexion) : '—'}
                  </dd>
                </div>
              </dl>

              <button
                onClick={handleLogout}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#E4E6EB] px-3 py-2 text-[13px] font-medium text-danger transition-colors hover:bg-danger-light"
              >
                <LogOut className="h-4 w-4" /> Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
