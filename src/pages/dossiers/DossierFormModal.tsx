import { useState } from 'react'
import { ExternalLink, Play } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { FicheAgentContenu, useFicheAgent } from '@/pages/anticipation/FicheAgent'
import { dossiersApi } from '@/api/dossiers'
import { extractErrorMessage } from '@/api/client'
import { TYPE_LABELS, statutAgentLabel } from '@/utils/anticipation'
import { ETAT_DOSSIER, etatDe } from '@/utils/dossiers'
import { InfosClesDossier, dejaAffichesDossier } from './InfosClesDossier'
import type { DossierDTO } from '@/types/dossier'

interface DossierFormModalProps {
  dossier: DossierDTO | null
  /** Ouvre directement sur « Confirmer le démarrage ? » (bouton Démarrer du tableau). */
  confirmerDemarrage?: boolean
  onClose: () => void
  onChange: (maj: DossierDTO) => void
}

export function DossierFormModal({ dossier, confirmerDemarrage = false, onClose, onChange }: DossierFormModalProps) {
  return (
    <Modal isOpen={dossier != null} onClose={onClose} maxWidth="max-w-4xl" dense title="Suivi du dossier">
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
  const fiche = useFicheAgent(dossier.matricule)   // une seule requête, partagée par les informations clés et la fiche
  const [motif, setMotif] = useState('')
  const [confirmation, setConfirmation] = useState(confirmerDemarrage)
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const affiche = ETAT_DOSSIER[etatDe(dossier)]
  const sansSuite = dossier.statut === 'SANS_SUITE'
  const demarrable = dossier.statut === 'EN_ATTENTE_DE_TRAITEMENT'

  const executer = async (action: () => Promise<DossierDTO>, repli: string) => {
    setOccupe(true)
    setErreur(null)
    try { onChange(await action()) }
    catch (err) { setErreur(extractErrorMessage(err, repli)); setConfirmation(false) }
    finally { setOccupe(false) }
  }

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <h3 className="font-display text-[16px] font-semibold leading-tight text-ink">{dossier.nomComplet}</h3>
          <p className="font-mono text-[12px] text-[#6B7180]">Matricule {dossier.matricule}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="accent">{TYPE_LABELS[dossier.type]}</Badge>
          <Badge tone={affiche.tone}>{affiche.label}</Badge>
          <Badge>{statutAgentLabel(dossier.statutAgent)}</Badge>
        </div>
      </header>

      {erreur && <ErrorBanner message={erreur} />}

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
        <InfosClesDossier dossier={dossier} etat={fiche} />

        <section className={`flex flex-col gap-2.5 rounded-lg border p-3 ${demarrable && dossier.enRetard ? 'border-danger/30 bg-danger-light' : 'border-[#E4E6EB] bg-[#FAFAFB]'}`}>
          <h4 className="font-display text-[13px] font-semibold text-ink">Suivi du dossier</h4>

          {sansSuite && (
            <>
              <p className="text-[13px] text-ink"><span className="font-semibold">Classé sans suite.</span> Motif : {dossier.motifSansSuite}</p>
              <div>
                <Button variant="secondary" size="sm" isLoading={occupe}
                  onClick={() => void executer(() => dossiersApi.reouvrir(dossier.id), 'Impossible de rouvrir le dossier')}>
                  Rouvrir le dossier
                </Button>
              </div>
            </>
          )}

          {demarrable && (!confirmation ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12.5px] text-[#6B7180]">Le dossier passera « En cours ».</p>
              <Button size="sm" icon={<Play className="h-3.5 w-3.5" />} onClick={() => setConfirmation(true)} disabled={occupe}>Démarrer le dossier</Button>
            </div>
          ) : (
            <>
              <p className="text-[13px] font-medium text-ink">
                Confirmer le démarrage ? Le dossier passera à « En cours » et ne pourra plus revenir à « À traiter ».
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setConfirmation(false)} disabled={occupe}>Annuler</Button>
                <Button size="sm" icon={<Play className="h-3.5 w-3.5" />} isLoading={occupe}
                  onClick={() => void executer(() => dossiersApi.demarrer(dossier.id), 'Impossible de démarrer ce dossier')}>
                  Confirmer le démarrage
                </Button>
              </div>
            </>
          ))}

          {!sansSuite && (
            <div className={`flex flex-col gap-1.5 ${demarrable ? 'border-t border-black/5 pt-2.5' : ''}`}>
              <p className="text-[12.5px] font-medium text-ink">
                Classer sans suite <span className="font-normal text-[#6B7180]">· motif obligatoire (ex. agent démissionnaire)</span>
              </p>
              <div className="flex items-end gap-2">
                <textarea value={motif} onChange={(e) => setMotif(e.target.value)} maxLength={500} rows={2} aria-label="Motif du classement sans suite"
                  className="min-w-0 flex-1 rounded-lg border border-[#DADCE3] bg-white px-3 py-1.5 text-[13px] text-ink focus:border-accent" />
                <Button variant="danger" size="sm" isLoading={occupe} disabled={motif.trim() === '' || occupe}
                  onClick={() => void executer(() => dossiersApi.sansSuite(dossier.id, motif.trim()), 'Impossible de classer ce dossier')}>
                  Classer sans suite
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-1.5 border-t border-[#EAEBF0] pt-3">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h4 className="font-display text-[13px] font-semibold text-ink">Fiche agent</h4>
          <span className="text-[11.5px] text-[#9CA0AC]">Les données déjà affichées plus haut ne sont pas répétées.</span>
        </div>
        <FicheAgentContenu etat={fiche} exclus={(f) => dejaAffichesDossier(dossier, f)} compact />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#EAEBF0] pt-2.5">
        {onOuvrirDansDossiers
          ? <Button type="button" variant="secondary" size="sm" icon={<ExternalLink className="h-3.5 w-3.5" />} onClick={onOuvrirDansDossiers} disabled={occupe}>Ouvrir dans les dossiers</Button>
          : <span />}
        <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={occupe}>Fermer</Button>
      </div>
    </div>
  )
}
