// NOUVEAU — Déplacement d'un département vers un nouveau parent, répercuté sur tout
// son sous-arbre. Le sélecteur exclut le département déplacé ET ses descendants : la
// règle métier « impossible de déplacer sous l'un de ses propres descendants » est
// rendue visible par les options elles-mêmes ; le backend reste le garde-fou final.
import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { departementsApi } from '@/api/departements'
import { extractErrorMessage } from '@/api/client'
import { compterSousDepartements, descendantIds, optionsIndente } from '@/utils/hierarchie'
import type { DepartementResponse } from '@/types/departement'

interface DepartementMoveModalProps {
  isOpen: boolean
  departement: DepartementResponse | null
  /** Liste plate complète — déjà chargée par la page Organigramme. */
  flat: DepartementResponse[]
  onClose: () => void
  onSaved: () => void
}

export function DepartementMoveModal({ isOpen, departement, flat, onClose, onSaved }: DepartementMoveModalProps) {
  // '' = racine (aucun parent) — pré-rempli avec le parent actuel pour montrer l'état présent.
  const [idNouveauParent, setIdNouveauParent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setIdNouveauParent(departement?.idParent != null ? String(departement.idParent) : '')
    setError(null)
  }, [isOpen, departement])

  if (!departement) return null

  // Le département lui-même et tout son sous-arbre sont des destinations interdites.
  const interdits = new Set<number>([departement.id, ...Array.from(descendantIds(flat, departement.id))])
  const options = optionsIndente(flat).filter((o) => !interdits.has(o.id))
  const nbSousDepartements = compterSousDepartements(flat, departement.id)
  const dejaRattacheIci =
    idNouveauParent === '' ? departement.idParent == null : Number(idNouveauParent) === departement.idParent

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await departementsApi.deplacer(departement.id, idNouveauParent ? Number(idNouveauParent) : null)
      onSaved()
      onClose()
    } catch (err) {
      setError(extractErrorMessage(err, 'Déplacement impossible — le backend a refusé cette destination.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Déplacer « ${departement.nomDepartement} »`} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}

        <p className="text-[13px] text-[#4B4F5A]">
          Actuellement rattaché à{' '}
          <span className="font-medium text-ink">{departement.nomParent ?? 'la racine (aucun parent)'}</span>.
        </p>

        <Select
          label="Nouveau parent"
          value={idNouveauParent}
          onChange={(e) => setIdNouveauParent(e.target.value)}
        >
          <option value="">— Racine : aucun parent —</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {'\u00A0'.repeat(o.profondeur * 3)}
              {o.nom}
            </option>
          ))}
        </Select>

        <p className="text-[12px] leading-relaxed text-[#6B7180]">
          {nbSousDepartements > 0
            ? `${nbSousDepartements} sous-département${nbSousDepartements > 1 ? 's' : ''} suiv` +
              `${nbSousDepartements > 1 ? 'ont' : ''} automatiquement ce déplacement. `
            : "Ce département n'a aucun sous-département. "}
          Le département lui-même et son sous-arbre n'apparaissent pas dans les destinations :
          un déplacement sous l'un de ses propres descendants est impossible.
        </p>

        {dejaRattacheIci && (
          <p className="text-[12px] text-[#9CA0AC]">Ce département est déjà rattaché à cette destination.</p>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={dejaRattacheIci}>
            Déplacer
          </Button>
        </div>
      </form>
    </Modal>
  )
}
