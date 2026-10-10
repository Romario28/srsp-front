import { useMemo } from 'react'
import { todayInputValue } from '@/utils/date'
import { CATEGORIE_INFO, JOURS_SEMAINE, jourLong, joursGrille, libelleNombre, versIso, type Pastille } from '@/utils/calendrier'

interface VueMoisProps {
  annee: number
  mois: number   // 0-11
  parJour: ReadonlyMap<string, Pastille[]>
  onJour: (iso: string) => void
}

export function VueMois({ annee, mois, parJour, onJour }: VueMoisProps) {
  const jours = useMemo(() => joursGrille(annee, mois), [annee, mois])
  const aujourdhui = todayInputValue()

  return (
    <div className="overflow-x-auto rounded-xl border border-[#E4E6EB] bg-white">
      <div className="min-w-[680px]">
        <div className="grid grid-cols-7 border-b border-[#EAEBF0] bg-[#FAFAFB]">
          {JOURS_SEMAINE.map((nom) => <div key={nom} className="table-head-cell text-center">{nom}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-px bg-[#EAEBF0]">
          {jours.map((d) => {
            const iso = versIso(d)
            const pastilles = parJour.get(iso) ?? []
            const total = pastilles.reduce((somme, p) => somme + p.nombre, 0)
            const horsMois = d.getMonth() !== mois
            const classes = `flex min-h-[92px] flex-col items-start p-2 text-left ${horsMois ? 'bg-[#FAFAFB]' : 'bg-white'}`
            const contenu = (
              <>
                {/* Jour courant : contour (le plein est réservé aux badges de comptage) */}
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[12.5px] font-medium ${
                  iso === aujourdhui ? 'font-semibold text-accent-dark ring-2 ring-accent' : horsMois ? 'text-[#B4B8C2]' : 'text-ink'
                }`}>{d.getDate()}</span>
                {pastilles.length > 0 && (
                  <div className={`mt-1.5 flex flex-wrap gap-1 ${horsMois ? 'opacity-50' : ''}`}>
                    {pastilles.map((p) => (
                      // Rond pour 1-2 chiffres, s'allonge en pilule au-delà
                      <span
                        key={p.categorie}
                        title={libelleNombre(p.categorie, p.nombre)}
                        className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-1.5 text-[12px] font-semibold tabular-nums text-white ${CATEGORIE_INFO[p.categorie].point}`}
                      >
                        {p.nombre}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )
            // Seuls les jours avec des échéances sont cliquables (et atteignables au clavier)
            return total > 0
              ? <button key={iso} type="button" onClick={() => onJour(iso)}
                  aria-label={`${jourLong(iso)} : ${pastilles.map((p) => libelleNombre(p.categorie, p.nombre)).join(', ')}`}
                  className={`${classes} transition-colors hover:bg-accent-light/40`}>{contenu}</button>
              : <div key={iso} className={classes}>{contenu}</div>
          })}
        </div>
      </div>
    </div>
  )
}
