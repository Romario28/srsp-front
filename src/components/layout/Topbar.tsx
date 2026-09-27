import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/utils/roles'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
}

export function Topbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  if (!user) return null

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-[#E4E6EB] bg-white px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-[13.5px] font-medium text-ink">{user.nomComplet}</p>
          <p className="text-[12px] text-[#6B7180]">
            {isAdmin(user.roles) ? 'Administrateur' : user.nomDepartement || 'Aucun département'}
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-light text-[13px] font-semibold text-accent-dark">
          {initials(user.nomComplet)}
        </div>
        <button
          onClick={handleLogout}
          aria-label="Se déconnecter"
          title="Se déconnecter"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6B7180] hover:bg-[#F0F1F4] hover:text-danger"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
