import { useContext } from 'react'
import { CompteursMenuContext } from '@/context/CompteursMenuContext'

export function useCompteursMenu() {
  const context = useContext(CompteursMenuContext)
  if (!context) throw new Error("useCompteursMenu doit être utilisé à l'intérieur de <CompteursMenuProvider>")
  return context
}
