import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { employesApi } from '@/api/employes'
import { departementsApi } from '@/api/departements'
import { extractErrorMessage } from '@/api/client'
import { toDateInputValue } from '@/utils/date'
import type { EmployeResponse } from '@/types/employe'
import type { DepartementResponse } from '@/types/departement'

interface EmployeFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  employe?: EmployeResponse | null
}

interface FormState {
  matricule: string
  nom: string
  prenom: string
  poste: string
  idDepartement: string
  dateEmbauche: string
}

const EMPTY_FORM: FormState = { matricule: '', nom: '', prenom: '', poste: '', idDepartement: '', dateEmbauche: '' }

export function EmployeFormModal({ isOpen, onClose, onSaved, employe }: EmployeFormModalProps) {
  const isEdit = !!employe
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [departements, setDepartements] = useState<DepartementResponse[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    setForm(
      employe
        ? {
            matricule: employe.matricule,
            nom: employe.nom,
            prenom: employe.prenom,
            poste: employe.poste ?? '',
            idDepartement: employe.idDepartement != null ? String(employe.idDepartement) : '',
            dateEmbauche: toDateInputValue(employe.dateEmbauche),
          }
        : EMPTY_FORM
    )
    departementsApi.getAll().then(setDepartements).catch(() => {})
  }, [isOpen, employe])

  const setField = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      if (isEdit && employe) {
        await employesApi.update(employe.id, {
          nom: form.nom,
          prenom: form.prenom,
          poste: form.poste,
          idDepartement: form.idDepartement ? Number(form.idDepartement) : undefined,
          dateEmbauche: form.dateEmbauche || undefined,
        })
      } else {
        await employesApi.create({
          matricule: form.matricule,
          nom: form.nom,
          prenom: form.prenom,
          poste: form.poste,
          idDepartement: Number(form.idDepartement),
          dateEmbauche: form.dateEmbauche || undefined,
        })
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(extractErrorMessage(err, "Impossible d'enregistrer l'employé — vérifiez vos droits sur ce département"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Modifier l'employé" : 'Nouvel employé'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}

        <Input
          label="Matricule" required value={form.matricule} onChange={setField('matricule')}
          disabled={isEdit} hint={isEdit ? 'Non modifiable' : undefined} maxLength={20}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nom" required value={form.nom} onChange={setField('nom')} maxLength={100} />
          <Input label="Prénom" required value={form.prenom} onChange={setField('prenom')} maxLength={100} />
        </div>
        <Input label="Poste" required value={form.poste} onChange={setField('poste')} maxLength={100} />

        <Select label="Département" required value={form.idDepartement} onChange={setField('idDepartement')}>
          <option value="">Sélectionner…</option>
          {departements.map((d) => (
            <option key={d.id} value={d.id}>
              {'—'.repeat(d.chemin ? (d.chemin.match(/\//g)?.length ?? 1) - 1 : 0)} {d.nomDepartement}
            </option>
          ))}
        </Select>

        <Input label="Date d'embauche" type="date" value={form.dateEmbauche} onChange={setField('dateEmbauche')} />

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Annuler</Button>
          <Button type="submit" isLoading={isSubmitting}>{isEdit ? 'Enregistrer' : "Créer l'employé"}</Button>
        </div>
      </form>
    </Modal>
  )
}
