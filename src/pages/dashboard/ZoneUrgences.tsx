import { Link } from 'react-router-dom'
import { CheckCircle2, ClipboardList } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useDossierApercu } from '@/hooks/useDossierApercu'
import { TYPE_LABELS, libelleEcheance } from '@/utils/anticipation'
import { formatDate, joursRestantsDepuis } from '@/utils/date'
import { etatDe } from '@/utils/dossiers'
import { nombreFr, pluriel } from '@/utils/dashboard'
import { lienAvecPortee } from '@/utils/filtresAgents'
import type { FiltresAgents } from '@/types/anticipation'
import { BlocDashboard } from './BlocDashboard'
import type { EtatChargement, Urgences } from '@/types/dashboard'
import type { DossierDTO } from '@/types/dossier'

function Delai({ d, retard }: { d: DossierDTO; retard: boolean }) {
  if (retard) return <span className="font-semibold text-danger">{pluriel(d.joursRetard ?? 0, 'jour', 'jours')}</span>
  return <Badge>{libelleEcheance(joursRestantsDepuis(d.dateEcheance) ?? 0)}</Badge>
}

export function ZoneUrgences({ etat, portee }: { etat: EtatChargement<Urgences>; portee: FiltresAgents }) {
  const { ouvrir } = useDossierApercu()
  const u = etat.data
  const retard = u?.mode === 'RETARD'
  const lignes = u?.page.content ?? []
  const total = u?.page.totalElements ?? 0
  const ouvrirDossier = (d: DossierDTO) => ouvrir({ matricule: d.matricule, type: d.type, dateEcheance: d.dateEcheance.slice(0, 10) }, etatDe(d))
  const sousTitre = retard
    ? total > lignes.length ? `Les ${lignes.length} retards les plus anciens` : lignes.length > 1 ? `Les ${lignes.length} retards, du plus ancien au plus récent` : 'Le seul retard'
    : "Prochains dossiers à traiter, échéance la plus proche d'abord"
  const actions = u && <div className="flex flex-wrap items-center justify-between gap-2">
    <p className="text-[12.5px] text-[#6B7180]">{sousTitre}</p>
    {retard ? <Link to={lienAvecPortee('/anticipation/dossiers', portee, { vue: 'EN_RETARD' })} className="text-[12.5px] font-medium text-accent hover:underline">{total > 1 ? `Voir les ${nombreFr(total)} dossiers en retard →` : 'Voir le dossier en retard →'}</Link>
      : <Link to={lienAvecPortee('/anticipation/dossiers', portee, { vue: 'A_TRAITER' })} className="text-[12.5px] font-medium text-accent hover:underline">Voir les dossiers à traiter →</Link>}
  </div>
  return <BlocDashboard titre="À traiter en priorité" actions={actions}
    aide="Les dossiers non démarrés dont l'échéance est dépassée, du plus ancien au plus récent. Un dossier démarré n'est jamais « en retard »."
    chargement={etat.isLoading && !u} erreur={etat.error} onReessayer={etat.reload}>
    {u && <>
      {!retard && <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-light px-4 py-3 text-[13px] font-medium text-success"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Aucun dossier en retard</div>}
      {lignes.length === 0 ? <EmptyState icon={ClipboardList} title="Aucun dossier à traiter" description="Aucun dossier n'est ouvert pour le moment." /> : <>
        <div className="hidden overflow-x-auto rounded-lg border border-[#E4E6EB] md:block"><table className="w-full">
          <thead className="border-b border-[#EAEBF0] bg-[#FAFAFB]"><tr><th className="table-head-cell">Agent</th><th className="table-head-cell">Type</th><th className="table-head-cell">Échéance</th><th className="table-head-cell">{retard ? 'Retard' : 'Délai'}</th><th className="table-head-cell text-right">Action</th></tr></thead>
          <tbody className="divide-y divide-[#EAEBF0]">{lignes.map((d) => <tr key={d.id} className="hover:bg-[#FAFAFB]">
            <td className={`table-cell border-l-4 ${retard ? 'border-l-danger' : 'border-l-transparent'}`}><button type="button" title="Ouvrir l'aperçu du dossier" onClick={() => ouvrirDossier(d)} className="text-left font-medium text-ink hover:underline">{d.nomComplet}</button><p className="font-mono text-[11.5px] text-[#6B7180]">{d.matricule}</p></td>
            <td className="table-cell"><Badge>{TYPE_LABELS[d.type]}</Badge></td><td className="table-cell whitespace-nowrap text-[#4B4F5A]">{formatDate(d.dateEcheance)}</td>
            <td className="table-cell whitespace-nowrap"><Delai d={d} retard={retard} /></td><td className="table-cell text-right"><Button size="sm" variant="secondary" onClick={() => ouvrirDossier(d)}>Ouvrir</Button></td>
          </tr>)}</tbody>
        </table></div>
        <ul className="flex flex-col gap-2 md:hidden">{lignes.map((d) => <li key={d.id} className={`flex flex-col gap-2 rounded-lg border border-[#E4E6EB] border-l-4 px-3 py-2.5 ${retard ? 'border-l-danger' : 'border-l-transparent'}`}>
          <div className="flex items-start justify-between gap-2"><div className="min-w-0"><button type="button" onClick={() => ouvrirDossier(d)} className="text-left text-[13.5px] font-medium text-ink hover:underline">{d.nomComplet}</button><p className="font-mono text-[11.5px] text-[#6B7180]">{d.matricule}</p></div><Delai d={d} retard={retard} /></div>
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="flex flex-wrap items-center gap-2 text-[12.5px] text-[#4B4F5A]"><Badge>{TYPE_LABELS[d.type]}</Badge> échéance {formatDate(d.dateEcheance)}</span><Button size="sm" variant="secondary" onClick={() => ouvrirDossier(d)}>Ouvrir</Button></div>
        </li>)}</ul>
      </>}
    </>}
  </BlocDashboard>
}
