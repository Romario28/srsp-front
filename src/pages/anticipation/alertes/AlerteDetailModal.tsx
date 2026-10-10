import { useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge, StatutAlerteBadge } from '@/components/ui/Badge'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { alertesApi } from '@/api/alertes'
import { extractErrorCode, extractErrorMessage } from '@/api/client'
import { formatDate, formatDateTime, joursRestantsDepuis } from '@/utils/date'
import { TYPE_LABELS, libelleEcheance, statutAgentLabel, toneDelai, changeDeGrade } from '@/utils/anticipation'
import { Age, AgeA } from '../DatesCarriere'
import { BlocsSituation } from '../SituationsGrade'
import { FicheAgentContenu, useFicheAgent, type CleFiche, type EtatFiche } from '../FicheAgent'
import type { AgentFiche, TypeAnticipation } from '@/types/anticipation'
import type { AlerteDTO } from '@/types/alerte'

interface AlerteDetailModalProps {
  alerte: AlerteDTO | null
  erreurConsultation: string | null
  onClose: () => void
  onAcquittee: (alerte: AlerteDTO) => void
  onObsolete: (id: number) => void
}

const GRILLE = 'grid grid-cols-[130px_minmax(0,1fr)] gap-x-3 gap-y-2 text-[13px] sm:grid-cols-[180px_minmax(0,1fr)]'
function Ligne({ label, children }: { label: string; children: ReactNode }) {
  return <><dt className="text-[#6B7180]">{label}</dt><dd className="min-w-0 text-ink">{children}</dd></>
}
function Section({ titre, aide, children }: { titre: string; aide?: string; children: ReactNode }) {
  return <section className="flex flex-col gap-3 border-t border-[#EAEBF0] pt-4"><div>
    <h3 className="font-display text-[13.5px] font-semibold text-ink">{titre}</h3>{aide && <p className="mt-0.5 text-[12px] text-[#9CA0AC]">{aide}</p>}
  </div>{children}</section>
}
function Repere({ label, children }: { label: string; children: ReactNode }) {
  return <div className="rounded-lg border border-[#E4E6EB] bg-[#FAFAFB] px-4 py-2.5">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7180]">{label}</p><div className="mt-1 text-[14px] font-medium text-ink">{children}</div>
  </div>
}
function Squelette({ className }: { className: string }) {
  return <span aria-hidden="true" className={`inline-block animate-pulse bg-[#EAEBF0] align-middle ${className}`} />
}
function ValeurFiche({ etat, children }: { etat: EtatFiche; children: (fiche: AgentFiche) => ReactNode }) {
  if (etat.fiche) return <>{children(etat.fiche)}</>
  if (etat.isLoading) return <Squelette className="h-3.5 w-24 rounded" />
  return <span className="text-[#9CA0AC]" title="Fiche indisponible">—</span>
}
function Preparation({ date, suivre }: { date: string | null; suivre: boolean }) {
  if (!date) return <span className="text-[#9CA0AC]">—</span>
  const jours = joursRestantsDepuis(date)
  return <span className="flex flex-wrap items-center gap-2"><span>{formatDate(date)}</span>{suivre && jours != null && (jours <= 0 ? <Badge tone="success">Ouverte</Badge> : <Badge>{libelleEcheance(jours)}</Badge>)}</span>
}

function libelleDateEcheance(type: TypeAnticipation): string {
  switch (type) {
    case 'DEPART_RETRAITE': return 'Date de retraite'
    case 'FIN_CONTRAT': return 'Date de fin de contrat'
    case 'AVANCEMENT': case 'TITULARISATION': return 'Nouvelle situation dès le'
    default: return 'Échéance'
  }
}

function EnTete({ alerte, etat }: { alerte: AlerteDTO; etat: EtatFiche }) {
  const estAnomalie = alerte.type === 'ANOMALIE'
  const avecEcheance = !estAnomalie && alerte.dateEcheance != null
  const delai = avecEcheance && alerte.statut !== 'ACQUITTEE' ? joursRestantsDepuis(alerte.dateEcheance) : null
  return <header className="flex flex-col gap-3">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><h3 className="font-display text-[17px] font-semibold text-ink">{alerte.nomCompletAgent ?? '—'}</h3><p className="font-mono text-[12.5px] text-[#6B7180]">Matricule {alerte.matriculeAgent}</p></div>
      <StatutAlerteBadge statut={alerte.statut} />
    </div>
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge tone={estAnomalie ? 'warning' : 'accent'}>{TYPE_LABELS[alerte.type]}</Badge>
      {etat.fiche ? <Badge>{statutAgentLabel(etat.fiche.statut)}</Badge> : etat.isLoading ? <Squelette className="h-5 w-20 rounded-full" /> : <Badge>—</Badge>}
    </div>
    {avecEcheance && <div className={`grid gap-3 ${delai != null ? 'grid-cols-2' : 'grid-cols-1'}`}>
      <Repere label={libelleDateEcheance(alerte.type)}>{formatDate(alerte.dateEcheance)}</Repere>
      {delai != null && <Repere label="Délai"><Badge tone={toneDelai(delai)}>{libelleEcheance(delai)}</Badge></Repere>}
    </div>}
  </header>
}

function InformationsCles({ alerte, etat }: { alerte: AlerteDTO; etat: EtatFiche }) {
  const preparation = <Ligne label="Préparation dès le"><Preparation date={alerte.datePreparation} suivre={alerte.statut !== 'ACQUITTEE'} /></Ligne>
  const note = alerte.details ? <Ligne label="Note">{alerte.details}</Ligne> : null
  switch (alerte.type) {
    case 'AVANCEMENT': case 'TITULARISATION': return <Section titre="Informations clés">
      <BlocsSituation gradeActuel={alerte.gradeActuel} dateEffetActuelle={alerte.dateEffetActuelle} gradeSuivant={alerte.gradeSuivant} dateEffetNouvelle={alerte.dateEcheance} />
      <dl className={GRILLE}>{preparation}{note}</dl>
    </Section>
    case 'FIN_CONTRAT': return <Section titre="Informations clés"><dl className={GRILLE}>
      <Ligne label="Début de contrat"><ValeurFiche etat={etat}>{(f) => formatDate(f.dateDebutContrat)}</ValeurFiche></Ligne>{preparation}{note}
    </dl></Section>
    case 'DEPART_RETRAITE': return <Section titre="Informations clés"><dl className={GRILLE}>
      <Ligne label="Date de naissance"><ValeurFiche etat={etat}>{(f) => formatDate(f.dateNaissance)}</ValeurFiche></Ligne>
      <Ligne label="Âge actuel"><ValeurFiche etat={etat}>{(f) => <Age naissance={f.dateNaissance} />}</ValeurFiche></Ligne>
      <Ligne label="Âge de départ"><ValeurFiche etat={etat}>{(f) => <AgeA naissance={f.dateNaissance} aLaDate={alerte.dateEcheance} />}</ValeurFiche></Ligne>
      {preparation}{note}
    </dl></Section>
    default: return <Section titre="Informations clés"><div className="rounded-lg border border-warning/30 bg-warning-light px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-warning">Raison</p><p className="mt-1 text-[13px] text-ink">{alerte.details ?? '—'}</p>
    </div></Section>
  }
}

function Suivi({ alerte }: { alerte: AlerteDTO }) {
  const acquittement = alerte.dateAcquittement ? `${formatDateTime(alerte.dateAcquittement)} par ${alerte.acquitteeParEmail ?? '—'}` : 'Non acquittée'
  const elements: [string, string][] = [['Détectée le', formatDateTime(alerte.dateDetection)], ['Dernière consultation', formatDateTime(alerte.dateDerniereConsultation)], ['Acquittement', acquittement]]
  return <Section titre="Suivi de l'alerte"><dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-3">
    {elements.map(([label, valeur]) => <div key={label} className="min-w-0"><dt className="text-[12px] text-[#6B7180]">{label}</dt><dd className="break-words text-[13px] text-ink">{valeur}</dd></div>)}
  </dl></Section>
}

const memeDate = (a: string | null, b: string | null) => a != null && b != null && a.slice(0, 10) === b.slice(0, 10)
function dejaAffiches(alerte: AlerteDTO, fiche: AgentFiche): ReadonlySet<CleFiche> {
  const exclus = new Set<CleFiche>(['statut'])
  switch (alerte.type) {
    case 'AVANCEMENT': case 'TITULARISATION': {
      if (alerte.gradeActuel != null && fiche.grade?.code === alerte.gradeActuel) exclus.add('grade')
      const effetFiche = fiche.avanceDate ?? fiche.dateDebutContrat
      if (memeDate(alerte.dateEffetActuelle, effetFiche)) exclus.add(fiche.avanceDate != null ? 'avanceDate' : 'debutContrat')
      break
    }
    case 'DEPART_RETRAITE': exclus.add('naissance'); break
    case 'FIN_CONTRAT':
      exclus.add('debutContrat')
      if (memeDate(alerte.dateEcheance, fiche.dateFinContrat)) exclus.add('finContrat')
      break
  }
  return exclus
}

export function AlerteDetailModal({ alerte, erreurConsultation, onClose, onAcquittee, onObsolete }: AlerteDetailModalProps) {
  if (!alerte) return null
  return <Fenetre key={alerte.id} alerte={alerte} erreurConsultation={erreurConsultation} onClose={onClose} onAcquittee={onAcquittee} onObsolete={onObsolete} />
}

function Fenetre({ alerte, erreurConsultation, onClose, onAcquittee, onObsolete }: Omit<AlerteDetailModalProps, 'alerte'> & { alerte: AlerteDTO }) {
  const etat = useFicheAgent(alerte.matriculeAgent)
  const [confirmation, setConfirmation] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const estAnomalie = alerte.type === 'ANOMALIE'
  const acquittee = alerte.statut === 'ACQUITTEE'
  const acquitter = async () => {
    setEnCours(true); setErreur(null)
    try { onAcquittee(await alertesApi.acquitter(alerte.id)); setConfirmation(false) }
    catch (err) { setErreur(extractErrorMessage(err, "Impossible d'acquitter cette alerte")); if (extractErrorCode(err) === 'DEJA_ACQUITTEE') { setConfirmation(false); onObsolete(alerte.id) } }
    finally { setEnCours(false) }
  }
  const pied = <div className="flex flex-col gap-3">
    {erreur && <ErrorBanner message={erreur} />}
    {!acquittee && confirmation && <div className="rounded-lg border border-warning/30 bg-warning-light px-4 py-3 text-[12.5px] text-warning">{estAnomalie
      ? "L'anomalie sort du fil et est figée en historique. Attention : plus aucune anomalie ne sera signalée dans le fil pour cet agent (l'écran Anomalies continue de la lister)."
      : "L'alerte sort du fil et est figée en historique. Elle ne sera pas régénérée pour cette échéance ; si la date calculée change, une nouvelle alerte apparaîtra."}</div>}
    <div className="flex justify-end gap-2">{!acquittee && confirmation ? <>
      <Button variant="secondary" onClick={() => setConfirmation(false)} disabled={enCours}>Annuler</Button><Button icon={<Check className="h-4 w-4" />} onClick={acquitter} isLoading={enCours}>Confirmer l'acquittement</Button>
    </> : <><Button variant="secondary" onClick={onClose}>Fermer</Button>{!acquittee && <Button icon={<Check className="h-4 w-4" />} onClick={() => setConfirmation(true)}>Acquitter</Button>}</>}</div>
  </div>
  return <Modal isOpen onClose={onClose} maxWidth="max-w-2xl" title="Détail de l'alerte" footer={pied}>
    <div className="flex flex-col gap-4">
      {erreurConsultation && <ErrorBanner message={erreurConsultation} />}
      <EnTete alerte={alerte} etat={etat} />
      <InformationsCles alerte={alerte} etat={etat} />
      <Suivi alerte={alerte} />
      <Section titre="Fiche agent" aide={changeDeGrade(alerte.type) ? "Le grade et la date d'effet ne sont répétés que s'ils diffèrent de la situation figée à la détection." : 'Les informations déjà affichées ci-dessus ne sont pas répétées.'}>
        <FicheAgentContenu etat={etat} exclus={(fiche) => dejaAffiches(alerte, fiche)} />
      </Section>
    </div>
  </Modal>
}
