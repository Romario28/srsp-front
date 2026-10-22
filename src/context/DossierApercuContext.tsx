import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { DossierApercuModal } from '@/pages/dossiers/DossierApercuModal'
import { etatDe, lienDossiers } from '@/utils/dossiers'
import type { EtatDossier } from '@/types/anticipation'
import type { CibleDossier, DossierDTO } from '@/types/dossier'

interface DossierApercuValue {
  /** etatListe : l’état que la ligne affichait au moment du clic. */
  ouvrir: (cible: CibleDossier, etatListe: EtatDossier) => void
  /** L’état de liste, sauf si ce dossier a été modifié dans l’aperçu et que la liste n’a pas été recalculée depuis. */
  etatAffiche: (cible: CibleDossier, etatListe: EtatDossier) => EtatDossier
  version: number
}

// eslint-disable-next-line react-refresh/only-export-components
export const DossierApercuContext = createContext<DossierApercuValue | undefined>(undefined)

const cle = (c: CibleDossier) => `${c.matricule}|${c.type}|${c.dateEcheance}`

/** Une seule modale d’aperçu pour toute l’application. */
export function DossierApercuProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [ouverture, setOuverture] = useState<{ cible: CibleDossier; etatListe: EtatDossier } | null>(null)
  const [surcharges, setSurcharges] = useState<Record<string, { avant: EtatDossier; apres: EtatDossier }>>({})
  const [version, setVersion] = useState(0)

  const ouvrir = useCallback((cible: CibleDossier, etatListe: EtatDossier) => setOuverture({ cible, etatListe }), [])
  const etatAffiche = useCallback((cible: CibleDossier, etatListe: EtatDossier) => {
    const maj = surcharges[cle(cible)]
    return maj && maj.avant === etatListe ? maj.apres : etatListe
  }, [surcharges])
  const valeur = useMemo(() => ({ ouvrir, etatAffiche, version }), [ouvrir, etatAffiche, version])

  const apresModification = (maj: DossierDTO) => {
    if (ouverture) setSurcharges((c) => ({ ...c, [cle(ouverture.cible)]: { avant: ouverture.etatListe, apres: etatDe(maj) } }))
    setVersion((v) => v + 1)
    setOuverture(null)
  }
  const ouvrirDansDossiers = (dossier: DossierDTO) => {
    setOuverture(null)
    navigate(lienDossiers(dossier))
  }

  return (
    <DossierApercuContext.Provider value={valeur}>
      {children}
      <DossierApercuModal cible={ouverture?.cible ?? null} onClose={() => setOuverture(null)} onMaj={apresModification} onOuvrirDansDossiers={ouvrirDansDossiers} />
    </DossierApercuContext.Provider>
  )
}
