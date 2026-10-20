import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Spinner } from '@/components/ui/Spinner'
import { useFetch } from '@/hooks/useFetch'
import { dossiersApi } from '@/api/dossiers'
import { FormulaireDossier } from './DossierFormModal'
import type { CibleDossier, DossierDTO } from '@/types/dossier'

interface DossierApercuModalProps {
  cible: CibleDossier | null
  onClose: () => void
  onMaj: (maj: DossierDTO) => void
  onOuvrirDansDossiers: (dossier: DossierDTO) => void
}

export function DossierApercuModal({ cible, onClose, onMaj, onOuvrirDansDossiers }: DossierApercuModalProps) {
  return (
    <Modal isOpen={cible != null} onClose={onClose} maxWidth="max-w-2xl" title="Aperçu du dossier">
      {cible && <Contenu key={`${cible.matricule}|${cible.type}|${cible.dateEcheance}`} cible={cible}
        onClose={onClose} onMaj={onMaj} onOuvrirDansDossiers={onOuvrirDansDossiers} />}
    </Modal>
  )
}

function Contenu({ cible, onClose, onMaj, onOuvrirDansDossiers }: Omit<DossierApercuModalProps, 'cible'> & { cible: CibleDossier }) {
  const { data: dossier, isLoading, error, reload } = useFetch(
    () => dossiersApi.parEcheance(cible), [cible.matricule, cible.type, cible.dateEcheance],
  )

  if (error) return (
    <div className="flex flex-col gap-4">
      <ErrorBanner message={error} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={reload}>Réessayer</Button>
        <Button variant="secondary" onClick={onClose}>Fermer</Button>
      </div>
    </div>
  )
  if (isLoading && !dossier) return <Spinner label="Chargement du dossier…" />
  if (!dossier) return null
  return <FormulaireDossier dossier={dossier} onClose={onClose} onChange={onMaj} onOuvrirDansDossiers={() => onOuvrirDansDossiers(dossier)} />
}
