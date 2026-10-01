import axios from 'axios'
import type { ApiErrorBody } from '@/types/api'

const TOKEN_KEY = 'gestion_token'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.clear()
      onUnauthorized?.()
    }
    return Promise.reject(error)
  }
)

/** Le backend renvoie soit { error: "..." }, soit { message: "...", code: "..." } (BusinessException). */
export function extractErrorMessage(err: unknown, fallback = 'Une erreur est survenue'): string {
  if (axios.isAxiosError<ApiErrorBody>(err)) {
    return err.response?.data?.error ?? err.response?.data?.message ?? err.message ?? fallback
  }
  if (err instanceof Error) return err.message
  return fallback
}

export function extractErrorCode(err: unknown): string | undefined {
  return axios.isAxiosError<ApiErrorBody>(err) ? err.response?.data?.code : undefined
}

export function estErreurReseau(err: unknown): boolean {
  return axios.isAxiosError(err) && !err.response
}
