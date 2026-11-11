import { useContext } from 'react'
import { DemandesComptesContext } from '@/context/DemandesComptesContext'

export function useDemandesComptes() {
  const context = useContext(DemandesComptesContext)
  if (!context) throw new Error("useDemandesComptes doit ?tre utilis? ? l'int?rieur de <DemandesComptesProvider>")
  return context
}
