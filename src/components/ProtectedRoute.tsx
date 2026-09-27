import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/utils/roles'
import { Spinner } from '@/components/ui/Spinner'

interface ProtectedRouteProps {
  children: ReactNode
  /** Seule distinction de rôle qui existe encore côté backend : ADMIN ou non. */
  adminOnly?: boolean
}

export function ProtectedRoute({ children, adminOnly }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <Spinner label="Vérification de la session…" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (adminOnly && !isAdmin(user?.roles)) {
    return <Navigate to="/interdit" replace />
  }

  return <>{children}</>
}
