import { useContext } from 'react'
import { AlertesNouvellesContext } from '@/context/AlertesNouvellesContext'

export function useAlertesNouvelles() {
  const context = useContext(AlertesNouvellesContext)
  if (!context) throw new Error("useAlertesNouvelles doit être utilisé à l'intérieur de <AlertesNouvellesProvider>")
  return context
}
