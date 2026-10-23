import { useState } from 'react'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { BlocDashboard, VoirEnTableau } from './BlocDashboard'
import { CATEGORIES, CATEGORIE_INFO } from '@/utils/calendrier'
import { moisLong, nombreFr, pluriel } from '@/utils/dashboard'
import type { EcheancesAVenirDTO, EtatChargement } from '@/types/dashboard'

type Periode = 'MOIS' | 'ANNEE'
export function EcheancesImminentes({ etat, className }: { etat: EtatChargement<EcheancesAVenirDTO>; className?: string }) {
  const [periode, setPeriode] = useState<Periode>('MOIS')
  const d = etat.data
  const options: { value: Periode; label: string; count?: number }[] = [
    { value: 'MOIS', label: 'Mois prochain', count: d?.moisProchain.total },
    { value: 'ANNEE', label: 'Année prochaine', count: d?.anneeProchaine.total },
  ]
  const p = d ? periode === 'MOIS' ? d.moisProchain : d.anneeProchaine : null
  const libelle = p ? periode === 'MOIS' ? moisLong(p.du.slice(0, 7)) : p.du.slice(0, 4) : ''
  return <BlocDashboard titre="Échéances imminentes" className={className}
    actions={<SegmentedControl options={options} value={periode} onChange={setPeriode} ariaLabel="Période des échéances" />}
    aide="Échéances datées des agents en activité du périmètre, par type, selon la date d'échéance. Les anomalies, sans date, ne sont pas comptées."
    chargement={etat.isLoading && !d} erreur={etat.error} onReessayer={etat.reload}>
    {d && p && <>
      <p className="text-[12.5px] text-[#6B7180]"><span className="font-medium capitalize text-ink">{libelle}</span> · {p.total === 0 ? 'aucune échéance' : pluriel(p.total, 'échéance', 'échéances')}</p>
      <ul className="grid grid-cols-2 gap-2">{CATEGORIES.map((categorie) => {
        const nb = p.parCategorie[categorie] ?? 0
        return <li key={categorie} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 ${nb > 0 ? 'border-[#E4E6EB] bg-white' : 'border-[#EAEBF0] bg-[#FAFAFB]'}`}>
          <span className="flex min-w-0 items-center gap-2 text-[12.5px] text-[#4B4F5A]" title={CATEGORIE_INFO[categorie].label}>
            <span aria-hidden="true" className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${nb > 0 ? CATEGORIE_INFO[categorie].point : 'border border-[#C4C7D0]'}`} />
            <span className={nb > 0 ? '' : 'text-[#9CA0AC]'}>{CATEGORIE_INFO[categorie].label}</span>
          </span>
          <span className={`font-display text-[18px] font-semibold tabular-nums ${nb > 0 ? 'text-ink' : 'text-[#C4C7D0]'}`}>{nombreFr(nb)}</span>
        </li>
      })}</ul>
      <VoirEnTableau colonnes={['Type', 'Mois prochain', 'Année prochaine']} lignes={[
        ...CATEGORIES.map((c) => [CATEGORIE_INFO[c].label, d.moisProchain.parCategorie[c] ?? 0, d.anneeProchaine.parCategorie[c] ?? 0]),
        ['Total', d.moisProchain.total, d.anneeProchaine.total],
      ]} />
    </>}
  </BlocDashboard>
}
