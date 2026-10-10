import { CATEGORIES, CATEGORIE_INFO, nomMois, type ComptesJour } from '@/utils/calendrier'
import type { CategorieCalendrier } from '@/types/calendrier'

interface VueAnneeProps {
  annee: number
  /** Index = mois (0-11) : nombre d'échéances par type, types actifs seulement. */
  comptes: readonly ComptesJour[]
  actifs: ReadonlySet<CategorieCalendrier>
  onMois: (mois: number) => void
}

export function VueAnnee({ annee, comptes, actifs, onMois }: VueAnneeProps) {
  const types = CATEGORIES.filter((c) => actifs.has(c))
  const maintenant = new Date()
  const moisCourant = maintenant.getFullYear() === annee ? maintenant.getMonth() : -1

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {comptes.map((compte, mois) => {
        const total = types.reduce((somme, c) => somme + (compte[c] ?? 0), 0)
        return (
          <button
            key={mois} type="button" onClick={() => onMois(mois)} aria-label={`Ouvrir ${nomMois(annee, mois)} ${annee}`}
            className={`flex flex-col gap-3 rounded-xl border bg-white p-4 text-left transition-colors hover:border-accent ${
              mois === moisCourant ? 'border-accent' : 'border-[#E4E6EB]'
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-display text-[14px] font-semibold capitalize text-ink">{nomMois(annee, mois)}</h3>
              <span className="text-[12px] text-[#9CA0AC]">{total} échéance{total > 1 ? 's' : ''}</span>
            </div>
            <ul className="flex flex-col gap-2">
              {types.map((c) => {
                const n = compte[c] ?? 0
                return (
                  <li key={c} className="flex items-center justify-between gap-3">
                    {/* Même forme que le composant Badge. Coloré s'il y a des échéances, gris neutre sinon. */}
                    <span
                      title={CATEGORIE_INFO[c].label}
                      className={`min-w-0 truncate rounded-full px-2.5 py-0.5 text-[12px] font-medium ${
                        n > 0 ? `text-white ${CATEGORIE_INFO[c].point}` : 'bg-[#EAEBF0] text-[#4B4F5A]'
                      }`}
                    >
                      {CATEGORIE_INFO[c].label}
                    </span>
                    <span className={`flex-shrink-0 text-[14px] tabular-nums ${n > 0 ? 'font-bold text-ink' : 'font-medium text-[#C4C7D0]'}`}>{n}</span>
                  </li>
                )
              })}
            </ul>
          </button>
        )
      })}
    </div>
  )
}
