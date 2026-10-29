import { useEffect, useRef } from 'react'
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
  const listeRef = useRef<HTMLUListElement>(null)

  // Le jour choisi reste visible dans la liste. Pas de scrollIntoView : il défilerait aussi la zone
  // horizontale et ramènerait sur ce bloc à chaque clic dans le calendrier. Seule la liste bouge ici.
  useEffect(() => {
    if (!selection) return
    const liste = listeRef.current
    const ligne = liste?.querySelector<HTMLElement>('[aria-current="date"]')
    if (!liste || !ligne) return
    const cadre = liste.getBoundingClientRect()
    const rect = ligne.getBoundingClientRect()
    if (rect.top < cadre.top) liste.scrollTop += rect.top - cadre.top
    else if (rect.bottom > cadre.bottom) liste.scrollTop += rect.bottom - cadre.bottom
  }, [selection])

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#E4E6EB] bg-white lg:min-h-[6rem] lg:flex-1">
      <div className="flex flex-shrink-0 items-baseline justify-between gap-2 border-b border-[#EAEBF0] px-3 py-2">
        <div className="min-w-0">
          <h3 className="font-display text-[13px] font-semibold text-ink">Effectifs du mois</h3>
          <p className="text-[11.5px] text-[#9CA0AC]">
            {critere === 'PREPARATION' ? 'Selon la date de préparation' : "Selon la date d'échéance"}
          </p>
        </div>
        <span className="flex-shrink-0 whitespace-nowrap text-[12px] text-[#9CA0AC]">{libelleAgents(total)}</span>
      </div>
      {effectifs.length === 0 ? (
        <p className="px-3 py-3 text-[12.5px] text-[#6B7180]">Aucune échéance ce mois-ci pour les types affichés.</p>
      ) : (
        <ul ref={listeRef} className="max-h-72 min-h-0 flex-1 divide-y divide-[#EAEBF0] overflow-y-auto lg:max-h-none">
          {effectifs.map((e) => {
            const choisi = e.iso === selection
            return (
              <li key={e.iso}>
                <button
                  type="button" onClick={() => onJour(e.iso)} aria-current={choisi ? 'date' : undefined}
                  className={`flex w-full items-center gap-2 px-3 py-1 text-left transition-colors ${choisi ? 'bg-accent-light' : 'hover:bg-[#FAFAFB]'}`}
                >
                  <span className={`w-[84px] flex-shrink-0 text-[12.5px] ${choisi ? 'font-semibold text-accent-dark' : 'text-ink'}`}>
                    {jourCourt(e.iso)}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-wrap gap-1">
                    {e.pastilles.map((p) => (
                      <span
                        key={p.categorie} title={libelleNombre(p.categorie, p.nombre)}
                        className={`inline-flex h-[18px] min-w-[1.125rem] items-center justify-center rounded-full px-1 text-[10.5px] font-semibold tabular-nums text-white ${CATEGORIE_INFO[p.categorie].point}`}
                      >
                        {p.nombre}
                      </span>
                    ))}
                  </span>
                  <span className="flex-shrink-0 text-[12.5px] font-bold tabular-nums text-ink">{e.total}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
