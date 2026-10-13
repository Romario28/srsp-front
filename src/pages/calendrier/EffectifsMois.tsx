import { CATEGORIE_INFO, jourCourt, libelleAgents, libelleNombre, type EffectifJour } from '@/utils/calendrier'
import type { CritereDate } from '@/types/anticipation'

interface EffectifsMoisProps {
  effectifs: readonly EffectifJour[]
  critere: CritereDate
  selection: string | null
  onJour: (iso: string) => void
}

/** Effectifs du mois affiché : une ligne par date, avec le détail par type et le total. */
export function EffectifsMois({ effectifs, critere, selection, onJour }: EffectifsMoisProps) {
  const total = effectifs.reduce((somme, e) => somme + e.total, 0)
  return (
    <section className="rounded-xl border border-[#E4E6EB] bg-white">
      <div className="flex items-baseline justify-between gap-2 border-b border-[#EAEBF0] px-4 py-3">
        <div className="min-w-0">
          <h3 className="font-display text-[13.5px] font-semibold text-ink">Effectifs du mois</h3>
          <p className="mt-0.5 text-[12px] text-[#9CA0AC]">
            {critere === 'PREPARATION' ? 'Selon la date de préparation' : "Selon la date d'échéance"}
          </p>
        </div>
        <span className="flex-shrink-0 whitespace-nowrap text-[12px] text-[#9CA0AC]">{libelleAgents(total)}</span>
      </div>
      {effectifs.length === 0 ? (
        <p className="px-4 py-5 text-[13px] text-[#6B7180]">Aucune échéance ce mois-ci pour les types affichés.</p>
      ) : (
        <ul className="max-h-64 divide-y divide-[#EAEBF0] overflow-y-auto">
          {effectifs.map((e) => {
            const choisi = e.iso === selection
            return (
              <li key={e.iso}>
                <button
                  type="button" onClick={() => onJour(e.iso)} aria-current={choisi ? 'date' : undefined}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${choisi ? 'bg-accent-light' : 'hover:bg-[#FAFAFB]'}`}
                >
                  <span className={`w-[88px] flex-shrink-0 text-[13px] ${choisi ? 'font-semibold text-accent-dark' : 'text-ink'}`}>
                    {jourCourt(e.iso)}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-wrap gap-1">
                    {e.pastilles.map((p) => (
                      <span
                        key={p.categorie} title={libelleNombre(p.categorie, p.nombre)}
                        className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums text-white ${CATEGORIE_INFO[p.categorie].point}`}
                      >
                        {p.nombre}
                      </span>
                    ))}
                  </span>
                  <span className="flex-shrink-0 text-[13px] font-bold tabular-nums text-ink">{e.total}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
