import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { departementsApi } from '@/api/departements'
import { extractErrorMessage } from '@/api/client'
import type { DepartementDTO } from '@/types/departement'

interface DepartementFormModalProps {
  isOpen: boolean
  /** null = création. */
  departement: DepartementDTO | null
  onClose: () => void
  onSaved: () => void
}

export function DepartementFormModal({ isOpen, departement, onClose, onSaved }: DepartementFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg" title={departement ? 'Modifier le département' : 'Nouveau département'}>
      {isOpen && <Formulaire key={departement?.id ?? 'nouveau'} departement={departement} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  )
}

function Formulaire({ departement, onClose, onSaved }: Omit<DepartementFormModalProps, 'isOpen'>) {
  const [libelle, setLibelle] = useState(departement?.libelle ?? '')
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const propre = libelle.trim()
  const inchange = departement != null && propre === departement.libelle

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (propre === '' || inchange) return
    setEnCours(true)
    setErreur(null)
    try {
      if (departement) await departementsApi.modifier(departement.id, propre)
      else await departementsApi.creer(propre)
      onSaved()
    } catch (err) {
      setErreur(extractErrorMessage(err, "Impossible d'enregistrer le département"))
    } finally {
      setEnCours(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {erreur && <ErrorBanner message={erreur} />}
      <Input label="Libellé" required value={libelle} onChange={(e) => setLibelle(e.target.value)} maxLength={200}
        placeholder="(SRSP) Service Regional de la Solde et des Pensions"
        hint="Il apparaît dans la liste de la demande de compte et sur les documents PDF." />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={enCours}>Annuler</Button>
        <Button type="submit" isLoading={enCours} disabled={propre === '' || inchange}>{departement ? 'Enregistrer' : 'Ajouter'}</Button>
      </div>
    </form>
  )
}
