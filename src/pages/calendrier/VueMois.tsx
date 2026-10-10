import { useMemo } from 'react'
import { todayInputValue } from '@/utils/date'
import { CATEGORIE_INFO, JOURS_SEMAINE, jourLong, joursGrille, versIso, type Pastille } from '@/utils/calendrier'

export function VueMois({ annee, mois, parJour, onJour }: {
  annee: number; mois: number; parJour: ReadonlyMap<string, Pastille[]>; onJour: (iso: string) => void
}) {
  const jours = useMemo(() => joursGrille(annee, mois), [annee, mois])
  const aujourdhui = todayInputValue()
  return <div className="overflow-x-auto rounded-xl border border-[#E4E6EB] bg-white"><div className="min-w-[680px]">
    <div className="grid grid-cols-7 border-b border-[#EAEBF0] bg-[#FAFAFB]">{JOURS_SEMAINE.map((nom) => <div key={nom} className="table-head-cell text-center">{nom}</div>)}</div>
    <div className="grid grid-cols-7 gap-px bg-[#EAEBF0]">{jours.map((d) => {
      const iso = versIso(d); const pastillesDuJour = parJour.get(iso) ?? []
      const total = pastillesDuJour.reduce((sum, p) => sum + p.nombre, 0)
      const horsMois = d.getMonth() !== mois
      const classes = `flex min-h-[92px] flex-col items-start p-2 text-left ${horsMois ? 'bg-[#FAFAFB]' : 'bg-white'}`
      const contenu = <>
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[12.5px] font-medium ${iso === aujourdhui ? 'bg-accent text-white' : horsMois ? 'text-[#B4B8C2]' : 'text-ink'}`}>{d.getDate()}</span>
        {pastillesDuJour.length > 0 && <div className={`mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1 ${horsMois ? 'opacity-50' : ''}`}>
          {pastillesDuJour.map((p) => <span key={p.categorie} title={`${p.nombre} · ${CATEGORIE_INFO[p.categorie].label}`} className="inline-flex items-center gap-1 text-[12px] tabular-nums text-[#4B4F5A]">
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${CATEGORIE_INFO[p.categorie].point}`} />{p.nombre}
          </span>)}
        </div>}
      </>
      return total > 0
        ? <button key={iso} type="button" onClick={() => onJour(iso)} aria-label={`${jourLong(iso)} : ${pastillesDuJour.map((p) => `${p.nombre} ${CATEGORIE_INFO[p.categorie].label.toLowerCase()}`).join(', ')}`} className={`${classes} transition-colors hover:bg-accent-light/40`}>{contenu}</button>
        : <div key={iso} className={classes}>{contenu}</div>
    })}</div>
  </div></div>
}
