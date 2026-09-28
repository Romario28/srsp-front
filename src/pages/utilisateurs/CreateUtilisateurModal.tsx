import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { utilisateursApi } from '@/api/utilisateurs'
import { employesApi } from '@/api/employes'
import { extractErrorMessage } from '@/api/client'
import type { EmployeResponse } from '@/types/employe'

interface CreateUtilisateurModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

// Seuls ces 2 rôles existent — "chef"/"RH" ne sont jamais choisis ici,
// ils découlent de la structure (Departement.chef) ou d'une délégation.
const ROLES = ['ROLE_EMPLOYE', 'ROLE_ADMIN'] as const
const ROLE_LABELS: Record<string, string> = { ROLE_EMPLOYE: 'Employé', ROLE_ADMIN: 'Administrateur' }

export function CreateUtilisateurModal({ isOpen, onClose, onSaved }: CreateUtilisateurModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [idEmploye, setIdEmploye] = useState('')
  const [roles, setRoles] = useState<string[]>(['ROLE_EMPLOYE'])
  const [employesSansCompte, setEmployesSansCompte] = useState<EmployeResponse[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setEmail('')
    setPassword('')
    setIdEmploye('')
    setRoles(['ROLE_EMPLOYE'])
    setError(null)
    // ADMIN voit tout — donc cette liste couvre bien tous les employés sans compte,
    // pas seulement ceux du sous-arbre de l'admin (qui est... tout, de toute façon).
    employesApi
      .getAll(0, 200)
      // MODIFIÉ — le champ s'appelle « aunCompte » dans EmployeResponse : le filtre
      // testait « aUnCompte » (undefined) et faisait apparaître TOUS les employés
      // comme disponibles dans le sélecteur.
      .then((page) => setEmployesSansCompte(page.content.filter((e) => !e.aunCompte)))
      .catch(() => {})
  }, [isOpen])

  const toggleRole = (role: string) => {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await utilisateursApi.create({
        email,
        password,
        idEmploye: idEmploye ? Number(idEmploye) : null,
        roles,
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(extractErrorMessage(err, 'Impossible de créer le compte'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouveau compte utilisateur" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}

        <Input
          label="Adresse e-mail" type="email" required value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@entreprise.mg"
        />
        <Input
          label="Mot de passe" type="password" required minLength={8} value={password}
          onChange={(e) => setPassword(e.target.value)} hint="8 caractères minimum"
        />

        <Select label="Employé lié" value={idEmploye} onChange={(e) => setIdEmploye(e.target.value)}>
          <option value="">Aucun (compte système)</option>
          {employesSansCompte.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.prenom} {emp.nom} ({emp.matricule}) — {emp.nomDepartement ?? 'sans département'}
            </option>
          ))}
        </Select>

        {/* AJOUTÉ — lisibilité : combien d'employés sans compte sont réellement proposés. */}
        <span className="-mt-2 text-[12px] text-[#6B7180]">
          {employesSansCompte.length === 0
            ? 'Aucun employé sans compte dans la liste visible — le compte restera non rattaché.'
            : `${employesSansCompte.length} employé${employesSansCompte.length > 1 ? 's' : ''} sans compte proposé${
                employesSansCompte.length > 1 ? 's' : ''
              } (200 premiers — pagination serveur à venir).`}
        </span>

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink">
            Rôles <span className="text-danger">*</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((role) => {
              const active = roles.includes(role)
              return (
                <button
                  key={role} type="button" onClick={() => toggleRole(role)}
                  className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                    active
                      ? 'border-accent bg-accent-light text-accent-dark'
                      : 'border-[#DADCE3] bg-white text-[#6B7180] hover:border-accent'
                  }`}
                >
                  {ROLE_LABELS[role]}
                </button>
              )
            })}
          </div>
          <span className="text-[12px] text-[#6B7180]">
            Aucune sélection = « Employé » par défaut. La capacité de gérer un sous-arbre (chef,
            RH) ne se règle pas ici — via l'organigramme (chef) ou une délégation.
          </span>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Annuler</Button>
          <Button type="submit" isLoading={isSubmitting}>Créer le compte</Button>
        </div>
      </form>
    </Modal>
  )
}
