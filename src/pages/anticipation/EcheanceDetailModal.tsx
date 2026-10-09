import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { useFetch } from '@/hooks/useFetch'
import { anticipationApi } from '@/api/anticipation'
import { formatDate } from '@/utils/date'
import { TYPE_LABELS, libelleEcheance, statutAgentLabel, toneDelai } from '@/utils/anticipation'
import { Age, AgeA } from './DatesCarriere'
import { BlocsSituation } from './SituationsGrade'
import type { AgentFiche, AlerteAnticipation, ReferenceAgent } from '@/types/anticipation'

const GRILLE = 'grid grid-cols-[180px_minmax(0,1fr)] gap-x-3 gap-y-2 text-[13px]'
function Ligne({ label, children }: { label: string; children: ReactNode }) {
  return <><dt className="text-[#6B7180]">{label}</dt><dd className="min-w-0 text-ink">{children}</dd></>
}
function Section({ titre, aide, children }: { titre: string; aide?: string; children: ReactNode }) {
  return <section className="flex flex-col gap-3 border-t border-[#EAEBF0] pt-4">
    <div><h3 className="font-display text-[13.5px] font-semibold text-ink">{titre}</h3>{aide && <p className="mt-0.5 text-[12px] text-[#9CA0AC]">{aide}</p>}</div>
    {children}
  </section>
}

function InformationsCles({ item }: { item: AlerteAnticipation }) {
  const preparation = <Ligne label="Préparation dès le">{formatDate(item.datePreparation)}</Ligne>
  const note = item.details ? <Ligne label="Note">{item.details}</Ligne> : null
  switch (item.type) {
    case 'AVANCEMENT':
    case 'TITULARISATION':
      return <div className="flex flex-col gap-3">
        <BlocsSituation gradeActuel={item.gradeCode} dateEffetActuelle={item.avanceDate ?? item.dateDebutContrat} gradeSuivant={item.gradeSuivant} dateEffetNouvelle={item.dateEcheance} />
        <dl className={GRILLE}>{preparation}{note}</dl>
      </div>
    case 'FIN_CONTRAT':
      return <dl className={GRILLE}>
        <Ligne label="Date de début">{formatDate(item.dateDebutContrat)}</Ligne>
        <Ligne label="Date de fin">{formatDate(item.dateFinContrat)}</Ligne>
        <Ligne label="Durée restante"><Badge tone={toneDelai(item.joursRestants)}>{libelleEcheance(item.joursRestants)}</Badge></Ligne>
        {preparation}{note}
      </dl>
    case 'DEPART_RETRAITE':
      return <dl className={GRILLE}>
        <Ligne label="Date de naissance">{formatDate(item.dateNaissance)}</Ligne>
        <Ligne label="Âge actuel"><Age naissance={item.dateNaissance} /></Ligne>
        <Ligne label="Âge de départ"><AgeA naissance={item.dateNaissance} aLaDate={item.dateEcheance} /></Ligne>
        <Ligne label="Date de retraite">{formatDate(item.dateEcheance)}</Ligne>
        {preparation}{note}
      </dl>
    default:
      return <dl className={GRILLE}><Ligne label="Raison">{item.details ?? '—'}</Ligne></dl>
  }
}

type CleFiche = 'naissance' | 'sexe' | 'cin' | 'corps' | 'categorie' | 'grade' | 'indice' | 'avanceDate' | 'debutContrat' | 'finContrat' | 'situation' | 'poste' | 'section' | 'localite' | 'ministere' | 'region' | 'hee' | 'heeCategorie' | 'soa'
interface Champ { cle: CleFiche; label: string; valeur: (f: AgentFiche) => ReactNode }
const texte = (v: string | null | undefined) => v || '—'
const reference = (r: ReferenceAgent | null) => r == null ? '—' : r.libelle ? `${r.code} — ${r.libelle}` : r.code
const SEXES: Record<string, string> = { M: 'Masculin', F: 'Féminin' }
const GROUPES: { titre: string; champs: Champ[] }[] = [
  { titre: 'Identité', champs: [
    { cle: 'naissance', label: 'Date de naissance', valeur: (f) => formatDate(f.dateNaissance) },
    { cle: 'sexe', label: 'Sexe', valeur: (f) => f.sexe ? SEXES[f.sexe] ?? f.sexe : '—' },
    { cle: 'cin', label: 'CIN', valeur: (f) => texte(f.cin) },
  ] },
  { titre: 'Carrière', champs: [
    { cle: 'corps', label: 'Corps', valeur: (f) => reference(f.corps) },
    { cle: 'categorie', label: 'Catégorie', valeur: (f) => texte(f.categorieCode) },
    { cle: 'grade', label: 'Grade', valeur: (f) => reference(f.grade) },
    { cle: 'indice', label: 'Indice', valeur: (f) => texte(f.indice) },
    { cle: 'avanceDate', label: 'Date du dernier avancement', valeur: (f) => formatDate(f.avanceDate) },
    { cle: 'debutContrat', label: 'Date de début de contrat', valeur: (f) => formatDate(f.dateDebutContrat) },
    { cle: 'finContrat', label: 'Date de fin de contrat', valeur: (f) => formatDate(f.dateFinContrat) },
    { cle: 'situation', label: 'Situation administrative', valeur: (f) => f.situation == null ? '— (réputé en activité)' : reference(f.situation) },
  ] },
  { titre: 'Affectation', champs: [
    { cle: 'poste', label: 'N° de poste', valeur: (f) => texte(f.posteNumero) },
    { cle: 'section', label: 'Section', valeur: (f) => texte(f.sectionCode) },
    { cle: 'localite', label: 'Localité', valeur: (f) => reference(f.localite) },
    { cle: 'ministere', label: 'Ministère', valeur: (f) => reference(f.ministere) },
    { cle: 'region', label: 'Région', valeur: (f) => texte(f.regCode) },
  ] },
  { titre: 'Références', champs: [
    { cle: 'hee', label: 'HEE', valeur: (f) => reference(f.hee) },
    { cle: 'heeCategorie', label: 'Catégorie HEE', valeur: (f) => texte(f.heeCategorieCode) },
    { cle: 'soa', label: 'SOA', valeur: (f) => reference(f.soa) },
  ] },
]

function dejaAffiches(item: AlerteAnticipation): Set<CleFiche> {
  switch (item.type) {
    case 'AVANCEMENT':
    case 'TITULARISATION': {
      const exclus = new Set<CleFiche>(['grade', 'avanceDate'])
      if (item.avanceDate == null) exclus.add('debutContrat')
      return exclus
    }
    case 'FIN_CONTRAT': return new Set<CleFiche>(['debutContrat', 'finContrat'])
    case 'DEPART_RETRAITE': return new Set<CleFiche>(['naissance'])
    default: return new Set<CleFiche>()
  }
}

function FicheAgent({ item }: { item: AlerteAnticipation }) {
  const { data, isLoading, error, reload } = useFetch(() => anticipationApi.fiche(item.matricule), [item.matricule])
  if (isLoading && !data) return <p className="flex items-center gap-2 text-[13px] text-[#6B7180]"><Loader2 className="h-4 w-4 animate-spin text-accent" />Chargement de la fiche…</p>
  if (error) return <div className="flex flex-col items-start gap-2"><ErrorBanner message={error} /><Button variant="secondary" size="sm" onClick={reload}>Réessayer</Button></div>
  if (!data) return null
  const exclus = dejaAffiches(item)
  const groupes = GROUPES.map((g) => ({ ...g, champs: g.champs.filter((c) => !exclus.has(c.cle)) })).filter((g) => g.champs.length > 0)
  return <div className="flex flex-col gap-4">{groupes.map((g) => <div key={g.titre}>
    <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#6B7180]">{g.titre}</h4>
    <dl className={GRILLE}>{g.champs.map((c) => <Ligne key={c.cle} label={c.label}>{c.valeur(data)}</Ligne>)}</dl>
  </div>)}</div>
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
    <Section titre="Fiche agent" aide="Les informations déjà affichées ci-dessus ne sont pas répétées."><FicheAgent item={item} /></Section>
    <div className="flex justify-end"><Button variant="secondary" onClick={onClose}>Fermer</Button></div>
  </div>
}
