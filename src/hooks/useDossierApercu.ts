import { useContext } from 'react'
import { DossierApercuContext } from '@/context/DossierApercuContext'

export function useDossierApercu() {
  const context = useContext(DossierApercuContext)
  if (!context) throw new Error('useDossierApercu doit être utilisé à l’intérieur de <DossierApercuProvider>')
  return context
}
