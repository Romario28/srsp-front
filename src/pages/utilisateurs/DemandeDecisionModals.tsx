import { useState } from 'react'
import { AlertTriangle, Check, CheckCircle2, Info, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { useAuth } from '@/hooks/useAuth'
import { demandesComptesApi } from '@/api/demandesComptes'
import { extractErrorCode, extractErrorMessage } from '@/api/client'
import { formatDateTime } from '@/utils/date'
import { isAdmin, roleLabel } from '@/utils/roles'
import { verifierIdentite } from '@/utils/demandesComptes'
import { PERIMETRE_VIDE, perimetreVide, type PerimetreDTO } from '@/types/utilisateur'
import type { DemandeCompteDTO } from '@/types/demandeCompte'
import { EncartAgentLie } from './EncartAgentLie'
import { SelecteurPerimetre } from './SelecteurPerimetre'

interface DecisionProps {
  demande: DemandeCompteDTO | null
  onClose: () => void
  /** La décision est enregistrée : la page ferme la fenêtre, recharge la liste et la pastille. */
  onFait: () => void
  /** La demande n'existe plus (traitée par un autre validateur) : la page recharge la liste, la fenêtre reste ouverte. */
  onObsolete: () => void
}
type FenetreProps = Omit<DecisionProps, 'demande'> & { demande: DemandeCompteDTO }

const DEMANDE_INTROUVABLE = 'DEMANDE_INTROUVABLE'

function EnTete({ demande }: { demande: DemandeCompteDTO }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="font-display text-[16px] font-semibold text-ink">{demande.prenom} {demande.nom}</h3>
        <p className="text-[12.5px] text-[#6B7180]">{demande.email}</p>
        <p className="font-mono text-[12px] text-[#6B7180]">Matricule {demande.matricule} · demandée le {formatDateTime(demande.dateDemande)}</p>
      </div>
      <Badge tone="accent">{roleLabel(demande.profil)}</Badge>
    </header>
  )
}

function BlocIdentite({ demande }: { demande: DemandeCompteDTO }) {
  const verification = verifierIdentite(demande)
  const a = demande.agentLie
  if (verification === 'CONFIRMEE') {
    return <p className="flex items-start gap-2 rounded-lg border border-success/30 bg-success-light px-3 py-2 text-[12.5px] text-success">
      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
      Le nom et le prénom déclarés correspondent à l'agent du matricule {demande.matricule}.
    </p>
  }
  if (verification === 'DIFFERENTE') {
    return <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-light px-3 py-2 text-[12.5px] text-warning">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-0.5">
        <p className="font-semibold">Identité à vérifier</p>
        <p>Déclaré : {demande.prenom} {demande.nom}. Agent du matricule {demande.matricule} : {a.prenoms ?? '—'} {a.nom ?? '—'}.</p>
        <p>N'importe qui peut saisir le matricule d'un autre : ne validez que si vous connaissez le demandeur.</p>
      </div>
    </div>
  }
  return <p className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent-light px-3 py-2 text-[12.5px] text-accent-dark">
    <Info className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
    Aucun agent n'a le matricule {demande.matricule} dans la base : l'identité ne peut pas être comparée. Le compte sera lié à ce matricule et sa fiche apparaîtra quand l'agent sera importé.
  </p>
}

// ── Approbation ─────────────────────────────────────────────────────────────

export function ApprobationModal({ demande, onClose, onFait, onObsolete }: DecisionProps) {
  if (!demande) return null
  return <FenetreApprobation key={demande.id} demande={demande} onClose={onClose} onFait={onFait} onObsolete={onObsolete} />
}

function FenetreApprobation({ demande, onClose, onFait, onObsolete }: FenetreProps) {
  const { user } = useAuth()
  const admin = isAdmin(user?.roles)
  const agent = demande.profil === 'ROLE_AGENT'
  const verification = verifierIdentite(demande)
  const [perimetre, setPerimetre] = useState<PerimetreDTO>(demande.perimetreSuggere ?? PERIMETRE_VIDE)
  const [identiteVerifiee, setIdentiteVerifiee] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [obsolete, setObsolete] = useState(false)

  const vide = perimetreVide(perimetre)
  const identiteOk = verification === 'CONFIRMEE' || identiteVerifiee
  // Un chef doit accorder au moins une valeur (le serveur l'exige aussi) ; un administrateur peut n'en mettre aucune
  const perimetreOk = agent || admin || !vide
  const peutApprouver = identiteOk && perimetreOk && !obsolete

  const approuver = async () => {
    setEnCours(true)
    setErreur(null)
    try {
      await demandesComptesApi.approuver(demande.id, agent ? undefined : perimetre)
      onFait()
    } catch (err) {
      setErreur(extractErrorMessage(err, "Impossible d'approuver cette demande"))
      if (extractErrorCode(err) === DEMANDE_INTROUVABLE) { setObsolete(true); onObsolete() }
    } finally {
      setEnCours(false)
    }
  }

  const pied = <div className="flex justify-end gap-2">
    {obsolete ? <Button variant="secondary" onClick={onClose}>Fermer</Button> : <>
      <Button variant="secondary" onClick={onClose} disabled={enCours}>Annuler</Button>
      <Button icon={<Check className="h-4 w-4" />} onClick={approuver} isLoading={enCours} disabled={!peutApprouver}>Approuver et activer</Button>
    </>}
  </div>

  return (
    <Modal isOpen onClose={onClose} maxWidth="max-w-2xl" dense title="Approuver la demande de compte" footer={pied}>
      <div className="flex flex-col gap-3">
        {erreur && <ErrorBanner message={erreur} />}
        <EnTete demande={demande} />
        <BlocIdentite demande={demande} />
        {demande.agentLie.trouve && <EncartAgentLie agent={demande.agentLie} />}

        <section className="flex flex-col gap-2 border-t border-[#EAEBF0] pt-3">
          <h4 className="font-display text-[13px] font-semibold text-ink">Périmètre accordé</h4>
          {agent ? (
            <p className="text-[12.5px] leading-snug text-[#4B4F5A]">
              Un agent n'a aucun périmètre : il ne voit que son propre espace, en lecture seule. Le droit d'agir sur son propre dossier ne s'accorde pas ici : un administrateur le coche ensuite dans la fiche du compte.
            </p>
          ) : (
            <>
              <p className="text-[12px] leading-snug text-[#6B7180]">
                Valeurs proposées d'après la fiche de l'agent ; modifiez-les au besoin. Dans un axe, une valeur suffit ; entre axes, toutes les conditions s'appliquent ; un axe vide ne restreint pas.
                {!admin && ' Vous ne pouvez accorder que des valeurs comprises dans votre propre périmètre, et au moins une.'}
              </p>
              <SelecteurPerimetre valeur={perimetre} onChange={setPerimetre} />
              {vide && <p className="rounded-lg border border-warning/30 bg-warning-light px-3 py-2 text-[12.5px] text-warning">
                {admin ? "Aucune valeur : ce compte ne verra aucun agent tant qu'un périmètre ne lui est pas accordé."
                  : 'Aucune valeur : accordez au moins une valeur pour pouvoir approuver.'}
              </p>}
            </>
          )}
        </section>

        {verification !== 'CONFIRMEE' && (
          <label className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-light px-3 py-2 text-[12.5px] text-ink">
            <input type="checkbox" checked={identiteVerifiee} onChange={(e) => setIdentiteVerifiee(e.target.checked)}
              className="mt-0.5 h-4 w-4 flex-shrink-0 accent-accent" />
            <span>J'ai vérifié par ailleurs l'identité du demandeur avant d'activer ce compte.</span>
          </label>
        )}
      </div>
    </Modal>
  )
}

// ── Refus ───────────────────────────────────────────────────────────────────

const MOTIF_MAX = 500

export function RefusModal({ demande, onClose, onFait, onObsolete }: DecisionProps) {
  if (!demande) return null
  return <FenetreRefus key={demande.id} demande={demande} onClose={onClose} onFait={onFait} onObsolete={onObsolete} />
}

function FenetreRefus({ demande, onClose, onFait, onObsolete }: FenetreProps) {
  const [motif, setMotif] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [obsolete, setObsolete] = useState(false)

  const refuser = async () => {
    setEnCours(true)
    setErreur(null)
    try {
      await demandesComptesApi.refuser(demande.id, motif.trim())
      onFait()
    } catch (err) {
      setErreur(extractErrorMessage(err, 'Impossible de refuser cette demande'))
      if (extractErrorCode(err) === DEMANDE_INTROUVABLE) { setObsolete(true); onObsolete() }
    } finally {
      setEnCours(false)
    }
  }

  const pied = <div className="flex justify-end gap-2">
    {obsolete ? <Button variant="secondary" onClick={onClose}>Fermer</Button> : <>
      <Button variant="secondary" onClick={onClose} disabled={enCours}>Annuler</Button>
      <Button variant="danger" icon={<X className="h-4 w-4" />} onClick={refuser} isLoading={enCours} disabled={motif.trim() === ''}>Refuser la demande</Button>
    </>}
  </div>

  return (
    <Modal isOpen onClose={onClose} maxWidth="max-w-lg" dense title="Refuser la demande de compte" footer={pied}>
      <div className="flex flex-col gap-3">
        {erreur && <ErrorBanner message={erreur} />}
        <EnTete demande={demande} />
        <p className="rounded-lg border border-warning/30 bg-warning-light px-3 py-2 text-[12.5px] leading-snug text-warning">
          La demande est supprimée. Le demandeur n'est pas prévenu : il peut déposer une nouvelle demande. Le motif reste dans le journal d'audit.
        </p>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink">Motif du refus <span className="text-danger">*</span></span>
          <textarea value={motif} onChange={(e) => setMotif(e.target.value)} maxLength={MOTIF_MAX} rows={3}
            className="rounded-lg border border-[#DADCE3] bg-white px-3 py-2 text-[13px] text-ink focus:border-accent" />
          <span className="text-right text-[11.5px] tabular-nums text-[#9CA0AC]">{motif.length} / {MOTIF_MAX}</span>
        </label>
      </div>
    </Modal>
  )
}