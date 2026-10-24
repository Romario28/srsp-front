import { Fragment, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { useFetch } from '@/hooks/useFetch'
import { anticipationApi } from '@/api/anticipation'
import { extractErrorCode } from '@/api/client'
import { formatDate } from '@/utils/date'
import { statutAgentLabel } from '@/utils/anticipation'
import type { AgentFiche, ReferenceAgent, SituationIntegration } from '@/types/anticipation'

export type CleFiche =
  | 'statut' | 'naissance' | 'sexe' | 'cin' | 'corps' | 'categorie' | 'grade' | 'indice'
  | 'avanceDate' | 'debutContrat' | 'finContrat' | 'situation' | 'integrationEtat' | 'integrationDate' | 'integrationPreparation' | 'poste' | 'section'
  | 'localite' | 'ministere' | 'region' | 'hee' | 'heeCategorie' | 'soa'

interface Champ { cle: CleFiche; label: string; valeur: (f: AgentFiche) => ReactNode; visible?: (f: AgentFiche) => boolean }
const ETATS_INTEGRATION: Record<SituationIntegration, string> = {
  NON_CONTRACTUEL: '', CONTRAT_AVEC_FIN: 'Non concerné : contrat à durée déterminée (date de fin renseignée)',
  DEBUT_MANQUANT: 'Non calculable : date de début de contrat manquante', CONCERNE: 'Concerné : contractuel sans date de fin de contrat',
}
const contractuel = (f: AgentFiche) => f.integration.situation !== 'NON_CONTRACTUEL'
const concerne = (f: AgentFiche) => f.integration.situation === 'CONCERNE'
const texte = (v: string | null | undefined) => v || '—'
const reference = (r: ReferenceAgent | null) => r == null ? '—' : r.libelle ? `${r.code} — ${r.libelle}` : r.code
const SEXES: Record<string, string> = { M: 'Masculin', F: 'Féminin' }
const GROUPES: { titre: string; champs: Champ[] }[] = [
  { titre: 'Identité', champs: [
    { cle: 'statut', label: "Statut de l'agent", valeur: (f) => statutAgentLabel(f.statut) },
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
  { titre: 'Intégration', champs: [
    { cle: 'integrationEtat', label: 'Éligibilité', visible: contractuel, valeur: (f) => ETATS_INTEGRATION[f.integration.situation] },
    { cle: 'integrationDate', label: "Date d'intégration prévue", visible: concerne, valeur: (f) => formatDate(f.integration.dateIntegration) },
    { cle: 'integrationPreparation', label: 'Préparation dès le', visible: concerne, valeur: (f) => formatDate(f.integration.datePreparation) },
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

export interface EtatFiche {
  fiche: AgentFiche | null
  isLoading: boolean
  error: string | null
  reload: () => void
}

export function useFicheAgent(matricule: string): EtatFiche {
  const { data, isLoading, error, reload } = useFetch<AgentFiche | null>(
    () => anticipationApi.fiche(matricule).catch((err) => {
      if (extractErrorCode(err) === 'AGENT_INTROUVABLE') return null
      throw err
    }),
    [matricule],
  )
  return { fiche: data, isLoading, error, reload }
}

export function FicheAgentContenu({ etat, exclus, compact = false }: {
  etat: EtatFiche
  exclus: (fiche: AgentFiche) => ReadonlySet<CleFiche>
  /** Deux colonnes de groupes, un champ par ligne : réduit la hauteur de moitié environ. */
  compact?: boolean
}) {
  const { fiche, isLoading, error, reload } = etat
  if (error) return <div className="flex flex-col items-start gap-2"><ErrorBanner message={error} /><Button variant="secondary" size="sm" onClick={reload}>Réessayer</Button></div>
  if (isLoading && !fiche) return <p className="flex items-center gap-2 text-[13px] text-[#6B7180]"><Loader2 className="h-4 w-4 animate-spin text-accent" /> Chargement de la fiche…</p>
  if (!fiche) return <p className="text-[13px] text-[#6B7180]">Cet agent n'existe plus dans la base. Les informations ci-dessus restent valables.</p>

  const masques = exclus(fiche)
  const groupes = GROUPES.map((g) => ({ ...g, champs: g.champs.filter((c) => !masques.has(c.cle) && (c.visible?.(fiche) ?? true)) })).filter((g) => g.champs.length > 0)

  if (compact) return <div className="md:columns-2 md:gap-x-8">{groupes.map((g) => (
    <div key={g.titre} className="mb-2.5 break-inside-avoid">
      <h4 className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#6B7180]">{g.titre}</h4>
      <dl className="grid grid-cols-[9.5rem_minmax(0,1fr)] gap-x-2 gap-y-0.5 text-[12.5px] leading-snug">
        {g.champs.map((c) => <Fragment key={c.cle}>
          <dt className="text-[#6B7180]">{c.label}</dt><dd className="min-w-0 break-words text-ink">{c.valeur(fiche)}</dd>
        </Fragment>)}
      </dl>
    </div>))}</div>

  return <div className="flex flex-col gap-4">{groupes.map((g) => <div key={g.titre}>
    <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#6B7180]">{g.titre}</h4>
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">{g.champs.map((c) => <div key={c.cle} className="min-w-0">
      <dt className="text-[12px] text-[#6B7180]">{c.label}</dt><dd className="break-words text-[13px] text-ink">{c.valeur(fiche)}</dd>
    </div>)}</dl>
  </div>)}</div>
}

/** Version autonome utilisée par la modale d'échéance. */
export function FicheAgent({ matricule, exclus, compact = false }: {
  matricule: string
  exclus: (fiche: AgentFiche) => ReadonlySet<CleFiche>
  compact?: boolean
}) {
  return <FicheAgentContenu etat={useFicheAgent(matricule)} exclus={exclus} compact={compact} />
}
