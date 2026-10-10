import type { ReactNode } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/utils/date'
import { TYPE_LABELS, libelleEcheance, statutAgentLabel, toneDelai } from '@/utils/anticipation'
import { Age, AgeA } from './DatesCarriere'
import { BlocsSituation } from './SituationsGrade'
import { FicheAgent, type CleFiche } from './FicheAgent'
import type { AlerteAnticipation } from '@/types/anticipation'

const GRILLE = 'grid grid-cols-[180px_minmax(0,1fr)] gap-x-3 gap-y-2 text-[13px]'
function Ligne({ label, children }: { label: string; children: ReactNode }) {
  return <><dt className="text-[#6B7180]">{label}</dt><dd className="min-w-0 text-ink">{children}</dd></>
}
function Section({ titre, aide, children }: { titre: string; aide?: string; children: ReactNode }) {
  return <section className="flex flex-col gap-3 border-t border-[#EAEBF0] pt-4"><div>
    <h3 className="font-display text-[13.5px] font-semibold text-ink">{titre}</h3>{aide && <p className="mt-0.5 text-[12px] text-[#9CA0AC]">{aide}</p>}
  </div>{children}</section>
}

function InformationsCles({ item }: { item: AlerteAnticipation }) {
  const preparation = <Ligne label="Préparation dès le">{formatDate(item.datePreparation)}</Ligne>
  const note = item.details ? <Ligne label="Note">{item.details}</Ligne> : null
  switch (item.type) {
    case 'AVANCEMENT':
    case 'TITULARISATION': return <div className="flex flex-col gap-3">
      <BlocsSituation gradeActuel={item.gradeCode} dateEffetActuelle={item.avanceDate ?? item.dateDebutContrat} gradeSuivant={item.gradeSuivant} dateEffetNouvelle={item.dateEcheance} />
      <dl className={GRILLE}>{preparation}{note}</dl>
    </div>
    case 'FIN_CONTRAT': return <dl className={GRILLE}>
      <Ligne label="Date de début">{formatDate(item.dateDebutContrat)}</Ligne><Ligne label="Date de fin">{formatDate(item.dateFinContrat)}</Ligne>
      <Ligne label="Durée restante"><Badge tone={toneDelai(item.joursRestants)}>{libelleEcheance(item.joursRestants)}</Badge></Ligne>{preparation}{note}
    </dl>
    case 'DEPART_RETRAITE': return <dl className={GRILLE}>
      <Ligne label="Date de naissance">{formatDate(item.dateNaissance)}</Ligne><Ligne label="Âge actuel"><Age naissance={item.dateNaissance} /></Ligne>
      <Ligne label="Âge de départ"><AgeA naissance={item.dateNaissance} aLaDate={item.dateEcheance} /></Ligne><Ligne label="Date de retraite">{formatDate(item.dateEcheance)}</Ligne>{preparation}{note}
    </dl>
    default: return <dl className={GRILLE}><Ligne label="Raison">{item.details ?? '—'}</Ligne></dl>
  }
}

function dejaAffiches(item: AlerteAnticipation): Set<CleFiche> {
  const exclus = new Set<CleFiche>(['statut'])
  switch (item.type) {
    case 'AVANCEMENT':
    case 'TITULARISATION':
      exclus.add('grade'); exclus.add('avanceDate')
      if (item.avanceDate == null) exclus.add('debutContrat')
      break
    case 'FIN_CONTRAT': exclus.add('debutContrat'); exclus.add('finContrat'); break
    case 'DEPART_RETRAITE': exclus.add('naissance'); break
  }
  return exclus
}

export function EcheanceDetailModal({ item, onClose }: { item: AlerteAnticipation | null; onClose: () => void }) {
  return <Modal isOpen={item != null} onClose={onClose} maxWidth="max-w-2xl" title={item ? item.type === 'ANOMALIE' ? 'Anomalie' : `Échéance · ${TYPE_LABELS[item.type]}` : ''}>
    {item && <Contenu item={item} onClose={onClose} />}
  </Modal>
}

function Contenu({ item, onClose }: { item: AlerteAnticipation; onClose: () => void }) {
  const estAnomalie = item.type === 'ANOMALIE'
  return <div className="flex flex-col gap-5">
    <dl className={GRILLE}>
      <Ligne label="Agent"><span className="font-medium">{item.nomComplet}</span>{' '}<span className="font-mono text-[12px] text-[#6B7180]">({item.matricule})</span></Ligne>
      <Ligne label="Type"><Badge tone={estAnomalie ? 'warning' : 'neutral'}>{TYPE_LABELS[item.type]}</Badge></Ligne>
      <Ligne label="Statut"><Badge tone="neutral">{statutAgentLabel(item.statut)}</Badge></Ligne>
      {!estAnomalie && <><Ligne label="Échéance">{formatDate(item.dateEcheance)}</Ligne><Ligne label="Délai"><Badge tone={toneDelai(item.joursRestants)}>{libelleEcheance(item.joursRestants)}</Badge></Ligne></>}
    </dl>
    <Section titre="Informations clés"><InformationsCles item={item} /></Section>
    <Section titre="Fiche agent" aide="Les informations déjà affichées ci-dessus ne sont pas répétées.">
      <FicheAgent matricule={item.matricule} exclus={() => dejaAffiches(item)} />
    </Section>
    <div className="flex justify-end"><Button variant="secondary" onClick={onClose}>Fermer</Button></div>
  </div>
}
