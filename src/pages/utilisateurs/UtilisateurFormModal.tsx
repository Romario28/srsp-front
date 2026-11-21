import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'   // [NOUVEAU]
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { useDebounce } from '@/hooks/useDebounce'
import { utilisateursApi } from '@/api/utilisateurs'
import { extractErrorMessage } from '@/api/client'
import { roleLabel } from '@/utils/roles'
import { PERIMETRE_VIDE, perimetreVide, type AgentLieDTO, type PerimetreDTO, type UtilisateurDetailDTO } from '@/types/utilisateur'
import { EncartAgentLie } from './EncartAgentLie'
import { SelecteurPerimetre } from './SelecteurPerimetre'

// [MODIFIÉ] les quatre profils (était : ['ROLE_GESTIONNAIRE', 'ROLE_ADMIN'], boutons à bascule multiples)
const ROLES = ['ROLE_AGENT', 'ROLE_RH', 'ROLE_CHEF', 'ROLE_ADMIN'] as const
const DESCRIPTIONS: Record<string, string> = {
  ROLE_AGENT: "Son propre espace, en lecture seule (sauf droit accordé ci-dessous). Matricule obligatoire.",
  ROLE_RH: 'Anticipation et dossiers des agents de son périmètre.',
  ROLE_CHEF: 'Comme RH, et consulte les comptes RH et Agent de son périmètre.',
  ROLE_ADMIN: 'Accès total.',
}

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
  const [role, setRole] = useState<string>(utilisateur?.role ?? 'ROLE_AGENT')   // [MODIFIÉ] un seul rôle, au moindre privilège par défaut
  const [agirSurSonDossier, setAgirSurSonDossier] = useState(utilisateur?.agirSurSonDossier ?? false)   // [NOUVEAU]
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

  const agent = role === 'ROLE_AGENT'
  const admin = role === 'ROLE_ADMIN'
  const avecPerimetre = role === 'ROLE_RH' || role === 'ROLE_CHEF'   // [NOUVEAU] seuls RH et Chef ont un périmètre
  const aucunPerimetre = avecPerimetre && perimetreVide(perimetre)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const corps = {
        nom: nom.trim(), prenom: prenom.trim(), matriculeAgent: matriculeNet,
        role,   // [MODIFIÉ] était : roles
        perimetre: avecPerimetre ? perimetre : PERIMETRE_VIDE,
        agirSurSonDossier: agent && agirSurSonDossier,   // [NOUVEAU] sans cela, chaque modification remettait le droit à « non »
      }
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

      {/* [MODIFIÉ] liste déroulante à un seul choix (étaient : boutons à bascule, plusieurs rôles possibles) */}
      <fieldset className="flex flex-col gap-2 border-t border-[#EAEBF0] pt-3">
        <Select label="Rôle" required value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
        </Select>
        <p className="text-[12px] leading-snug text-[#6B7180]">{DESCRIPTIONS[role]}</p>
        {agent && (
          <label className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-light px-3 py-2 text-[12.5px] text-ink">
            <input type="checkbox" checked={agirSurSonDossier} onChange={(e) => setAgirSurSonDossier(e.target.checked)}
              className="mt-0.5 h-4 w-4 flex-shrink-0 accent-accent" />
            <span>Peut démarrer, classer sans suite et rouvrir son propre dossier (sinon : lecture seule).</span>
          </label>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-2 border-t border-[#EAEBF0] pt-3">
        <legend className="mb-1 font-display text-[13px] font-semibold text-ink">Agent lié {agent ? <span className="text-danger">*</span> : '(facultatif)'}</legend>
        <Input label="Matricule de l'agent" required={agent} value={matricule} onChange={(e) => setMatricule(e.target.value)} maxLength={20}
          hint={agent ? "Obligatoire pour un compte Agent : c'est ainsi qu'il retrouve son dossier."
            : "Lien informatif : il identifie la personne (nom, journal) et n'ouvre aucun droit."} />
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

      {/* [MODIFIÉ] le périmètre ne concerne que RH et Chef */}
      <fieldset className="flex flex-col gap-3 border-t border-[#EAEBF0] pt-3">
        <legend className="mb-1 font-display text-[13px] font-semibold text-ink">Périmètre</legend>
        {avecPerimetre ? (
          <>
            <p className="text-[12px] leading-snug text-[#6B7180]">
              Seul le périmètre donne accès aux agents. Dans un axe, une valeur suffit ; entre axes, toutes les conditions s'appliquent ;
              un axe vide ne restreint pas.
            </p>
            <SelecteurPerimetre valeur={perimetre} onChange={setPerimetre} />
            {aucunPerimetre && <p className="rounded-lg border border-warning/30 bg-warning-light px-3 py-2 text-[12.5px] text-warning">Aucune valeur : ce compte ne verra aucun agent.</p>}
          </>
        ) : (
          <p className="text-[12.5px] text-[#4B4F5A]">
            {admin ? 'Un administrateur voit tout : le périmètre est sans effet.' : 'Un agent n\'a aucun périmètre : il ne voit que son propre espace.'}
          </p>
        )}
      </fieldset>

      <div className="flex justify-end gap-2 border-t border-[#EAEBF0] pt-3">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Annuler</Button>
        <Button type="submit" isLoading={isSubmitting} disabled={agent && matriculeNet === ''}>{edition ? 'Enregistrer' : 'Créer le compte'}</Button>
      </div>
    </form>
  )
}