import { useEffect, useMemo, useState } from 'react'
import { Check, Info, RefreshCw, UserCheck, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useFetch } from '@/hooks/useFetch'
import { useDemandesComptes } from '@/hooks/useDemandesComptes'
import { demandesComptesApi } from '@/api/demandesComptes'
import { formatDateTime } from '@/utils/date'
import { correspond } from '@/utils/recherche'
import { isAdmin, roleLabel } from '@/utils/roles'
import { verifierIdentite, type Verification } from '@/utils/demandesComptes'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ChampRecherche } from '@/components/ui/ChampRecherche'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Spinner } from '@/components/ui/Spinner'
import { ApprobationModal, RefusModal } from './DemandeDecisionModals'
import type { DemandeCompteDTO } from '@/types/demandeCompte'

type Decision = { demande: DemandeCompteDTO; mode: 'APPROBATION' | 'REFUS' }

const IDENTITE: Record<Verification, { tone: 'success' | 'warning' | 'neutral'; label: string; titre: string }> = {
  CONFIRMEE: { tone: 'success', label: 'Correspond', titre: "Le nom et le prénom déclarés correspondent à l'agent du matricule" },
  DIFFERENTE: { tone: 'warning', label: 'Différent', titre: "Le nom ou le prénom déclaré diffère de celui de l'agent du matricule" },
  INCONNUE: { tone: 'neutral', label: 'Matricule inconnu', titre: "Aucun agent n'a ce matricule dans la base : comparaison impossible" },
}
const nomDe = (d: DemandeCompteDTO) => `${d.prenom} ${d.nom}`.trim()

export function DemandesComptesPage() {
  const { user } = useAuth()
  const admin = isAdmin(user?.roles)
  const { refresh: rafraichirPastille } = useDemandesComptes()
  const { data, isLoading, error, reload } = useFetch(() => demandesComptesApi.lister())
  const [recherche, setRecherche] = useState('')
  const [decision, setDecision] = useState<Decision | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  useEffect(() => { rafraichirPastille() }, [rafraichirPastille])

  // Les plus anciennes en premier : ce sont celles qui attendent depuis le plus longtemps
  const demandes = useMemo(() => [...(data ?? [])].sort((a, b) => a.dateDemande.localeCompare(b.dateDemande)), [data])
  const trouvees = useMemo(() => demandes.filter((d) => correspond(recherche, d.nom, d.prenom, d.email, d.matricule, d.departement)), [demandes, recherche])

  const actualiser = () => { reload(); rafraichirPastille() }
  const apresDecision = (message: string) => { setDecision(null); setConfirmation(message); actualiser() }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[20px] font-semibold text-ink">Demandes de comptes</h1>
          <p className="mt-0.5 max-w-3xl text-[13px] text-[#6B7180]">
            Personnes qui ont demandé un accès depuis la page de connexion. Tant qu'une demande n'est pas approuvée, la personne ne peut pas se connecter.
            {data && ` ${data.length} demande${data.length > 1 ? 's' : ''} en attente.`}
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={actualiser} disabled={isLoading}>Actualiser</Button>
      </div>

      {!admin && (
        <div className="flex items-start gap-2.5 rounded-lg border border-accent/30 bg-accent-light px-4 py-3 text-[13px] text-accent-dark">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          Vous ne voyez que les demandes RH et Agent dont le matricule correspond à un agent de votre périmètre.
        </div>
      )}

      {confirmation && (
        <div role="status" className="flex items-start justify-between gap-3 rounded-lg border border-success/30 bg-success-light px-4 py-3 text-[13px] text-success">
          <span>{confirmation}</span>
          <button type="button" onClick={() => setConfirmation(null)} aria-label="Masquer le message" className="rounded p-0.5 hover:bg-success/10"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {error && <ErrorBanner message={error} />}

      {isLoading && !data ? <Spinner label="Chargement des demandes…" /> : data && !error ? (
        data.length === 0 ? (
          <EmptyState icon={UserCheck} title="Aucune demande en attente"
            description={admin ? "Aucune demande de compte n'est en attente de validation." : "Aucune demande de votre périmètre n'est en attente de validation."} />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <ChampRecherche valeur={recherche} onChange={setRecherche} className="w-72"
                ariaLabel="Rechercher une demande par nom, e-mail ou matricule" placeholder="Nom, e-mail ou matricule…" />
              {recherche.trim() !== '' && <span className="text-[12.5px] text-[#6B7180]">{trouvees.length} résultat{trouvees.length > 1 ? 's' : ''} sur {data.length}</span>}
            </div>
            {trouvees.length === 0 ? (
              <EmptyState title="Aucun résultat" description={`Aucune demande ne correspond à « ${recherche.trim()} ».`} />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#E4E6EB] bg-white">
                <table className="w-full">
                  <thead className="border-b border-[#EAEBF0] bg-[#FAFAFB]"><tr>
                    <th className="table-head-cell">Demandeur</th><th className="table-head-cell">Matricule</th>
                    <th className="table-head-cell">Profil</th><th className="table-head-cell">Département</th><th className="table-head-cell">Identité</th>
                    <th className="table-head-cell">Demandée le</th><th className="table-head-cell text-right">Décision</th>
                  </tr></thead>
                  <tbody className="divide-y divide-[#EAEBF0]">{trouvees.map((d) => {
                    const identite = IDENTITE[verifierIdentite(d)]
                    return (
                      <tr key={d.id} className="hover:bg-[#FAFAFB]">
                        <td className="table-cell">
                          <button type="button" onClick={() => setDecision({ demande: d, mode: 'APPROBATION' })} title="Examiner la demande"
                            className="text-left font-medium text-ink hover:underline">{nomDe(d)}</button>
                          <p className="text-[12px] text-[#9CA0AC]">{d.email}</p>
                        </td>
                        <td className="table-cell whitespace-nowrap font-mono text-[12.5px] text-[#4B4F5A]">{d.matricule}</td>
                        <td className="table-cell"><Badge tone="accent">{roleLabel(d.profil)}</Badge></td>
                        <td className="table-cell max-w-[16rem] text-[13px] text-[#4B4F5A]"><span className="block truncate" title={d.departement ?? undefined}>{d.departement ?? '—'}</span></td>
                        <td className="table-cell"><span title={identite.titre}><Badge tone={identite.tone}>{identite.label}</Badge></span></td>
                        <td className="table-cell whitespace-nowrap text-[#4B4F5A]">{formatDateTime(d.dateDemande)}</td>
                        <td className="table-cell">
                          <div className="flex justify-end gap-1.5">
                            <Button size="sm" icon={<Check className="h-3.5 w-3.5" />} onClick={() => setDecision({ demande: d, mode: 'APPROBATION' })}
                              aria-label={`Examiner et approuver la demande de ${nomDe(d)}`}>Examiner</Button>
                            <Button size="sm" variant="secondary" icon={<X className="h-3.5 w-3.5" />} onClick={() => setDecision({ demande: d, mode: 'REFUS' })}
                              aria-label={`Refuser la demande de ${nomDe(d)}`}>Refuser</Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}</tbody>
                </table>
              </div>
            )}
          </div>
        )
      ) : null}

      <ApprobationModal demande={decision?.mode === 'APPROBATION' ? decision.demande : null} onClose={() => setDecision(null)}
        onFait={() => { if (decision) apresDecision(`Compte de ${nomDe(decision.demande)} activé : la personne peut maintenant se connecter.`) }}
        onObsolete={actualiser} />
      <RefusModal demande={decision?.mode === 'REFUS' ? decision.demande : null} onClose={() => setDecision(null)}
        onFait={() => { if (decision) apresDecision(`Demande de ${nomDe(decision.demande)} refusée et supprimée.`) }}
        onObsolete={actualiser} />
    </div>
  )
}