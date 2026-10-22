import { Infobulle } from '@/components/ui/Infobulle'
import { alignement, nombreFr } from '@/utils/dashboard'

export interface ColonneBarre {
  cle: string; segments: { valeur: number; couleur: string }[]; compte: number; etiquette: string; infobulle: string
}
interface BarresProps { colonnes: readonly ColonneBarre[]; repere?: number; ariaLabel: string }

export function Barres({ colonnes, repere, ariaLabel }: BarresProps) {
  const totalDe = (c: ColonneBarre) => c.segments.reduce((s, x) => s + x.valeur, 0)
  const max = Math.max(1, ...colonnes.map(totalDe)); const n = colonnes.length
  return <div role="group" aria-label={ariaLabel} className="flex flex-col">
    <div className="relative flex h-40 items-end border-b border-[#DADCE3]">
      {colonnes.map((c, i) => {
        const total = totalDe(c)
        return <Infobulle key={c.cle} texte={c.infobulle} etiquette={c.infobulle} align={alignement(i, n)} className="flex h-full flex-1 flex-col justify-end px-[3px]">
          <div className="flex w-full flex-col-reverse overflow-hidden rounded-t-sm transition-opacity group-hover:opacity-80" style={{ height: `${total / max * 100}%`, minHeight: total > 0 ? '2px' : undefined }}>
            {c.segments.map((s, k) => s.valeur > 0 && <div key={k} style={{ height: `${s.valeur / total * 100}%`, backgroundColor: s.couleur }} />)}
          </div>
        </Infobulle>
      })}
      {repere != null && n > 0 && <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 border-l-2 border-dashed border-[#6B7180]/60" style={{ left: `${repere / n * 100}%` }} />}
    </div>
    <div className="flex pt-1.5">{colonnes.map((c) => <div key={c.cle} className="min-w-0 flex-1 break-words text-center leading-tight">
      <div className="whitespace-nowrap text-[11px] font-medium tabular-nums text-ink">{nombreFr(c.compte)}</div><div className="text-[10.5px] text-[#6B7180]">{c.etiquette}</div>
    </div>)}</div>
  </div>
}
