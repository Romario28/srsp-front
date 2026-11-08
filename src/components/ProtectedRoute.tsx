import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui/Spinner'

interface ProtectedRouteProps {
  children: ReactNode
  /** Profils admis. Absent : tout compte authentifié. */
  autorise?: (roles: string[] | undefined) => boolean
}

export function ProtectedRoute({ children, autorise }: ProtectedRouteProps) {
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

  if (autorise && !autorise(user?.roles)) {
    return <Navigate to="/interdit" replace />
  }

  return <>{children}</>
}
