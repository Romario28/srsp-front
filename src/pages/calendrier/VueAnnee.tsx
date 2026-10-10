import { CATEGORIES, CATEGORIE_INFO, nomMois, type ComptesJour } from '@/utils/calendrier'
import type { CategorieCalendrier } from '@/types/calendrier'

export function VueAnnee({ annee, comptes, actifs, onMois }: {
  annee: number; comptes: readonly ComptesJour[]; actifs: ReadonlySet<CategorieCalendrier>; onMois: (mois: number) => void
}) {
  const types = CATEGORIES.filter((c) => actifs.has(c))
  const maintenant = new Date()
  const moisCourant = maintenant.getFullYear() === annee ? maintenant.getMonth() : -1
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{comptes.map((compte, mois) => {
    const total = types.reduce((sum, c) => sum + (compte[c] ?? 0), 0)
    return <button key={mois} type="button" onClick={() => onMois(mois)} aria-label={`Ouvrir ${nomMois(annee, mois)} ${annee}`} className={`flex flex-col gap-3 rounded-xl border bg-white p-4 text-left transition-colors hover:border-accent ${mois === moisCourant ? 'border-accent' : 'border-[#E4E6EB]'}`}>
      <div className="flex items-baseline justify-between gap-2"><h3 className="font-display text-[14px] font-semibold capitalize text-ink">{nomMois(annee, mois)}</h3><span className="text-[12px] text-[#9CA0AC]">{total} échéance{total > 1 ? 's' : ''}</span></div>
      <ul className="flex flex-col gap-1.5">{types.map((c) => {
        const n = compte[c] ?? 0
        return <li key={c} className="flex items-center gap-2 text-[12.5px]"><span aria-hidden="true" className={`h-2 w-2 flex-shrink-0 rounded-full ${CATEGORIE_INFO[c].point}`} /><span className="min-w-0 flex-1 truncate text-[#4B4F5A]">{CATEGORIE_INFO[c].label}</span><span className={`tabular-nums ${n > 0 ? 'font-semibold text-ink' : 'text-[#C4C7D0]'}`}>{n}</span></li>
      })}</ul>
    </button>
  })}</div>
}
