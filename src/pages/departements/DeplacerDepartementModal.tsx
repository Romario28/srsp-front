import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { departementsApi } from '@/api/departements'
import { extractErrorMessage } from '@/api/client'
import { buildTree, type TreeNode } from './DepartementTree'
import type { DepartementResponse } from '@/types/departement'

interface DeplacerDepartementModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  departement: DepartementResponse | null
  departements: DepartementResponse[]
}

const RACINE = 'RACINE'
function aplatir(nodes: TreeNode[], depth = 0): { node: TreeNode; depth: number }[] {
  return nodes.flatMap((node) => [{ node, depth }, ...aplatir(node.children, depth + 1)])
}

export function DeplacerDepartementModal({ isOpen, onClose, onSaved, departement, departements }: DeplacerDepartementModalProps) {
  const [cible, setCible] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setCible('')
    setError(null)
  }, [isOpen, departement?.id])

  const { emplacements, nbDescendants } = useMemo(() => {
    if (!departement) return { emplacements: [] as { id: number; libelle: string }[], nbDescendants: 0 }
    const cheminSource = departement.chemin
    const dansLeSousArbre = (d: DepartementResponse) =>
      d.id === departement.id || (cheminSource != null && d.chemin != null && d.chemin.startsWith(cheminSource))
    const emplacements = aplatir(buildTree(departements))
      .filter(({ node }) => !dansLeSousArbre(node) && node.id !== departement.idParent)
      .map(({ node, depth }) => ({ id: node.id, libelle: `${'— '.repeat(depth)}${node.nomDepartement}` }))
    const nbDescendants = departements.filter((d) => d.id !== departement.id && dansLeSousArbre(d)).length
    return { emplacements, nbDescendants }
  }, [departement, departements])

  if (!departement) return null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (cible === '') return
    setError(null)
    setIsSubmitting(true)
    try {
      await departementsApi.deplacer(departement.id, cible === RACINE ? null : Number(cible))
      onSaved()
      onClose()
    } catch (err) {
      setError(extractErrorMessage(err, 'Impossible de déplacer ce département'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const aucunEmplacement = emplacements.length === 0 && departement.estRacine
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Déplacer « ${departement.nomDepartement} »`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}
        <p className="text-[13px] text-[#4B4F5A]">
          Rattaché actuellement à <span className="font-medium text-ink">{departement.nomParent ?? 'aucun département (racine)'}</span>.{' '}
          {nbDescendants > 0 ? `Ses ${nbDescendants} sous-département${nbDescendants > 1 ? 's' : ''} suivent automatiquement.` : 'Il n’a aucun sous-département.'}
        </p>
        {aucunEmplacement ? <p className="text-[13px] text-[#6B7180]">Aucun emplacement possible : tous les autres départements sont ses descendants.</p> : (
          <Select label="Nouveau département parent" required value={cible} onChange={(event) => setCible(event.target.value)}>
            <option value="">Sélectionner…</option>
            {!departement.estRacine && <option value={RACINE}>Aucun parent (devient département racine)</option>}
            {emplacements.map((option) => <option key={option.id} value={option.id}>{option.libelle}</option>)}
          </Select>
        )}
        <div className="rounded-lg border border-warning/30 bg-warning-light px-4 py-3 text-[12.5px] text-warning">
          Les visibilités des chefs et délégués de l'ancien et du nouveau parent changent immédiatement. Le supérieur du chef de ce département change aussi. Les employés restent dans leur département.
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Annuler</Button>
          <Button type="submit" isLoading={isSubmitting} disabled={cible === '' || aucunEmplacement}>Déplacer</Button>
        </div>
      </form>
    </Modal>
  )
}
