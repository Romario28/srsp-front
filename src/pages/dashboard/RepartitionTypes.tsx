import { BlocDashboard, VoirEnTableau } from './BlocDashboard'
import { CATEGORIES, CATEGORIE_INFO } from '@/utils/calendrier'
import { nombreFr, pluriel, pourcent } from '@/utils/dashboard'
import type { EcheancesAVenirDTO, EtatChargement } from '@/types/dashboard'

export function RepartitionTypes({ etat, className }: { etat: EtatChargement<EcheancesAVenirDTO>; className?: string }) {
  const d = etat.data
  const lignes = CATEGORIES.map((categorie) => ({ categorie, nb: d?.enPreparation[categorie] ?? 0 }))
  const total = lignes.reduce((somme, l) => somme + l.nb, 0)
  return <BlocDashboard titre="Anticipations par type" className={className}
    aide="Échéances dont la fenêtre de préparation est ouverte, celles que signale le calcul de nuit. Les anomalies, sans date, ne sont pas comptées."
    chargement={etat.isLoading && !d} erreur={etat.error} onReessayer={etat.reload}>
    {d && <>
      <div role="img" aria-label={`${pluriel(total, 'anticipation', 'anticipations')} en cours, réparties par type`} className="flex h-3 w-full overflow-hidden rounded-full bg-[#EAEBF0]">
        {lignes.filter((l) => l.nb > 0).map((l) => <div key={l.categorie} title={`${CATEGORIE_INFO[l.categorie].label} · ${nombreFr(l.nb)}`}
          className={`h-full min-w-[3px] ${CATEGORIE_INFO[l.categorie].point}`} style={{ width: `${l.nb / total * 100}%` }} />)}
      </div>
      <ul className="flex flex-col gap-0.5">{lignes.map(({ categorie, nb }) => <li key={categorie} className="flex items-center gap-2 rounded-md px-2 py-1 text-[13px]">
        <span aria-hidden="true" className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${nb > 0 ? CATEGORIE_INFO[categorie].point : 'border border-[#C4C7D0]'}`} />
        <span className={`min-w-0 flex-1 truncate ${nb > 0 ? 'text-[#4B4F5A]' : 'text-[#9CA0AC]'}`}>{CATEGORIE_INFO[categorie].label}</span>
        <span className={`font-semibold tabular-nums ${nb > 0 ? 'text-ink' : 'text-[#C4C7D0]'}`}>{nombreFr(nb)}</span>
        <span className="w-12 text-right text-[12px] tabular-nums text-[#9CA0AC]">{pourcent(nb, total)} %</span>
      </li>)}</ul>
      <p className="text-[12px] text-[#6B7180]">{total === 0 ? 'Aucune anticipation en cours dans ce périmètre.' : <>Total : <span className="font-semibold text-ink">{nombreFr(total)}</span></>}</p>
      <VoirEnTableau colonnes={['Type', 'Échéances', 'Part']} lignes={lignes.map(({ categorie, nb }) => [CATEGORIE_INFO[categorie].label, nb, `${pourcent(nb, total)} %`])} />
    </>}
  </BlocDashboard>
}
