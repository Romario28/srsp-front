import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { departementsApi } from '@/api/departements'
import { extractErrorMessage } from '@/api/client'
import { NIVEAUX_SUGGERES } from '@/types/departement'
import type { DepartementResponse } from '@/types/departement'

interface DepartementFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  /** Département parent pré-sélectionné (ouverture depuis "Ajouter un sous-département"). */
  parent?: DepartementResponse | null
}

export function DepartementFormModal({ isOpen, onClose, onSaved, parent }: DepartementFormModalProps) {
  const [nomDepartement, setNomDepartement] = useState('')
  const [niveau, setNiveau] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setNomDepartement('')
    setNiveau('')
    setDescription('')
    setError(null)
  }, [isOpen, parent])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await departementsApi.create({
        nomDepartement,
        niveau,
        idDepartementParent: parent?.id ?? null,
        description: description || undefined,
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(extractErrorMessage(err, 'Impossible de créer le département'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={parent ? `Nouveau sous-département de ${parent.nomDepartement}` : 'Nouveau département racine'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}

        <Input
          label="Nom du département"
          required
          maxLength={100}
          value={nomDepartement}
          onChange={(e) => setNomDepartement(e.target.value)}
          placeholder="Ex : Direction des Systèmes d'Information"
        />

        <Select label="Niveau" required value={niveau} onChange={(e) => setNiveau(e.target.value)}>
          <option value="">Sélectionner…</option>
          {NIVEAUX_SUGGERES.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </Select>

        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optionnel"
        />

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Annuler</Button>
          <Button type="submit" isLoading={isSubmitting}>Créer le département</Button>
        </div>
      </form>
    </Modal>
  )
}
