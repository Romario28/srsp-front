import { CATEGORIE_INFO, clePortee, jourCourtAnnee, titreMode, titrePeriode, type Pastille, type Portee } from '@/utils/calendrier'
import type { CritereDate } from '@/types/anticipation'

interface DetailJourProps {
  /** Le jour choisi ou le mois affiché : le bloc suit le mode Jour / Mois de la colonne. */
  portee: Portee
  critere: CritereDate
  /** Types présents : déjà limités aux types actifs de la légende et aux nombres > 0. */
  pastilles: readonly Pastille[]
}

function titre(portee: Portee): string {
  return portee.genre === 'JOUR' ? jourCourtAnnee(portee.iso) : titrePeriode('MOIS', portee.annee, portee.mois)
}

/** Détail de la période choisie : le mode (préparations ou échéances) et le nombre d'agents par type. */
export function DetailJour({ portee, critere, pastilles }: DetailJourProps) {
  return (
    <section className="rounded-xl border border-[#E4E6EB] bg-white">
      <div className="flex items-baseline justify-between gap-2 border-b border-[#EAEBF0] px-3 py-2">
        <h3 className="font-display text-[13px] font-semibold text-ink">
          <time dateTime={clePortee(portee)}>{titre(portee)}</time>
        </h3>
        <p className="text-[11.5px] text-[#9CA0AC]">{titreMode(critere)}</p>
      </div>
      {pastilles.length === 0 ? (
        <p className="px-3 py-2.5 text-[12.5px] text-[#6B7180]">
          {portee.genre === 'JOUR' ? 'Aucun type affiché pour cette date.' : 'Aucun type affiché pour ce mois.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5 px-3 py-2.5">
          {pastilles.map((p) => (
            <li key={p.categorie} className="flex items-center justify-between gap-3">
              <span className={`inline-flex h-5 min-w-0 items-center rounded-full px-2.5 text-[11.5px] font-medium text-white ${CATEGORIE_INFO[p.categorie].point}`}>
                <span className="truncate">{CATEGORIE_INFO[p.categorie].label}</span>
              </span>
              <span className="flex-shrink-0 text-[14px] font-bold tabular-nums text-ink">{p.nombre}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
