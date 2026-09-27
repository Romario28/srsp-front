import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { porteesDelegueesApi } from '@/api/porteesDeleguees'
import { departementsApi } from '@/api/departements'
import { utilisateursApi } from '@/api/utilisateurs'
import { extractErrorMessage } from '@/api/client'
import { todayInputValue } from '@/utils/date'
import type { DepartementResponse } from '@/types/departement'
import type { TypeAcces } from '@/types/porteeDeleguee'
import type { UtilisateurDTO } from '@/types/utilisateur'

interface CreateDelegationModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  /** Pré-remplit le champ utilisateur cible si on ouvre depuis la fiche de quelqu'un. */
  idUtilisateurPrerempli?: number | null
}

export function CreateDelegationModal({ isOpen, onClose, onSaved, idUtilisateurPrerempli }: CreateDelegationModalProps) {
  const [idUtilisateur, setIdUtilisateur] = useState('')
  const [idDepartement, setIdDepartement] = useState('')
  const [typeAcces, setTypeAcces] = useState<TypeAcces>('LECTURE_ECRITURE')
  const [dateDebut, setDateDebut] = useState(todayInputValue())
  const [dateFin, setDateFin] = useState('')
  const [departements, setDepartements] = useState<DepartementResponse[]>([])
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurDTO[] | null>(null) // null = pas encore su si dispo
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setIdUtilisateur(idUtilisateurPrerempli != null ? String(idUtilisateurPrerempli) : '')
    setIdDepartement('')
    setTypeAcces('LECTURE_ECRITURE')
    setDateDebut(todayInputValue())
    setDateFin('')
    setError(null)
    departementsApi.getAll().then(setDepartements).catch(() => {})
    // GET /api/utilisateurs est réservé ADMIN — un chef qui délègue sur son propre
    // sous-arbre n'y a pas accès. On tente quand même : ça marche pour un ADMIN,
    // et on retombe proprement sur la saisie manuelle d'ID si ça échoue (403).
    utilisateursApi
      .getAll(0, 500)
      .then((page) => setUtilisateurs(page.content))
      .catch(() => setUtilisateurs([]))
  }, [isOpen, idUtilisateurPrerempli])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await porteesDelegueesApi.accorder({
        idUtilisateur: Number(idUtilisateur),
        idDepartement: Number(idDepartement),
        typeAcces,
        dateDebut,
        dateFin: dateFin || null,
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(extractErrorMessage(err, "Impossible d'accorder cette délégation — avez-vous l'écriture sur ce département ?"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Accorder une délégation" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}

        {utilisateurs && utilisateurs.length > 0 ? (
          <Select
            label="Utilisateur bénéficiaire"
            required
            value={idUtilisateur}
            onChange={(e) => setIdUtilisateur(e.target.value)}
          >
            <option value="">Sélectionner…</option>
            {utilisateurs.map((u) => (
              <option key={u.id} value={u.id}>
                {u.email}{u.nomDepartement ? ` — ${u.nomDepartement}` : ''}
              </option>
            ))}
          </Select>
        ) : (
          <Input
            label="ID de l'utilisateur bénéficiaire"
            type="number"
            required
            value={idUtilisateur}
            onChange={(e) => setIdUtilisateur(e.target.value)}
            hint={
              utilisateurs === null
                ? 'Chargement de la liste des comptes…'
                : "La liste des comptes n'est accessible qu'aux administrateurs — indiquez l'ID communiqué par la personne concernée."
            }
          />
        )}

        <Select label="Département (+ son sous-arbre)" required value={idDepartement} onChange={(e) => setIdDepartement(e.target.value)}>
          <option value="">Sélectionner…</option>
          {departements.map((d) => (
            <option key={d.id} value={d.id}>{d.nomDepartement} ({d.niveau})</option>
          ))}
        </Select>

        <Select
          label="Type d'accès"
          required
          value={typeAcces}
          onChange={(e) => setTypeAcces(e.target.value as TypeAcces)}
        >
          <option value="LECTURE">Lecture seule</option>
          <option value="LECTURE_ECRITURE">Lecture et écriture</option>
        </Select>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Début" type="date" required value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
          <Input
            label="Fin"
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            hint="Vide = permanente"
          />
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Annuler</Button>
          <Button type="submit" isLoading={isSubmitting}>Accorder</Button>
        </div>
      </form>
    </Modal>
  )
}
