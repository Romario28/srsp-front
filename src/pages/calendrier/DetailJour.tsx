import { CATEGORIE_INFO, jourCourtAnnee, titreMode, type Pastille } from '@/utils/calendrier'
import type { CritereDate } from '@/types/anticipation'

interface DetailJourProps {
  jour: string
  critere: CritereDate
  /** Types présents ce jour : déjà limités aux types actifs de la légende et aux nombres > 0. */
  pastilles: readonly Pastille[]
}

/** Détail de la date choisie : le mode et le nombre d'agents par type. */
export function DetailJour({ jour, critere, pastilles }: DetailJourProps) {
  return (
    <section className="rounded-xl border border-[#E4E6EB] bg-white">
      <div className="border-b border-[#EAEBF0] px-4 py-3">
        <h3 className="font-display text-[13.5px] font-semibold text-ink">
          <time dateTime={jour}>{jourCourtAnnee(jour)}</time>
        </h3>
        <p className="mt-0.5 text-[12px] text-[#9CA0AC]">{titreMode(critere)}</p>
      </div>
      {pastilles.length === 0 ? (
        <p className="px-4 py-4 text-[13px] text-[#6B7180]">Aucun type affiché pour cette date.</p>
      ) : (
        <ul className="flex flex-col gap-2 px-4 py-3">
          {pastilles.map((p) => (
            <li key={p.categorie} className="flex items-center justify-between gap-3">
              <span
                title={CATEGORIE_INFO[p.categorie].label}
                className={`min-w-0 truncate rounded-full px-2.5 py-0.5 text-[12px] font-medium text-white ${CATEGORIE_INFO[p.categorie].point}`}
              >
                {CATEGORIE_INFO[p.categorie].label}
              </span>
              <span className="flex-shrink-0 text-[14px] font-bold tabular-nums text-ink">{p.nombre}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
