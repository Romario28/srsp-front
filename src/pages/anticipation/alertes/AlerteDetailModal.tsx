import { useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge, StatutAlerteBadge } from '@/components/ui/Badge'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { alertesApi } from '@/api/alertes'
import { extractErrorCode, extractErrorMessage } from '@/api/client'
import { formatDate, formatDateTime } from '@/utils/date'
import { changeDeGrade, TYPE_LABELS } from '@/utils/anticipation'
import { EcheanceAlerte } from './EcheanceAlerte'
import { BlocsSituation } from '../SituationsGrade'
import type { AlerteDTO } from '@/types/alerte'

interface AlerteDetailModalProps {
  alerte: AlerteDTO | null
  erreurConsultation: string | null
  onClose: () => void
  onAcquittee: (alerte: AlerteDTO) => void
  onObsolete: (id: number) => void
}
function Ligne({ label, children }: { label: string; children: ReactNode }) {
  return <><dt className="text-[#6B7180]">{label}</dt><dd className="min-w-0 text-ink">{children}</dd></>
}
const GRILLE = 'grid grid-cols-[150px_minmax(0,1fr)] gap-x-3 gap-y-2.5 text-[13px]'

export function AlerteDetailModal({ alerte, erreurConsultation, onClose, onAcquittee, onObsolete }: AlerteDetailModalProps) {
  return <Modal isOpen={alerte != null} onClose={onClose} maxWidth="max-w-lg" title={alerte ? `Alerte · ${TYPE_LABELS[alerte.type]}` : ''}>
    {alerte && <Contenu alerte={alerte} erreurConsultation={erreurConsultation} onClose={onClose} onAcquittee={onAcquittee} onObsolete={onObsolete} />}
  </Modal>
}

function Contenu({ alerte, erreurConsultation, onClose, onAcquittee, onObsolete }: Omit<AlerteDetailModalProps, 'alerte'> & { alerte: AlerteDTO }) {
  const [confirmation, setConfirmation] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const estAnomalie = alerte.type === 'ANOMALIE'
  const acquittee = alerte.statut === 'ACQUITTEE'

  const acquitter = async () => {
    setEnCours(true)
    setErreur(null)
    try {
      onAcquittee(await alertesApi.acquitter(alerte.id))
      setConfirmation(false)
    } catch (err) {
      setErreur(extractErrorMessage(err, "Impossible d'acquitter cette alerte"))
      if (extractErrorCode(err) === 'DEJA_ACQUITTEE') { setConfirmation(false); onObsolete(alerte.id) }
    } finally { setEnCours(false) }
  }

  return <div className="flex flex-col gap-4">
    {erreurConsultation && <ErrorBanner message={erreurConsultation} />}
    <dl className={GRILLE}>
      <Ligne label="Agent"><span className="font-medium">{alerte.nomCompletAgent ?? '—'}</span>{' '}<span className="font-mono text-[12px] text-[#6B7180]">({alerte.matriculeAgent})</span></Ligne>
      <Ligne label="Type"><Badge tone={estAnomalie ? 'warning' : 'neutral'}>{TYPE_LABELS[alerte.type]}</Badge></Ligne>
      <Ligne label="Statut"><StatutAlerteBadge statut={alerte.statut} /></Ligne>
      <Ligne label="Échéance"><EcheanceAlerte alerte={alerte} /></Ligne>
      {!estAnomalie && <Ligne label="Préparation dès le">{formatDate(alerte.datePreparation)}</Ligne>}
    </dl>
    {changeDeGrade(alerte.type) && <BlocsSituation gradeActuel={alerte.gradeActuel} dateEffetActuelle={alerte.dateEffetActuelle} gradeSuivant={alerte.gradeSuivant} dateEffetNouvelle={alerte.dateEcheance} />}
    <dl className={GRILLE}>
      <Ligne label={estAnomalie ? 'Raison' : 'Note'}>{alerte.details ?? '—'}</Ligne>
      <Ligne label="Détectée le">{formatDateTime(alerte.dateDetection)}</Ligne>
      <Ligne label="Dernière consultation">{formatDateTime(alerte.dateDerniereConsultation)}</Ligne>
      <Ligne label="Acquittement">{alerte.dateAcquittement ? `${formatDateTime(alerte.dateAcquittement)} par ${alerte.acquitteeParEmail ?? '—'}` : 'Non acquittée'}</Ligne>
    </dl>
    {erreur && <ErrorBanner message={erreur} />}
    {!acquittee && confirmation && <div className="flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning-light px-4 py-3 text-[12.5px] text-warning">
      <p>{estAnomalie ? "L'anomalie sort du fil et est figée en historique. Attention : plus aucune anomalie ne sera signalée dans le fil pour cet agent (l'écran Anomalies continue de la lister)." : "L'alerte sort du fil et est figée en historique. Elle ne sera pas régénérée pour cette échéance ; si la date calculée change, une nouvelle alerte apparaîtra."}</p>
      <div className="flex justify-end gap-2"><Button variant="secondary" size="sm" onClick={() => setConfirmation(false)} disabled={enCours}>Annuler</Button><Button size="sm" onClick={acquitter} isLoading={enCours} icon={<Check className="h-4 w-4" />}>Confirmer l'acquittement</Button></div>
    </div>}
    <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Fermer</Button>{!acquittee && !confirmation && <Button icon={<Check className="h-4 w-4" />} onClick={() => setConfirmation(true)}>Acquitter</Button>}</div>
  </div>
}
