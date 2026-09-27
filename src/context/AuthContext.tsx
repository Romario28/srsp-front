import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { authApi } from '@/api/auth'
import { setUnauthorizedHandler, tokenStorage } from '@/api/client'
import type { LoginRequest, MeResponse } from '@/types/auth'

interface AuthContextValue {
  user: MeResponse | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginRequest) => Promise<void>
  logout: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const clearSession = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // session locale effacée même si l'appel réseau échoue
    } finally {
      clearSession()
    }
  }, [clearSession])

  const login = useCallback(async (payload: LoginRequest) => {
    const resp = await authApi.login(payload)
    tokenStorage.set(resp.token)
    const me = await authApi.me()
    setUser(me)
  }, [])

  useEffect(() => {
    const token = tokenStorage.get()
    if (!token) {
      setIsLoading(false)
      return
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))
    return () => setUnauthorizedHandler(() => {})
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
