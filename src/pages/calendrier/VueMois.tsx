import { useMemo } from 'react'
import { todayInputValue } from '@/utils/date'
import {
  CATEGORIE_INFO, JOURS_SEMAINE, jourLong, joursGrille, libelleAgents, libelleNombre, totalPastilles, versIso,
  type Pastille,
} from '@/utils/calendrier'

interface VueMoisProps {
  annee: number
  mois: number
  parJour: ReadonlyMap<string, Pastille[]>
  onJour: (iso: string) => void
  /** Calendrier réduit (colonne de gauche) : un seul badge de total par jour, au lieu d'un par type. */
  compact?: boolean
  /** Jour dont le détail est affiché à droite. */
  selection?: string | null
}

export function VueMois({ annee, mois, parJour, onJour, compact = false, selection = null }: VueMoisProps) {
  const jours = useMemo(() => joursGrille(annee, mois), [annee, mois])
  const aujourdhui = todayInputValue()

  return (
    <div className={`rounded-xl border border-[#E4E6EB] bg-white ${compact ? 'overflow-hidden' : 'overflow-x-auto'}`}>
      <div className={compact ? '' : 'min-w-[680px]'}>
        <div className="grid grid-cols-7 border-b border-[#EAEBF0] bg-[#FAFAFB]">
          {JOURS_SEMAINE.map((nom) => (
            <div key={nom} className={`table-head-cell text-center ${compact ? 'px-0 py-1.5' : ''}`}>{nom}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-[#EAEBF0]">
          {jours.map((d) => {
            const iso = versIso(d)
            const liste = parJour.get(iso) ?? []
            const total = totalPastilles(liste)
            const horsMois = d.getMonth() !== mois
            const choisi = iso === selection
            const aujourdhuiIci = iso === aujourdhui && !horsMois
            const detail = liste.map((p) => libelleNombre(p.categorie, p.nombre)).join(', ')
            const fond = choisi ? 'bg-accent-light ring-2 ring-inset ring-accent' : horsMois ? 'bg-[#FAFAFB]' : 'bg-white'
            const classes = `flex flex-col text-left ${
              compact ? 'min-h-[48px] items-center gap-0.5 p-1' : 'min-h-[84px] items-start p-2'
            } ${fond}`
            const contenu = (
              <>
                <span className={`flex items-center justify-center rounded-full font-medium ${
                  compact ? 'h-5 w-5 text-[12px]' : 'h-6 w-6 text-[12.5px]'
                } ${
                  aujourdhuiIci ? 'font-semibold text-accent-dark ring-2 ring-accent'
                    : choisi ? 'font-semibold text-accent-dark'
                      : horsMois ? 'text-[#B4B8C2]' : 'text-ink'
                }`}>{d.getDate()}</span>
                {liste.length > 0 && (compact ? (
                  <span
                    title={`${libelleAgents(total)} - ${detail}`}
                    className={`inline-flex h-[18px] min-w-[1.1rem] items-center justify-center rounded-full bg-ink px-1.5 text-[10.5px] font-semibold tabular-nums text-white ${horsMois ? 'opacity-50' : ''}`}
                  >
                    {total}
                  </span>
                ) : (
                  <div className={`mt-1 flex flex-wrap gap-1 ${horsMois ? 'opacity-50' : ''}`}>
                    {liste.map((p) => (
                      <span
                        key={p.categorie}
                        title={libelleNombre(p.categorie, p.nombre)}
                        className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums text-white ${CATEGORIE_INFO[p.categorie].point}`}
                      >
                        {p.nombre}
                      </span>
                    ))}
                  </div>
                ))}
              </>
            )
            return total > 0
              ? <button key={iso} type="button" onClick={() => onJour(iso)} aria-current={choisi ? 'date' : undefined}
                  aria-label={`${jourLong(iso)} : ${detail}`}
                  className={`${classes} transition-colors hover:bg-accent-light/40`}>{contenu}</button>
              : <div key={iso} className={classes}>{contenu}</div>
          })}
        </div>
      </div>
    </div>
  )
}
