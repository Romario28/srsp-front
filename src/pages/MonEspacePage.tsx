import { useState } from 'react'
import { CalendarClock, ClipboardList, Play, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useFetch } from '@/hooks/useFetch'
import { monEspaceApi } from '@/api/monEspace'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Spinner } from '@/components/ui/Spinner'
import { FicheAgentContenu, type CleFiche, type EtatFiche } from '@/pages/anticipation/FicheAgent'
import { GradeSuivant } from '@/pages/anticipation/GradeSuivant'
import { DossierFormModal } from '@/pages/dossiers/DossierFormModal'
import { formatDate } from '@/utils/date'
import { TYPE_LABELS, changeDeGrade, libelleEcheance, toneDelai } from '@/utils/anticipation'
import { ETAT_DOSSIER, etatDe, restrictionDossier } from '@/utils/dossiers'
import type { DossierDTO } from '@/types/dossier'

const AUCUN_EXCLUS: ReadonlySet<CleFiche> = new Set<CleFiche>()

export function MonEspacePage() {
  const { user } = useAuth()
  const { data, isLoading, error, reload } = useFetch(() => monEspaceApi.consulter())
  const [edition, setEdition] = useState<{ dossier: DossierDTO; confirmer: boolean } | null>(null)

  if (isLoading && !data) return <Spinner label="Chargement de votre espace…" />
  if (!data) return (
    <div className="flex max-w-xl flex-col items-start gap-3">
      <h1 className="font-display text-[20px] font-semibold text-ink">Mon Espace</h1>
      {error && <ErrorBanner message={error} />}
      <Button variant="secondary" size="sm" onClick={reload}>Réessayer</Button>
    </div>
  )

  const { fiche } = data
  const restriction = restrictionDossier(user, fiche.matricule)
  const nom = [fiche.prenoms, fiche.nom].filter(Boolean).join(' ')
  const etatFiche: EtatFiche = { fiche, isLoading: false, error: null, reload }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-semibold text-ink">Mon Espace</h1>
          <p className="mt-1 text-[13px] text-[#6B7180]">{nom || user?.nomComplet} · matricule <span className="font-mono">{fiche.matricule}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={restriction ? 'neutral' : 'warning'}>{restriction ? 'Lecture seule' : 'Peut agir sur son dossier'}</Badge>
          <Button variant="secondary" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={reload} disabled={isLoading}>Actualiser</Button>
        </div>
      </header>

      {error && <ErrorBanner message={error} />}
      {!data.enActivite && (
        <div className="rounded-lg border border-warning/30 bg-warning-light px-4 py-3 text-[13px] text-warning">
          Votre situation administrative n'est pas « en activité » : aucune échéance n'est calculée.
        </div>
      )}
      {data.donneesManquantes.length > 0 && (
        <div className="rounded-lg border border-accent/30 bg-accent-light px-4 py-3 text-[13px] text-accent-dark">
          <p className="font-medium">Informations manquantes sur votre fiche : certaines échéances ne peuvent pas être calculées.</p>
          <ul className="mt-1 list-disc pl-5">{data.donneesManquantes.map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
      )}

      <section className="flex flex-col gap-2 rounded-xl border border-[#E4E6EB] bg-white p-4">
        <h2 className="flex items-center gap-2 font-display text-[14px] font-semibold text-ink">
          <CalendarClock className="h-4 w-4 text-accent" aria-hidden="true" />Mes échéances
        </h2>
        {data.echeances.length === 0 ? (
          <EmptyState icon={CalendarClock} title="Aucune échéance calculée" description="Vos échéances apparaîtront dès que votre fiche sera complète." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#E4E6EB]"><table className="w-full">
            <thead className="border-b border-[#EAEBF0] bg-[#FAFAFB]"><tr>
              <th className="table-head-cell">Type</th><th className="table-head-cell">Grade suivant</th>
              <th className="table-head-cell">Préparation dès le</th><th className="table-head-cell">Échéance</th>
              <th className="table-head-cell">Délai</th><th className="table-head-cell">Dossier</th>
            </tr></thead>
            <tbody className="divide-y divide-[#EAEBF0]">{data.echeances.map((e) => (
              <tr key={`${e.type}-${e.dateEcheance}`}>
                <td className="table-cell whitespace-nowrap"><Badge tone="accent">{TYPE_LABELS[e.type]}</Badge></td>
                <td className="table-cell whitespace-nowrap">{changeDeGrade(e.type) ? <GradeSuivant gradeSuivant={e.gradeSuivant} /> : '—'}</td>
                <td className="table-cell whitespace-nowrap text-[#4B4F5A]">{formatDate(e.datePreparation)}</td>
                <td className="table-cell whitespace-nowrap text-[#4B4F5A]">{formatDate(e.dateEcheance)}</td>
                <td className="table-cell whitespace-nowrap"><Badge tone={toneDelai(e.joursRestants)}>{libelleEcheance(e.joursRestants)}</Badge></td>
                <td className="table-cell whitespace-nowrap">{e.dossier ? <Badge tone={ETAT_DOSSIER[e.dossier].tone}>{ETAT_DOSSIER[e.dossier].label}</Badge> : '—'}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>

      <section className="flex flex-col gap-2 rounded-xl border border-[#E4E6EB] bg-white p-4">
        <h2 className="flex items-center gap-2 font-display text-[14px] font-semibold text-ink">
          <ClipboardList className="h-4 w-4 text-accent" aria-hidden="true" />Mes dossiers
        </h2>
        {data.dossiers.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Aucun dossier" description="Un dossier est ouvert automatiquement quand la préparation d'une échéance est atteinte." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#E4E6EB]"><table className="w-full">
            <thead className="border-b border-[#EAEBF0] bg-[#FAFAFB]"><tr>
              <th className="table-head-cell">Type</th><th className="table-head-cell">Préparation</th><th className="table-head-cell">Échéance</th>
              <th className="table-head-cell">État</th><th className="table-head-cell text-right">Action</th>
            </tr></thead>
            <tbody className="divide-y divide-[#EAEBF0]">{data.dossiers.map((d) => {
              const etat = ETAT_DOSSIER[etatDe(d)]
              return (
                <tr key={d.id}>
                  <td className="table-cell whitespace-nowrap"><Badge>{TYPE_LABELS[d.type]}</Badge></td>
                  <td className="table-cell whitespace-nowrap text-[#4B4F5A]">{formatDate(d.datePreparation)}</td>
                  <td className="table-cell whitespace-nowrap"><span className={d.enRetard ? 'font-semibold text-danger' : 'text-[#4B4F5A]'}>{formatDate(d.dateEcheance)}</span></td>
                  <td className="table-cell">
                    <Badge tone={etat.tone}>{etat.label}</Badge>
                    {d.enRetard && <p className="mt-1 text-[12px] font-medium text-danger">{d.joursRetard} jour{(d.joursRetard ?? 0) > 1 ? 's' : ''} de retard</p>}
                    {d.statut === 'EN_COURS' && d.dateDemarrage && <p className="mt-1 text-[12px] text-[#6B7180]">Depuis le {formatDate(d.dateDemarrage)}</p>}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-1.5">
                      {d.statut === 'EN_ATTENTE_DE_TRAITEMENT' && restriction === null && (
                        <Button size="sm" icon={<Play className="h-3.5 w-3.5" />} onClick={() => setEdition({ dossier: d, confirmer: true })}>Démarrer</Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setEdition({ dossier: d, confirmer: false })}>Détails</Button>
                    </div>
                  </td>
                </tr>
              )
            })}</tbody>
          </table></div>
        )}
      </section>

      <section className="flex flex-col gap-2 rounded-xl border border-[#E4E6EB] bg-white p-4">
        <h2 className="font-display text-[14px] font-semibold text-ink">Mes informations</h2>
        <FicheAgentContenu etat={etatFiche} exclus={() => AUCUN_EXCLUS} compact />
      </section>

      <DossierFormModal dossier={edition?.dossier ?? null} confirmerDemarrage={edition?.confirmer ?? false}
        fichePrechargee={fiche} onClose={() => setEdition(null)} onChange={() => { setEdition(null); reload() }} />
    </div>
  )
}
