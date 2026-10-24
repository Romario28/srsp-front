import { useState } from 'react'
import { ExternalLink, Play } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { FicheAgent, type CleFiche } from '@/pages/anticipation/FicheAgent'
import { dossiersApi } from '@/api/dossiers'
import { extractErrorMessage } from '@/api/client'
import { formatDate } from '@/utils/date'
import { TYPE_LABELS } from '@/utils/anticipation'
import { ETAT_DOSSIER, etatDe } from '@/utils/dossiers'
import type { DossierDTO } from '@/types/dossier'

/** Aucun champ masqué : ici l'en-tête ne montre pas le statut de l'agent, la fiche l'affiche donc en entier. */
const AUCUN_EXCLUS: ReadonlySet<CleFiche> = new Set<CleFiche>()

interface DossierFormModalProps {
  dossier: DossierDTO | null
  /** Ouvre directement sur « Confirmer le démarrage ? » (bouton Démarrer du tableau). */
  confirmerDemarrage?: boolean
  onClose: () => void
  onChange: (maj: DossierDTO) => void
}

export function DossierFormModal({ dossier, confirmerDemarrage = false, onClose, onChange }: DossierFormModalProps) {
  return (
    <Modal isOpen={dossier != null} onClose={onClose} maxWidth="max-w-2xl" title="Suivi du dossier">
      {dossier && <FormulaireDossier key={`${dossier.id}-${confirmerDemarrage ? 'c' : 'd'}`} dossier={dossier}
        confirmerDemarrage={confirmerDemarrage} onClose={onClose} onChange={onChange} />}
    </Modal>
  )
}

interface FormulaireDossierProps {
  dossier: DossierDTO
  confirmerDemarrage?: boolean
  onClose: () => void
  onChange: (maj: DossierDTO) => void
  onOuvrirDansDossiers?: () => void
}

export function FormulaireDossier({ dossier, confirmerDemarrage = false, onClose, onChange, onOuvrirDansDossiers }: FormulaireDossierProps) {
  const [motif, setMotif] = useState('')
  const [confirmation, setConfirmation] = useState(confirmerDemarrage)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const affiche = ETAT_DOSSIER[etatDe(dossier)]
  const sansSuite = dossier.statut === 'SANS_SUITE'
  const demarrable = dossier.statut === 'EN_ATTENTE_DE_TRAITEMENT'

  const executer = async (action: () => Promise<DossierDTO>, repli: string) => {
    setEnCours(true)
    setErreur(null)
    try { onChange(await action()) }
    catch (err) { setErreur(extractErrorMessage(err, repli)); setConfirmation(false) }
    finally { setEnCours(false) }
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-[17px] font-semibold text-ink">{dossier.nomComplet}</h3>
            <p className="font-mono text-[12.5px] text-[#6B7180]">Matricule {dossier.matricule}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="accent">{TYPE_LABELS[dossier.type]}</Badge>
            <Badge tone={affiche.tone}>{affiche.label}</Badge>
          </div>
        </div>
        <p className="text-[12.5px] text-[#6B7180]">
          Préparation dès le <span className="font-medium text-ink">{formatDate(dossier.datePreparation)}</span>
          {' · '}échéance le <span className={`font-medium ${dossier.enRetard ? 'text-danger' : 'text-ink'}`}>{formatDate(dossier.dateEcheance)}</span>
          {dossier.enRetard && <span className="font-medium text-danger"> ({dossier.joursRetard} j de retard)</span>}
        </p>
      </header>

      {erreur && <ErrorBanner message={erreur} />}

      {sansSuite && (
        <section className="flex flex-col gap-3 rounded-lg border border-[#E4E6EB] bg-[#FAFAFB] px-4 py-3">
          <p className="text-[13px] text-ink"><span className="font-semibold">Classé sans suite.</span> Motif : {dossier.motifSansSuite}</p>
          <div>
            <Button variant="secondary" size="sm" isLoading={enCours}
              onClick={() => void executer(() => dossiersApi.reouvrir(dossier.id), 'Impossible de rouvrir le dossier')}>
              Rouvrir le dossier
            </Button>
          </div>
        </section>
      )}

      {dossier.statut === 'EN_COURS' && (
        <section className="rounded-lg border border-accent/30 bg-accent-light px-4 py-3 text-[13px] text-accent-dark">
          Dossier en cours{dossier.dateDemarrage ? ` depuis le ${formatDate(dossier.dateDemarrage)}` : ''}.
        </section>
      )}

      {demarrable && (
        <section className={`flex flex-col gap-3 rounded-lg border px-4 py-3 ${dossier.enRetard ? 'border-danger/30 bg-danger-light' : 'border-[#E4E6EB] bg-[#FAFAFB]'}`}>
          {!confirmation ? (
            <>
              <p className="text-[13px] text-ink">Ce dossier n'est pas encore démarré.</p>
              <div>
                <Button icon={<Play className="h-4 w-4" />} onClick={() => setConfirmation(true)} disabled={enCours}>Démarrer le dossier</Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[13px] font-medium text-ink">
                Confirmer le démarrage ? Le dossier passera à « En cours » et ne pourra plus revenir à « À traiter ».
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setConfirmation(false)} disabled={enCours}>Annuler</Button>
                <Button icon={<Play className="h-4 w-4" />} isLoading={enCours}
                  onClick={() => void executer(() => dossiersApi.demarrer(dossier.id), 'Impossible de démarrer ce dossier')}>
                  Confirmer le démarrage
                </Button>
              </div>
            </>
          )}
        </section>
      )}

      <section className="flex flex-col gap-3 border-t border-[#EAEBF0] pt-4">
        <div>
          <h4 className="font-display text-[13.5px] font-semibold text-ink">Fiche agent</h4>
          <p className="mt-0.5 text-[12px] text-[#9CA0AC]">Identité, carrière, situation administrative, affectation et références.</p>
        </div>
        <FicheAgent matricule={dossier.matricule} exclus={() => AUCUN_EXCLUS} />
      </section>

      {!sansSuite && (
        <section className="flex flex-col gap-2 border-t border-[#EAEBF0] pt-4">
          <h4 className="text-[13px] font-semibold text-ink">Classer sans suite</h4>
          <p className="text-[12.5px] text-[#6B7180]">Le dossier sort des dossiers actifs (par exemple : agent démissionnaire). Un motif est obligatoire.</p>
          <textarea value={motif} onChange={(e) => setMotif(e.target.value)} maxLength={500} rows={2} aria-label="Motif du classement sans suite"
            className="w-full rounded-lg border border-[#DADCE3] bg-white px-3 py-2 text-sm text-ink focus:border-accent" />
          <div className="flex justify-end">
            <Button variant="danger" size="sm" isLoading={enCours} disabled={motif.trim() === '' || enCours}
              onClick={() => void executer(() => dossiersApi.sansSuite(dossier.id, motif.trim()), 'Impossible de classer ce dossier')}>
              Classer sans suite
            </Button>
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {onOuvrirDansDossiers
          ? <Button type="button" variant="secondary" icon={<ExternalLink className="h-4 w-4" />} onClick={onOuvrirDansDossiers} disabled={enCours}>Ouvrir dans les dossiers</Button>
          : <span />}
        <Button type="button" variant="secondary" onClick={onClose} disabled={enCours}>Fermer</Button>
      </div>
    </div>
  )
}
