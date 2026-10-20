import { useState, type FormEvent } from 'react'
import { ExternalLink } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { dossiersApi } from '@/api/dossiers'
import { extractErrorMessage } from '@/api/client'
import { formatDate, todayInputValue } from '@/utils/date'
import { TYPE_LABELS } from '@/utils/anticipation'
import { ETAPES, STATUT_DOSSIER } from '@/utils/dossiers'
import type { DossierDTO, EtapeDossier } from '@/types/dossier'

interface DossierFormModalProps {
  dossier: DossierDTO | null
  onClose: () => void
  onChange: (maj: DossierDTO) => void
}

export function DossierFormModal({ dossier, onClose, onChange }: DossierFormModalProps) {
  return <Modal isOpen={dossier != null} onClose={onClose} maxWidth="max-w-2xl" title="Suivi du dossier">
    {dossier && <FormulaireDossier key={dossier.id} dossier={dossier} onClose={onClose} onChange={onChange} />}
  </Modal>
}

interface FormulaireDossierProps {
  dossier: DossierDTO
  onClose: () => void
  onChange: (maj: DossierDTO) => void
  onOuvrirDansDossiers?: () => void
}

export function FormulaireDossier({ dossier, onClose, onChange, onOuvrirDansDossiers }: FormulaireDossierProps) {
  const [dates, setDates] = useState<Record<EtapeDossier, string>>(
    () => Object.fromEntries(ETAPES.map((e) => [e.cle, dossier.etapes[e.cle] ?? ''])) as Record<EtapeDossier, string>)
  const [motif, setMotif] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const sansSuite = dossier.statut === 'SANS_SUITE'
  const clos = sansSuite || dossier.statut === 'TRAITE'
  const statut = STATUT_DOSSIER[dossier.statut]
  const minDate = dossier.datePreparation.slice(0, 10)
  const modifie = ETAPES.some((e) => (dates[e.cle] || null) !== dossier.etapes[e.cle])
  const modifiee = (cle: EtapeDossier) => (dates[cle] || null) !== dossier.etapes[cle]
  const avantPreparation = (cle: EtapeDossier) => dates[cle] !== '' && dates[cle] < minDate
  const invalide = ETAPES.some((e) => modifiee(e.cle) && avantPreparation(e.cle))

  const executer = async (action: () => Promise<DossierDTO>, repli: string) => {
    setEnCours(true)
    setErreur(null)
    try { onChange(await action()) }
    catch (err) { setErreur(extractErrorMessage(err, repli)) }
    finally { setEnCours(false) }
  }
  const enregistrer = (event: FormEvent) => {
    event.preventDefault()
    if (invalide) return
    void executer(() => dossiersApi.majEtapes(dossier.id, {
      version: dossier.version,
      etapes: Object.fromEntries(ETAPES.map((e) => [e.cle, dates[e.cle] || null])),
    }), "Impossible d'enregistrer les étapes")
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0"><h3 className="font-display text-[17px] font-semibold text-ink">{dossier.nomComplet}</h3>
            <p className="font-mono text-[12.5px] text-[#6B7180]">Matricule {dossier.matricule}</p></div>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="accent">{TYPE_LABELS[dossier.type]}</Badge><Badge tone={statut.tone}>{statut.label}</Badge>
            {dossier.enRetard && <Badge tone="danger">En retard de {dossier.joursRetard} j</Badge>}
            {dossier.aRelancer && <Badge tone="warning">À relancer · {dossier.joursSansNouvelle} j</Badge>}
          </div>
        </div>
        <p className="text-[12.5px] text-[#6B7180]">Préparation dès le <span className="font-medium text-ink">{formatDate(dossier.datePreparation)}</span>
          {' · '}échéance le <span className="font-medium text-ink">{formatDate(dossier.dateEcheance)}</span></p>
      </header>

      {erreur && <ErrorBanner message={erreur} />}

      {sansSuite && <div className="flex flex-col gap-3 rounded-lg border border-[#E4E6EB] bg-[#FAFAFB] px-4 py-3">
        <p className="text-[13px] text-ink"><span className="font-semibold">Classé sans suite.</span> Motif : {dossier.motifSansSuite}</p>
        <div><Button variant="secondary" size="sm" isLoading={enCours}
          onClick={() => void executer(() => dossiersApi.reouvrir(dossier.id), 'Impossible de rouvrir le dossier')}>Rouvrir le dossier</Button></div>
      </div>}

      <form onSubmit={enregistrer} className="flex flex-col gap-4">
        <p className="text-[12.5px] text-[#6B7180]">Une date par étape, rétro-datation possible après la préparation. Aucune date ne peut précéder la date de préparation. Laissez vide une étape qui ne s'applique pas, et videz un champ pour effacer une date. « CHEF » démarre le dossier, « FIN » le clôt.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ETAPES.map((e) => <Input key={e.cle} label={e.label} type="date" value={dates[e.cle]} min={minDate} max={todayInputValue()} disabled={sansSuite || enCours}
            error={modifiee(e.cle) && avantPreparation(e.cle) ? `Avant la préparation (${formatDate(dossier.datePreparation)})` : undefined}
            hint={!modifiee(e.cle) && avantPreparation(e.cle) ? 'Antérieure à la préparation : à corriger.' : undefined}
            onChange={(event) => setDates((c) => ({ ...c, [e.cle]: event.target.value }))} />)}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {onOuvrirDansDossiers
            ? <Button type="button" variant="secondary" icon={<ExternalLink className="h-4 w-4" />} onClick={onOuvrirDansDossiers} disabled={enCours}>Ouvrir dans les dossiers</Button>
            : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={enCours}>Fermer</Button>
            <Button type="submit" isLoading={enCours} disabled={!modifie || sansSuite || invalide}>Enregistrer</Button>
          </div>
        </div>
      </form>

      {!clos && <section className="flex flex-col gap-2 border-t border-[#EAEBF0] pt-4">
        <h4 className="text-[13px] font-semibold text-ink">Classer sans suite</h4>
        <p className="text-[12.5px] text-[#6B7180]">Le dossier sort des tâches à traiter (par exemple : agent démissionnaire). Un motif est obligatoire.</p>
        <textarea value={motif} onChange={(e) => setMotif(e.target.value)} maxLength={500} rows={2} aria-label="Motif du classement sans suite"
          className="w-full rounded-lg border border-[#DADCE3] bg-white px-3 py-2 text-sm text-ink focus:border-accent" />
        <div className="flex justify-end"><Button variant="danger" size="sm" isLoading={enCours} disabled={motif.trim() === '' || enCours}
          onClick={() => void executer(() => dossiersApi.sansSuite(dossier.id, motif.trim()), 'Impossible de classer ce dossier')}>Classer sans suite</Button></div>
      </section>}
    </div>
  )
}
