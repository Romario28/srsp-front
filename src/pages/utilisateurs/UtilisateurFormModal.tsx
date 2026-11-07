import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { useDebounce } from '@/hooks/useDebounce'
import { utilisateursApi } from '@/api/utilisateurs'
import { extractErrorMessage } from '@/api/client'
import { roleLabel } from '@/utils/roles'
import { PERIMETRE_VIDE, perimetreVide, type AgentLieDTO, type PerimetreDTO, type UtilisateurDetailDTO } from '@/types/utilisateur'
import { EncartAgentLie } from './EncartAgentLie'
import { SelecteurPerimetre } from './SelecteurPerimetre'

const ROLES = ['ROLE_GESTIONNAIRE', 'ROLE_ADMIN'] as const

interface UtilisateurFormModalProps {
  isOpen: boolean
  /** null = création. */
  utilisateur: UtilisateurDetailDTO | null
  onClose: () => void
  onSaved: (utilisateur: UtilisateurDetailDTO) => void
}

export function UtilisateurFormModal({ isOpen, utilisateur, onClose, onSaved }: UtilisateurFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl" dense title={utilisateur ? 'Modifier le compte' : 'Nouveau compte utilisateur'}>
      {isOpen && <Formulaire key={utilisateur?.id ?? 'nouveau'} utilisateur={utilisateur} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  )
}

function Formulaire({ utilisateur, onClose, onSaved }: Omit<UtilisateurFormModalProps, 'isOpen'>) {
  const edition = utilisateur != null
  const [email, setEmail] = useState(utilisateur?.email ?? '')
  const [password, setPassword] = useState('')
  const [nom, setNom] = useState(utilisateur?.nom ?? '')
  const [prenom, setPrenom] = useState(utilisateur?.prenom ?? '')
  const [matricule, setMatricule] = useState(utilisateur?.matriculeAgent ?? '')
  const [roles, setRoles] = useState<string[]>(utilisateur?.roles ?? ['ROLE_GESTIONNAIRE'])
  const [perimetre, setPerimetre] = useState<PerimetreDTO>(utilisateur?.perimetre ?? PERIMETRE_VIDE)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Aperçu de l'agent pendant la saisie du matricule (après une pause)
  const matriculeNet = matricule.trim()
  const matriculeStable = useDebounce(matriculeNet, 500)
  const [apercu, setApercu] = useState<AgentLieDTO | null>(null)
  useEffect(() => {
    if (!matriculeStable) { setApercu(null); return }
    let annule = false
    utilisateursApi.agentLie(matriculeStable)
      .then((a) => { if (!annule) setApercu(a) })
      .catch(() => { if (!annule) setApercu(null) })
    return () => { annule = true }
  }, [matriculeStable])
  const apercuAJour = apercu != null && apercu.matricule === matriculeNet ? apercu : null

  const admin = roles.includes('ROLE_ADMIN')
  const aucunPerimetre = !admin && perimetreVide(perimetre)
  const basculerRole = (role: string) => setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const corps = { nom: nom.trim(), prenom: prenom.trim(), matriculeAgent: matriculeNet, roles, perimetre }
      const maj = edition
        ? await utilisateursApi.update(utilisateur.id, corps)
        : await utilisateursApi.create({ email, password, ...corps })
      onSaved(maj)
    } catch (err) {
      setError(extractErrorMessage(err, "Impossible d'enregistrer le compte"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <ErrorBanner message={error} />}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-display text-[13px] font-semibold text-ink">Compte</legend>
        <Input label="Adresse e-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          disabled={edition} hint={edition ? 'Non modifiable' : undefined} placeholder="prenom.nom@entreprise.mg" />
        {!edition && <Input label="Mot de passe" type="password" required minLength={8} value={password}
          onChange={(e) => setPassword(e.target.value)} hint="8 caractères minimum" />}
        <div className="grid grid-cols-2 gap-3">
          <Input label="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} maxLength={100} />
          <Input label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} maxLength={100} />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2 border-t border-[#EAEBF0] pt-3">
        <legend className="mb-1 font-display text-[13px] font-semibold text-ink">Agent lié (facultatif)</legend>
        <Input label="Matricule de l'agent" value={matricule} onChange={(e) => setMatricule(e.target.value)} maxLength={20}
          hint="Lien informatif : il identifie la personne (nom, journal) et n'ouvre aucun droit." />
        {apercuAJour && <EncartAgentLie agent={apercuAJour} />}
        {apercuAJour?.trouve && ((apercuAJour.nom ?? '') !== nom.trim() || (apercuAJour.prenoms ?? '') !== prenom.trim()) && (
          <div>
            <Button type="button" variant="secondary" size="sm"
              onClick={() => { setNom(apercuAJour.nom ?? ''); setPrenom(apercuAJour.prenoms ?? '') }}>
              Reprendre le nom et le prénom de l'agent
            </Button>
          </div>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-2 border-t border-[#EAEBF0] pt-3">
        <legend className="mb-1 font-display text-[13px] font-semibold text-ink">Rôles <span className="text-danger">*</span></legend>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((role) => {
            const actif = roles.includes(role)
            return (
              <button key={role} type="button" onClick={() => basculerRole(role)} aria-pressed={actif}
                className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                  actif ? 'border-accent bg-accent-light text-accent-dark' : 'border-[#DADCE3] bg-white text-[#6B7180] hover:border-accent'}`}>
                {roleLabel(role)}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3 border-t border-[#EAEBF0] pt-3">
        <legend className="mb-1 font-display text-[13px] font-semibold text-ink">Périmètre</legend>
        <p className="text-[12px] leading-snug text-[#6B7180]">
          Seul le périmètre donne accès aux agents. Dans un axe, une valeur suffit ; entre axes, toutes les conditions s'appliquent ;
          un axe vide ne restreint pas. Un administrateur voit tout.
        </p>
        <SelecteurPerimetre valeur={perimetre} onChange={setPerimetre} />
        {admin && <p className="text-[12.5px] text-[#4B4F5A]">Ce compte est administrateur : le périmètre est sans effet.</p>}
        {aucunPerimetre && <p className="rounded-lg border border-warning/30 bg-warning-light px-3 py-2 text-[12.5px] text-warning">Aucune valeur : ce compte ne verra aucun agent.</p>}
      </fieldset>

      <div className="flex justify-end gap-2 border-t border-[#EAEBF0] pt-3">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Annuler</Button>
        <Button type="submit" isLoading={isSubmitting} disabled={roles.length === 0}>{edition ? 'Enregistrer' : 'Créer le compte'}</Button>
      </div>
    </form>
  )
}